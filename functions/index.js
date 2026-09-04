const functions = require("firebase-functions/v1"); // VIKTIGT: /v1 krävs för att .runWith ska fungera med Node 20
const crypto = require("crypto"); // För spelarlänk-tokens (randomBytes är inte globalt i Node)
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
// Skyddar acquisitionReport (permanent rapportverktyg) — egen hemlighet så
// den inte upphör att fungera om digestTestToken tas bort senare.
const reportsToken = defineSecret('REPORTS_TOKEN');

// --- KONFIGURATION ---
// iceiq.app är den faktiska produktionsdomänen (Firebase Hosting-målet
// "prod") — iceiq-v2.web.app är ett separat, sällan deployat testmål.
// Stripes success/cancel-redirect måste peka hit, annars landar kunden
// på fel sajt efter betalning.
const APP_URL = "https://iceiq.app";
const APP_ID = "default-app-id";
const FREE_MONTHLY_CREDITS = 3; // Gratisplanens AI-krediter per månad

// Betalplanernas månadspott. Låg tidigare hårdkodad som 50/500 på två ställen
// (nyteckning och förnyelse) — de måste vara samma siffra, annars får kunden
// en annan pott månad 2 än månad 1.
const PLAN_MONTHLY_CREDITS = { premium: 50, elite: 500 };
const creditsForPlan = (planType) =>
  PLAN_MONTHLY_CREDITS[planType] ?? PLAN_MONTHLY_CREDITS.premium;
const PROJECT_ID = "squareverse-36179";

// focusTags i askCoach: en fast, liten v1-lista, grundad i två källor —
// dels den fasta poängtaxonomin (TemplateContext.tsx, finns i varenda
// match oavsett hur lite fritext som skrivits), dels de faktiska
// coachTimeline-anteckningar som redan fanns i produktionen 2026-08-26
// (bara 5 poster totalt då — pucktapp/passningsspel, sargdueller och
// zonspel återkom där, och en post nämnde uttryckligen "lugn under press"
// och mentala övningar). Fysik och sömn/återhämtning är medvetet
// uteslutna: det finns inget rutininnehåll att peka mot för dem ännu,
// bara andningsövningen (kopplad till fokus_press). Listan är en startpunkt
// — väx den när fler coachTimeline-poster ger ett bredare underlag.
// En enda källa till sanning för både schemats enum och
// serverfiltreringen nedan, så de aldrig kan glida isär.
const FOCUS_TAGS = [
  'puckhantering_press',
  'sargdueller',
  'zonspel',
  'avslut',
  'defensivt_ansvar',
  'tekningar',
  'malvaktsspel',
  'fokus_press',
]; 

// --- PRIS IDn ---
// Produkterna i Stripe: Premium Subscription (prod_TCPEqrpZtAFK5e) och
// Ice IQ Elite (prod_TyKsZ0OH6O3w6B).
//
// Priserna ligger per valuta. Svenskspråkiga kunder debiteras i SEK, alla
// andra i USD — merparten av den organiska söktrafiken kommer från Kanada
// och USA, och ett SEK-pris i kassan är där ett skäl att stänga fliken.
// Valet görs i currencyForLang() nedan och speglas i src/utils/pricing.ts,
// som styr vilket pris kunden SER. Beloppen här är alltså inte bara
// dokumentation: de kontrolleras mot Stripe innan kassan öppnas, så att en
// avvikelse mellan visat och debiterat pris stoppar köpet i stället för att
// tyst dra fel summa.
//
// amount = belopp i minsta enhet (öre/cent), samma som Stripes unit_amount.
const SEK_TABLE = {
  premium: {
    monthly: { id: "price_1SG0PzG6k6tU2YpwlL1sRjxo", amount: 2900 },
    yearly: { id: "price_1SG0R0G6k6tU2Ypw8v1wALpq", amount: 29900 },
  },
  elite: {
    monthly: { id: "price_1T0OCgG6k6tU2YpwHLrOYeHV", amount: 8900 },
    yearly: { id: "price_1T0ODTG6k6tU2YpwZUMoaXzE", amount: 89000 },
  },
  // Engångspris, 15 krediter. Se ENGÅNGSKÖP AV KREDITER nedan.
  // 49 kr (upp från 29 kr) — till 29 kr låg paketet i sticker-pris-paritet
  // med en hel månad Premium (50 krediter + allt annat), vilket inte
  // signalerade att prenumeration är den bättre dealen.
  credits: { id: "price_1UAtG8G6k6tU2YpwP8ZDhdfj", amount: 4900 },
};

// USD-priserna i Stripe. Både premium och elite finns, så USD är påslaget
// (se PRICES nedan). Halva tabellen duger inte: en engelsk pristabell med
// "Premium 29 SEK/month" bredvid "Elite $9.90/month" vore sämre än att visa
// allt i kronor — därför är det Premium-postens existens, inte en separat
// flagga, som utgör på/av.
const USD_TABLE = {
  premium: {
    monthly: { id: "price_1UAsTCG6k6tU2YpwtVADGY8L", amount: 299 },
    yearly: { id: "price_1UAsTYG6k6tU2Ypw1WhUcr0G", amount: 2900 },
  },
  elite: {
    monthly: { id: "price_1T0OE2G6k6tU2Ypw15nq67ZP", amount: 990 },
    yearly: { id: "price_1T0OEQG6k6tU2YpwhF5OxyjV", amount: 9900 },
  },
  // 15 krediter, $4.99 (upp från $2.90 — samma motivering som SEK ovan).
  credits: { id: "price_1UAtGUG6k6tU2YpwvcN4oIxN", amount: 499 },
};

const PRICES = {
  sek: SEK_TABLE,
  // Både premium och elite måste finnas för att USD ska kunna erbjudas alls.
  usd: USD_TABLE.premium && USD_TABLE.elite ? USD_TABLE : null,
};

// Vilken valuta en kund ska debiteras i. Samma regel som i
// src/utils/pricing.ts: svenska = SEK, allt annat = USD. Faller tillbaka
// till SEK så länge USD-tabellen ovan inte är ifylld.
function currencyForLang(lang) {
  if (lang === "sv") return "sek";
  return PRICES.usd ? "usd" : "sek";
}

