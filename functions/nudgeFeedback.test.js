// Kör: node --test functions/nudgeFeedback.test.js
const test = require("node:test");
const assert = require("node:assert");
const { REASONS, label, feedbackToken, feedbackUrl, isValid, createNudgeFeedback } = require("./nudgeFeedback");

const SECRET = "test-secret";
const BASE = "https://www.iceiq.app/nudge-feedback";

test("en giltig signatur godtas, en ändrad avvisas", () => {
  const t = feedbackToken(SECRET, "uid1", "auto");
  assert.ok(isValid(SECRET, "uid1", "auto", t));
  assert.ok(!isValid(SECRET, "uid1", "start", t), "signaturen gäller bara det valda svaret");
  assert.ok(!isValid(SECRET, "uid2", "auto", t), "signaturen gäller bara det kontot");
  assert.ok(!isValid("annan-nyckel", "uid1", "auto", t));
  assert.ok(!isValid(SECRET, "uid1", "auto", t.slice(0, 63) + "0"));
  assert.ok(!isValid(SECRET, "uid1", "okänt", t));
  assert.ok(!isValid(SECRET, "", "auto", t));
});

test("länken har konto, svar, signatur och språk", () => {
  const url = new URL(feedbackUrl(BASE, SECRET, "abc123", "start", "en"));
  assert.strictEqual(url.searchParams.get("u"), "abc123");
  assert.strictEqual(url.searchParams.get("r"), "start");
  assert.strictEqual(url.searchParams.get("l"), "en");
  assert.ok(isValid(SECRET, "abc123", "start", url.searchParams.get("t")));
});

test("alla svar har text på båda språken", () => {
  for (const r of REASONS) {
    assert.ok(label(r, "en") && label(r, "sv"));
  }
});

// Minimal imitation av Cloud Functions och Express, så att själva hanteraren kan köras.
function setup({ exists = true } = {}) {
  const writes = [];
  const functions = { runWith: () => ({ https: { onRequest: (fn) => fn } }) };
  const handler = createNudgeFeedback({
    functions,
    secret: { value: () => SECRET },
    getUsersCollection: () => ({
      doc: () => ({
        get: async () => ({ exists }),
        set: async (data, opts) => writes.push({ data, opts }),
      }),
    }),
    baseUrl: BASE,
    appUrl: "https://iceiq.app",
    supportEmail: "support@example.com",
  });
  const call = async (method, query, body) => {
    const res = { code: 200, headers: {}, html: "" };
    res.status = (c) => { res.code = c; return res; };
    res.set = (h) => { Object.assign(res.headers, h); return res; };
    res.send = (h) => { res.html = h; return res; };
    await handler({ method, query, body }, res);
    return res;
  };
  return { call, writes };
}

const q = (reason, lang = "en") => ({ u: "uid1", r: reason, t: feedbackToken(SECRET, "uid1", reason), l: lang });

test("GET visar bara sidan och sparar ingenting (mejlskannrar)", async () => {
  const { call, writes } = setup();
  const res = await call("GET", q("auto"));
  assert.strictEqual(res.code, 200);
  assert.ok(res.html.includes("I expected it to follow the game automatically"));
  assert.ok(res.html.includes('method="POST"'));
  assert.strictEqual(writes.length, 0);
});

test("POST sparar svaret och den valfria kommentaren", async () => {
  const { call, writes } = setup();
  const res = await call("POST", q("start"), { comment: "  I couldn't find where to begin  " });
  assert.strictEqual(res.code, 200);
  assert.strictEqual(writes.length, 1);
  assert.strictEqual(writes[0].data.nudgeFeedback.reason, "start");
  assert.strictEqual(writes[0].data.nudgeFeedback.comment, "I couldn't find where to begin");
  assert.deepStrictEqual(writes[0].opts, { merge: true });
});

test("kommentaren kapas och är valfri", async () => {
  const { call, writes } = setup();
  await call("POST", q("notnow"), { comment: "x".repeat(900) });
  assert.strictEqual(writes[0].data.nudgeFeedback.comment.length, 500);
  await call("POST", q("notnow"), {});
  assert.ok(!("comment" in writes[1].data.nudgeFeedback));
});

test("fel signatur ger 400 och sparar ingenting", async () => {
  const { call, writes } = setup();
  const bad = { ...q("auto"), t: "0".repeat(64) };
  assert.strictEqual((await call("GET", bad)).code, 400);
  assert.strictEqual((await call("POST", bad, { comment: "hej" })).code, 400);
  assert.strictEqual(writes.length, 0);
});

test("ett konto som inte finns (testmejl) får tack men ingenting skrivs", async () => {
  const { call, writes } = setup({ exists: false });
  const res = await call("POST", q("auto"));
  assert.strictEqual(res.code, 200);
  assert.strictEqual(writes.length, 0);
});

test("svenska sidan visas på svenska", async () => {
  const { call } = setup();
  const res = await call("GET", q("start", "sv"));
  assert.ok(res.html.includes("Jag visste inte hur jag skulle komma igång"));
});
