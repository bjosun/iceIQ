const functions = require("firebase-functions/v1"); // VIKTIGT: /v1 krävs för att .runWith ska fungera med Node 20
const admin = require("firebase-admin");
const Stripe = require("stripe");
const { Resend } = require("resend");
const { GoogleGenAI, Type, FinishReason } = require('@google/genai');
const { defineSecret } = require('firebase-functions/params');

admin.initializeApp();
const db = admin.firestore();

// Definiera dina secrets
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const resendApiKey = defineSecret('RESEND_API_KEY');
// Skyddar den tillfälliga testtriggern för veckomejlet (runWeeklyDigestNow).
// Tas bort tillsammans med den funktionen när digesten är verifierad.
const digestTestToken = defineSecret('DIGEST_TEST_TOKEN');

// --- KONFIGURATION ---
// iceiq.app är den faktiska produktionsdomänen (Firebase Hosting-målet
// "prod") — iceiq-v2.web.app är ett separat, sällan deployat testmål.
// Stripes success/cancel-redirect måste peka hit, annars landar kunden
// på fel sajt efter betalning.
const APP_URL = "https://iceiq.app";
const APP_ID = "default-app-id";
const FREE_MONTHLY_CREDITS = 3; // Gratisplanens AI-krediter per månad
const PROJECT_ID = "squareverse-36179"; 

// --- PRIS IDn ---
// Produkterna i Stripe: Premium Subscription (prod_TCPEqrpZtAFK5e) och
// Ice IQ Elite (prod_TyKsZ0OH6O3w6B). Elite har även två USD-priser som
// appen INTE använder. Kontrollen i createStripeCheckoutSession ser till att
// en felpekning stoppar köpet i stället för att debitera fel valuta/intervall.
const monthlyPriceId = "price_1SG0PzG6k6tU2YpwlL1sRjxo";       // Premium 29 kr/mån
const yearlyPriceId = "price_1SG0R0G6k6tU2Ypw8v1wALpq";        // Premium 299 kr/år
const eliteMonthlyPriceId = "price_1T0OCgG6k6tU2YpwHLrOYeHV";  // Elite 89 kr/mån
const eliteYearlyPriceId = "price_1T0ODTG6k6tU2YpwZUMoaXzE";   // Elite 890 kr/år
const EXPECTED_CURRENCY = "sek";

// --- ENGÅNGSKÖP AV KREDITER ---
// Ett enda engångspris i Stripe (mode: payment, INTE prenumeration). Kunden
// justerar antalet paket själv i kassan via adjustable_quantity, så vi slipper
// underhålla en pristrappa. Priset per paket är platt — ingen mängdrabatt —
// vilket gör att prenumerationen förblir det bättre valet ju mer man köper.
// Ändra siffrorna här om du vill ha ett annat upplägg; de följer med i
// köpets metadata och styr hur många krediter som delas ut.
const creditPackPriceId = "price_1U4KoDG6k6tU2YpwYPphw4RD"; // 15 krediter, 29 kr
const CREDITS_PER_PACK = 15;
const MAX_CREDIT_PACKS = 10;

// Ice IQ-scopad portalkonfiguration (varumärke, länkar). Stripe-kontot delas
// med squareverse-ai, som har sin egen konfiguration — utan detta ID skulle
// alla kunder se samma (fel) varumärke i "Hantera prenumeration".
const portalConfigurationId = "bpc_1SzOInG6k6tU2Ypwxr85tQu4";

// --- E-POST (RESEND) ---
// iceiq.app är inte verifierad i Resend än (kräver deras betalplan för fler
// domäner) — skickar tills vidare från den redan verifierade
// squareversegroup.com. Byt bara denna rad när iceiq.app är klar.
const FROM_EMAIL = "Ice IQ <noreply@squareversegroup.com>";

// Tills support@iceiq.app är verifierad går svar hit istället för till
// noreply-adressen (som inte tar emot något).
const SUPPORT_REPLY_TO = "bjorn.sundberg@squareverse.se";

let resend;
const getResend = () => {
  if (!resend) resend = new Resend(resendApiKey.value());
  return resend;
};

const sendEmail = async (to, subject, html, replyTo) => {
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });
  if (error) throw new Error(`Resend: ${error.message || JSON.stringify(error)}`);
};

