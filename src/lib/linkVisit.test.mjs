// Körs med: node --test src/lib/linkVisit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readLastSeenMatch, writeLastSeenMatch, LINK_VISIT_KEY } from './linkVisit.ts';

const memory = () => {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    store,
  };
};

test('skriver och läser ett matchdatum', () => {
  globalThis.localStorage = memory();
  assert.equal(readLastSeenMatch(), null);
  writeLastSeenMatch('2026-10-26');
  assert.equal(readLastSeenMatch(), '2026-10-26');
  assert.equal(globalThis.localStorage.store.get(LINK_VISIT_KEY), '2026-10-26');
});

test('ogiltigt värde i lagringen ignoreras och ogiltigt datum skrivs aldrig', () => {
  globalThis.localStorage = memory();
  globalThis.localStorage.setItem(LINK_VISIT_KEY, 'skräp');
  assert.equal(readLastSeenMatch(), null);
  writeLastSeenMatch('igår');
  writeLastSeenMatch(null);
  assert.equal(globalThis.localStorage.store.get(LINK_VISIT_KEY), 'skräp');
});

test('blockerad lagring kastar inte', () => {
  globalThis.localStorage = {
    getItem() { throw new Error('blockerad'); },
    setItem() { throw new Error('blockerad'); },
  };
  assert.equal(readLastSeenMatch(), null);
  assert.doesNotThrow(() => writeLastSeenMatch('2026-10-26'));
});
