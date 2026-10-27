// Kör: node --test functions/reconcile_stripe_flags.test.js
const test = require("node:test");
const assert = require("node:assert");
const { reconcileUserFlag } = require("./reconcile_stripe_flags");

const premium = (extra = {}) => ({
  subscriptionPlan: "premium", subscriptionStatus: "active",
  subscriptionSource: "stripe", stripeCustomerId: "cus_x", ...extra,
});
const sub = (status, extra = {}) => ({ id: "sub_1", status, ...extra });

test("missad deleted-webhook: betald flagga men ingen levande prenumeration → nedgradera", () => {
  const r = reconcileUserFlag(premium(), [sub("canceled", { canceled_at: 1782691200 })]);
  assert.strictEqual(r.outcome, "downgrade");
  assert.strictEqual(r.set.subscriptionPlan, "free");
  assert.strictEqual(r.set.subscriptionStatus, "cancelled");
  assert.strictEqual(r.set.cancelledPlan, "premium");
  assert.strictEqual(r.set.aiCredits, 0);
  // Verklig avslutstid från Stripe — inte "när vi märkte det".
  assert.strictEqual(r.canceledAt, 1782691200);
});

test("kund utan någon prenumeration alls → nedgradera utan avslutsdatum", () => {
  const r = reconcileUserFlag(premium(), []);
  assert.strictEqual(r.outcome, "downgrade");
  assert.strictEqual(r.canceledAt, null);
});

test("levande Stripe-prenumeration → rör aldrig flaggan", () => {
  for (const s of ["active", "trialing", "past_due"]) {
    assert.strictEqual(reconcileUserFlag(premium(), [sub(s)]), null);
  }
});

test("past_due-flagga på frisk prenumeration → återställ till active", () => {
  const r = reconcileUserFlag(premium({ subscriptionStatus: "past_due" }), [sub("active")]);
  assert.strictEqual(r.outcome, "restore");
  assert.strictEqual(r.set.subscriptionStatus, "active");
});

test("apple-ägd prenumeration rörs aldrig av Stripe-svepet", () => {
  assert.strictEqual(reconcileUserFlag(premium({ subscriptionSource: "apple" }), []), null);
});

test("fri användare eller redan avslutad → inget att göra", () => {
  assert.strictEqual(reconcileUserFlag({ subscriptionPlan: "free" }, []), null);
  assert.strictEqual(reconcileUserFlag(premium({ subscriptionStatus: "cancelled" }), []), null);
});

test("betald flagga UTAN stripeCustomerId → flagga, nedgradera aldrig tyst", () => {
  const r = reconcileUserFlag(premium({ stripeCustomerId: undefined }), null);
  assert.strictEqual(r.outcome, "flagged");
  assert.ok(!("set" in r));
});
