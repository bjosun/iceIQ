// Körs med: node --test src/utils/corsi.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { individualCorsi, corsiSummary } from './corsi.ts';

test('räknar skott på mål, missade och egna blockerade, men inte egna blockar av motståndarens skott', () => {
  const counts = { 'Shot on Goal': 3, 'Missed Shot': 2, 'Shot Blocked (Own)': 1, 'Blocked Shot': 5 };
  assert.equal(individualCorsi(counts), 6);
});

test('tomma eller saknade counts ger 0', () => {
  assert.equal(individualCorsi(undefined), 0);
  assert.equal(individualCorsi({}), 0);
});

test('snitt räknas bara över matcher med skottförsök', () => {
  const s = corsiSummary([
    { counts: { 'Shot on Goal': 2, 'Missed Shot': 2 } },
    { counts: {} },
    { counts: { 'Shot on Goal': 2 } },
  ]);
  assert.deepEqual(s, { attempts: 6, gamesWithData: 2, perGame: 3, onTargetPct: 67 });
});

test('utan försök är andelen på mål null', () => {
  assert.equal(corsiSummary([{ counts: {} }]).onTargetPct, null);
});
