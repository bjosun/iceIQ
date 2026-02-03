const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();

// --- KONFIGURATION ---
// 1. FIXAD URL (https och inga extra snedstreck)
const APP_URL = "https://iceiq-v2.web.app"; 
const APP_ID = "default-app-id";

// --- PRIS IDn (Dina Live IDs) ---
const monthlyPriceId = "price_1SG0PzG6k6tU2YpwlL1sRjxo"; 
const yearlyPriceId = "price_1SG0R0G6k6tU2Ypw8v1wALpq"; 

// Hämta Stripe-instans
let stripe;
const getStripe = () => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Stripe secret key missing.");
    stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
  }
  return stripe;
};

// Hjälpfunktion för att nå rätt collection
const getUsersCollection = () => {
  return admin.firestore()
    .collection("artifacts")
    .doc(APP_ID)
    .collection("users");
};

// --- NY HJÄLPFUNKTION: Hämta eller Skapa Kund ---
// Detta löser problemet om användaren saknar ID i databasen
const getOrCreateCustomer = async (userId, email) => {
  const stripeInstance = getStripe();
  const userRef = getUsersCollection().doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  // 1. Om vi har ett ID, returnera det
  if (userData && userData.stripeCustomerId) {
    return userData.stripeCustomerId;
  }

  // 2. Om inte, skapa en ny kund i Stripe
  console.log(`Creating new Stripe customer for: ${email}`);
  const customer = await stripeInstance.customers.create({
    email: email,
    metadata: {
      firebaseUID: userId
    }
  });

  // 3. Spara ID:t i databasen så vi har det nästa gång
  await userRef.set({ stripeCustomerId: customer.id }, { merge: true });

  return customer.id;
};

/**
 * 1. Skapa Checkout Session
 */
exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");

  const { interval } = data;
  const priceId = interval === "yearly" ? yearlyPriceId : monthlyPriceId;
  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  try {
    const stripeInstance = getStripe();
    
    // 2. ANVÄND NYA FUNKTIONEN HÄR
    // Detta garanterar att vi alltid har ett giltigt customerId
    const customerId = await getOrCreateCustomer(userId, userEmail);

    const sessionParams = {
      payment_method_types: ["card"],
      mode: "subscription",
      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`, // Nu är URL korrekt
      cancel_url: `${APP_URL}/dashboard`,
      client_reference_id: userId,
      customer: customerId, // Vi skickar alltid med ID nu
      line_items: [{ price: priceId, quantity: 1 }],
      // allow_promotion_codes: true, // Slå på om du vill ha rabattkoder
    };

    const session = await stripeInstance.checkout.sessions.create(sessionParams);
    return { id: session.id };
  } catch (error) {
    console.error("Stripe session failed:", error);
    // Skicka med detaljerat fel om det går
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * 2. Skapa Customer Portal
 */
exports.createStripePortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");

  const userId = context.auth.uid;
  
  // Hämta ID direkt (här behöver vi inte skapa ny om den saknas, för man kan inte hantera en prenumeration som inte finns)
  const userDoc = await getUsersCollection().doc(userId).get();
  const customerId = userDoc.data()?.stripeCustomerId;

  if (!customerId) {
    throw new functions.https.HttpsError("failed-precondition", "No subscription found.");
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
    throw new functions.https.HttpsError("internal", "Could not create portal session.");
  }
});

/**
 * 3. Stripe Webhook
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripeInstance = getStripe();
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
    // A. Ny prenumeration (Betalning lyckades)
    if (event.type === "checkout.session.completed") {
      const userId = data.client_reference_id;
      const subscriptionId = data.subscription;
      const customerId = data.customer;

      if (userId) {
          const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
          
          await usersRef.doc(userId).set({
            stripeCustomerId: customerId,
            subscriptionStatus: "active",
            subscriptionId: subscriptionId,
            subscriptionPlan: "premium",
            subscriptionEnd: new Date(subscription.current_period_end * 1000).toISOString()
          }, { merge: true });
          
          console.log(`✅ Premium activated for user: ${userId}`);
      } else {
          console.warn("⚠️ Webhook missing client_reference_id");
      }
    }

    // B. Betalning misslyckades
    if (event.type === "invoice.payment_failed") {
      const customerId = data.customer;
      const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
      
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          subscriptionStatus: "past_due"
        });
        console.log(`⚠️ Payment failed for customer: ${customerId}`);
      }
    }

    // C. Prenumeration avslutad
    if (event.type === "customer.subscription.deleted") {
      const customerId = data.customer;
      const snapshot = await usersRef.where("stripeCustomerId", "==", customerId).get();
      
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          subscriptionStatus: "cancelled",
          subscriptionPlan: "free"
        });
        console.log(`❌ Subscription cancelled for customer: ${customerId}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    res.status(500).send("Server Error");
  }
});