// Slår upp vilken plan ett pris-ID hör till, oavsett valuta. Webhooken kan
// inte jämföra mot ett enskilt ID längre: med två valutor finns det fyra
// giltiga Elite-priser, och ett missat ID skulle ge en Elite-kund Premiums
// kreditpott vid varje förnyelse.
function planForPriceId(priceId) {
  for (const table of Object.values(PRICES)) {
    if (!table) continue;
    for (const [plan, entry] of Object.entries(table)) {
      if (plan === "credits") continue;
      if (entry.monthly?.id === priceId || entry.yearly?.id === priceId) return plan;
    }
  }
  return null;
}

// --- ENGÅNGSKÖP AV KREDITER ---
// Ett enda engångspris per valuta i Stripe (mode: payment, INTE
// prenumeration). Kunden justerar antalet paket själv i kassan via
// adjustable_quantity, så vi slipper underhålla en pristrappa. Priset per
// paket är platt — ingen mängdrabatt — vilket gör att prenumerationen
// förblir det bättre valet ju mer man köper. Ändra siffrorna här om du vill
// ha ett annat upplägg; de följer med i köpets metadata och styr hur många
// krediter som delas ut.
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

// reply_to på allt kundvänt vi skickar — noreply-adressen ovan tar inte emot
// något. Svaren går in via en Cloudflare-worker och triageras av
// Ice IQ-agenten. Adressen ligger på squareversegroup.com tills iceiq.app
// ligger hos Cloudflare och support@iceiq.app kan ta över samma väg. Den
// dagen: byt den här raden och SUPPORT_EMAIL i src/utils/contact.ts — de två
// ska alltid vara samma adress, annars ber mejlen om svar på ett ställe medan
// sajten pekar på ett annat.
const SUPPORT_REPLY_TO = "support-iceiq@squareversegroup.com";

// Interna rapporter (veckans ops-digest) går till en personlig adress, inte
// till supportinkorgen — kundmejl och driftrapporter ska inte samsas i samma
// tråd-flöde.
const OPS_EMAIL = "bjorn.sundberg@squareverse.se";

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

// Firebase Auth är enda sanningen för en användares e-postadress. Tidigare
// låg den även som fältet `email` på users-dokumentet, skrivet en enda gång
// vid signup och aldrig uppdaterat — byter någon adress i Auth blev
// dokumentet tyst fel, och då gick välkomst- och köpmejl till den gamla
// adressen medan veckomejlet (som redan läste från Auth) gick till den nya.
// Alla utskick går numera genom den här.
const getUserEmail = async (uid) => {
  try {
    return (await admin.auth().getUser(uid)).email || null;
  } catch (err) {
    // Kontot kan vara raderat i Auth men ha ett kvarlämnat dokument.
    return null;
  }
};

