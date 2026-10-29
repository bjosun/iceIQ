// Körs med: node --test src/lib/cardDrafts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCards } from '../../scripts/card-library.mjs';
import { slugify, parseSourceFile, buildPrompt, checkQuote, buildDraftRecords } from '../../scripts/card-drafts.mjs';

const TEXT = 'Jag försökte alltid titta på var pucken skulle vara om en sekund, inte var den var just nu. '.repeat(3);
const FILE = `---\nperson: Test Person\nwork: En intervju\nyear: 1999\nlang: sv\nurl: https://example.com/a\n---\n${TEXT}\n`;

const model = (over = {}) => ({
  sectionTitle: { sv: 'Titta framåt', en: 'Look ahead' },
  quote: '',
  cards: [
    { sv: { title: 'Titta dit pucken är på väg.' }, en: { title: 'Look where the puck is going.' } },
    {
      sv: { title: 'Var kan du titta framåt?', input: { placeholder: 't.ex. mot mitten', errorText: 'Skriv en sak innan du går vidare.' } },
      en: { title: 'Where can you look ahead?', input: { placeholder: 'e.g. toward the middle', errorText: 'Write one thing before you continue.' } },
    },
    { sv: { title: 'På nästa träning', body: 'Titta på nästa pass innan det kommer.' }, en: { title: 'At your next practice', body: 'Look at the next pass before it arrives.' } },
    {
      sv: { title: 'Prova det', reward: { withAnswer: 'Du valde: {answer}. Prova det.', empty: 'Prova det.' } },
      en: { title: 'Give it a try', reward: { withAnswer: 'You chose: {answer}. Try it.', empty: 'Try it.' } },
    },
  ],
  ...over,
});

const meta = () => parseSourceFile(FILE).meta;

test('slugify ger ascii-slug utan konstiga tecken', () => {
  assert.equal(slugify('Niklas Lidström – Intervju 2008!'), 'niklas-lidstrom-intervju-2008');
});

test('källfil tolkas, och ofullständig källfil avvisas', () => {
  const { meta: m, text } = parseSourceFile(FILE);
  assert.equal(m.person, 'Test Person');
  assert.equal(m.year, 1999);
  assert.equal(m.lang, 'sv');
  assert.equal(m.slug, 'test-person-en-intervju');
  assert.ok(text.length > 200);
  assert.throws(() => parseSourceFile('ingen front matter'), /front matter/);
  assert.throws(() => parseSourceFile(FILE.replace('year: 1999', 'year: nittio')), /year/);
  assert.throws(() => parseSourceFile(FILE.replace('lang: sv', 'lang: fi')), /lang/);
  assert.throws(() => parseSourceFile(FILE.replace('https://example.com/a', 'http://x')), /url/);
  assert.throws(() => parseSourceFile(`---\nperson: A\nwork: B\nyear: 2000\nlang: sv\n---\nkort`), /för kort/);
});

test('prompten innehåller källtexten och förbudet mot egna fakta och citattecken', () => {
  const prompt = buildPrompt(meta(), TEXT);
  assert.ok(prompt.includes(TEXT.slice(0, 40)));
  assert.ok(prompt.includes('ENDAST det som står i utdraget'));
  assert.ok(prompt.includes('Skriv aldrig citattecken'));
  assert.ok(prompt.includes('står bakom, rekommenderar'));
});

test('citat: ordagrant och kort godtas, påhittat eller långt kasseras', () => {
  assert.equal(checkQuote('', TEXT).ok, true);
  assert.equal(checkQuote('titta på var pucken skulle vara', TEXT).ok, true);
  assert.equal(checkQuote('Titta på VAR pucken   skulle vara', TEXT).ok, true, 'blanksteg och versaler spelar ingen roll');
  assert.equal(checkQuote('ett citat som aldrig sagts', TEXT).ok, false);
  const long = TEXT.split(' ').slice(0, 20).join(' ');
  assert.equal(checkQuote(long, TEXT).ok, false);
});

test('giltigt modellsvar ger åtta utkastposter som klarar simulerat godkännande', () => {
  const { records, problems } = buildDraftRecords(model(), meta(), TEXT);
  assert.deepEqual(problems, []);
  assert.equal(records.length, 8);
  assert.ok(records.every((r) => r.status === 'draft' && r.track === 'legends' && r.source.verified === false));
  assert.ok(records.every((r) => r.source.person === 'Test Person' && r.source.url === 'https://example.com/a'));
  assert.deepEqual(records.filter((r) => r.lang === 'sv').map((r) => r.icon), ['backpack', 'pen-line', 'moon', 'check']);
  assert.deepEqual(records.filter((r) => r.lang === 'sv').map((r) => r.id), [
    'legend-test-person-en-intervju-01', 'legend-test-person-en-intervju-02',
    'legend-test-person-en-intervju-03', 'legend-test-person-en-intervju-04',
  ]);
  // utkast är giltiga som utkast (strukturellt)
  assert.deepEqual(validateCards(records), []);
});

test('verifierat citat läggs bara på källspråkets kort', () => {
  const { records, problems } = buildDraftRecords(model({ quote: 'titta på var pucken skulle vara' }), meta(), TEXT);
  assert.deepEqual(problems, []);
  const sv1 = records.find((r) => r.lang === 'sv' && r.order === 1);
  const en1 = records.find((r) => r.lang === 'en' && r.order === 1);
  assert.ok(sv1.body.includes('“titta på var pucken skulle vara”'));
  assert.equal(en1.body, undefined);
});

test('påhittat citat kasseras och rapporteras', () => {
  const { records, problems } = buildDraftRecords(model({ quote: 'ett påhittat citat' }), meta(), TEXT);
  assert.ok(problems.some((p) => /quote kasserades/.test(p)));
  assert.equal(records.find((r) => r.lang === 'sv' && r.order === 1).body, undefined);
});

test('citattecken i modellens egen text flaggas', () => {
  const m = model();
  m.cards[0].sv.title = 'Han sa "titta framåt" hela tiden.';
  const { problems } = buildDraftRecords(m, meta(), TEXT);
  assert.ok(problems.some((p) => /citattecken/.test(p)));
});

test('fel antal kort ger inga poster', () => {
  const m = model();
  m.cards.pop();
  const { records, problems } = buildDraftRecords(m, meta(), TEXT);
  assert.equal(records.length, 0);
  assert.ok(problems[0].includes('exakt fyra kort'));
});

test('kort som nämner nerver får trygghetsrad, annars skulle valideringen fallera', () => {
  const m = model();
  m.cards[2].sv.body = 'Känner du nerver? Titta på nästa pass.';
  m.cards[2].en.body = 'Feel nervous? Look at the next pass. Nerves are normal.';
  const { records, problems } = buildDraftRecords(m, meta(), TEXT);
  assert.deepEqual(problems, []);
  const nervy = records.filter((r) => r.lang === 'sv' && r.order === 3)[0];
  assert.equal(nervy.nerves, true);
  assert.ok(nervy.footnote.length > 20);
  assert.equal(records.filter((r) => r.lang === 'sv' && r.order === 1)[0].footnote, undefined);
});

test('reward utan {answer} fångas av den simulerade valideringen', () => {
  const m = model();
  m.cards[3].sv.reward.withAnswer = 'Prova det.';
  const { problems } = buildDraftRecords(m, meta(), TEXT);
  assert.ok(problems.some((p) => /\{answer\}/.test(p)));
});
