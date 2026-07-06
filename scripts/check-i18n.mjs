// Verifierar att 'en' och 'sv' i src/utils/translations.ts har exakt samma nycklar.
// Körs med: npm run check:i18n  (avslutar med felkod om nycklar saknas)
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src/utils/translations.ts'), 'utf8');

// Filen är nästan ren JS — strippa bara typ-exporten så Node kan importera den.
const js = source.replace(/^export type .*$/gm, '');
const tmpDir = mkdtempSync(join(tmpdir(), 'iceiq-i18n-'));
const tmpFile = join(tmpDir, 'translations.mjs');
writeFileSync(tmpFile, js);

const { translations } = await import(pathToFileURL(tmpFile).href);
rmSync(tmpDir, { recursive: true, force: true });

function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      keys.push(...collectKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const en = new Set(collectKeys(translations.en));
const sv = new Set(collectKeys(translations.sv));

const missingInSv = [...en].filter((k) => !sv.has(k));
const missingInEn = [...sv].filter((k) => !en.has(k));

let failed = false;
if (missingInSv.length) {
  failed = true;
  console.error(`Saknas i 'sv' (${missingInSv.length}):`);
  for (const k of missingInSv) console.error(`  - ${k}`);
}
if (missingInEn.length) {
  failed = true;
  console.error(`Saknas i 'en' (${missingInEn.length}):`);
  for (const k of missingInEn) console.error(`  - ${k}`);
}

if (failed) {
  process.exit(1);
}
console.log(`OK: ${en.size} nycklar, en och sv matchar.`);
