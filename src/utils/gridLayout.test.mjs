// Körs med: node --test src/utils/gridLayout.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveGrid, GRID_POSITIVE, GRID_NEGATIVE } from './gridLayout.ts';

const a = (en, type = 'positive', points = 1) => ({ name: { sv: en, en }, points, type });
const actions = [
  ...['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'F1', 'F2', 'X1'].map((n) => a(n)),
  ...['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'].map((n) => a(n, 'negative', -1)),
];
const layout = {
  positive: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11'],
  negative: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'],
  focus: ['F1'],
};

test('tolv pluss (11 fasta + 1 fokus) och sex minus, resten under Mer', () => {
  const g = resolveGrid({ actions }, layout);
  assert.equal(g.positive.length, GRID_POSITIVE);
  assert.equal(g.negative.length, GRID_NEGATIVE);
  assert.deepEqual(g.more.map((x) => x.name.en), ['F2', 'X1', 'N7']);
  assert.equal(g.slots, 1);
  assert.equal(g.emptySlots, 0);
});

test('valt fokus ersätter förvalet och kan inte vara en fast aktion', () => {
  assert.deepEqual(resolveGrid({ actions }, layout, ['F2']).focusChosen, ['F2']);
  assert.deepEqual(resolveGrid({ actions }, layout, ['A1']).focusChosen, []);
  assert.equal(resolveGrid({ actions }, layout, ['A1']).emptySlots, 1);
});

test('minus kan inte väljas som fokus och okända namn hoppas över', () => {
  assert.deepEqual(resolveGrid({ actions }, layout, ['N1']).focusChosen, []);
  assert.deepEqual(resolveGrid({ actions }, layout, ['finns-inte']).focusChosen, []);
});

test('målvaktsstil: inga fokusplatser och inget Mer', () => {
  const g = resolveGrid({ actions }, { positive: ['A1', 'A2', 'A3', 'A4'], negative: ['N1', 'N2'], focus: [], focusSlots: 0 });
  assert.equal(g.slots, 0);
  assert.equal(g.positive.length, 4);
});

test('layout som inte matchar mallen ger null så att hela listan visas', () => {
  assert.equal(resolveGrid({ actions }, { positive: ['Z1', 'Z2'], negative: ['Z3'], focus: [] }), null);
  assert.equal(resolveGrid({ actions }, undefined), null);
});
