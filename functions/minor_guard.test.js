// Kör: node --test functions/minor_guard.test.js
const test = require("node:test");
const assert = require("node:assert");
const { statesUnder13 } = require("./minor_guard");

test("första person under 13 stoppas", () => {
  for (const t of ["i am 11 years old I play on the hawks", "I'm 12", "Im 9 and I play defense", "i am only 10.", "I’m 11 yo", "jag är 11 år", "jag är bara 12 år gammal"])
    assert.strictEqual(statesUnder13(t), true, t);
});

test("13 och uppåt, och förälder/tränare, stoppas inte", () => {
  for (const t of ["I am 13 years old", "I'm 45", "my son is 11 years old", "han är 11 år", "I am 11 games into the season", "I'm 12 games in", "jag är tränare för 11-åringar", "How many points in 11 games?", ""])
    assert.strictEqual(statesUnder13(t), false, t);
});

test("ingen text", () => {
  assert.strictEqual(statesUnder13(undefined), false);
  assert.strictEqual(statesUnder13(null), false);
});
