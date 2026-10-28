// Körs med: node --test src/lib/cardLibrary.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCards, loadCardLibrary, VIRTUAL_CARDS_ID } from '../../scripts/card-library.mjs';
import { translations } from '../utils/translations.ts';
import { cardToStep } from './cardSteps.ts';

const pair = (id, over = {}) => ['sv', 'en'].map((lang) => ({
  id,
  concept: 'c',
  track: 'routine',
  level: 1,
  ageMin: 13,
  ageMax: 18,
  surface: 'link',
  lang,
  title: 'T',
  status: 'approved',
  pass: 'p',
  order: 1,
  sectionTitle: 'S',
  icon: 'check',
  ...over,
}));

const passOf = (prefix, n, over = {}) =>
  Array.from({ length: n }, (_, i) => pair(`${prefix}-${i + 1}`, { order: i + 1, ...over })).flat();

const valid = () => passOf('p', 3);
const hasError = (records, re) =>
  assert.ok(validateCards(records).some((e) => re.test(e)), `förväntade fel ${re}: ${JSON.stringify(validateCards(records))}`);

test('giltigt syntetiskt bibliotek passerar', () => {
  assert.deepEqual(validateCards(valid()), []);
});

test('saknat sv/en-par avvisas', () => {
  hasError(valid().filter((c) => !(c.id === 'p-1' && c.lang === 'en')), /exactly one sv and one en/);
});

test('dubblett av samma id+lang avvisas', () => {
  hasError([...valid(), pair('p-1')[0]], /duplicate/);
});

test('blandning draft/approved i samma pass avvisas', () => {
  const p = passOf('p', 3);
  p[0].status = 'draft';
  hasError(p, /draft and approved|disagree on 'status'/);
});

test('okänt requires-id avvisas', () => {
  const p = passOf('p', 3, { requires: ['nope-1'] });
  hasError(p, /unknown card id/);
});

test('requires mot sig själv och cykler avvisas', () => {
  hasError(passOf('p', 3, { requires: ['p-1'] }), /may not require itself/);
  const a = passOf('a', 3, { requires: ['b-1'] });
  const b = passOf('b', 3, { requires: ['a-1'] });
  hasError([...a, ...b], /cycle/);
});

test('godkänt kort får inte kräva ett utkast', () => {
  const draft = passOf('d', 3, { status: 'draft', title: '', sectionTitle: '' });
  const p = passOf('p', 3, { requires: ['d-1'] });
  hasError([...draft, ...p], /may not require draft/);
});

test('ageMin under 13 kräver surface link', () => {
  hasError(passOf('p', 3, { ageMin: 8, surface: 'app' }), /under 13/);
  assert.deepEqual(validateCards(passOf('p', 3, { ageMin: 8, surface: 'link' })), []);
});

test('godkänt kort med tom titel avvisas; utkast får vara tomma', () => {
  hasError(passOf('p', 3, { title: '  ' }), /title must be non-empty/);
  assert.deepEqual(
    validateCards(passOf('p', 3, { status: 'draft', title: '', sectionTitle: '' })),
    [],
  );
});

test('reward kräver {answer}-mall och tidigare input-kort', () => {
  hasError(passOf('p', 3, { reward: { withAnswer: 'ingen mall', empty: 'x' } }), /\{answer\}/);
  const p = passOf('p', 3);
  for (const c of p) if (c.id === 'p-1') c.reward = { withAnswer: '{answer}', empty: 'x' };
  hasError(p, /earlier input card/);
  for (const c of p) if (c.id === 'p-2') c.input = { placeholder: 'p', errorText: 'e' };
  hasError(p, /earlier input card/);
  for (const c of p) if (c.id === 'p-3') c.reward = { withAnswer: '{answer}', empty: 'x' };
  for (const c of p) if (c.id === 'p-1') delete c.reward;
  assert.deepEqual(validateCards(p), []);
});

