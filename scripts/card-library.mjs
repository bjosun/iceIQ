import fs from 'node:fs';
import path from 'node:path';

export const VIRTUAL_CARDS_ID = 'virtual:iceiq-cards';
const RESOLVED_CARDS_ID = '\0' + VIRTUAL_CARDS_ID;

const ICONS = new Set(['backpack', 'pen-line', 'moon', 'check']);
const SURFACES = new Set(['link', 'app', 'both']);
const LANGS = new Set(['sv', 'en']);
const STATUSES = new Set(['draft', 'approved']);
const COPY_KEYS = ['title', 'body', 'reflect', 'footnote', 'sectionTitle'];
const META_KEYS = ['id', 'concept', 'track', 'level', 'requires', 'ageMin', 'ageMax', 'surface', 'status', 'pass', 'order', 'icon', 'nerves', 'source'];
const NERVE_WORD = /nerv|anxi/i;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonblank = (v) => typeof v === 'string' && v.trim().length > 0;
const isInt = (v) => Number.isInteger(v);

function structuralErrors(card, ctx) {
  const errors = [];
  const fail = (m) => errors.push(`${ctx}: ${m}`);
  if (!isObj(card)) return [`${ctx}: not an object`];
  if (!nonblank(card.id)) fail('id must be a non-empty string');
  if (!nonblank(card.concept)) fail('concept must be a non-empty string');
  if (!nonblank(card.track)) fail('track must be a non-empty string');
  if (![1, 2, 3].includes(card.level)) fail('level must be 1, 2 or 3');
  if (card.requires !== undefined && (!Array.isArray(card.requires) || card.requires.some((r) => !nonblank(r)))) {
    fail('requires must be an array of card ids');
  }
  if (!isInt(card.ageMin) || !isInt(card.ageMax) || card.ageMin < 0 || card.ageMin > card.ageMax) {
    fail('ageMin/ageMax must be integers with 0 <= ageMin <= ageMax');
  }
  if (!SURFACES.has(card.surface)) fail("surface must be 'link', 'app' or 'both'");
  if (!LANGS.has(card.lang)) fail("lang must be 'sv' or 'en'");
  if (!STATUSES.has(card.status)) fail("status must be 'draft' or 'approved'");
  if (!nonblank(card.pass)) fail('pass must be a non-empty string');
  if (!isInt(card.order) || card.order < 1 || card.order > 4) fail('order must be an integer 1-4');
  if (typeof card.title !== 'string') fail('title must be a string');
  if (typeof card.sectionTitle !== 'string') fail('sectionTitle must be a string');
  if (!ICONS.has(card.icon)) fail(`icon must be one of ${[...ICONS].join(', ')}`);
  for (const key of ['body', 'reflect', 'footnote']) {
    if (card[key] !== undefined && typeof card[key] !== 'string') fail(`${key} must be a string`);
  }
  if (card.input !== undefined) {
    if (!isObj(card.input) || typeof card.input.placeholder !== 'string' || typeof card.input.errorText !== 'string') {
      fail('input must be { placeholder: string, errorText: string }');
    }
  }
  if (card.action !== undefined) {
    if (!isObj(card.action) || card.action.kind !== 'breathing' || typeof card.action.label !== 'string') {
      fail("action must be { kind: 'breathing', label: string }");
    }
  }
  if (card.reward !== undefined) {
    if (!isObj(card.reward) || typeof card.reward.withAnswer !== 'string' || typeof card.reward.empty !== 'string') {
      fail('reward must be { withAnswer: string, empty: string }');
    }
  }
  if (card.nerves !== undefined && typeof card.nerves !== 'boolean') fail('nerves must be a boolean');
  if (card.source !== undefined) {
    const s = card.source;
    if (
      !isObj(s) || !nonblank(s.person) || !nonblank(s.work) || !isInt(s.year) || typeof s.verified !== 'boolean' ||
      (s.url !== undefined && !(typeof s.url === 'string' && /^https:\/\//.test(s.url)))
    ) {
      fail('source must be { person, work, year, verified: boolean, url?: https-url }');
    }
  }
  if (card.track === 'legends' && card.source === undefined) fail('legends cards must carry a source');
  const allowed = new Set([...META_KEYS, ...COPY_KEYS, 'lang', 'input', 'action', 'reward']);
  for (const key of Object.keys(card)) {
    if (!allowed.has(key)) fail(`unknown field '${key}'`);
  }
  return errors;
}

function approvedCopyErrors(card, ctx) {
  const errors = [];
  const fail = (m) => errors.push(`${ctx}: ${m}`);
  if (!nonblank(card.title)) fail('approved card title must be non-empty');
  if (!nonblank(card.sectionTitle)) fail('approved card sectionTitle must be non-empty');
  for (const key of ['body', 'reflect', 'footnote']) {
    if (card[key] !== undefined && !nonblank(card[key])) fail(`approved card ${key} must be non-empty when present`);
  }
  if (card.input && (!nonblank(card.input.placeholder) || !nonblank(card.input.errorText))) {
    fail('approved card input fields must be non-empty');
  }
  if (card.action && !nonblank(card.action.label)) fail('approved card action label must be non-empty');
  if (card.source && card.source.verified !== true) fail('approved card source must be verified by a person (source.verified: true)');
  if (card.reward) {
    if (!nonblank(card.reward.empty)) fail('approved card reward.empty must be non-empty');
    if (!card.reward.withAnswer.includes('{answer}')) {
      fail("approved card reward.withAnswer must contain '{answer}'");
    }
  }
  return errors;
}

function mentionsNerves(card) {
  return NERVE_WORD.test(card.title ?? '') || NERVE_WORD.test(card.body ?? '') || NERVE_WORD.test(card.reflect ?? '');
}

export function validateCards(records) {
  const errors = [];
  if (!Array.isArray(records)) return ['card library must be an array'];

  const byId = new Map();
  for (const card of records) {
    const ctx = `card ${card?.id ?? '?'} (${card?.lang ?? '?'})`;
    errors.push(...structuralErrors(card, ctx));
    if (isObj(card) && nonblank(card.id) && LANGS.has(card.lang)) {
      const key = `${card.id}${card.lang}`;
      if (byId.has(key)) errors.push(`${ctx}: duplicate ${card.lang} record for id '${card.id}'`);
      else byId.set(key, card);
    }
    if (isObj(card) && isInt(card.ageMin) && card.ageMin < 13 && card.surface !== 'link') {
      errors.push(`${ctx}: cards for ages under 13 may only have surface 'link'`);
    }
  }

  const ids = new Map();
  for (const [key, card] of byId) {
    const id = key.slice(0, -2);
    if (!ids.has(id)) ids.set(id, []);
    ids.get(id).push(card);
  }
  for (const [id, pair] of ids) {
    if (pair.length !== 2) {
      errors.push(`card '${id}': must exist in exactly one sv and one en record`);
      continue;
    }
    const [a, b] = pair;
    for (const key of META_KEYS) {
      if (key === 'id') continue;
      if (JSON.stringify(a[key] ?? null) !== JSON.stringify(b[key] ?? null)) {
        errors.push(`card '${id}': sv/en records disagree on '${key}'`);
      }
    }
  }

  const passes = new Map();
  for (const card of byId.values()) {
    if (!nonblank(card.pass)) continue;
    const key = `${card.pass}${card.lang}`;
    if (!passes.has(key)) passes.set(key, []);
    passes.get(key).push(card);
  }
  const passKeys = [...new Set([...byId.values()].filter((c) => nonblank(c.pass)).map((c) => c.pass))];
  for (const pass of passKeys) {
    const svCards = (passes.get(`${pass}sv`) ?? []).sort((x, y) => x.order - y.order);
    const enCards = (passes.get(`${pass}en`) ?? []).sort((x, y) => x.order - y.order);
    const ctx = `pass '${pass}'`;
    if (svCards.length < 3 || svCards.length > 4 || enCards.length < 3 || enCards.length > 4) {
      errors.push(`${ctx}: a pass must contain 3-4 cards per language (got sv=${svCards.length}, en=${enCards.length})`);
      continue;
    }
    for (const [lang, cards] of [['sv', svCards], ['en', enCards]]) {
      const orders = cards.map((c) => c.order);
      if (new Set(orders).size !== orders.length || orders.some((o, i) => o !== i + 1)) {
        errors.push(`${ctx} (${lang}): orders must be unique and contiguous from 1`);
      }
      for (const key of ['concept', 'track', 'level', 'sectionTitle']) {
        const first = JSON.stringify(cards[0][key]);
        if (cards.some((c) => JSON.stringify(c[key]) !== first)) {
          errors.push(`${ctx} (${lang}): cards disagree on '${key}'`);
        }
      }
      const statuses = new Set(cards.map((c) => c.status));
      if (statuses.size !== 1) {
        errors.push(`${ctx} (${lang}): a pass may not mix draft and approved cards`);
      }
      if (cards[0].status === 'approved') {
        for (const card of cards) errors.push(...approvedCopyErrors(card, `${ctx} (${lang}) card '${card.id}'`));
        const withInput = cards.filter((c) => c.input);
        if (withInput.length > 1) errors.push(`${ctx} (${lang}): at most one input card per pass`);
        const withReward = cards.filter((c) => c.reward);
        if (withReward.length > 1) errors.push(`${ctx} (${lang}): at most one reward card per pass`);
        if (withReward.length === 1) {
          const rewardCard = withReward[0];
          const inputBefore = cards.some((c) => c.input && c.order < rewardCard.order);
          if (!inputBefore) errors.push(`${ctx} (${lang}): a reward card requires an earlier input card`);
        }
        for (const card of cards) {
          const needsFootnote = card.nerves === true || card.track === 'game-nerves' || mentionsNerves(card);
          if (needsFootnote && !nonblank(card.footnote)) {
            errors.push(`${ctx} (${lang}) card '${card.id}': nerve-related cards must carry a non-empty footnote safety line`);
          }
        }
      }
    }
  }

  for (const [key, card] of byId) {
    for (const req of card.requires ?? []) {
      if (!ids.has(req)) {
        errors.push(`card '${card.id}' (${card.lang}): requires unknown card id '${req}'`);
      } else if (req === card.id) {
        errors.push(`card '${card.id}' (${card.lang}): may not require itself`);
      } else {
        const target = ids.get(req)[0];
        if (card.status === 'approved' && target.status !== 'approved') {
          errors.push(`card '${card.id}' (${card.lang}): approved card may not require draft card '${req}'`);
        }
      }
    }
  }
  const rep = new Map([...ids.entries()].map(([id, pair]) => [id, pair[0]]));
  const visiting = new Set();
  const done = new Set();
  const visit = (id, chain) => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`requires cycle detected: ${[...chain, id].join(' -> ')}`);
      return;
    }
    visiting.add(id);
    for (const req of rep.get(id)?.requires ?? []) {
      if (rep.has(req)) visit(req, [...chain, id]);
    }
    visiting.delete(id);
    done.add(id);
  };
  for (const id of rep.keys()) visit(id, []);

  return errors;
}

function* cardJsonFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* cardJsonFiles(full);
    else if (entry.isFile() && entry.name.endsWith('.json')) yield full;
  }
}

export function loadCardLibrary(root) {
  const dir = path.join(root, 'content', 'cards');
  const records = [];
  if (fs.existsSync(dir)) {
    for (const file of cardJsonFiles(dir)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(parsed)) throw new Error(`${file}: expected an array of cards`);
      records.push(...parsed);
    }
  }
  const errors = validateCards(records);
  if (errors.length) {
    throw new Error(`Invalid card library:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }
  return records;
}

export function cardLibraryPlugin() {
  let root = process.cwd();
  return {
    name: 'iceiq-card-library',
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      const dir = path.join(root, 'content', 'cards');
      if (fs.existsSync(dir)) {
        for (const file of cardJsonFiles(dir)) this.addWatchFile(file);
      }
    },
    resolveId(id) {
      if (id === VIRTUAL_CARDS_ID) return RESOLVED_CARDS_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_CARDS_ID) return null;
      const approved = loadCardLibrary(root).filter((c) => c.status === 'approved');
      return `export const approvedCards = ${JSON.stringify(approved)};\nexport default approvedCards;\n`;
    },
    configureServer(server) {
      server.watcher.add(path.join(root, 'content', 'cards'));
    },
    handleHotUpdate({ file, server, modules }) {
      const dir = path.join(root, 'content', 'cards') + path.sep;
      if (!file.startsWith(dir)) return modules;
      const mod = server.moduleGraph.getModuleById(RESOLVED_CARDS_ID);
      if (mod) server.moduleGraph.invalidateModule(mod);
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}