const buildWelcomeEmail = (lang, displayName) => {
  const en = lang === 'en';
  const name = displayName ? displayName.split(' ')[0] : '';
  const subject = en ? "Welcome to Ice IQ" : "Välkommen till Ice IQ";

  const steps = en
    ? [
        ["Add a player", "Name is enough to get started."],
        ["Log a game", "Tap the actions as they happen, or fill it in afterwards — takes about two minutes."],
        ["Ask the AI coach", "Get a concrete read on the game and how things are trending."],
      ]
    : [
        ["Lägg till en spelare", "Namnet räcker för att komma igång."],
        ["Logga en match", "Tryck på händelserna medan de sker, eller fyll i efteråt — tar ett par minuter."],
        ["Fråga AI-coachen", "Få en konkret bild av matchen och hur utvecklingen ser ut."],
      ];

  const stepRows = steps.map(([title, desc], i) => `
    <tr>
      <td style="padding:10px 12px 10px 0;vertical-align:top;width:28px;">
        <div style="width:22px;height:22px;border-radius:999px;background:#0891b2;color:#ffffff;font-size:12px;font-weight:bold;text-align:center;line-height:22px;">${i + 1}</div>
      </td>
      <td style="padding:10px 0;vertical-align:top;">
        <strong style="color:#111827;">${title}</strong><br/>
        <span style="color:#6b7280;font-size:14px;">${desc}</span>
      </td>
    </tr>`).join('');

  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
      <h2 style="margin:24px 0 4px;">Ice <span style="color:#0891b2;">IQ</span></h2>
      <p style="margin:0 0 20px;color:#6b7280;">
        ${en ? (name ? `Welcome, ${name}!` : "Welcome!") : (name ? `Välkommen, ${name}!` : "Välkommen!")}
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
        ${en
          ? "Ice IQ turns a couple of minutes of match logging into a clear picture of how a player is developing — no spreadsheets, no guesswork."
          : "Ice IQ gör om ett par minuters matchloggning till en tydlig bild av hur en spelare utvecklas — inga kalkylark, ingen gissning."}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">${stepRows}</table>
      <p style="margin:28px 0;">
        <a href="${APP_URL}/dashboard" style="background:#0891b2;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;">
          ${en ? "Open Ice IQ" : "Öppna Ice IQ"}
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">
        ${en
          ? "Questions or feedback? Just reply to this email — we read everything."
          : "Frågor eller feedback? Svara bara på det här mejlet — vi läser allt."}
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
        ${en
          ? "Ice IQ is part of SquareVerse Group, which is why this email arrives from squareversegroup.com."
          : "Ice IQ är en del av SquareVerse Group, därför kommer det här mejlet från squareversegroup.com."}
      </p>
    </div>`;

  return { subject, html };
};

// AI-genererad text är fortfarande extern text som hamnar rakt i ett
// HTML-mejl — utan detta skulle t.ex. ett bokstavligt "<" i svaret
// (matematiska jämförelser förekommer i analyser) kunna bryta layouten.
const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const buildPlayerAnalysisEmail = (lang, playerName, analysisText) => {
  const en = lang === 'en';
  const subject = en ? `A note from your Ice IQ Coach` : `En hälsning från din Ice IQ-coach`;

  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
      <h2 style="margin:24px 0 4px;">Ice <span style="color:#0891b2;">IQ</span></h2>
      <p style="margin:0 0 20px;color:#6b7280;">
        ${en ? `Hi ${escapeHtml(playerName)},` : `Hej ${escapeHtml(playerName)},`}
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
        ${en
          ? "Your coach wanted to share this with you:"
          : "Din coach ville dela det här med dig:"}
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(analysisText)}</div>
      <p style="margin:28px 0;">
        <a href="${APP_URL}" style="background:#0891b2;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;">
          ${en ? "Open Ice IQ" : "Öppna Ice IQ"}
        </a>
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
        ${en
          ? "Ice IQ is part of SquareVerse Group, which is why this email arrives from squareversegroup.com."
          : "Ice IQ är en del av SquareVerse Group, därför kommer det här mejlet från squareversegroup.com."}
      </p>
    </div>`;

  return { subject, html };
};

// --- INITIERA VERTEX AI (GEMINI) ---
// EU-region: spelardata (namn + statistik för minderåriga) ska inte
// lämna EU för analys. europe-west1 (Belgien) har Gemini 2.5 Flash/Pro.
// Kontrollerat 2026-08-20: INGEN Gemini 3-modell finns i någon EU-region
// (europe-west1/-west4/-north1/-central2 ger bara 2.5). Gemini 3 går bara
// att nå via location 'global', vilket flyttar behandlingen ut ur EU —
// därför står vi kvar på 2.5 tills 3-serien landar i europe-west1.
// Byt alltså INTE till 'global' för att komma åt en nyare modell utan att
// det är ett medvetet beslut om var barns data behandlas.
const vertex_ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'europe-west1'
});

// --- STRIPE HELPER ---
let stripe;
const getStripe = () => {
  if (!stripe) {
    const secretKey = stripeSecretKey.value();
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY saknas.");
    // Stripes hemliga nycklar är sk_ (secret) eller rk_ (restricted). Kontrollen
    // fångar felklistrade värden direkt, med tydligt fel i loggen istället för
    // ett svårtolkat 401 från Stripe. Bara prefixet loggas, aldrig nyckeln.
    if (!/^(sk|rk)_(test|live)_/.test(secretKey)) {
      throw new Error(
        `STRIPE_SECRET_KEY ser inte ut som en hemlig Stripe-nyckel (börjar med "${secretKey.slice(0, 3)}"). ` +
        `Förväntat: sk_live_, sk_test_, rk_live_ eller rk_test_.`
      );
    }
    stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
  }
  return stripe;
};

// Din specifika helper för databas-sökvägen
const getUsersCollection = () => {
  return db.collection("artifacts").doc(APP_ID).collection("users");
};

const getOrCreateCustomer = async (userId, email) => {
  const stripeInstance = getStripe();
  const userRef = getUsersCollection().doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (userData && userData.stripeCustomerId) {
    // Ett sparat ID kan vara skapat under en tidigare/annan Stripe-nyckel
    // (t.ex. den felaktiga mk_-nyckeln som fixades tidigare, eller testläge)
    // och existerar då inte under dagens skarpa nyckel. Utan den här
    // kontrollen fick de kontona ett odiagnostiserbart 500-fel för varje
    // köpförsök, permanent — self-healing här löser det utan manuell
    // migrering av gamla konton.
    try {
      const customer = await stripeInstance.customers.retrieve(userData.stripeCustomerId);
      // Stripe kastar INTE resource_missing för en raderad kund — retrieve
      // lyckas och returnerar { deleted: true }. Ett rent try/catch missar
      // därför precis det fallet: kunden existerade men raderades sedan.
      if (!customer.deleted) return userData.stripeCustomerId;
      console.warn(`Stripe-kund ${userData.stripeCustomerId} är raderad för ${userId} — skapar en ny.`);
    } catch (err) {
      if (err.code !== 'resource_missing') throw err;
      console.warn(`Stripe-kund ${userData.stripeCustomerId} finns inte längre för ${userId} — skapar en ny.`);
    }
  }

  console.log(`Creating new Stripe customer for: ${email}`);
  const customer = await stripeInstance.customers.create({
    email: email,
    metadata: { firebaseUID: userId }
  });

  await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
  return customer.id;
};

// Drar en kredit och returnerar de nya saldona. Månadsransonen används först
// eftersom den ändå nollställs vid nästa periodskifte — köpta krediter ligger
// kvar tills de faktiskt används, så kunden ska aldrig förlora dem i onödan.
// Transaktionen behövs för att spärren längre upp sker FÖRE AI-anropet (som
// tar sekunder): utan den kan två samtidiga frågor båda passera och dra
// saldot under noll.
const deductAiCredit = async (userRef) => {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const d = snap.exists ? snap.data() : {};
    const monthly = d.aiCredits || 0;
    const purchased = d.purchasedCredits || 0;

    if (monthly > 0) {
      tx.update(userRef, { aiCredits: admin.firestore.FieldValue.increment(-1) });
      return { monthly: monthly - 1, purchased };
    }
    if (purchased > 0) {
      tx.update(userRef, { purchasedCredits: admin.firestore.FieldValue.increment(-1) });
      return { monthly, purchased: purchased - 1 };
    }
    return { monthly, purchased }; // inget kvar — låt inte saldot bli negativt
  });
};

