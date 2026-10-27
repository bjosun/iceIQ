// Kör: node --test functions/season_pass.test.js
const test = require("node:test");
const assert = require("node:assert");
const { seasonPassEnd } = require("./season_pass");

const iso = (d) => seasonPassEnd(new Date(d)).toISOString();

test("köp i oktober → 31 juli nästa år", () => {
  assert.strictEqual(iso("2026-10-27T12:00:00Z"), "2027-07-31T23:59:59.000Z");
});

test("köp i augusti och januari → samma 31 juli", () => {
  assert.strictEqual(iso("2026-08-01T00:00:00Z"), "2027-07-31T23:59:59.000Z");
  assert.strictEqual(iso("2027-01-15T00:00:00Z"), "2027-07-31T23:59:59.000Z");
});

test("köp i juni eller juli (mindre än 60 dagar kvar) → nästa säsong", () => {
  assert.strictEqual(iso("2027-06-10T00:00:00Z"), "2028-07-31T23:59:59.000Z");
  assert.strictEqual(iso("2027-07-30T00:00:00Z"), "2028-07-31T23:59:59.000Z");
});

test("köp i maj (drygt 60 dagar kvar) → samma säsong", () => {
  assert.strictEqual(iso("2027-05-30T00:00:00Z"), "2027-07-31T23:59:59.000Z");
});
