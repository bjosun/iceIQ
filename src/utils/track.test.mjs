// Körs med: node --test src/utils/track.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { isTrackablePath } from './track.ts';

test('marknads- och infosidor mäts', () => {
  for (const p of [
    '/', '/hockey-tracking-app', '/youth-hockey-stats', '/hockey-scouting-template',
    '/measure-corsi-youth-hockey', '/hockey-iq-app', '/game-tracking-template',
    '/hockey-player-evaluation-template', '/terms', '/privacy', '/support', '/success',
  ]) {
    assert.equal(isTrackablePath(p), true, p);
  }
});

test('spelarlänken, app-vyerna och labbet mäts aldrig', () => {
  for (const p of ['/p/abc123', '/p/', '/dashboard', '/match', '/voice-lab']) {
    assert.equal(isTrackablePath(p), false, p);
  }
});

test('frågesträng och fragment räknas inte in i sökvägen', () => {
  assert.equal(isTrackablePath('/p/abc?utm_source=x#y'), false);
  assert.equal(isTrackablePath('/?utm_source=test#h'), true);
  assert.equal(isTrackablePath('/dashboard?x=1'), false);
});