// ==========================================
//  AI COACH FUNCTION (FIXAD & UPPGRADERAD RAM)
// ==========================================
// Regionen: funktionen låg tidigare i us-central1 (Firebase-standard) medan
// Vertex-anropet gick till europe-west1 — spelardatan passerade alltså USA på
// vägen till en "EU-analys". Sedan 2026-08-21 kör askCoach bara i EU, och
// klienten anropar den via en egen getFunctions(app, 'europe-west1')-instans
// (euFunctions i src/services/firebase.ts). Flyttas regionen här måste den
// ändras där också — annars får klienten 404 från fel region.
// Övriga funktioner ligger kvar i us-central1; stripeWebhook har dessutom en
// URL registrerad hos Stripe som inte får ändras.
// Ordningen spelar roll: .region() måste komma före .runWith().
exports.askCoach = functions
  .region('europe-west1')
  .runWith({ memory: "1GB", timeoutSeconds: 120 }) // Ökat minne för AI:n för att förhindra krasch
  .https.onCall(async (data, context) => {
  // 1. Säkerhetskoll
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Du måste vara inloggad.');
  }

  const userId = context.auth.uid;
  
  // VIKTIGT: Hämta 'lang' här också!
  const { playerStats, question, history, lang } = data;

  // 2. Hämta användaren (dokumentet kanske inte finns ännu för helt nya konton)
  const userRef = getUsersCollection().doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};

  // Kontrollera plan
  const isSubscribed = userData.subscriptionStatus === 'active';
  const plan = userData.subscriptionPlan || (isSubscribed ? 'premium' : 'free');

  // Krediterna ligger i två separata hinkar:
  //   aiCredits         månadsranson — sätts om till ett fast värde vid varje
  //                     periodskifte (refillFreeCreditsMonthly, förnyelse)
  //   purchasedCredits  engångsköpta — rörs ALDRIG av de jobben, ligger kvar
  //                     tills de används
  // Att blanda dem i ett fält skulle innebära att månadspåfyllningen raderar
  // krediter kunden har betalat för.
  // Free-planen inkluderar FREE_MONTHLY_CREDITS gratis analyser per månad —
  // det är produktens "prova på"-upplevelse, så free får INTE blockeras här.
  let monthlyCredits = userData.aiCredits;
  if (monthlyCredits === undefined) {
      monthlyCredits = isSubscribed ? (plan === 'elite' ? 500 : 50) : FREE_MONTHLY_CREDITS;
      // set + merge så nya konton utan användardokument också fungerar.
      // subscriptionPlan sätts så att månadspåfyllnaden hittar gratisanvändaren.
      await userRef.set({ aiCredits: monthlyCredits, subscriptionPlan: plan }, { merge: true });
  }
  const purchasedCredits = userData.purchasedCredits || 0;

  // 3. Spärr: summan av båda hinkarna är gränsen, oavsett plan
  if (monthlyCredits + purchasedCredits <= 0) {
    throw new functions.https.HttpsError('resource-exhausted', 'Slut på krediter.');
  }

  // Sätt språk
  const userLanguage = lang || 'en';

  // 4. Välj modell
  const modelName = plan === 'elite'
    ? 'gemini-2.5-pro'
    : 'gemini-2.5-flash';

  console.log(`Använder modell: ${modelName} (Lang: ${userLanguage})`);

  // Spelarens namn är dokument-ID:t under users/{uid}/players — samma
  // sökväg klienten skriver till (se src/services/firebase.ts).
  const playerName = playerStats?.player;
  const playerRef = playerName ? userRef.collection('players').doc(playerName) : null;
  const playerDocData = playerRef ? (await playerRef.get()).data() || {} : {};
  // coachTimeline ersätter det gamla enkelfältet coachNotes: en daterad
  // logg istället för en blob som skrevs över helt varje gång, så coachen
  // kan referera till en utveckling ("i mars jobbade du på X, nu i augusti
  // har du...") snarare än bara ett senaste-tillstånd. Konton med den gamla
  // formen migreras in som en första post första gången de körs om.
  const existingTimeline = Array.isArray(playerDocData.coachTimeline)
    ? playerDocData.coachTimeline
    : (playerDocData.coachNotes
        ? [{ date: '(tidigare anteckning)', note: String(playerDocData.coachNotes).slice(0, 200) }]
        : []);
  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `
      Du är "Ice IQ Coach", en elitinriktad ishockeytränare och mentor.
      Din uppgift är att maximera spelarens prestation på och utanför isen genom djupgående dataanalys.

      VIKTIG KONTEXT OM APPENS POÄNGSYSTEM (ICE IQ):
      - Appen använder ett prestationsbaserat poängsystem för att mäta spelarens "impact".
      - Om 'points_impact' är POSITIV (+): Handlingen var framgångsrik och bidrog till laget.
      - Om 'points_impact' är NEGATIV (-): Handlingen var ett misstag (t.ex. panikrensning, pucktapp).
      - STRICT REGEL: Fråga ALDRIG hur poängsystemet fungerar. Agera som att du är experten.

      SIFFROR — LITA PÅ DE ANGIVNA TOTALERNA, RÄKNA INTE OM DEM:
      - Datan innehåller redan färdigräknade totalsummor (se fälten nedan).
      - Räkna ALDRIG ut en egen totalsumma genom att summera enskilda poster i listorna — det är så fel siffror uppstår. Citera alltid det redan angivna talet ordagrant.
      - "Poäng denna match" och "Totalt saldo" är TVÅ OLIKA TAL (saldot kan innehålla överfört värde från tidigare matcher) — blanda aldrig ihop dem eller påstå att det ena är det andra.

      HUR DU SKA ANALYSERA (MYCKET VIKTIGT):
      1. Om "Pågående session" är tom: Klaga INTE på att data saknas. Då är spelaren här för att utvärdera sin historik. Dyk direkt ner i "Historik"-datan.
      2. Identifiera trender: Jämför alltid prestationerna över tid. Går totalpoängen upp eller ner? Vilka specifika handlingar har blivit bättre eller sämre mellan matcherna?
      2b. Använd "Säsongsöversikt" för det långa perspektivet: jämför snittet för de senaste 5 matcherna (last5Avg) med säsongssnittet (avgPoints) och säg tydligt om spelaren är på väg uppåt eller nedåt jämfört med sin egen nivå.
      3. Var proaktiv: Tvinga inte spelaren att dra ur dig informationen. Ditt första svar ska alltid innehålla en konkret analys.
      4. "Tidigare tidslinje om spelaren" (om sådan finns) är vad du själv antecknat i tidigare samtal — väv in den naturligt ("du har ju jobbat på X ett tag nu, och det syns...") i stället för att bara räkna upp den. Lita fortfarande bara på siffrorna i den aktuella datan, inte på minnet, för själva talen.
      4b. STRICT REGEL: Om tidslinjen är tom/står "(ingen ännu — första samtalet...)": det HÄNDER inte att ni pratat förut. Säg ALDRIG saker som "som vi pratade om", "precis som förra gången" eller liknande då — det är påhittat och spelaren vet att det inte är sant. Hälsa varmt, men som första mötet det faktiskt är.

      FORMATERA DITT SVAR SÅ HÄR (Översätt rubrikerna till ${userLanguage}):
      - 📈 ${userLanguage === 'sv' ? 'Trend' : 'Trend'}: ...
      - 💪 ${userLanguage === 'sv' ? 'Styrkor' : 'Strengths'}: ...
      - 🎯 ${userLanguage === 'sv' ? 'Fokusområde' : 'Focus Area'}: ...

      VIKTIGA INSTRUKTIONER (SPRÅK & TON):
      1. SPRÅK: Svara konsekvent på språkkoden "${userLanguage}". Blanda absolut inte språk.
      2. TON: Som en trygg, varm vän som råkar vara en elitcoach — inte en opersonlig rapportgenerator. Använd att du känner spelaren (via tidslinjen) för att låta närvarande och genuint intresserad, inte bara korrekt. Fortfarande ärlig och konkret i sakinnehållet: en trygg vän mjukar inte upp sanningen, den säger den med omtanke.
      3. FORMAT: Korta stycken och punktlistor. Var koncis snarare än uttömmande — hellre ett par vassa, personliga meningar per rubrik än långa stycken. Detta är också en teknisk gräns: svaret har en tokenbudget, och en instruktion om att vara "utförlig" är precis det som tidigare klippte av svar mitt i en mening.

      DELBAR HÖJDPUNKT (fältet "shareHighlight" i svaret):
      - EN mening som spelaren eller föräldern ska kunna dela stolt — den starkaste SANNA observationen i datan.
      - Max 90 tecken, på språkkoden "${userLanguage}". Ingen emoji, ingen rubrik, ingen avslutande punkt.
      - Bara sådant som är belagt i siffrorna du fått. Hitta ALDRIG på ett tal, och avrunda inte uppåt till något snyggare.
      - Finns inget genuint positivt att lyfta den här gången: returnera en tom sträng. Ett påhittat beröm hamnar i en laggrupp och blir genomskådat.
      - Skriv den som ett konstaterande, inte som en hälsning: "Fem vunna sargdueller — flest hittills i säsongen".

      MINNE OM SPELAREN (fältet "coachTimeline" i svaret):
      - Du får spelarens tidslinje: en lista med daterade poster om vad du observerat över tid (spelstil, återkommande styrkor/svagheter, vad spelaren jobbat på, vad ni pratat om). Det är så du "känner igen" spelaren mellan samtal.
      - Lägg till EN NY post (med dagens datum, ${today}) bara om du lärt dig något varaktigt nytt i det här samtalet — inte vid varje litet svar. Om inget nytt tillkommit: returnera listan oförändrad.
      - Listan får ALDRIG innehålla fler än 8 poster. Är den redan full när du vill lägga till en ny: slå ihop de två minst relevanta/äldsta posterna till en, så det finns plats. Radera aldrig hela historiken.
      - Varje post: max ~150 tecken, bara varaktigt relevanta fakta — inga engångsdetaljer om just dagens fråga.
  `;
  // "Personligheten" (systemInstruction) ligger i konfigurationen och skickas
  // med varje anrop. JSON-schemat tvingar fram flera fält i samma anrop —
  // svaret till spelaren, delningsraden och den uppdaterade tidslinjen — så vi
  // slipper ett extra (och dubbelt så dyrt) modellanrop bara för minnet.
  // I Gen AI-SDK:t är generering och systeminstruktion ett och samma
  // config-objekt; den gamla nästlade generationConfig finns inte kvar.
  const generationConfig = {
    systemInstruction: systemPrompt,
    // Elite (Pro) får mer utrymme och ett begränsat tankebudget-tak — Pro
    // kan inte stänga av tänkande helt. Flash stänger av det: en
    // formatterad coach-analys behöver inte flerstegsresonemang, och utan
    // gränsen kan tänkandet annars äta hela maxOutputTokens och klippa av
    // svaret mitt i en mening (det som hände innan denna ändring).
    // Höjt ytterligare en gång: tidslinjen (upp till 8 daterade poster)
    // är större än den gamla enkeltextens minnesfält, så svaret behöver
    // mer marginal än tidigare för att inte riskera samma avklippning.
    // Höjt igen när shareHighlight tillkom. Taket är en gräns, inte en
    // reservation — outnyttjade tokens kostar ingenting — så marginalen
    // är gratis försäkring mot just den avklippning som beskrivs ovan.
    maxOutputTokens: plan === 'elite' ? 4352 : 3328,
    temperature: 0.4,
    thinkingConfig: plan === 'elite' ? { thinkingBudget: 1024 } : { thinkingBudget: 0 },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        analysis: { type: Type.STRING, description: 'Svaret till spelaren, enligt formateringsinstruktionerna.' },
        shareHighlight: { type: Type.STRING, description: 'En delbar en-radare, max 90 tecken. Tom sträng om inget sant positivt finns att lyfta.' },
        coachTimeline: {
          type: Type.ARRAY,
          description: 'Den fullständiga, uppdaterade tidslinjen om spelaren — max 8 poster.',
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: 'YYYY-MM-DD' },
              note: { type: Type.STRING, description: 'Kort observation, max ca 150 tecken.' },
            },
            required: ['date', 'note'],
          },
        },
      },
      // shareHighlight är medvetet INTE required: den är en trevlighet
      // ovanpå analysen, och ett fält som modellen inte lyckas fylla ska
      // aldrig kunna fälla själva coach-svaret. Utelämnas den blir
      // shareHighlight tom sträng och delningsknappen visas bara inte.
      required: ['analysis', 'coachTimeline'],
    },
  };

  // 5. Hantera användarens unika data och fråga
  try {
    const userMessage = `
      Data för analys:
      - Pågående session (dagens match): ${JSON.stringify(playerStats.stats || {})}
      - Historik (senaste 3 matcherna): ${JSON.stringify(playerStats.history || [])}
      - Säsongsöversikt (alla registrerade matcher): ${JSON.stringify(playerStats.season || {})}
      - Poäng denna match: ${playerStats.totals?.actionsPoints ?? 0}
      - Totalt saldo (kan inkludera överfört värde från tidigare matcher): ${playerStats.totals?.total ?? 0}
      - Tidigare tidslinje om spelaren: ${existingTimeline.length > 0 ? JSON.stringify(existingTimeline) : '(ingen ännu — första samtalet med den här spelaren)'}

      Spelarens fråga: "${question || 'Ge en analys baserat på min statistik.'}"
    `;

    // Chatthistorik -> flerturskonversation, så följdfrågor har kontext.
    // Klientdata valideras och begränsas: max 10 turer, 4000 tecken per tur.
    const safeHistory = (Array.isArray(history) ? history : [])
      .slice(-10)
      .filter((m) => m && (m.role === 'user' || m.role === 'ai') && typeof m.text === 'string')
      .map((m) => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text.slice(0, 4000) }],
      }));

    // Gemini kräver att konversationen börjar med 'user'. Första analysen
    // görs via en knapp utan användarmeddelande, så vi lägger in det implicita.
    if (safeHistory.length > 0 && safeHistory[0].role === 'model') {
      safeHistory.unshift({ role: 'user', parts: [{ text: 'Ge en analys baserat på min statistik.' }] });
    }

    // Slå ihop eventuella på varandra följande turer med samma roll
    // (kan uppstå om ett AI-svar misslyckades mellan två frågor)
    const contents = [];
    for (const turn of safeHistory) {
      const prev = contents[contents.length - 1];
      if (prev && prev.role === turn.role) {
        prev.parts[0].text += '\n\n' + turn.parts[0].text;
      } else {
        contents.push(turn);
      }
    }
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    // Gen AI-SDK:t returnerar svaret direkt — inget mellanliggande
    // result.response som i det gamla Vertex-SDK:t.
    const response = await vertex_ai.models.generateContent({
      model: modelName,
      contents,
      config: generationConfig,
    });

    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("Inget svar från AI.");
    }

    const candidate = response.candidates[0];
    // MAX_TOKENS hände tidigare tyst — svaret klipptes av mitt i en mening
    // utan varken fel eller logg. Nu syns det i loggen om det trots den
    // höjda budgeten och avstängda tänkandet skulle inträffa igen.
    if (candidate.finishReason && candidate.finishReason !== FinishReason.STOP) {
      console.warn(`askCoach: oväntat finishReason "${candidate.finishReason}" för ${userId}`);
    }

    // response.text slår ihop alla textdelar i svaret. Det gamla
    // parts[0].text tog bara den första — vilket räckte så länge svaret
    // alltid kom i ett stycke, men tappar innehåll om modellen delar upp
    // JSON:en i flera delar.
    const rawText = response.text || '';
    let analysis = rawText;
    let shareHighlight = '';
    let coachTimeline = null;
    try {
      const parsed = JSON.parse(rawText);
      analysis = parsed.analysis || rawText;
      // Serverside-gräns oavsett vad modellen returnerade: 90 tecken är
      // vad kortet rymmer, och instruktionen är bara en instruktion.
      if (typeof parsed.shareHighlight === 'string') {
        shareHighlight = parsed.shareHighlight.trim().slice(0, 90);
      }
      if (Array.isArray(parsed.coachTimeline)) {
        // Server-sidan gräns oavsett vad modellen faktiskt returnerade —
        // instruktionen om max 8 poster är bara en instruktion, inte en
        // garanti. Utan detta kan fältet växa obegränsat om modellen
        // struntar i sammanslagningsregeln.
        coachTimeline = parsed.coachTimeline
          .filter((e) => e && typeof e.date === 'string' && typeof e.note === 'string')
          .map((e) => ({ date: e.date.slice(0, 20), note: e.note.slice(0, 200) }))
          .slice(-8);
      }
    } catch (e) {
      // JSON-läget kan i sällsynta fall ge ogiltig JSON (t.ex. vid avklippt
      // svar). Då visar vi ändå rådatan för spelaren i stället för att
      // misslyckas helt — bara minnesuppdateringen uteblir den gången.
      console.warn(`askCoach: kunde inte tolka JSON-svaret för ${userId}: ${e.message}`);
    }

    if (playerRef && coachTimeline) {
      // Bäst-ansträngning: minnet får inte blockera själva svaret till
      // spelaren om det här skulle strula. coachNotes (gamla strängfältet)
      // raderas medvetet inte — coachTimeline-läsningen ovan migrerar in
      // det vid behov, men vi rör inte bort det här ifall något annat
      // skulle läsa det.
      await playerRef.set({ coachTimeline }, { merge: true }).catch((e) =>
        console.warn(`askCoach: kunde inte spara coachTimeline för ${userId}/${playerName}: ${e.message}`)
      );
    }

    // 6. Dra av kredit — månadsransonen först, köpta krediter sist
    const balance = await deductAiCredit(userRef);

    return {
      success: true,
      analysis,
      shareHighlight,
      creditsLeft: balance.monthly + balance.purchased,
      monthlyCredits: balance.monthly,
      purchasedCredits: balance.purchased
    };

  } catch (error) {
    console.error("AI Error:", error);
    throw new functions.https.HttpsError('internal', `Coachen kunde inte svara just nu: ${error.message}`);
  }
});

