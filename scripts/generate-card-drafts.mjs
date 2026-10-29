// Redaktörsskript: ett kortpass (fyra kort, sv+en) som UTKAST ur en källtext.
//
//   node scripts/generate-card-drafts.mjs content/sources/min-källa.md [--dry-run]
//
// Källfilen (front matter: person, work, year, lang, url?, slug?) lägger du
// själv in; modellen får bara skriva ur den texten. Resultatet hamnar i
// content/card-drafts/<slug>.json (läses INTE in av appen) och ska läsas,
// faktakontrolleras mot källan, ändras och sedan flyttas till
// content/cards/legends/ med status "approved" och source.verified true.
//
// Körs lokalt med Google-inloggning (gcloud auth application-default login).
// EU-region som askCoach: ändra inte till 'global' utan ett medvetet beslut.
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { parseSourceFile, buildPrompt, buildDraftRecords } from './card-drafts.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Användning: node scripts/generate-card-drafts.mjs <källfil.md> [--dry-run]');
  process.exit(1);
}

const { meta, text } = parseSourceFile(fs.readFileSync(file, 'utf8'));
const prompt = buildPrompt(meta, text);

if (dryRun) {
  console.log(prompt);
  process.exit(0);
}

const ai = new GoogleGenAI({ vertexai: true, project: 'squareverse-36179', location: 'europe-west1' });
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: prompt,
  config: { responseMimeType: 'application/json', temperature: 0.4 },
});

let model;
try {
  model = JSON.parse(response.text);
} catch (e) {
  console.error(`Modellen returnerade ogiltig JSON: ${e.message}`);
  process.exit(1);
}

const { records, problems } = buildDraftRecords(model, meta, text);
const outDir = path.join('content', 'card-drafts');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${meta.slug}.json`);
if (records.length) fs.writeFileSync(out, `${JSON.stringify(records, null, 2)}\n`);

if (records.length) console.log(`Skrev ${records.length} utkastposter till ${out}`);
if (problems.length) {
  console.log('\nÅtgärda före godkännande:');
  for (const p of problems) console.log(`  - ${p}`);
}
console.log('\nNästa steg: läs källan, faktakontrollera varje rad, ändra texten, sätt status "approved" och source.verified true, flytta till content/cards/legends/, kör npm run check:cards.');
