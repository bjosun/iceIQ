// Körs med: node --test src/lib/cardEngine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickNextPass } from './cardEngine.ts';

let seq = 0;
const card = (over = {}) => ({
  id: `card-${seq++}`,
  concept: 'c',
  track: 'routine',
  level: 1,
  ageMin: 13,
  ageMax: 18,
  surface: 'link',
  lang: 'sv',
  title: 'T',
  status: 'approved',
  pass: 'p1',
  order: 1,
  sectionTitle: 'S',
  icon: 'check',
  ...over,
});

// Bygger ett komplett pass av n kort (order 1..n).
const pass = (passId, n, over = {}) =>
  Array.from({ length: n }, (_, i) => card({ id: `${passId}-${i + 1}`, pass: passId, order: i + 1, ...over }));

const progress = (seen = {}, passes = 0) => ({ seen, passes });
const T = (s) => `2026-01-01T00:00:${s}Z`;
const ids = (cards) => cards.map((c) => c.id);

test('första besöket ger första passet i routine-spåret', () => {
  const original = pass('night-before-game', 4);
  const focus = pass('focus-1', 4, { track: 'focus' });
  assert.deepEqual(ids(pickNextPass([...focus, ...original], progress())), ids(original));
});

test('nästa godkända pass i samma spår när kraven är sedda', () => {
  const first = pass('a', 4);
  const next = pass('b', 4, { level: 2, requires: first.map((c) => c.id) });
  const seen = Object.fromEntries(first.map((c, i) => [c.id, T(`0${i}`)]));
  assert.deepEqual(ids(pickNextPass([...first, ...next], progress(seen))), ids(next));
});

test('nivå låst tills alla requires är sedda', () => {
  const first = pass('a', 4);
  const next = pass('b', 4, { level: 2, requires: first.map((c) => c.id) });
  const seen = Object.fromEntries(first.slice(0, 3).map((c, i) => [c.id, T(`0${i}`)]));
  const picked = pickNextPass([...first, ...next], progress(seen));
  assert.deepEqual(ids(picked), ids(first));
});

test('byter spår när nuvarande spår är uttömt', () => {
  const a = pass('a', 4, { track: 'routine' });
  const f = pass('f', 4, { track: 'focus' });
  const seen = Object.fromEntries(a.map((c, i) => [c.id, T(`0${i}`)]));
  assert.deepEqual(ids(pickNextPass([...a, ...f], progress(seen))), ids(f));
});

test('stannar i aktuellt spår även om annat spår har lägre nivå', () => {
  const a1 = pass('a1', 4, { track: 'focus' });
  const a2 = pass('a2', 4, { track: 'focus', level: 2, requires: a1.map((c) => c.id) });
  const b1 = pass('b1', 3, { track: 'aaa-before' });
  const seen = Object.fromEntries(a1.map((c, i) => [c.id, T(`0${i}`)]));
  assert.deepEqual(ids(pickNextPass([...b1, ...a1, ...a2], progress(seen))), ids(a2));
});

test('varianter av samma concept är separata pass', () => {
  const v1 = pass('v1', 4, { concept: 'same' });
  const v2 = pass('v2', 4, { concept: 'same', level: 2 });
  const seen = Object.fromEntries(v1.map((c, i) => [c.id, T(`0${i}`)]));
  assert.deepEqual(ids(pickNextPass([...v1, ...v2], progress(seen))), ids(v2));
});

test('alla pass sedda → repris av minst nyligen sett pass', () => {
  const a = pass('a', 4);
  const b = pass('b', 4, { track: 'focus' });
  const seen = {
    ...Object.fromEntries(a.map((c, i) => [c.id, T(`1${i}`)])),
    ...Object.fromEntries(b.map((c, i) => [c.id, T(`0${i}`)])),
  };
  assert.deepEqual(ids(pickNextPass([...a, ...b], progress(seen))), ids(b));
});

test('tom progress ger första passet; tomt bibliotek ger []', () => {
  assert.deepEqual(pickNextPass([], progress()), []);
});

test('ofullständiga grupper ignoreras', () => {
  const two = pass('short', 2);
  const gap = [card({ id: 'g-1', pass: 'gapped', order: 1 }), card({ id: 'g-3', pass: 'gapped', order: 3 })];
  const ok = pass('ok', 3);
  assert.deepEqual(ids(pickNextPass([...two, ...gap, ...ok], progress())), ids(ok));
});

test('utkast och app-only-kort publiceras aldrig', () => {
  const draftPass = pass('d', 4, { status: 'draft' });
  const appPass = pass('app', 4, { surface: 'app' });
  assert.deepEqual(pickNextPass([...draftPass, ...appPass], progress()), []);
});

test('delvis sett pass förs vidare där det slutade', () => {
  const p = pass('p', 4);
  const seen = { 'p-1': T('00'), 'p-2': T('01') };
  assert.deepEqual(ids(pickNextPass(p, progress(seen))), ids(p));
});

test('varken input eller progress muteras', () => {
  const p = pass('p', 4);
  const cards = [...p];
  const prog = progress({ 'p-1': T('00') });
  const before = JSON.stringify({ cards, prog });
  pickNextPass(cards, prog);
  assert.equal(JSON.stringify({ cards, prog }), before);
});

test('duplicerade id:n i indata räknas bara en gång', () => {
  const p = pass('p', 4);
  const picked = pickNextPass([...p, ...p], progress());
  assert.equal(picked.length, 4);
  assert.deepEqual(ids(picked), ids(p));
});

test('stabil ordning: samma indata ger samma pass varje gång', () => {
  const a = pass('a', 4);
  const b = pass('b', 4, { track: 'focus' });
  const input = [...b, ...a];
  const first = ids(pickNextPass(input, progress()));
  const second = ids(pickNextPass([...input].reverse(), progress()));
  assert.deepEqual(first, second);
});
