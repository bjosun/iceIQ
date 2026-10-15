// Körs med: node --test src/utils/acquisitionContext.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseReferrerHost, cleanLandingPath, captureAcquisitionContext,
  consumeAcquisitionContext, resetAcquisitionContext,
} from './acquisitionContext.ts';

test('extern avsändare blir bara värdnamnet', () => {
  assert.equal(parseReferrerHost('https://www.google.com/search?q=hockey+stats', 'www.iceiq.app'), 'google.com');
  assert.equal(parseReferrerHost('https://l.instagram.com/?u=abc&e=def', 'www.iceiq.app'), 'l.instagram.com');
});

test('direkt och intern trafik ger ingen avsändare', () => {
  assert.equal(parseReferrerHost('', 'www.iceiq.app'), null);
  assert.equal(parseReferrerHost('https://www.iceiq.app/dashboard', 'www.iceiq.app'), null);
  assert.equal(parseReferrerHost('https://iceiq.app/', 'www.iceiq.app'), null);
  assert.equal(parseReferrerHost('inte-en-url', 'www.iceiq.app'), null);
});

test('landningssidan sparas utan frågesträng', () => {
  assert.equal(cleanLandingPath('/hockey-tracking-app?utm_source=x&email=a@b.c'), '/hockey-tracking-app');
  assert.equal(cleanLandingPath('/'), '/');
});

test('första touch gäller och töms vid konsumtion', () => {
  resetAcquisitionContext();
  captureAcquisitionContext('https://www.google.com/', '/youth-hockey-stats', 'www.iceiq.app');
  captureAcquisitionContext('https://t.co/xyz', '/dashboard', 'www.iceiq.app');
  assert.deepEqual(consumeAcquisitionContext(), { referrer: 'google.com', landing: '/youth-hockey-stats' });
  assert.equal(consumeAcquisitionContext(), null);
});

test('direkt landning ger bara sidan', () => {
  resetAcquisitionContext();
  captureAcquisitionContext('', '/', 'www.iceiq.app');
  assert.deepEqual(consumeAcquisitionContext(), { landing: '/' });
});
