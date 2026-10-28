// Körs med: node --test src/lib/cardProgress.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARD_PROGRESS_KEY,
  readCardProgress,
  writeCardProgress,
  markPassSeen,
} from './cardProgress.ts';

const KNOWN = ['a-1', 'a-2', 'b-1'];
const ISO = '2026-02-01T10:00:00.000Z';

function stubStorage(behavior = {}) {
  let data = behavior.initial ?? null;
  const calls = { get: 0, set: [] };
  const stub = {};
  Object.defineProperty(stub, 'getItem', {
    value: () => {
      calls.get++;
      if (behavior.throwOnGet) throw new Error('denied');
      return data;
    },
  });
  Object.defineProperty(stub, 'setItem', {
    value: (_k, v) => {
      calls.set.push(v);
      if (behavior.throwOnSet) throw new Error('denied');
      data = v;
    },
  });
  globalThis.localStorage = stub;
  return { calls, get data() { return data; }, set data(v) { data = v; } };
}

test.afterEach(() => {
  delete globalThis.localStorage;
});

test('saknad nyckel ger tom progress', () => {
  stubStorage();
  assert.deepEqual(readCardProgress(KNOWN), { seen: {}, passes: 0 });
});

test('korrupt JSON ger tom progress', () => {
  stubStorage({ initial: '{oops' });
  assert.deepEqual(readCardProgress(KNOWN), { seen: {}, passes: 0 });
});

test('rensad lagring (null) ger första passet utan fel', () => {
  const s = stubStorage({ initial: null });
  assert.deepEqual(readCardProgress(KNOWN), { seen: {}, passes: 0 });
  assert.equal(s.calls.get, 1);
});

test('getItem som kastar ger tom progress', () => {
  stubStorage({ throwOnGet: true });
  assert.deepEqual(readCardProgress(KNOWN), { seen: {}, passes: 0 });
});

test('åtkomst till localStorage som kastar (getter) ger tom progress', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('denied'); },
  });
  assert.deepEqual(readCardProgress(KNOWN), { seen: {}, passes: 0 });
  writeCardProgress({ seen: { 'a-1': ISO }, passes: 1 }, KNOWN);
  delete globalThis.localStorage;
});

test('setItem som kastar sväljs tyst', () => {
  stubStorage({ throwOnSet: true });
  writeCardProgress({ seen: { 'a-1': ISO }, passes: 1 }, KNOWN);
});

test('läsning filtrerar okända id:n, ogiltiga tider och extrasfält', () => {
  stubStorage({
    initial: JSON.stringify({
      seen: {
        'a-1': ISO,
        'a-2': '2026-02-01 10:00', // inte kanonisk ISO
        'x-9': ISO, // okänt id
        '__proto__': ISO, // prototype-nyckel
        toString: ISO,
      },
      passes: 2.5, // ej heltal
      name: 'fri text som inte får finnas',
      extra: true,
    }),
  });
  assert.deepEqual(readCardProgress(KNOWN), { seen: { 'a-1': ISO }, passes: 0 });
});

test('skrivning serialiserar exakt {seen,passes} och bara kända id:n', () => {
  const s = stubStorage();
  writeCardProgress({ seen: { 'a-1': ISO, evil: ISO, 'a-2': 'notiso' }, passes: 3, name: 'x' }, KNOWN);
  const parsed = JSON.parse(s.calls.set[0]);
  assert.deepEqual(Object.keys(parsed).sort(), ['passes', 'seen']);
  assert.deepEqual(parsed, { seen: { 'a-1': ISO }, passes: 3 });
  assert.ok(!JSON.stringify(parsed).includes('x'));
});

test('skriven progress kan läsas tillbaka oförändrad', () => {
  stubStorage();
  writeCardProgress({ seen: { 'a-1': ISO, 'b-1': ISO }, passes: 2 }, KNOWN);
  assert.deepEqual(readCardProgress(KNOWN), { seen: { 'a-1': ISO, 'b-1': ISO }, passes: 2 });
});

test('markPassSeen stämplat alla kort, räknar passes en gång, muterar inte', () => {
  const before = { seen: { 'a-1': '2026-01-01T00:00:00.000Z' }, passes: 1 };
  const after = markPassSeen(before, [{ id: 'a-1' }, { id: 'b-1' }], ISO);
  assert.deepEqual(after.seen, { 'a-1': ISO, 'b-1': ISO });
  assert.equal(after.passes, 2);
  assert.deepEqual(before.seen, { 'a-1': '2026-01-01T00:00:00.000Z' });
  assert.equal(before.passes, 1);
});

test('nyckeln innehåller inga identifierare eller fri text', () => {
  assert.equal(CARD_PROGRESS_KEY, 'iceiq-card-progress-v1');
});

test('felaktigt format (array/number/string) ger tom progress', () => {
  for (const initial of ['[1,2]', '5', '"hej"', '{"seen":null,"passes":-3}']) {
    stubStorage({ initial });
    assert.deepEqual(readCardProgress(KNOWN), { seen: {}, passes: 0 }, initial);
  }
});
