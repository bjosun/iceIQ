// Körs med: node --test src/utils/matchChanges.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actionCounts, latestChanges, pointsVsAverage, latestGameDate, hasNewMatch, normalizeActionKey, sortedGames,
} from './matchChanges.ts';

const g = (date, points, counts) => ({ date, points, counts });
const POL = { 'Turnover': 'negative', 'Blocked Shot': 'positive', 'Faceoff Win': 'positive' };

const games = [
  g('2026-10-01', 8, { Turnover: 6, 'Blocked Shot': 1 }),
  g('2026-10-05', 9, { Turnover: 5, 'Blocked Shot': 0 }),
  g('2026-10-12', 10, { Turnover: 4, 'Blocked Shot': 2 }),
  g('2026-10-19', 11, { Turnover: 4, 'Blocked Shot': 1 }),
  g('2026-10-26', 14, { Turnover: 2, 'Blocked Shot': 3, 'Faceoff Win': 4 }),
];

test('JSON-nycklar {sv,en} normaliseras till engelskt namn och summeras', () => {
  assert.equal(normalizeActionKey('{"sv":"Pucktapp","en":"Turnover"}'), 'Turnover');
  assert.equal(normalizeActionKey('{trasig'), '{trasig');
  assert.deepEqual(actionCounts({ counts: { Turnover: 2, '{"sv":"x","en":"Turnover"}': 1 } }), { Turnover: 3 });
  assert.deepEqual(actionCounts({}), {});
});

test('ändringar mot förra matchen, störst först, med ton efter polaritet', () => {
  const c = latestChanges(games, POL);
  assert.deepEqual(c.map((x) => x.action), ['Faceoff Win', 'Blocked Shot', 'Turnover']);
  const turn = c.find((x) => x.action === 'Turnover');
  assert.equal(turn.previous, 4);
  assert.equal(turn.current, 2);
  assert.equal(turn.delta, -2);
  assert.equal(turn.tone, 'better', 'färre negativa aktioner är en förbättring');
  assert.equal(c.find((x) => x.action === 'Blocked Shot').tone, 'better');
});

test('försämring blir "worse" och okänd polaritet blir neutral', () => {
  const worse = latestChanges([g('2026-10-01', 5, { Turnover: 1 }), g('2026-10-02', 5, { Turnover: 3 })], POL);
  assert.equal(worse[0].tone, 'worse');
  const unknown = latestChanges([g('2026-10-01', 5, { Okänd: 1 }), g('2026-10-02', 5, { Okänd: 3 })], POL);
  assert.equal(unknown[0].tone, 'neutral');
});

test('oförändrade aktioner tas inte med, och färre än två matcher ger tomt', () => {
  const same = latestChanges([g('2026-10-01', 5, { Turnover: 2 }), g('2026-10-02', 5, { Turnover: 2 })], POL);
  assert.deepEqual(same, []);
  assert.deepEqual(latestChanges([g('2026-10-01', 5, { Turnover: 2 })], POL), []);
  assert.deepEqual(latestChanges([], POL), []);
});

test('recent är högst fem värden, äldst först, och slutar på senaste matchen', () => {
  const many = Array.from({ length: 8 }, (_, i) => g(`2026-10-${String(i + 1).padStart(2, '0')}`, 5, { Turnover: i }));
  const [c] = latestChanges(many, POL);
  assert.deepEqual(c.recent, [3, 4, 5, 6, 7]);
});

test('lägst/högst hittills kräver minst fyra matcher och strikt rekord', () => {
  const c = latestChanges(games, POL);
  assert.equal(c.find((x) => x.action === 'Turnover').extreme, 'lowest');
  assert.equal(c.find((x) => x.action === 'Blocked Shot').extreme, 'highest');
  const few = latestChanges(games.slice(-3), POL);
  assert.ok(few.every((x) => x.extreme === null));
  const tie = latestChanges([...games.slice(0, 3), g('2026-10-26', 14, { Turnover: 4 })], POL);
  assert.equal(tie.find((x) => x.action === 'Turnover'), undefined, 'ingen ändring jämfört med förra');
});

test('osorterad indata sorteras på datum och muteras inte', () => {
  const shuffled = [games[3], games[0], games[4], games[2], games[1]];
  const before = JSON.stringify(shuffled);
  assert.deepEqual(latestChanges(shuffled, POL).map((x) => x.action), ['Faceoff Win', 'Blocked Shot', 'Turnover']);
  assert.equal(JSON.stringify(shuffled), before);
  assert.deepEqual(sortedGames(shuffled).map((x) => x.date), games.map((x) => x.date));
});

test('max begränsar antalet rader', () => {
  assert.equal(latestChanges(games, POL, 2).length, 2);
});

test('poäng mot snitt avrundas till en decimal och saknat snitt ger null', () => {
  assert.equal(pointsVsAverage(14, 11), 3);
  assert.equal(pointsVsAverage(10, 11.04), -1);
  assert.equal(pointsVsAverage(10.3, 10), 0.3);
  assert.equal(pointsVsAverage(10, null), null);
  assert.equal(pointsVsAverage(10, undefined), null);
  assert.equal(pointsVsAverage(10, Number.NaN), null);
});

test('senaste matchdatum och "ny match sedan sist"', () => {
  assert.equal(latestGameDate(games), '2026-10-26');
  assert.equal(latestGameDate([]), null);
  assert.equal(hasNewMatch('2026-10-26', null), true, 'första besöket');
  assert.equal(hasNewMatch('2026-10-26', '2026-10-19'), true);
  assert.equal(hasNewMatch('2026-10-26', '2026-10-26'), false);
  assert.equal(hasNewMatch(null, '2026-10-26'), false);
});