// Mejlar ett redan genererat coach-svar till spelaren. Ingen ny AI-fråga
// görs här — texten kommer från klienten (den redan visade den efter att
// ha betalat en kredit för den), så det här kostar inget extra.
//
// Medvetet begränsad till exakt det: dela text via mejl. Den (mycket
// större) idén om att låta spelaren själv chatta med coachen live är ett
// separat, framtida beslut om auktoriseringsfri åtkomst — den bygger
// vidare på players/{playerName}.email precis som denna funktion redan
// gör, så det kräver ingen omskrivning här när/om den byggs.
exports.shareAnalysisWithPlayer = functions
  .runWith({ secrets: [resendApiKey] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Du måste vara inloggad.');
    }

    const { playerName, analysis, lang } = data;
    if (!playerName || typeof playerName !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Spelarnamn saknas.');
    }
    if (!analysis || typeof analysis !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Ingen analys att dela.');
    }

    const userId = context.auth.uid;
    const playerRef = getUsersCollection().doc(userId).collection('players').doc(playerName);
    const playerDoc = await playerRef.get();
    const email = playerDoc.exists ? playerDoc.data().email : null;

    if (!email) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Spelaren har ingen sparad e-postadress. Lägg till en under spelarens uppgifter först.'
      );
    }

    try {
      const { subject, html } = buildPlayerAnalysisEmail(lang || 'en', playerName, analysis.slice(0, 8000));
      await sendEmail(email, subject, html, SUPPORT_REPLY_TO);
      return { success: true };
    } catch (error) {
      console.error(`shareAnalysisWithPlayer misslyckades för ${userId}/${playerName}:`, error);
      throw new functions.https.HttpsError('internal', 'Kunde inte skicka mejlet just nu.');
    }
  });


