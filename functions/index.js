const functions = require("firebase-functions/v1"); // VIKTIGT: /v1 krävs för att .runWith ska fungera med Node 20
const admin = require("firebase-admin");
const Stripe = require("stripe");
const { VertexAI } = require('@google-cloud/vertexai'); 
const { defineSecret } = require('firebase-functions/params');

admin.initializeApp();
const db = admin.firestore();

// Definiera dina secrets
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

// --- KONFIGURATION ---
const APP_URL = "https://iceiq-v2.web.app"; 
const APP_ID = "default-app-id";
const FREE_MONTHLY_CREDITS = 3; // Gratisplanens AI-krediter per månad
const PROJECT_ID = "squareverse-36179"; 

// --- PRIS IDn ---
const monthlyPriceId = "price_1SG0PzG6k6tU2YpwlL1sRjxo"; 
const yearlyPriceId = "price_1SG0R0G6k6tU2Ypw8v1wALpq"; 
const eliteMonthlyPriceId = "price_1T0OCgG6k6tU2YpwHLrOYeHV"; 
const eliteYearlyPriceId = "price_1T0ODTG6k6tU2YpwZUMoaXzE";

// --- INITIERA VERTEX AI (GEMINI) ---
const vertex_ai = new VertexAI({
  project: PROJECT_ID,
  location: 'us-central1'
});

// --- STRIPE HELPER ---
let stripe;
const getStripe = () => {
  if (!stripe) {
    const secretKey = stripeSecretKey.value();
    if (!secretKey) throw new Error("Stripe secret key missing.");
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
    return userData.stripeCustomerId;
  }

  console.log(`Creating new Stripe customer for: ${email}`);
  const customer = await stripeInstance.customers.create({
    email: email,
    metadata: { firebaseUID: userId }
  });

  await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
  return customer.id;
};

