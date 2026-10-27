// Stripe→Firestore-avstämning för prenumerationsflaggor.
//
// Webhooks är i praktiken at-most-once: en missad customer.subscription.deleted
// lämnar subscriptionPlan:"premium" + subscriptionStatus:"active" kvar för
// alltid (observerat 2026-10-27: konto avslutat i Stripe 2026-06-29 men flaggan
// satt kvar fyra månader senare). En schemalagd svepning gör flaggorna
// konvergenta — samma nedgraderingsskrivning som webhooken gör, men med
// avstämningsproveniens.
//
// Ren beslutsfunktion separerad från I/O — testbar utan Firebase eller Stripe.

// Stripe-statusar som betyder "kunden betalar fortfarande". Canceled,
// incomplete_expired, unpaid och avsaknad av prenumeration = inte betalande.
const STRIPE_LIVE = new Set(["active", "trialing", "past_due"]);

/**
 * @param {object} user       user-dokumentets data (Firestore)
 * @param {Array}  stripeSubs kundens prenumerationer i Stripe (status:"all"),
 *                            eller null om stripeCustomerId saknas
 * @returns {null|{outcome: string, set?: object, canceledAt?: number}}
 *   null        = inget att göra (gratis, apple-ägd, eller Stripe håller med)
 *   "downgrade" = skriv `set`; `canceledAt` (epoch s) om Stripe vet när
 *   "flagged"   = betald flagga utan Stripe-kund — aldrig tyst nedgradering
 *                 (kan vara manuellt tilldelat comp-konto), bara rapport
 */
function reconcileUserFlag(user, stripeSubs) {
  if (user.subscriptionSource === "apple") return null;
  if (!user.subscriptionPlan || user.subscriptionPlan === "free") return null;
  if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "past_due") return null;

  if (!user.stripeCustomerId) return { outcome: "flagged" };

  const live = (stripeSubs || []).filter((s) => STRIPE_LIVE.has(s.status));
  if (live.length) {
    // Stripe säger betalande — men en past_due-flagga på en frisk prenumeration
    // är samma sorts drift åt andra hållet (missad invoice.payment_succeeded).
    if (user.subscriptionStatus !== "active") {
      return { outcome: "restore", set: { subscriptionStatus: "active" } };
    }
    return null;
  }

  // Stripe har ingen levande prenumeration. Avslutstiden är den verkliga —
  // VI skriver inte dagens datum: en avstämd uppsägning är inte en ny churn,
  // och veckodigesten ska räkna den i den vecka den faktiskt hände.
  const newestEnded = (stripeSubs || [])
    .filter((s) => typeof s.canceled_at === "number" || typeof s.ended_at === "number")
    .sort((a, b) => (b.canceled_at || b.ended_at) - (a.canceled_at || a.ended_at))[0];
  return {
    outcome: "downgrade",
    set: {
      subscriptionStatus: "cancelled",
      subscriptionPlan: "free",
      aiCredits: 0,
      cancelledPlan: user.subscriptionPlan,
    },
    canceledAt: newestEnded ? (newestEnded.canceled_at || newestEnded.ended_at) : null,
  };
}

module.exports = { reconcileUserFlag, STRIPE_LIVE };