// ==========================================
//  STRIPE FUNCTIONS (UPPGRADERAD RAM)
// ==========================================

exports.createStripeCheckoutSession = functions
  .runWith({ secrets: [stripeSecretKey], memory: "512MB" }) // Ökat minne
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");

    const { interval, plan } = data;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    try {
      const stripeInstance = getStripe();
      const customerId = await getOrCreateCustomer(userId, userEmail);

      // Engångsköp av krediter: eget läge (payment) och eget pris. Kunden får
      // justera antalet paket i kassan; webhooken läser slutgiltig kvantitet.
      if (plan === 'credits') {
        const packPrice = await stripeInstance.prices.retrieve(creditPackPriceId);
        // Engångspriser saknar 'recurring' — ett prenumerationspris här skulle
        // binda kunden till en månadsdebitering hen aldrig bad om.
        if (packPrice.recurring || packPrice.currency !== EXPECTED_CURRENCY) {
          console.error(
            `Prisfel: ${creditPackPriceId} är ${packPrice.currency}` +
            `${packPrice.recurring ? `/${packPrice.recurring.interval} (återkommande)` : ' (engång)'} ` +
            `— förväntade ett engångspris i ${EXPECTED_CURRENCY}.`
          );
          throw new functions.https.HttpsError(
            "failed-precondition",
            "Pricing is misconfigured. Please contact support."
          );
        }

        const creditSession = await stripeInstance.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          // success=true krävs av /success-sidan; type=credits gör att den
          // kan säga "krediter tillagda" i stället för "prenumeration aktiv".
          success_url: `${APP_URL}/success?success=true&type=credits&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${APP_URL}/dashboard`,
          client_reference_id: userId,
          customer: customerId,
          line_items: [{
            price: creditPackPriceId,
            quantity: 1,
            adjustable_quantity: { enabled: true, minimum: 1, maximum: MAX_CREDIT_PACKS },
          }],
          metadata: { type: 'credits', creditsPerPack: String(CREDITS_PER_PACK) },
          // Kontot delas med squareverse-ai — utan detta läser kunden bara
          // det gemensamma kontonamnet på sitt kontoutdrag och kan bestrida
          // en debitering hen inte känner igen. Bara giltigt i payment-läge;
          // prenumerationerna (subscription-läge) saknar motsvarande fält.
          payment_intent_data: { statement_descriptor_suffix: "ICEIQ" },
        });

        return { id: creditSession.id };
      }

      let priceId;
      if (plan === 'elite') {
        priceId = interval === "yearly" ? eliteYearlyPriceId : eliteMonthlyPriceId;
       } else {
        priceId = interval === "yearly" ? yearlyPriceId : monthlyPriceId;
      }
      
      // Kontrollera att pris-ID:t verkligen är det vi tror innan kunden debiteras.
      // Ett hopblandat ID (fel intervall eller USD i stället för SEK) ska stoppa
      // köpet, inte tyst dra fel belopp. Kräver Prices:read på API-nyckeln.
      const price = await stripeInstance.prices.retrieve(priceId);
      const expectedInterval = interval === "yearly" ? "year" : "month";
      if (price.recurring?.interval !== expectedInterval || price.currency !== EXPECTED_CURRENCY) {
        console.error(
          `Prisfel: ${priceId} är ${price.unit_amount / 100} ${price.currency}/` +
          `${price.recurring?.interval} — förväntade ${EXPECTED_CURRENCY}/${expectedInterval}. ` +
          `Kontrollera pris-ID:na i functions/index.js.`
        );
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Pricing is misconfigured. Please contact support."
        );
      }

      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        success_url: `${APP_URL}/success?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/dashboard`,
        client_reference_id: userId,
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
            planType: plan || 'premium'
        }
      });

      return { id: session.id };
    } catch (error) {
      // Full detalj i serverloggen; klienten får ett generiskt meddelande så att
      // varken nyckelfragment eller Stripe-interna detaljer hamnar i webbläsaren.
      console.error("Stripe session failed:", error);
      throw new functions.https.HttpsError("internal", "Could not start checkout. Please try again later.");
    }
  });

