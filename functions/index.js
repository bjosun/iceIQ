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

  // 2. Hämta användaren
  const userRef = getUsersCollection().doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Användare hittades inte.');
  }

  const userData = userDoc.data();
   
  // Kontrollera plan
  const isSubscribed = userData.subscriptionStatus === 'active';
  const plan = userData.subscriptionPlan || (isSubscribed ? 'premium' : 'free');

  // Hantera krediter
  let credits = userData.aiCredits;
  if (credits === undefined && isSubscribed) {
      credits = 50;
      await userRef.update({ aiCredits: 50 });
  } else if (credits === undefined) {
      credits = 0;
  }

  // 3. Spärrar
  if (!isSubscribed && plan === 'free') {
     throw new functions.https.HttpsError('permission-denied', 'Uppgradera till Premium för att använda coachen.');
  }

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
  
  // Använd stabila API:t
  const generativeModel = vertex_ai.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: 800,
      temperature: 0.4,
    },
  });

  // 5. Prompten (Förbättrad kontext)
  const systemPrompt = `
      Du är "Ice IQ Coach", en elitinriktad ishockeytränare och mentor.
      Din uppgift är att maximera spelarens prestation på och utanför isen.

      VIKTIG KONTEXT OM APPENS POÄNGSYSTEM (ICE IQ):
      - Appen använder ett prestationsbaserat poängsystem för att mäta spelarens "impact" på isen. "Totalpoäng" är det sammanlagda resultatet av prestationen i matchen (högre är bättre).
      - Du får in spelarens statistik i ett format som visar 'action' (handling), 'count' (antal) och 'points_impact' (poängvärde).
      - Om 'points_impact' är en POSITIV siffra (+): Handlingen var framgångsrik och bidrog positivt till lagets/spelarens prestation.
      - Om 'points_impact' är en NEGATIV siffra (-): Handlingen var ett misstag (t.ex. utvisning, pucktapp, missad markering) som skadade prestationen.
      - Du MÅSTE använda 'points_impact' för att bedöma vad spelaren gjorde bra och vad som måste förbättras. Fokusera på de handlingar som gav högst pluspoäng (styrkor) och de som gav mest minuspoäng (svagheter/utvecklingsområden).
      - STRICT REGEL: Fråga ALDRIG spelaren hur poängsystemet fungerar eller vad poängen representerar. Du ska agera som att du redan är expert på Ice IQ:s system. Analysera datan direkt och dra dina egna ishockeymässiga slutsatser.
      
      Dina tillåtna ämnen är:
      1. Ishockey (taktik, teknik, spelförståelse).
      2. Fysträning och rehabilitering.
      3. Mental träning och tävlingspsykologi.
      4. Kost och återhämtning.

      Data för analys:
      - Pågående session (dagens match): ${JSON.stringify(playerStats.stats || {})}
      - Historik (senaste 3 matcherna): ${JSON.stringify(playerStats.history || [])}
      - Totalpoäng: ${playerStats.totals?.total || 0}
      
      Spelarens fråga: "${question || 'Ge en analys baserat på min statistik.'}"

      VIKTIGA INSTRUKTIONER (SPRÅK & TON):
      1. SPRÅK: Svara på språkkoden "${userLanguage}". Om frågan ställs på ett annat språk, svara på samma språk som frågan.
      2. TON: Professionell, coachande, peppande och konstruktiv. Du är rak men rättvis. Använd emojis sparsamt 🏒.
      3. GUARDRAILS: Om frågan inte rör ishockey, träning eller hälsa, svara vänligt: "Jag fokuserar endast på din hockeyutveckling."
      4. FORMAT: Ge utförliga och insiktsfulla svar, men håll det lättläst. Använd max 2-3 korta stycken eller tydliga punktlistor. En riktig coach går rakt på sak utan onödigt babbel.
    `;

  try {
    const req = {
      contents: [{role: 'user', parts: [{text: systemPrompt}]}],
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
      batch.update(doc.ref, { aiCredits: 3 });
      count++;
    });

    await batch.commit();
    console.log(`✅ Månadsuppdatering klar: Gav 3 AI-krediter till ${count} gratisanvändare.`);
    return null;
  });