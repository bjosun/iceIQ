// Apple In-App Purchase via RevenueCat. RevenueCat skickar en webhook för varje
// köpshändelse; här översätts den till exakt samma användarfält som
// Stripe-webhooken (index.js) skriver — subscriptionPlan/Status/Interval/End,
// aiCredits och purchasedCredits. Resten av appen läser bara de fälten och
// bryr sig inte om var köpet gjordes.
//
// subscriptionSource ('stripe' | 'apple') säger vilken kassa som äger
// prenumerationen, så att en uppsägning hos den ena aldrig nollar en
// prenumeration som betalas via den andra.
//
// Produkt-ID:n måste vara exakt de som skapas i App Store Connect och kopplas
// i RevenueCat. Se docs/ios-app-plan.md.

const crypto = require("crypto");

const PRODUCTS = {
  iceiq_premium_monthly: { kind: "subscription", plan: "premium", interval: "monthly" },
  iceiq_premium_yearly: { kind: "subscription", plan: "premium", interval: "yearly" },
  iceiq_elite_monthly: { kind: "subscription", plan: "elite", interval: "monthly" },
  iceiq_elite_yearly: { kind: "subscription", plan: "elite", interval: "yearly" },
  iceiq_credits_15: { kind: "credits" },
};

const ACTIVATING = new Set(["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"]);
// Nya krediter delas ut när en period faktiskt börjar, inte när bara
// auto-förnyelsen slås på igen eller man byter plan mitt i en period.
const GRANTS_MONTHLY_CREDITS = new Set(["INITIAL_PURCHASE", "RENEWAL"]);

// Ren funktion: händelse + nuvarande användardokument -> fält att skriva, eller
// null om ingenting ska göras. Ingen I/O här, så den går att testa utan Firebase.
//   deps.creditsForPlan(plan) och deps.creditsPerPack kommer från index.js.
function buildUserUpdate(event, user, deps) {
  const product = PRODUCTS[event.product_id];
  const type = event.type;

  if (type === "NON_RENEWING_PURCHASE" || (product && product.kind === "credits" && type === "INITIAL_PURCHASE")) {
    if (!product || product.kind !== "credits") return null;
    return { creditsToAdd: deps.creditsPerPack };
  }

  if (ACTIVATING.has(type)) {
    if (!product || product.kind !== "subscription") return null;
    const update = {
      subscriptionStatus: "active",
      subscriptionPlan: product.plan,
      subscriptionInterval: product.interval,
      subscriptionSource: "apple",
    };
    if (event.expiration_at_ms) {
      update.subscriptionEnd = new Date(event.expiration_at_ms).toISOString();
    }
    if (GRANTS_MONTHLY_CREDITS.has(type)) {
      update.aiCredits = deps.creditsForPlan(product.plan);
    }
    return { set: update };
  }

  // Från och med här ändras bara en prenumeration som Apple äger.
  if (user.subscriptionSource !== "apple") return null;

  if (type === "EXPIRATION") {
    return {
      set: {
        subscriptionStatus: "cancelled",
        subscriptionPlan: "free",
        aiCredits: 0,
        cancelledPlan: user.subscriptionPlan || null,
      },
      stampCancelledAt: true,
    };
  }

  if (type === "BILLING_ISSUE") {
    return { set: { subscriptionStatus: "past_due" } };
  }

  // CANCELLATION = auto-förnyelse avslagen; prenumerationen gäller tills
  // perioden går ut (då kommer EXPIRATION). TEST, TRANSFER m.fl. ignoreras.
  return null;
}

function authorized(header, secret) {
  if (!header || !secret) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Webhooken. functions/admin/db/secret skickas in från index.js så att vi
// delar samma initierade app och samma secrets-hantering.
function createRevenueCatWebhook({ functions, admin, db, secret, getUsersCollection, creditsForPlan, creditsPerPack }) {
  return functions
    .runWith({ secrets: [secret] })
    .https.onRequest(async (req, res) => {
      if (req.method !== "POST") return res.status(405).send();
      if (!authorized(req.headers.authorization, secret.value())) {
        console.error("RevenueCat webhook: fel Authorization-header.");
        return res.status(401).send();
      }

      const event = req.body && req.body.event;
      if (!event || !event.id || !event.type) return res.status(400).send();

      const uid = event.app_user_id;
      // Anonyma RevenueCat-ID:n ($RCAnonymousID:...) betyder att inköpet gjordes
      // innan Purchases.logIn(uid) — det går inte att koppla till en användare.
      if (!uid || String(uid).startsWith("$RCAnonymousID")) {
        console.warn(`RevenueCat ${event.type}: anonymt app_user_id, ignorerar.`);
        return res.json({ received: true, ignored: "anonymous" });
      }

      try {
        const userRef = getUsersCollection().doc(uid);
        const eventRef = userRef.collection("iapEvents").doc(event.id);

        const outcome = await db.runTransaction(async (tx) => {
          const [userSnap, eventSnap] = await Promise.all([tx.get(userRef), tx.get(eventRef)]);
          if (!userSnap.exists) return "no-user";
          if (eventSnap.exists) return "duplicate";

          const user = userSnap.data();
          // RevenueCat kan leverera i fel ordning. Äldre händelse än den vi
          // redan tillämpat får inte skriva över nyare tillstånd.
          const ts = event.event_timestamp_ms || 0;
          if (ts && user.iapLastEventMs && ts < user.iapLastEventMs) {
            tx.set(eventRef, { type: event.type, skipped: "stale", createdAt: admin.firestore.FieldValue.serverTimestamp() });
            return "stale";
          }

          const change = buildUserUpdate(event, user, { creditsForPlan, creditsPerPack });
          tx.set(eventRef, {
            type: event.type,
            productId: event.product_id || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          if (!change) return "no-op";

          const write = { ...(change.set || {}) };
          if (ts) write.iapLastEventMs = ts;
          if (change.stampCancelledAt) {
            write.subscriptionCancelledAt = admin.firestore.FieldValue.serverTimestamp();
          }
          if (change.creditsToAdd) {
            write.purchasedCredits = admin.firestore.FieldValue.increment(change.creditsToAdd);
          }
          tx.set(userRef, write, { merge: true });
          return "applied";
        });

        console.log(`RevenueCat ${event.type} för ${uid}: ${outcome}`);
        return res.json({ received: true, outcome });
      } catch (err) {
        console.error("RevenueCat webhook failed:", err);
        // 500 gör att RevenueCat försöker igen.
        return res.status(500).send("Server Error");
      }
    });
}

module.exports = { createRevenueCatWebhook, buildUserUpdate, PRODUCTS };