// Samma sak för många uid på en gång (ops-digesten listar adresser för hela
// veckans händelser). getUsers tar max 100 identifierare per anrop.
const getUserEmails = async (uids) => {
  const byUid = new Map();
  for (let i = 0; i < uids.length; i += 100) {
    const chunk = uids.slice(i, i + 100).map((uid) => ({ uid }));
    try {
      const { users } = await admin.auth().getUsers(chunk);
      users.forEach((u) => byUid.set(u.uid, u.email || null));
    } catch (err) {
      console.error('getUsers misslyckades för ett block:', err);
    }
  }
  return byUid;
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

// Ett mejlfel får ALDRIG fälla stripeWebhook: kastar vi där svarar funktionen
// 500, och då levererar Stripe om händelsen och kör hela kredit- och
// planlogiken en gång till. Att betalningen bokförs rätt är viktigare än att
// mejlet går fram, så ett fel loggas och släpps.
const sendPurchaseEmailSafely = async (userId, payload) => {
  try {
    const email = await getUserEmail(userId);
    if (!email) {
      console.warn(`Köpmejl hoppades över för ${userId} — ingen e-postadress.`);
      return;
    }
    // Dokumentet behövs fortfarande för språkvalet — bara adressen kommer
    // numera från Auth.
    const userDoc = await getUsersCollection().doc(userId).get();
    const { subject, html } = buildPurchaseEmail(userDoc.data()?.language, payload);
    await sendEmail(email, subject, html, SUPPORT_REPLY_TO);
    console.log(`✅ Köpmejl (${payload.kind}) skickat till ${email}`);
  } catch (err) {
    console.error(`Köpmejl misslyckades för ${userId}:`, err);
  }
};

// Skickas när ett köp gått igenom. Medvetet INTE ett kvitto — Stripe skickar
// redan ett sådant, och ett sämre andrakvitto från oss hjälper ingen. Det här
// mejlet svarar på "vad har jag nu, och vad gör jag härnäst", eftersom den
// stora risken efter ett köp är att kunden aldrig kommer igång och säger upp
// nästa månad. Därför också ingen merförsäljning: de har just köpt.
const buildPurchaseEmail = (lang, { kind, planType, credits }) => {
  const en = lang === 'en';
  const isSubscription = kind === 'subscription';
  const planName = planType === 'elite' ? 'Elite' : 'Premium';

  const subject = isSubscription
    ? (en ? `${planName} is active` : `${planName} är igång`)
    : (en ? "Your credits are ready" : "Dina krediter är påfyllda");

  const headline = isSubscription
    ? (en ? `${planName} is active.` : `${planName} är igång.`)
    : (en ? "Credits added." : "Krediterna är påfyllda.");

  const creditLine = isSubscription
    ? (en
        ? `You have ${credits} AI credits this month, and they refill automatically every renewal.`
        : `Du har ${credits} AI-krediter den här månaden, och de fylls på automatiskt vid varje förnyelse.`)
    : (en
        ? `You have ${credits} more AI credits. They don't expire — unused credits stay on the account.`
        : `Du har ${credits} nya AI-krediter. De går inte ut — oanvända krediter ligger kvar på kontot.`);

  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
      <h2 style="margin:24px 0 4px;">Ice <span style="color:#0891b2;">IQ</span></h2>
      <p style="margin:0 0 20px;color:#6b7280;">${headline}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${creditLine}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
        ${en
          ? "The best next step is to log a match and ask the coach to read it — that's where the difference shows up."
          : "Bästa nästa steg är att logga en match och be coachen läsa den — det är där skillnaden syns."}
      </p>
      <p style="margin:28px 0;">
        <a href="${APP_URL}/dashboard" style="background:#0891b2;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;">
          ${en ? "Open Ice IQ" : "Öppna Ice IQ"}
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">
        ${isSubscription
          ? (en
              ? "Your receipt comes separately from Stripe, who handle the payment. You can change or cancel the subscription at any time under My Account."
              : "Ditt kvitto kommer separat från Stripe, som sköter betalningen. Du kan ändra eller säga upp prenumerationen när som helst under Mitt konto.")
          : (en
              ? "Your receipt comes separately from Stripe, who handle the payment."
              : "Ditt kvitto kommer separat från Stripe, som sköter betalningen.")}
      </p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">
        ${en
          ? "Something not working as expected? Just reply to this email."
          : "Är det något som inte fungerar som det ska? Svara bara på det här mejlet."}
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

// Server-sidan spegling av buildSeasonSummary i src/pages/Dashboard.tsx —
// samma formel, så spelarlänkens siffror alltid matchar det föräldern ser
// i appen. Hålls i synk manuellt; ändra båda om formeln ändras.
function buildSeasonSummary(games) {
  if (games.length === 0) return null;
  const pts = games.map((g) => g.points || 0);
  const sum = pts.reduce((a, b) => a + b, 0);
  const last5 = pts.slice(-5);
  return {
    games: games.length,
    totalPoints: sum,
    avgPoints: Number((sum / games.length).toFixed(1)),
    bestGame: Math.max(...pts),
    worstGame: Math.min(...pts),
    last5Avg: Number((last5.reduce((a, b) => a + b, 0) / last5.length).toFixed(1)),
    firstGame: games[0].date,
    lastGame: games[games.length - 1].date,
  };
}

// Matchrelativ streak för kvällen-innan-match-rutinen: "X matcher i rad
// med rutinen gjord". Medvetet INTE en kalenderstreak à la Deepstash —
// matcher spelas 1-3 ggr/veckan, så en daglig streak hade straffat barnet
// för sportens rytm i stället för för att faktiskt hoppa över rutinen.
//
// En rutinpost daterad D räknas för en match spelad D (samma kväll) eller
// D+1 (rutinen görs kvällen innan). Räknar bakåt från senaste spelade
// matchen och stannar vid första matchen utan förberedelse.
//
// Not: en rutin gjord ikväll inför en match som ännu inte spelats syns
// inte i streaken förrän matchen faktiskt registrerats — matchen finns
// inte i games förrän föräldern loggat den. Det är avsiktligt: streaken
// räknar förberedda matcher, inte avsikter.
function computeRoutineStreak(games, completions) {
  if (!Array.isArray(games) || games.length === 0) return 0;
  const done = new Set(Array.isArray(completions) ? completions : []);
  if (done.size === 0) return 0;

  const dayBefore = (isoDate) => {
    const d = new Date(`${isoDate}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return null;
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  let streak = 0;
  // games kommer sorterad stigande på datum (se getPlayerLinkData).
  for (let i = games.length - 1; i >= 0; i--) {
    const gameDate = games[i].date;
    if (typeof gameDate !== 'string') break;
    const prev = dayBefore(gameDate);
    if (done.has(gameDate) || (prev && done.has(prev))) streak++;
    else break;
  }
  return streak;
}

const getOrCreateCustomer = async (userId, email, lang) => {
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
    metadata: { firebaseUID: userId },
    // Utan detta faller Stripes egna mejl (kvitton, dunning) tillbaka på
    // kontots Standardspråk i Dashboarden — samma `lang` som redan avgör
    // valutan (currencyForLang) styr här språket, så en svensk kund inte
    // får sitt kvitto på samma språk som majoriteten (Kanada/USA, engelska).
    ...(lang === 'sv' ? { preferred_locales: ['sv'] } : {}),
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
      monthlyCredits = isSubscribed ? creditsForPlan(plan) : FREE_MONTHLY_CREDITS;
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

      FOKUSOMRÅDEN (fältet "focusTags" i svaret):
      - Max 2 taggar, och bara om ett TYDLIGT mönster i datan pekar dit — en enda match räcker inte om historiken/säsongsöversikten säger något annat. Det vanliga fallet är en tom lista, inte undantaget.
      - Välj ENDAST ur listan nedan. Hitta aldrig på en egen tagg — okända taggar filtreras bort ändå.
      - Taggarna syns aldrig för spelaren och nämns aldrig i själva svaret ("analysis") — de styr bara vilken hjälp appen kan erbjuda i efterhand, som ett tyst erbjudande spelaren själv får välja att öppna.
      - fokus_press sätts bara vid ett tydligt mönster av att tappa marginalerna under press (paniktappningar, ojämn prestation matcher med mycket press) ELLER om frågan/samtalet uttryckligen handlar om nerver, fokus eller matchdagsrutiner — INTE bara för att en match gick dåligt.

      Tillgängliga taggar:
      - puckhantering_press: återkommande pucktapp eller misslyckade passningar, särskilt under press
      - sargdueller: tydligt mönster i vunna eller förlorade närkamper
      - zonspel: tydligt mönster i zoninträden eller zonförsvar
      - avslut: tydligt mönster i skottavslut eller skapade målchanser
      - defensivt_ansvar: tydligt mönster i blockerade skott, klarerade lägen eller insläppta mål mot
      - tekningar: tydligt mönster i tekningsstatistik (bara relevant för forwards)
      - malvaktsspel: tydligt mönster i räddningar eller returer (bara relevant för målvakter)
      - fokus_press: se villkoret ovan — mental press, inte prestationssvacka

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
        focusTags: {
          type: Type.ARRAY,
          description: 'Max 2 taggar ur den fasta listan, bara vid ett tydligt mönster i datan. Tom lista är det vanliga.',
          items: { type: Type.STRING, enum: FOCUS_TAGS },
        },
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
      // shareHighlight och focusTags är medvetet INTE required: båda är
      // en trevlighet ovanpå analysen, och ett fält som modellen inte
      // lyckas fylla ska aldrig kunna fälla själva coach-svaret. Utelämnas
      // de blir det tom sträng respektive tom lista — delningsknappen och
      // rutin-erbjudandet visas bara inte.
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
    let focusTags = [];
    let coachTimeline = null;
    try {
      const parsed = JSON.parse(rawText);
      analysis = parsed.analysis || rawText;
      // Serverside-gräns oavsett vad modellen returnerade: 90 tecken är
      // vad kortet rymmer, och instruktionen är bara en instruktion.
      if (typeof parsed.shareHighlight === 'string') {
        shareHighlight = parsed.shareHighlight.trim().slice(0, 90);
      }
      if (Array.isArray(parsed.focusTags)) {
        // enum i schemat styr redan modellen, men filtrera ändå mot
        // FOCUS_TAGS här — samma "lita inte på att instruktionen hölls"
        // som resten av parsningen. Max 2, precis som prompten ber om.
        focusTags = parsed.focusTags
          .filter((tag) => typeof tag === 'string' && FOCUS_TAGS.includes(tag))
          .slice(0, 2);
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
      focusTags,
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
//  SPELARLÄNK (dela läge, ingen inloggning)
// ==========================================
// Ger föräldern en beständig länk att skicka till spelaren (t.ex. via sms).
// Spelaren öppnar den på sin egen enhet utan konto. Token:en i playerLinks
// (192 bitars slump, se crypto.randomBytes nedan) ÄR behörighetsbeviset —
// det finns medvetet ingen inloggning att kringgå.
//
// EU-region av samma skäl som askCoach: spelardata om minderåriga ska
// behandlas inom EU hela vägen (se kommentaren vid askCoach).
exports.mintPlayerLink = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Du måste vara inloggad.');
    }
    const userId = context.auth.uid;
    const { playerName } = data;
    if (!playerName || typeof playerName !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Spelarnamn saknas.');
    }

    // Ägarkoll: spelaren måste finnas under den inloggade förälderns egna
    // users/{uid}/players — annars kunde vem som helst skapa en länk för
    // en spelare de inte äger genom att bara gissa ett namn.
    const playerRef = getUsersCollection().doc(userId).collection('players').doc(playerName);
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Spelaren hittades inte.');
    }

    const linksRef = db.collection('artifacts').doc(APP_ID).collection('playerLinks');

    // Länken ska vara BESTÅENDE — samma URL ska funka igen och igen.
    // Återanvänd en redan aktiv (icke-återkallad) länk för samma spelare
    // i stället för att skapa en ny varje gång knappen trycks, annars
    // sprider sig flera giltiga länkar för samma spelare i onödan.
    // Rent likhetsfilter (==) på tre fält — kräver inget kompositindex.
    const existing = await linksRef
      .where('userId', '==', userId)
      .where('playerName', '==', playerName)
      .where('revokedAt', '==', null)
      .limit(1)
      .get();
    if (!existing.empty) {
      const token = existing.docs[0].id;
      return { token, url: `${APP_URL}/p/${token}` };
    }

    const token = crypto.randomBytes(24).toString('base64url');
    await linksRef.doc(token).set({
      userId,
      playerName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedAt: null,
    });
    return { token, url: `${APP_URL}/p/${token}` };
  });

// Delad tokenupplösning för de inloggningsfria spelarlänk-funktionerna.
// Kastar samma fel som tidigare låg inline i getPlayerLinkData, så både
// läs- och skrivvägen behandlar ogiltiga/återkallade tokens identiskt.
async function resolvePlayerLink(token) {
  if (!token || typeof token !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Ogiltig länk.');
  }
  const linkRef = db.collection('artifacts').doc(APP_ID).collection('playerLinks').doc(token);
  const linkDoc = await linkRef.get();
  if (!linkDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Länken hittades inte.');
  }
  const link = linkDoc.data();
  if (link.revokedAt) {
    throw new functions.https.HttpsError('permission-denied', 'Länken är inte längre aktiv.');
  }
  return link;
}

// FÖRSTA skrivvägen från den inloggningsfria spelarsidan — allt annat där
// är läsning. Säkerhetsöverväganden, i tur och ordning:
//
// 1. Token:en är hela behörigheten (som resten av spelarlänken). Den som
//    har länken får redan se spelarens statistik, så att också kunna
//    markera en rutin som gjord vidgar inte vad en läckt länk avslöjar.
// 2. Skriver ENDAST routineCompletions. Rör aldrig poäng, saldo, krediter
//    eller prenumerationsfält — den här funktionen har inget att göra i
//    de fälten, och att begränsa den här är billigare än att lita på
//    Firestore-reglerna (som ändå inte gäller för admin-SDK:t).
// 3. Datumet sätts av SERVERN, aldrig av klienten. Annars kunde vem som
//    helst med länken backdatera poster och fabricera en streak.
// 4. En post per datum: är dagens datum redan loggat returnerar vi utan
//    att skriva. Det gör upprepade anrop gratis (ingen Firestore-skrivning
//    per klick) och håller fältet naturligt begränsat.
// 5. Listan kapas till de 60 senaste datumen — streaken behöver bara de
//    senaste matcherna, och fältet får aldrig växa obegränsat.
exports.logRoutineCompletion = functions
  .region('europe-west1')
  .https.onCall(async (data) => {
    const link = await resolvePlayerLink(data && data.token);
    const { userId, playerName } = link;

    const playerRef = getUsersCollection().doc(userId).collection('players').doc(playerName);
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Spelaren hittades inte längre.');
    }

    const today = new Date().toISOString().slice(0, 10);
    const existing = playerDoc.data().routineCompletions;
    const completions = Array.isArray(existing)
      ? existing.filter((d) => typeof d === 'string')
      : [];

    if (completions.includes(today)) {
      // Redan loggad idag — ingen skrivning, men returnera aktuell streak
      // så knappen ändå kan visa rätt siffra.
      const gamesSnap = await playerRef.collection('games').orderBy('date', 'asc').get();
      const games = gamesSnap.docs.map((d) => ({ date: d.data().date }));
      return { alreadyLogged: true, streak: computeRoutineStreak(games, completions) };
    }

    const updated = [...completions, today].sort().slice(-60);
    await playerRef.set({ routineCompletions: updated }, { merge: true });

    const gamesSnap = await playerRef.collection('games').orderBy('date', 'asc').get();
    const games = gamesSnap.docs.map((d) => ({ date: d.data().date }));
    return { alreadyLogged: false, streak: computeRoutineStreak(games, updated) };
  });

// Läses av spelarens egen (inloggningsfria) sida. Ingen context.auth-koll
// medvetet — token:en är beviset. Returnerar BARA det som PlayerLinkPage
// faktiskt visar: spelarnamn, säsongsdata och senaste coach-yttrandet.
// Aldrig currentBalance, email, subscriptionPlan/Status, aiCredits eller
// purchasedCredits — samma princip som matchReport.ts redan följer för
// delade matchrapporter, men strängare eftersom det här är en riktigt
// publik, inloggningsfri URL.
exports.getPlayerLinkData = functions
  .region('europe-west1')
  .https.onCall(async (data) => {
    const link = await resolvePlayerLink(data && data.token);
    const { userId, playerName } = link;
    const playerRef = getUsersCollection().doc(userId).collection('players').doc(playerName);
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) {
      // Spelaren kan ha raderats efter att länken skapades.
      throw new functions.https.HttpsError('not-found', 'Spelaren hittades inte längre.');
    }

    // Enkelfälts-orderBy ('date') — kräver inget kompositindex.
    const gamesSnap = await playerRef.collection('games').orderBy('date', 'asc').get();
    const games = gamesSnap.docs.map((d) => ({ date: d.data().date, points: d.data().points || 0 }));
    const full = buildSeasonSummary(games);
    // Trimmat till exakt det SeasonOverview-komponenten behöver — inga
    // extra fält (totalPoints, firstGame, lastGame, worstGame) skickas
    // över nätet i onödan, även om de inte är känsliga i sig.
    const summary = full
      ? { games: full.games, avgPoints: full.avgPoints, bestGame: full.bestGame, last5Avg: full.last5Avg }
      : null;

    // Senaste coach-yttrandet: läses ur redan sparad text i coachChats
    // (sparas av klienten i useCoachChats.ts efter varje coach-svar) —
    // INGET nytt AI-anrop görs här. Vi undviker medvetet ett filter på
    // playerName + orderBy('updatedAt') ihop (det skulle kräva ett nytt
    // kompositindex); hämtar i stället de senaste chattarna för hela
    // kontot och letar upp rätt spelare i minnet. Om spelaren har fler än
    // 30 andra coach-chattar sen den senaste om denna spelare missas den
    // — ett medvetet, ofarligt undantag (fältet blir bara null) snarare
    // än att kräva ett extra indexdeploy för v1.
    const chatsSnap = await getUsersCollection().doc(userId).collection('coachChats')
      .orderBy('updatedAt', 'desc')
      .limit(30)
      .get();
    let latestCoachNote = null;
    const chatDoc = chatsSnap.docs.find((d) => d.data().playerName === playerName);
    if (chatDoc) {
      const messages = chatDoc.data().messages || [];
      const lastAi = [...messages].reverse().find((m) => m.role === 'ai');
      if (lastAi) latestCoachNote = lastAi.text;
    }

    // routineCompletions skrivs bara av logRoutineCompletion ovan. Själva
    // datumen skickas aldrig till klienten — bara den räknade streaken,
    // som är det enda sidan visar.
    const routineStreak = computeRoutineStreak(games, playerDoc.data().routineCompletions);

    return { playerName, games, summary, latestCoachNote, routineStreak };
  });


// ==========================================
//  STRIPE FUNCTIONS (UPPGRADERAD RAM)
// ==========================================

exports.createStripeCheckoutSession = functions
  .runWith({ secrets: [stripeSecretKey], memory: "512MB" }) // Ökat minne
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");

    const { interval, plan, lang } = data;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    // Valutan följer språket kunden faktiskt har i appen — det är samma regel
    // som bestämde priset hen just läste på sidan.
    const currency = currencyForLang(lang);
    const priceTable = PRICES[currency];

    try {
      const stripeInstance = getStripe();
      const customerId = await getOrCreateCustomer(userId, userEmail, lang);

      // Engångsköp av krediter: eget läge (payment) och eget pris. Kunden får
      // justera antalet paket i kassan; webhooken läser slutgiltig kvantitet.
      if (plan === 'credits') {
        // Kreditpaketet är ett engångsköp och kan mycket väl sakna USD-pris
        // även när prenumerationerna har ett. Då säljs det i SEK i stället för
        // att knappen går sönder — beloppet syns i Stripes kassa innan kunden
        // betalar, så ingen debiteras något hen inte fått se.
        const packCurrency = priceTable.credits ? currency : "sek";
        const expectedPack = priceTable.credits || PRICES.sek.credits;
        const packPrice = await stripeInstance.prices.retrieve(expectedPack.id);
        // Engångspriser saknar 'recurring' — ett prenumerationspris här skulle
        // binda kunden till en månadsdebitering hen aldrig bad om.
        if (
          packPrice.recurring ||
          packPrice.currency !== packCurrency ||
          packPrice.unit_amount !== expectedPack.amount
        ) {
          console.error(
            `Prisfel: ${expectedPack.id} är ${packPrice.unit_amount} ${packPrice.currency}` +
            `${packPrice.recurring ? `/${packPrice.recurring.interval} (återkommande)` : ' (engång)'} ` +
            `— förväntade ett engångspris på ${expectedPack.amount} ${packCurrency}.`
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
            price: expectedPack.id,
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

      const planKey = plan === 'elite' ? 'elite' : 'premium';
      const intervalKey = interval === "yearly" ? "yearly" : "monthly";
      const expected = priceTable[planKey][intervalKey];

      // Kontrollera att pris-ID:t verkligen är det vi tror innan kunden debiteras.
      // Ett hopblandat ID (fel intervall, fel valuta eller fel belopp) ska stoppa
      // köpet, inte tyst dra fel summa. Beloppkontrollen är också skyddet mot att
      // src/utils/pricing.ts och den här tabellen glider isär: då ser kunden ett
      // pris och debiteras ett annat, och det ska bli ett fel — inte en tvist.
      // Kräver Prices:read på API-nyckeln.
      const price = await stripeInstance.prices.retrieve(expected.id);
      const expectedInterval = interval === "yearly" ? "year" : "month";
      if (
        price.recurring?.interval !== expectedInterval ||
        price.currency !== currency ||
        price.unit_amount !== expected.amount
      ) {
        console.error(
          `Prisfel: ${expected.id} är ${price.unit_amount} ${price.currency}/` +
          `${price.recurring?.interval} — förväntade ${expected.amount} ${currency}/${expectedInterval}. ` +
          `Kontrollera PRICES i functions/index.js mot Stripe.`
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
        line_items: [{ price: expected.id, quantity: 1 }],
        metadata: {
            planType: plan || 'premium',
            // Vilken valuta kunden faktiskt köpte i — syns i Stripe och gör att
            // en felanmälan går att härleda utan att gissa utifrån pris-ID:t.
            currency,
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
  .runWith({ secrets: [stripeSecretKey, stripeWebhookSecret, resendApiKey], memory: "512MB" })
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

          // Bara vid faktisk tilldelning: en omleverans från Stripe ska inte
          // ge kunden ett andra mejl om krediter den redan fått.
          if (granted) {
            await sendPurchaseEmailSafely(userId, { kind: 'credits', credits: bought });
          }

        } else if (userId) {
          const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
          const interval = subscription.items.data[0].plan.interval;

          const planType = data.metadata?.planType || "premium";
          const creditAmount = creditsForPlan(planType);

          const userRef = usersRef.doc(userId);
          await userRef.set({
            stripeCustomerId: customerId,
            subscriptionStatus: "active",
            subscriptionId: subscriptionId,
            subscriptionPlan: planType,
            subscriptionInterval: interval,
            subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            aiCredits: creditAmount
          }, { merge: true });
          console.log(`✅ ${planType} activated for ${userId} with ${creditAmount} AI credits`);

          // Skrivningen ovan tål att upprepas (absoluta värden, inga
          // increments) — men det gör inte mejlet. Utan den här spärren får
          // kunden ett nytt aktiveringsmejl varje gång Stripe levererar om
          // händelsen. Sessions-ID:t som dokumentnamn följer samma mönster
          // som creditPurchases ovan.
          const activationRef = userRef.collection('subscriptionActivations').doc(data.id);
          const firstActivation = await db.runTransaction(async (tx) => {
            if ((await tx.get(activationRef)).exists) return false;
            tx.set(activationRef, {
              planType,
              interval,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
          });

          if (firstActivation) {
            await sendPurchaseEmailSafely(userId, { kind: 'subscription', planType, credits: creditAmount });
          }
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
            
            // Kolla om det är Elite eller Premium baserat på Pris-ID. Slås upp
            // över alla valutor — en Elite-kund som betalat i USD ska förstås
            // förnyas som Elite, inte falla tillbaka på Premiums kreditpott.
            const creditAmount = creditsForPlan(planForPriceId(priceId) || 'premium');

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
          // Planen skrivs över till "free" i samma anrop — utan att spara
          // den gamla planen här kan ops-digesten aldrig säga VAD som sades
          // upp, bara ATT något gjorde det.
          const cancelledPlan = snapshot.docs[0].data().subscriptionPlan || null;
          await snapshot.docs[0].ref.update({
            subscriptionStatus: "cancelled",
            subscriptionPlan: "free",
            aiCredits: 0,
            cancelledPlan,
            // Utan tidsstämpel här går det inte att skilja "sa upp i morse"
            // från "sa upp för tre månader sen" — ops-digesten (se runOpsDigest)
            // behöver den för att bara räkna veckans uppsägningar.
            subscriptionCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
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
    // Dokumentet skapas först efter att Auth-kontot finns (AuthContext kör i
    // onAuthStateChanged), så uppslaget hittar alltid användaren här.
    const email = await getUserEmail(snap.id);
    if (!email) {
      console.warn(`Välkomstmejl hoppades över för ${snap.id} — ingen e-postadress i Auth.`);
      return null;
    }

    const { subject, html } = buildWelcomeEmail(data.language, data.displayName);
    try {
      await sendEmail(email, subject, html, SUPPORT_REPLY_TO);
      console.log(`✅ Välkomstmejl skickat till ${email}`);
    } catch (err) {
      console.error(`Välkomstmejl misslyckades för ${email}:`, err);
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
    const email = await getUserEmail(userDoc.id);
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
      // Samma svarsadress som övriga kundmejl — utan den går svar till
      // noreply-adressen och försvinner.
      await sendEmail(redirectTo || email, subject, html, SUPPORT_REPLY_TO);
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

// Permanent rapportverktyg (till skillnad från de tillfälliga test-
// endpointsen ovan) — svarar på "vilken kanal ger faktiskt betalande
// kunder", inte bara "hur många registrerade sig". Bara aggregerade
// siffror i svaret, aldrig namn eller e-post.
//
// ?since=YYYY-MM-DD  begränsar till konton skapade från och med det datumet
exports.acquisitionReport = functions
  .runWith({ secrets: [reportsToken], timeoutSeconds: 120 })
  .https.onRequest(async (req, res) => {
    if (req.get('x-reports-token') !== reportsToken.value()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    try {
      const since = typeof req.query.since === 'string' ? req.query.since : null;
      const usersSnap = await getUsersCollection().get();

      const report = {
        since: since || null,
        totalUsers: 0,
        totalWithAcquisition: 0,
        totalDirect: 0, // inget utm_source sparat — direkttrafik eller innan spårningen fanns
        bySource: {},
        byCampaign: {},
      };

      const isPaid = (u) => u.subscriptionStatus === 'active' && u.subscriptionPlan !== 'free';

      const bump = (bucket, key, u) => {
        if (!bucket[key]) bucket[key] = { signups: 0, paid: 0 };
        bucket[key].signups++;
        if (isPaid(u)) bucket[key].paid++;
      };

      for (const userDoc of usersSnap.docs) {
        const u = userDoc.data();
        if (since && (!u.createdAt || u.createdAt < since)) continue;

        report.totalUsers++;
        const source = u.acquisition?.source;
        if (!source) {
          report.totalDirect++;
          continue;
        }
        report.totalWithAcquisition++;
        bump(report.bySource, source, u);
        if (u.acquisition?.campaign) bump(report.byCampaign, u.acquisition.campaign, u);
      }

      res.json(report);
    } catch (err) {
      console.error('acquisitionReport misslyckades:', err);
      res.status(500).json({ error: 'Failed', message: err.message });
    }
  });

// ==========================================
//  OPS-DIGEST (VECKORAPPORT TILL BJORN)
// ==========================================
// Svarar på "vad hände den här veckan" över hela användarbasen —
// inklusive gratisanvändarna, som Stripe aldrig ser eftersom de inte har
// någon betalning att visa upp. Skickas bara till en person (dig), inte
// till kunder, så listorna nedan innehåller riktiga e-postadresser —
// till skillnad från acquisitionReport ovan, som är en publik JSON-endpoint
// och därför medvetet håller sig till aggregat.
//
// Samma N+1-läsmönster som runWeeklyDigest (en fråga per användare, ibland
// per spelare) — rimligt för en veckovis cron-körning vid den här
// användarvolymen, men första stället att optimera om användarbasen växer
// mycket.
const runOpsDigest = async ({ dryRun = false, redirectTo = null } = {}) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString();
  const weekAgoTs = admin.firestore.Timestamp.fromDate(weekAgo);

  // 14 dagar, inte 7 — matchar produktens egen matchrytm (1-3 matcher/vecka,
  // se computeRoutineStreak ovan). En 7-dagarsgräns hade flaggat helt
  // normala familjer som "inaktiva" bara för att de hade en vilovecka.
  const inactiveCutoffDate = new Date();
  inactiveCutoffDate.setDate(inactiveCutoffDate.getDate() - 14);
  const inactiveCutoffISO = inactiveCutoffDate.toISOString().split('T')[0];

  const usersSnap = await getUsersCollection().get();

  const newSignups = [];
  const purchases = [];
  const cancellations = [];
  let activePremium = 0;
  let activeElite = 0;
  let pastDue = 0;
  let notPaying = 0;
  let inactive14d = 0;
  // Aktiveringstratten: var i kedjan konto -> spelare -> första matchen som
  // folk faktiskt fastnar. Utan de här siffrorna syns bara "hur många
  // registrerade sig" och "hur många betalar" — aldrig steget däremellan,
  // som är där de flesta nya konton tar slut.
  let noPlayers = 0;
  let playersNoGames = 0;
  let activated = 0;

  for (const userDoc of usersSnap.docs) {
    const u = userDoc.data();
    // Bara uid här — adresserna slås upp i Auth i ett svep när loopen är
    // klar (getUserEmails nedan), så rapporten inte bygger på ett fält som
    // kan vara inaktuellt eller saknas helt på nyare konton.
    const uid = userDoc.id;
    const isNewThisWeek = typeof u.createdAt === 'string' && u.createdAt >= weekAgoISO;

    if (u.subscriptionStatus === 'active' && u.subscriptionPlan === 'elite') activeElite++;
    else if (u.subscriptionStatus === 'active' && u.subscriptionPlan === 'premium') activePremium++;
    else if (u.subscriptionStatus === 'past_due') pastDue++;
    else notPaying++;

    const cancelledAt = u.subscriptionCancelledAt?.toDate?.();
    if (cancelledAt && cancelledAt >= weekAgo) {
      cancellations.push({ uid, plan: u.cancelledPlan || '?' });
    }

    const [subsSnap, creditsSnap] = await Promise.all([
      userDoc.ref.collection('subscriptionActivations').where('createdAt', '>=', weekAgoTs).get(),
      userDoc.ref.collection('creditPurchases').where('createdAt', '>=', weekAgoTs).get(),
    ]);
    subsSnap.forEach((d) => {
      const p = d.data();
      purchases.push({ uid, detail: `${p.planType || '?'} (${p.interval || '?'})` });
    });
    creditsSnap.forEach((d) => {
      const p = d.data();
      const amount = typeof p.amountTotal === 'number'
        ? ` — ${(p.amountTotal / 100).toFixed(2)} ${(p.currency || '').toUpperCase()}`
        : '';
      purchases.push({ uid, detail: `${p.credits || '?'} krediter${amount}` });
    });

    // Senaste matchdatumet över kontots alla spelare. Ett dokument per
    // spelare räcker (sorterat fallande), och vi slutar leta så fort vi
    // hittat en match som ändå är färsk nog — samma tak på antalet läsningar
    // som den tidigare varianten, men svaret räcker nu till både
    // "har aldrig loggat en match" och "har slutat logga".
    const playersSnap = await userDoc.ref.collection('players').get();
    let latestGameDate = null;
    for (const playerDoc of playersSnap.docs) {
      const lastGame = await playerDoc.ref.collection('games')
        .orderBy('date', 'desc')
        .limit(1)
        .get();
      if (lastGame.empty) continue;
      const date = lastGame.docs[0].data().date;
      if (typeof date !== 'string') continue;
      if (!latestGameDate || date > latestGameDate) latestGameDate = date;
      if (latestGameDate >= inactiveCutoffISO) break;
    }

    if (playersSnap.empty) noPlayers++;
    else if (!latestGameDate) playersNoGames++;
    else {
      activated++;
      // Inaktivitet är bara en meningsfull siffra för konton som redan hunnit
      // använda appen — annars räknar den bara upp den här veckans nya konton
      // en gång till, vilket redan syns i "Nya konton" ovan.
      if (!isNewThisWeek && latestGameDate < inactiveCutoffISO) inactive14d++;
    }

    // Sist i loopen: nu vet vi om kontot hunnit logga något, och veckans
    // kohort kan redovisas med sin egen aktiveringsgrad i stället för att
    // blandas ihop med hela basen.
    if (isNewThisWeek) {
      newSignups.push({ uid, lang: u.language || 'en', activated: latestGameDate !== null });
    }
  }

  // Ett uppslag för alla uid som faktiskt hamnade i rapporten. Konton som
  // hunnit raderas i Auth visas som uid:t — bättre än en tom rad.
  const emailByUid = await getUserEmails([
    ...new Set([...newSignups, ...purchases, ...cancellations].map((r) => r.uid)),
  ]);
  const label = (uid) => emailByUid.get(uid) || `(${uid})`;

  const cap = (arr, n) => arr.length > n ? [...arr.slice(0, n), null] : arr; // null = "+X fler"
  const listRows = (arr, n, render) => {
    const shown = cap(arr, n);
    const rows = shown.map((item) => item === null
      ? `<tr><td style="padding:4px 12px;color:#9ca3af;font-style:italic;" colspan="2">+ ${arr.length - n} till</td></tr>`
      : render(item));
    return rows.join('');
  };

  const totalUsers = usersSnap.size;
  const newActivated = newSignups.filter((n) => n.activated).length;
  // Andelen skrivs bara ut när den betyder något — "0 av 0 = 0 %" ser ut som
  // ett resultat, men är bara ett tomt underlag.
  const share = (n) => (totalUsers > 0 ? ` (${Math.round((n / totalUsers) * 100)} %)` : '');

  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;">
      <h2 style="margin:24px 0 4px;">Ice <span style="color:#0891b2;">IQ</span> — veckorapport</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:13px;">${weekAgo.toISOString().split('T')[0]} → idag</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:14px;">
        <tr style="background:#f3f4f6;">
          <td style="padding:8px 12px;">Nya konton</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${newSignups.length}</td>
        </tr>
        <tr><td style="padding:8px 12px;">Köp den här veckan</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${purchases.length}</td></tr>
        <tr style="background:#f3f4f6;"><td style="padding:8px 12px;">Uppsägningar den här veckan</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${cancellations.length}</td></tr>
        <tr><td style="padding:8px 12px;">Aktiva — Premium / Elite</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${activePremium} / ${activeElite}</td></tr>
        <tr style="background:#f3f4f6;"><td style="padding:8px 12px;">Betalning misslyckad just nu (past_due)</td><td style="padding:8px 12px;text-align:right;font-weight:bold;${pastDue > 0 ? 'color:#c2410c;' : ''}">${pastDue}</td></tr>
        <tr><td style="padding:8px 12px;">Inaktiva 14+ dagar (av de med spelare)</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${inactive14d}</td></tr>
      </table>

      <h3 style="font-size:14px;margin:0 0 8px;">Aktivering</h3>
      <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">
        Var kedjan konto &rarr; spelare &rarr; f&ouml;rsta matchen tar slut. Hela basen, inte bara den h&auml;r veckan.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:14px;">
        <tr style="background:#f3f4f6;">
          <td style="padding:8px 12px;">Konton totalt</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${totalUsers}</td>
        </tr>
        <tr><td style="padding:8px 12px;">— utan spelare (kom aldrig ig&aring;ng)</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${noPlayers}${share(noPlayers)}</td></tr>
        <tr style="background:#f3f4f6;"><td style="padding:8px 12px;">— spelare, men aldrig loggat en match</td><td style="padding:8px 12px;text-align:right;font-weight:bold;">${playersNoGames}${share(playersNoGames)}</td></tr>
        <tr><td style="padding:8px 12px;">— har loggat minst en match</td><td style="padding:8px 12px;text-align:right;font-weight:bold;color:#047857;">${activated}${share(activated)}</td></tr>
        <tr style="background:#f3f4f6;">
          <td style="padding:8px 12px;">Nya konton denna vecka som loggat en match</td>
          <td style="padding:8px 12px;text-align:right;font-weight:bold;">${newActivated} av ${newSignups.length}</td>
        </tr>
      </table>

      ${newSignups.length ? `
        <h3 style="font-size:14px;margin:0 0 8px;">Nya konton</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">${listRows(newSignups, 20, (s) => `<tr><td style="padding:4px 12px;">${label(s.uid)}</td><td style="padding:4px 12px;color:#9ca3af;">${s.lang} · ${s.activated ? 'loggat match' : 'ingen match än'}</td></tr>`)}</table>
      ` : ''}

      ${purchases.length ? `
        <h3 style="font-size:14px;margin:0 0 8px;">Köp</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">${listRows(purchases, 20, (p) => `<tr><td style="padding:4px 12px;">${label(p.uid)}</td><td style="padding:4px 12px;color:#6b7280;">${p.detail}</td></tr>`)}</table>
      ` : ''}

      ${cancellations.length ? `
        <h3 style="font-size:14px;margin:0 0 8px;">Uppsägningar</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">${listRows(cancellations, 20, (c) => `<tr><td style="padding:4px 12px;">${label(c.uid)}</td><td style="padding:4px 12px;color:#6b7280;">${c.plan}</td></tr>`)}</table>
      ` : ''}

      <p style="color:#9ca3af;font-size:11px;margin-top:32px;">Automatiskt genererad, mottagare: ${OPS_EMAIL}.</p>
    </div>`;

  const stats = {
    newSignups: newSignups.length,
    purchases: purchases.length,
    cancellations: cancellations.length,
    activePremium,
    activeElite,
    pastDue,
    notPaying,
    inactive14d,
    totalUsers,
    noPlayers,
    playersNoGames,
    activated,
    newActivated,
  };

  if (dryRun) return { dryRun: true, stats };

  await sendEmail(redirectTo || OPS_EMAIL, `Ice IQ — veckorapport (${weekAgo.toISOString().split('T')[0]} →)`, html);
  return { dryRun: false, sentTo: redirectTo || OPS_EMAIL, stats };
};

exports.opsDigest = functions
  .runWith({ memory: "512MB", timeoutSeconds: 540, secrets: [resendApiKey] })
  .pubsub.schedule('30 7 * * 1') // Måndagar 07:30 — en halvtimme före kundernas weeklyDigest
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const result = await runOpsDigest();
    console.log(`📊 Ops-digest skickad. ${JSON.stringify(result.stats)}`);
    return null;
  });

// Manuell testtrigger, samma säkerhetsmönster som runWeeklyDigestNow:
//   (inget)      -> torrkörning, returnerar bara siffrorna, skickar inget
//   ?live=true   -> skickar skarpt till OPS_EMAIL
//   ?to=adress   -> skickar riktigt innehåll till en annan adress istället
exports.runOpsDigestNow = functions
  .runWith({ memory: "512MB", timeoutSeconds: 540, secrets: [resendApiKey, digestTestToken] })
  .https.onRequest(async (req, res) => {
    if (req.get('x-digest-token') !== digestTestToken.value()) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const to = typeof req.query.to === 'string' ? req.query.to : null;
    const live = req.query.live === 'true';

    try {
      const result = await runOpsDigest({ dryRun: !to && !live, redirectTo: to });
      res.json(result);
    } catch (err) {
      console.error('runOpsDigestNow misslyckades:', err);
      res.status(500).json({ error: 'Failed', message: err.message });
    }
  });