exports.createStripePortalSession = functions
  .runWith({ secrets: [stripeSecretKey], memory: "512MB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");

    const userId = context.auth.uid;
    const userDoc = await getUsersCollection().doc(userId).get();
    const customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      throw new functions.https.HttpsError("failed-precondition", "No Stripe customer found.");
    }

    try {
      const stripeInstance = getStripe();
      const session = await stripeInstance.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${APP_URL}/dashboard`,
        configuration: portalConfigurationId,
      });
      return { url: session.url };
    } catch (error) {
      console.error("Portal session failed:", error);
      throw new functions.https.HttpsError("internal", "Could not create portal.");
    }
  });

exports.deleteUserStripeAccount = functions
  .runWith({ secrets: [stripeSecretKey], memory: "512MB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");

    const userId = context.auth.uid;
    const stripeInstance = getStripe();

    try {
      const userDoc = await getUsersCollection().doc(userId).get();
      const customerId = userDoc.data()?.stripeCustomerId;

      if (!customerId) return { deleted: true };

      await stripeInstance.customers.del(customerId);
      console.log(`🗑️ Stripe customer ${customerId} deleted`);
      return { deleted: true };
    } catch (error) {
      console.error("Deletion failed:", error);
      return { deleted: false, error: error.message };
    }
  });

exports.stripeWebhook = functions
  .runWith({ secrets: [stripeSecretKey, stripeWebhookSecret], memory: "512MB" })
  .https.onRequest(async (req, res) => {
    const stripeInstance = getStripe();
    const signature = req.headers["stripe-signature"];
    const webhookSecret = stripeWebhookSecret.value();

    let event;
    try {
      event = stripeInstance.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature failed.");
      return res.status(400).send();
    }

    const data = event.data.object;
    const usersRef = getUsersCollection(); 

    try {
      if (event.type === "checkout.session.completed") {
        const userId = data.client_reference_id;
        const subscriptionId = data.subscription;
        const customerId = data.customer;

        // Engångsköp av krediter: ingen prenumeration inblandad, så grenen
        // nedan (som slår upp subscriptionId) gäller inte här.
        if (userId && data.mode === "payment" && data.metadata?.type === "credits") {
          const lineItems = await stripeInstance.checkout.sessions.listLineItems(data.id, { limit: 1 });
          const packs = lineItems.data[0]?.quantity || 1;
          const perPack = Number(data.metadata.creditsPerPack) || CREDITS_PER_PACK;
          const bought = packs * perPack;

          // Stripe levererar om webhooken vid fel, och increment() är inte
          // idempotent — utan spärr kan samma köp ge krediter flera gånger.
          // Sessions-ID:t som dokumentnamn gör körningen säker att upprepa.
          const userRef = usersRef.doc(userId);
          const purchaseRef = userRef.collection('creditPurchases').doc(data.id);
          const granted = await db.runTransaction(async (tx) => {
            if ((await tx.get(purchaseRef)).exists) return false;
            tx.set(purchaseRef, {
              credits: bought,
              packs,
              amountTotal: data.amount_total,
              currency: data.currency,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            tx.set(userRef, {
              stripeCustomerId: customerId,
              purchasedCredits: admin.firestore.FieldValue.increment(bought),
            }, { merge: true });
            return true;
          });

          console.log(granted
            ? `✅ ${bought} krediter (${packs} paket) till ${userId}`
            : `↩️ Köp ${data.id} redan behandlat — hoppar över`);

        } else if (userId) {
          const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
          const interval = subscription.items.data[0].plan.interval;
          
          const planType = data.metadata?.planType || "premium";
          
          // --- HÄR ÄR DINA NYA VÄRDEN: 50 och 500 ---
          const creditAmount = planType === 'elite' ? 500 : 50;

          await usersRef.doc(userId).set({
            stripeCustomerId: customerId,
            subscriptionStatus: "active",
            subscriptionId: subscriptionId,
            subscriptionPlan: planType,
            subscriptionInterval: interval,
            subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            aiCredits: creditAmount 
          }, { merge: true });
          console.log(`✅ ${planType} activated for ${userId} with ${creditAmount} AI credits`);
        }
      }

      // --- NYTT: FYLL PÅ KREDITER NÄR PRENUMERATIONEN FÖRNYAS NÄSTA MÅNAD ---
      if (event.type === "invoice.payment_succeeded") {
        const customerId = data.customer;
        const subscriptionId = data.subscription;
        
        // Vi vill bara agera på fakturor som tillhör en prenumeration (inte engångsköp)
        if (subscriptionId) {
            const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0].price.id;
            
            // Kolla om det är Elite eller Premium baserat på Pris-ID
            const isElite = priceId === eliteMonthlyPriceId || priceId === eliteYearlyPriceId;
            const creditAmount = isElite ? 500 : 50;

            const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
            if (!snapshot.empty) {
                await snapshot.docs[0].ref.update({ 
                    subscriptionStatus: "active",
                    aiCredits: creditAmount,
                    subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString()
                });
                console.log(`🔄 Renewed! Refilled ${creditAmount} credits for customer ${customerId}`);
            }
        }
      }

      if (event.type === "invoice.payment_failed") {
        const customerId = data.customer;
        const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({ subscriptionStatus: "past_due" });
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const customerId = data.customer;
        const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            subscriptionStatus: "cancelled",
            subscriptionPlan: "free",
            aiCredits: 0 
          });
          console.log(`❌ Subscription deleted for ${customerId}`);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook processing failed:", err);
      res.status(500).send("Server Error");
    }
  });
// ==========================================
//  AUTOMATISK PÅFYLLNING (CRON JOB)
// ==========================================
exports.refillFreeCreditsMonthly = functions
  .runWith({ memory: "512MB", timeoutSeconds: 300 })
  .pubsub.schedule('0 0 1 * *') // Körs kl 00:00 den 1:a varje månad
  .timeZone('Europe/Stockholm')
  .onRun(async (context) => {
    const usersRef = getUsersCollection();
    
    // Hämta alla användare som har 'free' plan
    const snapshot = await usersRef.where('subscriptionPlan', '==', 'free').get();
    
    if (snapshot.empty) {
      console.log('Inga gratisanvändare att återställa denna månad.');
      return null;
    }

    // Använd en Firebase "Batch" för att uppdatera hundratals konton blixtsnabbt
    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
      // Sätter deras krediter till 3 (sparar eventuella gamla krediter? Nej, vi "nollställer" till max 3 så de inte kan spara ihop 100 gratis)
      batch.update(doc.ref, { aiCredits: FREE_MONTHLY_CREDITS });
      count++;
    });

    await batch.commit();
    console.log(`✅ Månadsuppdatering klar: Gav ${FREE_MONTHLY_CREDITS} AI-krediter till ${count} gratisanvändare.`);
    return null;
  });
// ==========================================
//  VÄLKOMSTMEJL (FIRESTORE TRIGGER)
// ==========================================
// Triggas när klienten skapar användarens dokument (AuthContext.saveNewUserToDatabase)
// — täcker alltså både Google-inlogg och e-post/lösenord i ett enda ställe.
exports.sendWelcomeEmail = functions
  .runWith({ secrets: [resendApiKey] })
  .firestore.document('artifacts/{appId}/users/{userId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data.email) return null;

    const { subject, html } = buildWelcomeEmail(data.language, data.displayName);
    try {
      await sendEmail(data.email, subject, html, SUPPORT_REPLY_TO);
      console.log(`✅ Välkomstmejl skickat till ${data.email}`);
    } catch (err) {
      console.error(`Välkomstmejl misslyckades för ${data.email}:`, err);
    }
    return null;
  });

// ==========================================
//  VECKOMEJL
// ==========================================
// Delad körning för både det schemalagda måndagsutskicket och testtriggern
// nedan. dryRun rapporterar vilka som skulle få mejl utan att skicka något;
// redirectTo skickar allt till en enda adress så innehållet kan granskas
// utan att nå riktiga kunder.
const runWeeklyDigest = async ({ dryRun = false, redirectTo = null, limit = 0 } = {}) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const cutoff = weekAgo.toISOString().split('T')[0];

  const usersSnap = await getUsersCollection().get();
  const recipients = [];
  let sent = 0;

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    if (userData.emailDigest === false) continue; // användaren har stängt av

    const playersSnap = await userDoc.ref.collection('players').get();
    if (playersSnap.empty) continue;

    // Summera veckans matcher per spelare (datum lagras som YYYY-MM-DD,
    // så strängjämförelsen fungerar)
    const summaries = [];
    for (const playerDoc of playersSnap.docs) {
      const gamesSnap = await playerDoc.ref
        .collection('games')
        .where('date', '>=', cutoff)
        .get();
      if (gamesSnap.empty) continue;

      const games = gamesSnap.docs.map((d) => d.data());
      summaries.push({
        name: playerDoc.id,
        games: games.length,
        total: games.reduce((sum, g) => sum + (g.points || 0), 0),
        best: Math.max(...games.map((g) => g.points || 0)),
      });
    }
    // Ingen aktivitet denna vecka -> inget mejl (vi spammar inte)
    if (summaries.length === 0) continue;

    // E-postadressen bor i Auth, inte i Firestore-dokumentet
    let email;
    try {
      email = (await admin.auth().getUser(userDoc.id)).email;
    } catch (err) {
      continue;
    }
    if (!email) continue;

    recipients.push({ uid: userDoc.id, email, players: summaries.length });
    if (dryRun) continue;

    const en = userData.language === 'en';
    const subject = en
      ? "Last week on the ice — your Ice IQ summary"
      : "Förra veckan på isen — din Ice IQ-summering";

    const rows = summaries.map((p) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;"><strong>${p.name}</strong></td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.games}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.total}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.best}</td>
      </tr>`).join('');

    const html = `
      <div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
        <h2 style="margin:24px 0 4px;">Ice <span style="color:#0891b2;">IQ</span></h2>
        <p style="margin:0 0 20px;color:#6b7280;">${en ? "Your weekly summary" : "Din veckosummering"}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px 12px;text-align:left;">${en ? "Player" : "Spelare"}</th>
              <th style="padding:8px 12px;">${en ? "Games" : "Matcher"}</th>
              <th style="padding:8px 12px;">${en ? "Points" : "Poäng"}</th>
              <th style="padding:8px 12px;">${en ? "Best game" : "Bästa match"}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:24px 0;">
          <a href="${APP_URL}/dashboard" style="background:#0891b2;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;">
            ${en ? "Open Ice IQ" : "Öppna Ice IQ"}
          </a>
        </p>
        <p style="color:#9ca3af;font-size:12px;">
          ${en
            ? "You get this email because you use Ice IQ. Turn it off under My Account in the app."
            : "Du får det här mejlet för att du använder Ice IQ. Stäng av det under Mitt konto i appen."}
        </p>
        <p style="color:#9ca3af;font-size:12px;">
          ${en
            ? "Ice IQ is part of SquareVerse Group, which is why this email arrives from squareversegroup.com."
            : "Ice IQ är en del av SquareVerse Group, därför kommer det här mejlet från squareversegroup.com."}
        </p>
      </div>`;

    try {
      await sendEmail(redirectTo || email, subject, html);
      sent++;
    } catch (err) {
      console.error(`Veckomejl misslyckades för ${userDoc.id}:`, err);
    }
    if (limit && sent >= limit) break;
  }

  return { dryRun, redirectTo: redirectTo || null, candidates: recipients.length, sent, recipients };
};