// ==========================================
//  AI COACH FUNCTION (FIXAD & UPPGRADERAD RAM)
// ==========================================
exports.askCoach = functions
  .runWith({ memory: "1GB", timeoutSeconds: 120 }) // Ökat minne för AI:n för att förhindra krasch
  .https.onCall(async (data, context) => {
  // 1. Säkerhetskoll
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Du måste vara inloggad.');
  }

  const userId = context.auth.uid;
  
  // VIKTIGT: Hämta 'lang' här också!
  const { playerStats, question, lang } = data;

  // 2. Hämta användaren (dokumentet kanske inte finns ännu för helt nya konton)
  const userRef = getUsersCollection().doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};

  // Kontrollera plan
  const isSubscribed = userData.subscriptionStatus === 'active';
  const plan = userData.subscriptionPlan || (isSubscribed ? 'premium' : 'free');

  // Hantera krediter. Free-planen inkluderar FREE_MONTHLY_CREDITS gratis
  // analyser per månad (fylls på av refillFreeCreditsMonthly) — det är
  // produktens "prova på"-upplevelse, så free får INTE blockeras här.
  let credits = userData.aiCredits;
  if (credits === undefined) {
      credits = isSubscribed ? (plan === 'elite' ? 500 : 50) : FREE_MONTHLY_CREDITS;
      // set + merge så nya konton utan användardokument också fungerar.
      // subscriptionPlan sätts så att månadspåfyllnaden hittar gratisanvändaren.
      await userRef.set({ aiCredits: credits, subscriptionPlan: plan }, { merge: true });
  }

  // 3. Spärr: krediterna är den enda gränsen, oavsett plan
  if (credits <= 0) {
    throw new functions.https.HttpsError('resource-exhausted', 'Slut på krediter för denna månad.');
  }

  // Sätt språk
  const userLanguage = lang || 'en';

  // 4. Välj modell
  const modelName = plan === 'elite' 
    ? 'gemini-2.5-pro' 
    : 'gemini-2.5-flash';
    
  console.log(`Använder modell: ${modelName} (Lang: ${userLanguage})`);

  const systemPrompt = `
      Du är "Ice IQ Coach", en elitinriktad ishockeytränare och mentor.
      Din uppgift är att maximera spelarens prestation på och utanför isen genom djupgående dataanalys.

      VIKTIG KONTEXT OM APPENS POÄNGSYSTEM (ICE IQ):
      - Appen använder ett prestationsbaserat poängsystem för att mäta spelarens "impact". 
      - Om 'points_impact' är POSITIV (+): Handlingen var framgångsrik och bidrog till laget.
      - Om 'points_impact' är NEGATIV (-): Handlingen var ett misstag (t.ex. panikrensning, pucktapp).
      - STRICT REGEL: Fråga ALDRIG hur poängsystemet fungerar. Agera som att du är experten.

      HUR DU SKA ANALYSERA (MYCKET VIKTIGT):
      1. Om "Pågående session" är tom: Klaga INTE på att data saknas. Då är spelaren här för att utvärdera sin historik. Dyk direkt ner i "Historik"-datan.
      2. Identifiera trender: Jämför alltid prestationerna över tid. Går totalpoängen upp eller ner? Vilka specifika handlingar har blivit bättre eller sämre mellan matcherna? 
      3. Var proaktiv: Tvinga inte spelaren att dra ur dig informationen. Ditt första svar ska alltid innehålla en konkret analys.
      
      FORMATERA DITT SVAR SÅ HÄR (Översätt rubrikerna till ${userLanguage}):
      - 📈 ${userLanguage === 'sv' ? 'Trend' : 'Trend'}: ...
      - 💪 ${userLanguage === 'sv' ? 'Styrkor' : 'Strengths'}: ...
      - 🎯 ${userLanguage === 'sv' ? 'Fokusområde' : 'Focus Area'}: ...

      VIKTIGA INSTRUKTIONER (SPRÅK & TON):
      1. SPRÅK: Svara konsekvent på språkkoden "${userLanguage}". Blanda absolut inte språk.
      2. TON: Professionell, coachande och analytisk. 
      3. FORMAT: Använd korta stycken och punktlistor för att göra analysen lättläst. Inget onödigt babbel, men var utförlig i din feedback.
  `;
  // Använd stabila API:t och ladda in "personligheten" (systemInstruction) direkt i modellen!
  const generativeModel = vertex_ai.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt, // <-- Ninja-tricket!
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.4,
    },
  });

  // 5. Hantera användarens unika data och fråga
  try {
    const userMessage = `
      Data för analys:
      - Pågående session (dagens match): ${JSON.stringify(playerStats.stats || {})}
      - Historik (senaste 3 matcherna): ${JSON.stringify(playerStats.history || [])}
      - Totalpoäng: ${playerStats.totals?.total || 0}
      
      Spelarens fråga: "${question || 'Ge en analys baserat på min statistik.'}"
    `;

    const req = {
      contents: [{role: 'user', parts: [{text: userMessage}]}],
    };

    const result = await generativeModel.generateContent(req);
    const response = result.response;
    
    if (!response.candidates || response.candidates.length === 0) {
        throw new Error("Inget svar från AI.");
    }

    const text = response.candidates[0].content.parts[0].text;

    // 6. Dra av kredit
    await userRef.update({
      aiCredits: admin.firestore.FieldValue.increment(-1)
    });

    return { 
      success: true, 
      analysis: text, 
      creditsLeft: credits - 1 
    };

  } catch (error) {
    console.error("AI Error:", error);
    throw new functions.https.HttpsError('internal', `Coachen kunde inte svara just nu: ${error.message}`);
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
      
      let priceId;
      if (plan === 'elite') {
        priceId = interval === "yearly" ? eliteYearlyPriceId : eliteMonthlyPriceId;
       } else {
        priceId = interval === "yearly" ? yearlyPriceId : monthlyPriceId;
      }
      
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
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
      console.error("Stripe session failed:", error);
      throw new functions.https.HttpsError("internal", error.message);
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

        if (userId) {
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
//  VECKOMEJL (CRON JOB)
// ==========================================
// Köar mejl i kollektionen "mail" — kräver att Firebase-tillägget
// "Trigger Email from Firestore" (firebase/firestore-send-email) är
// installerat och konfigurerat mot den kollektionen. Utan tillägget
// skapas dokumenten men inga mejl skickas.
exports.weeklyDigest = functions
  .runWith({ memory: "512MB", timeoutSeconds: 540 })
  .pubsub.schedule('0 8 * * 1') // Måndagar 08:00
  .timeZone('Europe/Stockholm')
  .onRun(async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString().split('T')[0];

    const usersSnap = await getUsersCollection().get();
    let queued = 0;

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
        </div>`;

      await db.collection('mail').add({ to: email, message: { subject, html } });
      queued++;
    }

    console.log(`📬 Veckomejl: ${queued} köade.`);
    return null;
  });