test('max ett input per pass', () => {
  hasError(passOf('p', 3, { input: { placeholder: 'p', errorText: 'e' } }), /at most one input/);
});

test('pass måste ha 3-4 kort och ordning 1..n utan luckor', () => {
  hasError(passOf('p', 2), /3-4 cards/);
  const g = passOf('p', 3);
  for (const c of g) if (c.order === 2) c.order = 4;
  hasError(g, /unique and contiguous/);
});

test('nervkort utan trygghetsrad avvisas i båda språken', () => {
  hasError(passOf('p', 3, { nerves: true }), /safety line/);
  hasError(passOf('p', 3, { track: 'game-nerves' }), /safety line/);
  hasError(passOf('p', 3, { body: 'om nerverna kikar fram' }), /safety line/);
  assert.deepEqual(
    validateCards(passOf('p', 3, { nerves: true, footnote: 'Prata med en vuxen.' })),
    [],
  );
});

test('sv/en-par måste dela metadata men inte copy', () => {
  const p = valid();
  p.find((c) => c.id === 'p-1' && c.lang === 'en').ageMax = 99;
  hasError(p, /disagree on 'ageMax'/);
});

test('okänt fält och felaktig icon/action avvisas', () => {
  hasError(passOf('p', 3, { token: 'abc' }), /unknown field/);
  hasError(passOf('p', 3, { icon: 'rocket' }), /icon must be/);
  hasError(passOf('p', 3, { action: { kind: 'jump', label: 'x' } }), /action must be/);
});

test('riktiga biblioteket är giltigt och har rätt totaler', () => {
  const records = loadCardLibrary(process.cwd());
  assert.deepEqual(validateCards(records), []);
  const approved = records.filter((c) => c.status === 'approved');
  const drafts = records.filter((c) => c.status === 'draft');
  assert.equal(new Set(approved.map((c) => c.id)).size, 16);
  assert.equal(new Set(drafts.map((c) => c.id)).size, 0);
  assert.equal(approved.length, 32);
  assert.equal(drafts.length, 0);
});

test('migrering: originalkortens copy matchar translations exakt, båda språken', () => {
  const records = loadCardLibrary(process.cwd());
  for (const lang of ['sv', 'en']) {
    const t = translations[lang].routines.nightBeforeGame;
    const cards = records
      .filter((c) => c.pass === 'night-before-game' && c.lang === lang)
      .sort((a, b) => a.order - b.order);
    assert.equal(cards.length, 4);
    assert.deepEqual(cards.map((c) => c.id), [
      'night-before-game-01', 'night-before-game-02', 'night-before-game-03', 'night-before-game-04',
    ]);
    assert.deepEqual(cards.map((c) => c.icon), ['backpack', 'pen-line', 'moon', 'check']);
    for (const c of cards) {
      assert.equal(c.sectionTitle, t.sectionTitle);
      assert.equal(c.track, 'routine');
      assert.equal(c.concept, 'night-before-game');
      assert.equal(c.level, 1);
      assert.equal(c.ageMin, 8);
      assert.equal(c.ageMax, 18);
      assert.equal(c.surface, 'link');
      assert.equal(c.status, 'approved');
    }
    assert.equal(cards[0].title, t.intro);
    assert.equal(cards[1].title, t.step1Title);
    assert.deepEqual(cards[1].input, { placeholder: t.step1Placeholder, errorText: t.step1Error });
    assert.equal(cards[2].title, t.step2Title);
    assert.equal(cards[2].body, t.step2Body);
    assert.deepEqual(cards[2].action, { kind: 'breathing', label: t.step2Cta });
    assert.equal(cards[3].title, t.rewardTitle);
    assert.equal(cards[3].reward.withAnswer, t.rewardBodyWithAnswer);
    assert.equal(cards[3].reward.empty, t.rewardBodyEmpty);
    assert.equal(cards[3].footnote, t.floor);
    assert.equal(cards[3].nerves, true);
    assert.equal(cards[0].nerves, undefined);
    assert.equal(cards[1].nerves, undefined);
    assert.equal(cards[2].nerves, undefined);
    assert.equal(cards[0].footnote, undefined);
    assert.equal(cards[1].footnote, undefined);
    assert.equal(cards[2].footnote, undefined);
  }
});

