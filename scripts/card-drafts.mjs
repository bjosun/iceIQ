// Ren logik för redaktörsskriptet (generate-card-drafts.mjs): promptbygge,
// källtolkning och sanering av modellens svar. Inget nätverk här, så det går
// att testa: node --test src/lib/cardDrafts.test.mjs
//
// Princip: modellen får bara skriva ur en källtext en människa lagt in, och
// allt den returnerar behandlas som misstänkt tills koden kontrollerat det.
// Utkasten är alltid status 'draft' med source.verified false — en människa
// läser källan, granskar texten och flyttar kortet till content/cards/.
import { validateCards } from './card-library.mjs';

const ICONS = ['backpack', 'pen-line', 'moon', 'check'];
const MAX_QUOTE_WORDS = 15;
const NERVE_FOOTNOTE = {
  sv: 'Känns nerverna större än så här — prata med din tränare eller en vuxen du litar på. Den här rutinen är till för matchnerver, inte för allt.',
  en: 'If the nerves feel bigger than this, talk to your coach or an adult you trust. This routine is for game-day nerves, not for everything.',
};

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// Källfil: front matter (nyckel: värde) mellan --- rader, sedan själva texten.
export function parseSourceFile(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error('Källfilen måste börja med front matter (--- … ---) med person, work, year, lang.');
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z]+):\s*(.*)$/.exec(line.trim());
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  const text = m[2].trim();
  const errors = [];
  if (!meta.person) errors.push('person saknas');
  if (!meta.work) errors.push('work saknas');
  if (!/^\d{4}$/.test(meta.year ?? '')) errors.push('year måste vara fyra siffror');
  if (!['sv', 'en'].includes(meta.lang)) errors.push("lang måste vara 'sv' eller 'en' (källtextens språk)");
  if (meta.url && !/^https:\/\//.test(meta.url)) errors.push('url måste börja med https://');
  if (text.length < 200) errors.push('källtexten är för kort (minst ~200 tecken)');
  if (errors.length) throw new Error(`Ogiltig källfil: ${errors.join('; ')}`);
  return {
    meta: {
      person: meta.person,
      work: meta.work,
      year: Number(meta.year),
      lang: meta.lang,
      url: meta.url || undefined,
      slug: meta.slug ? slugify(meta.slug) : slugify(`${meta.person}-${meta.work}`),
    },
    text,
  };
}

export function buildPrompt(meta, sourceText) {
  return `Du skriver utkast till korta övningskort för ungdomshockeyspelare (13-18 år), på svenska och engelska.
Underlag: ett utdrag ur "${meta.work}" (${meta.year}) av ${meta.person}. Utdraget är skrivet på ${meta.lang === 'sv' ? 'svenska' : 'engelska'}.

REGLER (bryts någon är utkastet värdelöst):
1. Använd ENDAST det som står i utdraget nedan. Lägg inte till egna fakta, anekdoter, siffror eller påståenden om personen. Vet du något annat om personen: ignorera det.
2. Parafrasera med egna ord. Skriv aldrig citattecken i korttexterna. Vill du ha ett citat, lägg ett enda i fältet "quote": en ordagrann sträng ur utdraget, högst ${MAX_QUOTE_WORDS} ord, på utdragets språk. Finns inget kort citat som tillför något: returnera "quote" som tom sträng.
3. Skriv aldrig att ${meta.person} står bakom, rekommenderar eller har sagt något om Ice IQ. Skriv det som en lärdom: "${meta.person} har berättat att …" eller en lärdom utan att dra in personen om du är osäker.
4. Ingen medicinsk eller psykologisk rådgivning, inga löften om resultat, inga påståenden om hur många som gör något, inga jämförelser med andra spelare.
5. Enkelt språk som en tonåring läser. Korta meningar. Hockeyspråk är okej.
6. Exakt fyra kort, i den här ordningen:
   1. intro: lärdomen i 1-2 meningar (title).
   2. fråga: en fråga om hur spelaren kan använda lärdomen (title) plus ett inmatningsfält: placeholder (ett exempelsvar) och errorText ("Skriv … innan du går vidare.").
   3. prova: en konkret liten sak att testa på nästa träning eller match (title kort, body 1-2 meningar).
   4. avslut: en kort rubrik (title) och reward.withAnswer (måste innehålla texten {answer} ordagrant) och reward.empty (samma budskap utan {answer}).
7. Skriv både "sv" och "en" för varje kort. Engelskan ska låta naturlig, inte vara ordagrann översättning.
8. sectionTitle: en kort rubrik, sv och en.

Svara ENDAST med JSON i exakt den här formen:
{
  "sectionTitle": {"sv": "", "en": ""},
  "quote": "",
  "cards": [
    {"sv": {"title": ""}, "en": {"title": ""}},
    {"sv": {"title": "", "input": {"placeholder": "", "errorText": ""}}, "en": {"title": "", "input": {"placeholder": "", "errorText": ""}}},
    {"sv": {"title": "", "body": ""}, "en": {"title": "", "body": ""}},
    {"sv": {"title": "", "reward": {"withAnswer": "", "empty": ""}}, "en": {"title": "", "reward": {"withAnswer": "", "empty": ""}}}
  ]
}

UTDRAG:
"""
${sourceText}
"""`;
}

