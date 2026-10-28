// Körs med: node --test src/lib/cardSteps.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cardToStep } from './cardSteps.ts';

const base = {
  id: 'x-1',
  concept: 'c',
  track: 'routine',
  level: 1,
  ageMin: 13,
  ageMax: 18,
  surface: 'link',
  lang: 'sv',
  title: 'Titel',
  status: 'approved',
  pass: 'p',
  order: 1,
  sectionTitle: 'Sektion',
  icon: 'moon',
};

test('ikonmappning följer kortets icon-fält', async () => {
  const { Backpack, PenLine, Moon, Check } = await import('lucide-react');
  assert.equal(cardToStep({ ...base, icon: 'backpack' }, () => {}).icon, Backpack);
  assert.equal(cardToStep({ ...base, icon: 'pen-line' }, () => {}).icon, PenLine);
  assert.equal(cardToStep({ ...base, icon: 'moon' }, () => {}).icon, Moon);
  assert.equal(cardToStep({ ...base, icon: 'check' }, () => {}).icon, Check);
});

test('body och reflect slås ihop med blankrad', () => {
  const step = cardToStep({ ...base, body: 'B', reflect: 'R' }, () => {});
  assert.equal(step.body, 'B\n\nR');
  assert.equal(cardToStep({ ...base, reflect: 'R' }, () => {}).body, 'R');
  assert.equal(cardToStep({ ...base, body: 'B' }, () => {}).body, 'B');
  assert.equal(cardToStep(base, () => {}).body, undefined);
});

test('input och footnote förs över orörda', () => {
  const step = cardToStep(
    { ...base, input: { placeholder: 'P', errorText: 'E' }, footnote: 'F' },
    () => {},
  );
  assert.deepEqual(step.input, { placeholder: 'P', errorText: 'E' });
  assert.equal(step.footnote, 'F');
});

test('breathing-action kopplas till callbacken', () => {
  let called = 0;
  const step = cardToStep({ ...base, action: { kind: 'breathing', label: 'Andas' } }, () => called++);
  step.action.onClick();
  assert.equal(step.action.label, 'Andas');
  assert.equal(called, 1);
});

test('reward: tomt svar ger empty-texten', () => {
  const step = cardToStep(
    { ...base, reward: { withAnswer: 'Du sa: {answer}. Klart.', empty: 'Klart.' } },
    () => {},
  );
  assert.equal(step.rewardBody(''), 'Klart.');
});

test('reward: svar med $&, $` och HTML-liknande tecken sätts in ordagrant', () => {
  const step = cardToStep(
    { ...base, reward: { withAnswer: 'Du sa: {answer}. Klart.', empty: 'Klart.' } },
    () => {},
  );
  assert.equal(step.rewardBody('$& $<img> {answer}'), 'Du sa: $& $<img> {answer}. Klart.');
});

test('kortet muteras inte av mappningen', () => {
  const card = { ...base, reward: { withAnswer: '{answer}!', empty: '!' } };
  const before = JSON.stringify(card);
  cardToStep(card, () => {}).rewardBody('hej');
  assert.equal(JSON.stringify(card), before);
});

test('källa blir en källrad, saknad källa ger ingen', () => {
  const withSource = cardToStep({ ...base, source: { person: 'P', work: 'Intervju', year: 1999, verified: true } }, () => {});
  assert.equal(withSource.attribution, 'P, Intervju (1999)');
  assert.equal(cardToStep(base, () => {}).attribution, undefined);
});