test('migrering: mappade steg speglar svaret ordagrant ($&, HTML-liknande text)', () => {
  const records = loadCardLibrary(process.cwd());
  const card = records.find((c) => c.id === 'night-before-game-04' && c.lang === 'en');
  const step = cardToStep(card, () => {});
  const t = translations.en.routines.nightBeforeGame;
  assert.equal(step.rewardBody(''), t.rewardBodyEmpty);
  assert.equal(step.rewardBody('skate faster'), t.rewardBodyWithAnswer.replace('{answer}', 'skate faster'));
  assert.equal(step.rewardBody('$& <b>'), 'You said: $& <b>. Whatever happens tomorrow, you\'ve done your part tonight. That\'s enough.');
});

test('utkast serialiseras aldrig in i den genererade modulen', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { cardLibraryPlugin } = await import('../../scripts/card-library.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iceiq-cards-'));
  try {
    fs.mkdirSync(path.join(root, 'content', 'cards', 'x'), { recursive: true });
    const approved = passOf('ok', 3, { pass: 'ok-pass' });
    const draft = passOf('secret-draft', 3, { pass: 'draft-pass', status: 'draft', title: '', sectionTitle: '' });
    fs.writeFileSync(path.join(root, 'content', 'cards', 'x', 'a.json'), JSON.stringify([...approved, ...draft]));
    const plugin = cardLibraryPlugin();
    plugin.configResolved({ root });
    const code = plugin.load('\0' + VIRTUAL_CARDS_ID);
    assert.ok(code.includes('"ok-1"'));
    assert.ok(!code.includes('secret-draft'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const src = (over = {}) => ({ person: 'P', work: 'W', year: 1999, verified: true, ...over });
const legend = (over = {}) => passOf('l', 3, { track: 'legends', source: src(), ...over });

test('legendkort med verifierad källa passerar', () => {
  assert.deepEqual(validateCards(legend()), []);
});

test('legendkort utan källa avvisas', () => {
  hasError(legend({ source: undefined }), /legends cards must carry a source/);
});

test('godkänt kort med overifierad källa avvisas, utkast tillåts', () => {
  hasError(legend({ source: src({ verified: false }) }), /must be verified/);
  assert.deepEqual(
    validateCards(legend({ source: src({ verified: false }), status: 'draft', title: '', sectionTitle: '' })),
    [],
  );
});

test('felaktig källa avvisas', () => {
  hasError(legend({ source: src({ year: '1999' }) }), /source must be/);
  hasError(legend({ source: src({ person: ' ' }) }), /source must be/);
  hasError(legend({ source: src({ url: 'http://x.se' }) }), /source must be/);
  assert.deepEqual(validateCards(legend({ source: src({ url: 'https://x.se/a' }) })), []);
});

test('sv/en måste ange samma källa', () => {
  const records = legend();
  records[0] = { ...records[0], source: src({ person: 'Annan' }) };
  hasError(records, /disagree on 'source'/);
});

test('utkastkorten är tomma tills copy granskats', () => {
  const records = loadCardLibrary(process.cwd());
  for (const c of records.filter((c) => c.status === 'draft')) {
    assert.equal(c.title, '');
    assert.equal(c.sectionTitle, '');
    assert.equal(c.body, undefined);
    assert.equal(c.input, undefined);
    assert.equal(c.action, undefined);
    assert.equal(c.reward, undefined);
    assert.equal(c.ageMin, 13);
    assert.equal(c.surface, 'link');
  }
});

test('virtuellt modul-id är stabilt', () => {
  assert.equal(VIRTUAL_CARDS_ID, 'virtual:iceiq-cards');
});
