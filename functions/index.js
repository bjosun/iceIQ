const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const { VertexAI } = require('@google-cloud/vertexai'); // <-- NY: Importera Vertex AI
const { defineSecret } = require('firebase-functions/params');

admin.initializeApp();
const db = admin.firestore(); // Spara referens till db

// Definiera dina secrets
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

// --- KONFIGURATION ---
const APP_URL = "https://iceiq-v2.web.app"; 
const APP_ID = "default-app-id";
const PROJECT_ID = "squareverse-36179"; // <-- Dinu projekt-ID

// --- PRIS IDn ---
const monthlyPriceId = "price_1SG0PzG6k6tU2YpwlL1sRjxo"; 
const yearlyPriceId = "price_1SG0R0G6k6tU2Ypw8v1wALpq"; 

// --- INITIERA VERTEX AI (GEMINI) ---
const vertex_ai = new VertexAI({
  project: PROJECT_ID,
  location: 'us-central1' // Vi kör us-central1 för bäst tillgänglighet på Gemini
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
//  AI COACH FUNCTION (NY)
// ==========================================
exports.askCoach = functions.https.onCall(async (data, context) => {
  // 1. Säkerhetskoll
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Du måste vara inloggad.');
  }

  const userId = context.auth.uid;
  const { playerStats, question } = data;

  // 2. Hämta användaren
  const userRef = getUsersCollection().doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Användare hittades inte.');
  }

  const userData = userDoc.data();
  
  // Kontrollera plan (Premium eller Elite)
  // Om fältet saknas, anta 'free' om de inte har subscriptionStatus active
  const isSubscribed = userData.subscriptionStatus === 'active';
  const plan = userData.subscriptionPlan || (isSubscribed ? 'premium' : 'free');

  // Hantera krediter (Om fältet saknas, ge 10 "test-krediter" om man är betalande)
  let credits = userData.aiCredits;
  if (credits === undefined && isSubscribed) {
      credits = 10;
      await userRef.update({ aiCredits: 10 }); // Spara initieringsvärdet
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

  // 4. Välj modell
  // Elite = Pro (Smartare), Premium = Flash (Snabbare)
  const modelName = plan === 'elite' 
    ? 'gemini-1.5-pro-preview-0409' 
    : 'gemini-1.5-flash-preview-0514';

  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  // 5. Prompten
  const systemPrompt = `
    Du är en erfaren ishockeytränare som heter "Ice IQ Coach". 
    Din uppgift är att analysera spelarstatistik och ge konkreta, konstruktiva råd.
    
    Här är spelarens statistik:
    ${JSON.stringify(playerStats)}
    
    ${question ? `Spelarens specifika fråga: "${question}"` : 'Ge en analys av styrkor och svagheter.'}

    Svara kortfattat, proffsigt och på Svenska. Använd emojis 🏒.
    ${plan === 'elite' ? 'Gör en djupgående taktisk analys.' : 'Håll det enkelt och motiverande.'}
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
    throw new functions.https.HttpsError('internal', 'Coachen kunde inte svara just nu.');
  }
});


// ==========================================
//  STRIPE FUNCTIONS (DINA GAMLA)
// ==========================================

exports.createStripeCheckoutSession = functions
  .runWith({ secrets: [stripeSecretKey] })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");

    const { interval } = data;
    const priceId = interval === "yearly" ? yearlyPriceId : monthlyPriceId;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    try {
      const stripeInstance = getStripe();
      const customerId = await getOrCreateCustomer(userId, userEmail);

      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/dashboard`,
        client_reference_id: userId,
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
      });

      return { id: session.id };
    } catch (error) {
      console.error("Stripe session failed:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

exports.createStripePortalSession = functions
  .runWith({ secrets: [stripeSecretKey] })
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
  .runWith({ secrets: [stripeSecretKey] })
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

// Uppdaterad Webhook för att sätta default-krediter vid köp
exports.stripeWebhook = functions
  .runWith({ secrets: [stripeSecretKey, stripeWebhookSecret] })
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
          
          await usersRef.doc(userId).set({
            stripeCustomerId: customerId,
            subscriptionStatus: "active",
            subscriptionId: subscriptionId,
            subscriptionPlan: "premium", // Vi utgår från att allt är premium just nu
            subscriptionInterval: interval,
            subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            // NYTT: Ge 15 krediter när man köper premium!
            aiCredits: 15 
          }, { merge: true });
          console.log(`✅ Premium activated for ${userId} with 15 AI credits`);
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
            aiCredits: 0 // Ta bort krediter om man säger upp
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