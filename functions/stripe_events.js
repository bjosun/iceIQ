// Rena hjälpare för Stripe-webhooken (stripeWebhook i index.js).
//
// Två saker som webhooken inte klarade 2026-10-30:
//
// 1. Fälten har flyttat. Webhook-slutpunkten står på en nyare Stripe-version
//    (2025-09-30.clover). Där finns prenumerations-id:t på en faktura under
//    invoice.parent.subscription_details.subscription, inte i
//    invoice.subscription. Periodens slut ligger på prenumerationsraden
//    (items.data[0].current_period_end), inte på prenumerationen. Förnyelser
//    hoppades därför över: kunden debiterades men varken slutdatum eller
//    krediter uppdaterades. Hjälparna läser båda formaten.
//
// 2. Stripe-kontot delas med andra ventures (BudPro, tandis, …), så webhooken
//    får deras köp också. Ett köp hör till iceIQ bara om det bär vår markering
//    (metadata.app, satt från 2026-10-30) eller har en iceIQ-form som andra
//    ventures inte använder. Användaren måste dessutom finnas, vilket index.js
//    kontrollerar, så ett främmande köp aldrig kan skapa ett iceIQ-konto.

const APP_ID = "iceiq";

/** Prenumerations-id:t en faktura gäller, i både gamla och nya API-versioner. */
function invoiceSubscriptionId(invoice) {
  if (!invoice || typeof invoice !== "object") return null;
  const direct = invoice.subscription;
  if (typeof direct === "string" && direct) return direct;
  if (direct && typeof direct.id === "string") return direct.id;
  const parent = invoice.parent?.subscription_details?.subscription;
  if (typeof parent === "string" && parent) return parent;
  for (const line of invoice.lines?.data || []) {
    const s = line?.parent?.subscription_item_details?.subscription || line?.subscription;
    if (typeof s === "string" && s) return s;
  }
  return null;
}

/** Periodens slut som ISO-sträng, eller null om Stripe inte angav något. */
function subscriptionPeriodEndISO(subscription) {
  const sec = subscription?.current_period_end ?? subscription?.items?.data?.[0]?.current_period_end;
  return Number.isFinite(sec) ? new Date(sec * 1000).toISOString() : null;
}

/**
 * Vilket slags iceIQ-köp en avslutad kassa är, eller null om den inte är vår.
 * @returns {"credits"|"season_pass"|"subscription"|null}
 */
function iceiqCheckoutKind(session) {
  if (!session || typeof session !== "object" || !session.client_reference_id) return null;
  const meta = session.metadata || {};
  const ours = meta.app === APP_ID;
  if (session.mode === "payment" && meta.type === "credits" && (ours || meta.creditsPerPack)) return "credits";
  if (session.mode === "payment" && meta.type === "season_pass" && (ours || meta.currency)) return "season_pass";
  if (session.mode === "subscription" && session.subscription && (ours || meta.planType)) return "subscription";
  return null;
}

module.exports = { APP_ID, invoiceSubscriptionId, subscriptionPeriodEndISO, iceiqCheckoutKind };
