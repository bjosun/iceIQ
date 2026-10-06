// Kör: node --test functions/revenuecat.test.js
const test = require("node:test");
const assert = require("node:assert");
const { buildUserUpdate } = require("./revenuecat");

const deps = { creditsForPlan: (p) => ({ premium: 50, elite: 500 }[p] ?? 50), creditsPerPack: 15 };
const ev = (type, product_id, extra = {}) => ({ id: "e1", type, product_id, ...extra });

test("första köpet aktiverar planen och delar ut månadskrediter", () => {
  const r = buildUserUpdate(ev("INITIAL_PURCHASE", "iceiq_elite_yearly", { expiration_at_ms: 1790000000000 }), {}, deps);
  assert.deepStrictEqual(r.set, {
    subscriptionStatus: "active", subscriptionPlan: "elite", subscriptionInterval: "yearly",
    subscriptionSource: "apple", subscriptionEnd: new Date(1790000000000).toISOString(), aiCredits: 500,
  });
});

test("planbyte fyller inte på krediter", () => {
  const r = buildUserUpdate(ev("PRODUCT_CHANGE", "iceiq_elite_monthly"), { subscriptionSource: "apple" }, deps);
  assert.strictEqual(r.set.subscriptionPlan, "elite");
  assert.ok(!("aiCredits" in r.set));
});

test("kreditpaket ökar purchasedCredits", () => {
  assert.deepStrictEqual(buildUserUpdate(ev("NON_RENEWING_PURCHASE", "iceiq_credits_15"), {}, deps), { creditsToAdd: 15 });
});

test("okänd produkt ignoreras", () => {
  assert.strictEqual(buildUserUpdate(ev("INITIAL_PURCHASE", "nope"), {}, deps), null);
});

test("EXPIRATION nollar bara en prenumeration som Apple äger", () => {
  const apple = buildUserUpdate(ev("EXPIRATION", "iceiq_premium_monthly"), { subscriptionSource: "apple", subscriptionPlan: "premium" }, deps);
  assert.strictEqual(apple.set.subscriptionPlan, "free");
  assert.strictEqual(apple.set.cancelledPlan, "premium");
  assert.strictEqual(buildUserUpdate(ev("EXPIRATION", "iceiq_premium_monthly"), { subscriptionSource: "stripe", subscriptionPlan: "premium" }, deps), null);
  assert.strictEqual(buildUserUpdate(ev("EXPIRATION", "iceiq_premium_monthly"), { subscriptionPlan: "premium" }, deps), null);
});

test("BILLING_ISSUE och CANCELLATION", () => {
  const u = { subscriptionSource: "apple" };
  assert.strictEqual(buildUserUpdate(ev("BILLING_ISSUE", "iceiq_premium_monthly"), u, deps).set.subscriptionStatus, "past_due");
  assert.strictEqual(buildUserUpdate(ev("CANCELLATION", "iceiq_premium_monthly"), u, deps), null);
});
