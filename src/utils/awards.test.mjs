// Körs med: node --test src/utils/awards.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { awardsForGame, topAward, earnedAwards, AWARDS } from './awards.ts';

const names = (negative, positive) => ({ negative: new Set(negative), positive: new Set(positive) });
const NEG_FWD = names(
  ['Faceoff Loss', 'Missed Shot', 'Offensive Zone Turnover', 'Offside', 'Penalty', 'On Ice For Goal (AGAINST)'],
  ['Goal', 'Assist', 'Shot on Goal', 'Tackle', 'Successful Deke', 'Faceoff Win', 'Forecheck Puck Recovery',
    'Backcheck Puck Recovery', 'Wins Board Battle', 'On Ice For Goal (FOR)', 'Controlled Zone Entry'],
);
const NEG_D = names(
  ['Failed Pass', 'Turnover', 'Panic Turnover / Throwaway', 'Penalty', 'On Ice For Goal (AGAINST)'],
  ['Goal', 'Assist', 'Blocked Shot', 'Wins Board Battle', 'Solves Pressured Situation', 'Successful Pass',
    'Controlled Zone Entry', 'Shot on Goal', 'Tackle', 'Denies Entry (Gap Control)', 'On Ice For Goal (FOR)'],
);
const NEG_G = names(
  ['Goal Against', 'Bad Rebound', 'Failed Puck Play', 'Penalty'],
  ['Save', 'Difficult Save', 'Shutout (Period)', 'Controlled Rebound', 'Successful Puck Play', 'Assist'],
);

test('hattrick slår målkungen när båda är uppfyllda', () => {
  const ids = awardsForGame('forward', { Goal: 3 }, NEG_FWD);
  assert.deepEqual(ids.slice(0, 2), ['hattrick', 'goalKing']);
  assert.equal(topAward('forward', { Goal: 3 }, NEG_FWD), 'hattrick');
});

test('två mål ger målkungen, inte hattrick', () => {
  assert.equal(topAward('forward', { Goal: 2 }, NEG_FWD), 'goalKing');
});

test('ingen utmärkelse hellre än en felaktig', () => {
  assert.equal(topAward('forward', { Goal: 1, Assist: 1 }, NEG_FWD), null);
});

test('rent bord kräver inga negativa aktioner', () => {
  const clean = { 'Shot on Goal': 2, Tackle: 1, Assist: 1, 'Successful Deke': 1, 'Faceoff Win': 1 };
  assert.ok(awardsForGame('forward', clean, NEG_FWD).includes('cleanSheet'));
  assert.ok(!awardsForGame('forward', { ...clean, Penalty: 1 }, NEG_FWD).includes('cleanSheet'));
});

test('muren och iceman gäller bara backar', () => {
  assert.equal(topAward('defenseman', { 'Blocked Shot': 4 }, NEG_D), 'wall');
  assert.ok(!awardsForGame('forward', { 'Blocked Shot': 4 }, NEG_FWD).includes('wall'));
  const cool = { 'Solves Pressured Situation': 3 };
  assert.ok(awardsForGame('defenseman', cool, NEG_D).includes('iceman'));
  assert.ok(!awardsForGame('defenseman', { ...cool, 'Panic Turnover / Throwaway': 1 }, NEG_D).includes('iceman'));
});

test('målvakt: nollan kräver tre perioder', () => {
  assert.equal(topAward('goalie', { 'Shutout (Period)': 3 }, NEG_G), 'shutout');
  assert.equal(topAward('goalie', { 'Shutout (Period)': 2 }, NEG_G), null);
  assert.equal(topAward('goalie', { Save: 12 }, NEG_G), 'saveMachine');
});

test('tvåvägsspelaren kräver både offensivt och defensivt', () => {
  const both = { Goal: 1, Tackle: 4, 'Backcheck Puck Recovery': 4 };
  assert.ok(awardsForGame('forward', both, NEG_FWD).includes('twoWay'));
  assert.ok(!awardsForGame('forward', { Tackle: 4 }, NEG_FWD).includes('twoWay'));
});

test('hyllan räknar bara matchens enda utmärkelse', () => {
  const earned = earnedAwards(
    [
      { template: 'forward', counts: { Goal: 3 } },
      { template: 'forward', counts: { Goal: 3 } },
      { template: 'forward', counts: { Goal: 2 } },
      { template: 'custom-1', counts: { Goal: 9 } },
      { template: 'forward' },
    ],
    () => NEG_FWD,
  );
  assert.deepEqual(earned, { hattrick: 2, goalKing: 1 });
});

test('okänd aktion i mallen blockerar rent bord', () => {
  const base = { Goal: 1, Assist: 1, 'Shot on Goal': 2, Tackle: 1, 'Faceoff Win': 1 };
  assert.ok(awardsForGame('forward', base, NEG_FWD).includes('cleanSheet'));
  assert.ok(!awardsForGame('forward', { ...base, 'Goal Against on Ice': 2 }, NEG_FWD).includes('cleanSheet'));
});

test('äldre matcher med JSON-nycklar läses som engelska namn', () => {
  const old = { '{"sv":"Misslyckad passning","en":"Failed Pass"}': 2, 'Successful Pass': 12 };
  // 2 misslyckade passningar > 1 → ingen spelbyggare
  assert.ok(!awardsForGame('defenseman', old, NEG_D).includes('builder'));
  const oneMiss = { '{"sv":"Misslyckad passning","en":"Failed Pass"}': 1, 'Successful Pass': 12 };
  assert.ok(awardsForGame('defenseman', oneMiss, NEG_D).includes('builder'));
});

test('alla utmärkelser har unikt id', () => {
  assert.equal(new Set(AWARDS.map((a) => a.id)).size, AWARDS.length);
});