exports.weeklyDigest = functions
  .runWith({ memory: "512MB", timeoutSeconds: 540, secrets: [resendApiKey] })
  .pubsub.schedule('0 8 * * 1') // Måndagar 08:00
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const { sent, candidates } = await runWeeklyDigest();
    console.log(`📬 Veckomejl: ${sent} skickade av ${candidates} möjliga.`);
    return null;
  });

// TILLFÄLLIG: manuell trigger för att verifiera veckomejlet utanför
// måndagsschemat. Ta bort när digesten är verifierad.
// Säker som standard — utan ?to= eller ?live=true skickas inga mejl alls.
//   (inget)      -> torrkörning, rapporterar vilka som skulle få mejl
//   ?to=adress   -> skickar riktigt innehåll till bara den adressen
//   ?live=true   -> skickar skarpt till alla mottagare
//   ?limit=N     -> tak för antal utskick (användbart ihop med ?to=)
exports.runWeeklyDigestNow = functions
  .runWith({ memory: "512MB", timeoutSeconds: 540, secrets: [resendApiKey, digestTestToken] })
  .https.onRequest(async (req, res) => {
    if (req.get('x-digest-token') !== digestTestToken.value()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const to = typeof req.query.to === 'string' ? req.query.to : null;
    const live = req.query.live === 'true';
    const limit = Number(req.query.limit) || 0;

    try {
      const result = await runWeeklyDigest({ dryRun: !to && !live, redirectTo: to, limit });
      res.json(result);
    } catch (err) {
      console.error('runWeeklyDigestNow misslyckades:', err);
      res.status(500).json({ error: 'Failed', message: err.message });
    }
  });