const norm = (s) => String(s).replace(/\s+/g, ' ').replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").trim().toLowerCase();

// Citatet måste finnas ordagrant (efter blanksteg/citattecken-normalisering)
// i källtexten och vara kort. Annars kastas det — hellre inget citat än ett påhittat.
export function checkQuote(quote, sourceText) {
  if (typeof quote !== 'string' || !quote.trim()) return { ok: true, quote: '' };
  const q = quote.trim();
  if (q.split(/\s+/).length > MAX_QUOTE_WORDS) return { ok: false, reason: `citatet är längre än ${MAX_QUOTE_WORDS} ord` };
  if (!norm(sourceText).includes(norm(q))) return { ok: false, reason: 'citatet finns inte ordagrant i källtexten' };
  return { ok: true, quote: q };
}

const QUOTE_CHARS = /["“”„«»]/;
const strings = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);

// Bygger fullständiga kortposter (sv+en, status 'draft') ur modellens svar.
// Returnerar { records, problems }. Problem som gör utkastet oanvändbart
// ligger i problems; skriptet skriver ändå filen så att en människa ser vad som blev fel.
export function buildDraftRecords(model, meta, sourceText) {
  const problems = [];
  const fail = (m) => problems.push(m);
  if (!model || typeof model !== 'object' || !Array.isArray(model.cards) || model.cards.length !== 4) {
    return { records: [], problems: ['modellen returnerade inte exakt fyra kort'] };
  }

  const quote = checkQuote(model.quote, sourceText);
  if (!quote.ok) fail(`quote kasserades: ${quote.reason}`);

  const records = [];
  for (const lang of ['sv', 'en']) {
    model.cards.forEach((entry, idx) => {
      const c = entry?.[lang] ?? {};
      const id = `legend-${meta.slug}-${String(idx + 1).padStart(2, '0')}`;
      const rec = {
        id,
        concept: `legend-${meta.slug}`,
        track: 'legends',
        level: 1,
        ageMin: 13,
        ageMax: 18,
        surface: 'link',
        lang,
        status: 'draft',
        pass: `legend-${meta.slug}`,
        order: idx + 1,
        icon: ICONS[idx],
        title: typeof c.title === 'string' ? c.title.trim() : '',
        sectionTitle: typeof model.sectionTitle?.[lang] === 'string' ? model.sectionTitle[lang].trim() : '',
        source: {
          person: meta.person,
          work: meta.work,
          year: meta.year,
          verified: false,
          ...(meta.url ? { url: meta.url } : {}),
        },
      };
      if (typeof c.body === 'string' && c.body.trim()) rec.body = c.body.trim();
      if (c.input) rec.input = { placeholder: String(c.input.placeholder ?? '').trim(), errorText: String(c.input.errorText ?? '').trim() };
      if (c.reward) rec.reward = { withAnswer: String(c.reward.withAnswer ?? '').trim(), empty: String(c.reward.empty ?? '').trim() };
      // Citatet läggs bara in på källtextens eget språk, aldrig som översättning.
      if (idx === 0 && quote.ok && quote.quote && lang === meta.lang) {
        rec.body = `${rec.body ? `${rec.body}\n\n` : ''}“${quote.quote}”`;
      }
      records.push(rec);
    });
  }

  // Citattecken i modellens egen text = möjligt påhittat citat. Själva citatet
  // läggs in av koden ovan, så allt annat med citattecken kasseras.
  for (const lang of ['sv', 'en']) {
    model.cards.forEach((entry, idx) => {
      if (strings(entry?.[lang]).some((s) => QUOTE_CHARS.test(s))) {
        fail(`kort ${idx + 1} (${lang}) innehåller citattecken i modellens text — kan vara ett påhittat citat`);
      }
    });
  }

  // Kort som nämner nerver ska bära trygghetsraden (samma regel som bygget
  // kräver). Lägg till den på just de korten så valideringen nedan inte
  // fallerar på något vi kan lösa.
  for (const rec of records) {
    if (/nerv|anxi/i.test(`${rec.title} ${rec.body ?? ''}`)) {
      rec.nerves = true;
      rec.footnote = NERVE_FOOTNOTE[rec.lang];
    }
  }

  // Simulerad godkännande-validering: samma regler som bygget kräver, så
  // strukturfel syns nu och inte först när en människa försöker godkänna.
  const asApproved = records.map((r) => ({ ...r, status: 'approved', source: { ...r.source, verified: true } }));
  for (const e of validateCards(asApproved)) fail(`validering: ${e}`);

  return { records, problems };
}
