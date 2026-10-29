// Kör: node --test functions/cardFocus.test.js
const test = require("node:test");
const assert = require("node:assert");
const {
  FOCUS_TAG_TRACK, FOCUS_TAG_DESCRIPTION, daysBetween, normalizeLastFocus, suggestedTrack, followUpPromptBlock,
} = require("./cardFocus");

const KNOWN = Object.keys(FOCUS_TAG_DESCRIPTION);
const TODAY = "2026-10-29";

test("daysBetween räknar hela dagar och avvisar skräp", () => {
  assert.strictEqual(daysBetween("2026-10-22", TODAY), 7);
  assert.strictEqual(daysBetween(TODAY, TODAY), 0);
  assert.strictEqual(daysBetween("nonsens", TODAY), null);
  assert.strictEqual(daysBetween(undefined, TODAY), null);
  assert.strictEqual(daysBetween("2026-13-45", TODAY), null);
});

test("normalizeLastFocus kastar okända taggar, dåligt datum och fel form", () => {
  assert.deepStrictEqual(
    normalizeLastFocus({ tags: ["fokus_press", "påhittad", 5], at: "2026-10-20" }, KNOWN),
    { tags: ["fokus_press"], at: "2026-10-20" },
  );
  assert.strictEqual(normalizeLastFocus({ tags: [], at: "2026-10-20" }, KNOWN), null);
  assert.strictEqual(normalizeLastFocus({ tags: ["fokus_press"], at: "igår" }, KNOWN), null);
  assert.strictEqual(normalizeLastFocus({ tags: "fokus_press", at: "2026-10-20" }, KNOWN), null);
  assert.strictEqual(normalizeLastFocus(null, KNOWN), null);
  assert.strictEqual(normalizeLastFocus([], KNOWN), null);
});

test("max två taggar behålls", () => {
  const out = normalizeLastFocus({ tags: ["avslut", "zonspel", "fokus_press"], at: "2026-10-20" }, KNOWN);
  assert.deepStrictEqual(out.tags, ["avslut", "zonspel"]);
});

test("fokus_press ger spåret focus, färskt tips", () => {
  assert.strictEqual(suggestedTrack({ tags: ["fokus_press"], at: "2026-10-25" }, TODAY, KNOWN), "focus");
});

test("tagg utan kortinnehåll ger inget tips, men nästa tagg med innehåll vinner", () => {
  assert.strictEqual(suggestedTrack({ tags: ["zonspel"], at: "2026-10-25" }, TODAY, KNOWN), null);
  assert.strictEqual(suggestedTrack({ tags: ["zonspel", "fokus_press"], at: "2026-10-25" }, TODAY, KNOWN), "focus");
});

test("gammalt eller framtida tips ger inget spår", () => {
  assert.strictEqual(suggestedTrack({ tags: ["fokus_press"], at: "2026-09-01" }, TODAY, KNOWN), null);
  assert.strictEqual(suggestedTrack({ tags: ["fokus_press"], at: "2026-11-30" }, TODAY, KNOWN), null);
  assert.strictEqual(suggestedTrack(undefined, TODAY, KNOWN), null);
});

test("alla spår i FOCUS_TAG_TRACK hör till kända taggar", () => {
  for (const tag of Object.keys(FOCUS_TAG_TRACK)) assert.ok(KNOWN.includes(tag), tag);
});

test("uppföljningsblocket är tomt utan fokus eller när det är för gammalt", () => {
  assert.strictEqual(followUpPromptBlock(undefined, TODAY, KNOWN), "");
  assert.strictEqual(followUpPromptBlock({ tags: ["fokus_press"], at: "2026-08-01" }, TODAY, KNOWN), "");
  assert.strictEqual(followUpPromptBlock({ tags: ["okänd"], at: "2026-10-20" }, TODAY, KNOWN), "");
});

test("uppföljningsblocket beskriver fokuset på vanlig svenska och förbjuder påståenden om övningen", () => {
  const block = followUpPromptBlock({ tags: ["fokus_press"], at: "2026-10-20" }, TODAY, KNOWN);
  assert.ok(block.includes("2026-10-20"));
  assert.ok(block.includes("att hålla fokus och marginalerna under press"));
  assert.ok(!block.includes("fokus_press"), "taggnamnet ska inte läcka in i prompten");
  assert.ok(block.includes("du vet INTE om den gjorts"));
  assert.ok(block.includes("Finns inga matcher efter 2026-10-20"));
});
