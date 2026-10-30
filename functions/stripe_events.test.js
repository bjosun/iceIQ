// Kör: node --test functions/stripe_events.test.js
const test = require("node:test");
const assert = require("node:assert");
const { invoiceSubscriptionId, subscriptionPeriodEndISO, iceiqCheckoutKind } = require("./stripe_events");

test("faktura: gammalt format (invoice.subscription)", () => {
  assert.strictEqual(invoiceSubscriptionId({ subscription: "sub_old" }), "sub_old");
  assert.strictEqual(invoiceSubscriptionId({ subscription: { id: "sub_exp" } }), "sub_exp");
});

test("faktura: clover-format (parent.subscription_details)", () => {
  assert.strictEqual(invoiceSubscriptionId({ parent: { subscription_details: { subscription: "sub_new" } } }), "sub_new");
});

test("faktura: id bara på raden", () => {
  assert.strictEqual(invoiceSubscriptionId({ lines: { data: [{ parent: { subscription_item_details: { subscription: "sub_line" } } }] } }), "sub_line");
});

test("faktura utan prenumeration (engångsköp) → null", () => {
  assert.strictEqual(invoiceSubscriptionId({ parent: { type: "quote_details" }, lines: { data: [{}] } }), null);
  assert.strictEqual(invoiceSubscriptionId(null), null);
});

test("periodens slut: på prenumerationen eller på raden", () => {
  assert.strictEqual(subscriptionPeriodEndISO({ current_period_end: 1794470400 }), "2026-11-12T08:00:00.000Z");
  assert.strictEqual(subscriptionPeriodEndISO({ items: { data: [{ current_period_end: 1794470400 }] } }), "2026-11-12T08:00:00.000Z");
  assert.strictEqual(subscriptionPeriodEndISO({ items: { data: [] } }), null);
});

test("kassor: iceIQ:s tre köp känns igen, även före markeringen", () => {
  const base = { client_reference_id: "uid1" };
  assert.strictEqual(iceiqCheckoutKind({ ...base, mode: "payment", metadata: { type: "credits", creditsPerPack: "15" } }), "credits");
  assert.strictEqual(iceiqCheckoutKind({ ...base, mode: "payment", metadata: { type: "season_pass", currency: "sek" } }), "season_pass");
  assert.strictEqual(iceiqCheckoutKind({ ...base, mode: "subscription", subscription: "sub_1", metadata: { planType: "premium", currency: "sek" } }), "subscription");
  assert.strictEqual(iceiqCheckoutKind({ ...base, mode: "subscription", subscription: "sub_1", metadata: { app: "iceiq" } }), "subscription");
});

test("kassor från andra ventures på samma Stripe-konto ignoreras", () => {
  assert.strictEqual(iceiqCheckoutKind({ client_reference_id: "t_1", mode: "subscription", subscription: "sub_x", metadata: { company_id: "budpro" } }), null);
  assert.strictEqual(iceiqCheckoutKind({ client_reference_id: "t_1", mode: "payment", metadata: {} }), null);
  assert.strictEqual(iceiqCheckoutKind({ mode: "subscription", subscription: "sub_x", metadata: { planType: "premium" } }), null, "utan användare");
  assert.strictEqual(iceiqCheckoutKind({ client_reference_id: "u", mode: "subscription", metadata: { planType: "premium" } }), null, "utan prenumeration");
});
