// Fast "knapptelefon"-layout för aktionsknapparna: tolv pluss och sex minus på
// samma plats varje match, så att händerna lär sig läget och man slipper titta.
// Spelaren kan själv lägga till fler knappar i rutnätet (se loadExtras). Några pluss-platser är "dagens fokus": spelaren
// väljer själv vilka aktioner som ska ligga där (sparas på enheten).
//
// Det här är bara en vy. Alla aktioner finns kvar i mallen och sparas under
// samma engelska namn som förut, så statistik, utmärkelser och coach påverkas inte.

import type { Template, TemplateAction, TemplateLayout } from '../contexts/TemplateContext';

export const GRID_POSITIVE = 12;
export const GRID_NEGATIVE = 6;

export interface ResolvedGrid {
  positive: TemplateAction[];
  negative: TemplateAction[];
  /** Aktioner som inte ligger på rutnätet; kan läggas till som egna knappar. */
  more: TemplateAction[];
  /** Aktioner spelaren själv lagt till (redan inräknade i positive/negative). */
  extras: TemplateAction[];
  /** Engelska namn på standardrutnätets knappar, före att något dolts eller lagts till. */
  baseNames: Set<string>;
  /** Antal fokusplatser, och hur många av dem som är tomma. */
  slots: number;
  emptySlots: number;
  /** Vilka positiva aktioner man kan välja som fokus. */
  focusCandidates: TemplateAction[];
  /** Engelska namn på de aktioner som ligger på fokusplatserna just nu. */
  focusChosen: string[];
  /** Engelska namn på de fasta platserna (för att markera fokus visuellt). */
  fixedNames: Set<string>;
}

const FOCUS_KEY = (templateId: string) => `iceiq-focus-${templateId}`;

export function loadFocus(templateId: string): string[] | null {
  try {
    const raw = localStorage.getItem(FOCUS_KEY(templateId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((x) => typeof x === 'string') ? parsed : null;
  } catch {
    return null;
  }
}

const EXTRAS_KEY = (templateId: string) => `iceiq-extras-${templateId}`;

/** Aktioner spelaren själv lagt till som egna knappar, per mall (engelska namn). */
export function loadExtras(templateId: string): string[] {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY(templateId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((x) => typeof x === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExtras(templateId: string, names: string[]): void {
  try {
    localStorage.setItem(EXTRAS_KEY(templateId), JSON.stringify(names));
  } catch { /* privat läge: valet gäller bara den här sessionen */ }
}

const HIDDEN_KEY = (templateId: string) => `iceiq-hidden-${templateId}`;

/** Standardknappar spelaren valt att dölja, per mall (engelska namn). */
export function loadHidden(templateId: string): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY(templateId));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((x) => typeof x === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHidden(templateId: string, names: string[]): void {
  try {
    localStorage.setItem(HIDDEN_KEY(templateId), JSON.stringify(names));
  } catch { /* privat läge: valet gäller bara den här sessionen */ }
}

export function saveFocus(templateId: string, names: string[]): void {
  try {
    localStorage.setItem(FOCUS_KEY(templateId), JSON.stringify(names));
  } catch { /* privat läge: valet gäller bara den här sessionen */ }
}

/**
 * Bygger rutnätet ur mallens aktioner och layout. Returnerar null när layouten
 * inte går att använda (egen mall där de flesta namnen saknas); då visas den
 * gamla fulla listan.
 */
export function resolveGrid(
  template: Pick<Template, 'actions'>,
  layout: TemplateLayout | undefined,
  chosenFocus?: string[] | null,
  extraNames: string[] = [],
  hiddenNames: string[] = [],
): ResolvedGrid | null {
  if (!layout) return null;
  const byEn = new Map<string, TemplateAction>();
  for (const a of template.actions) byEn.set(a.name.en, a);

  const find = (en: string, type: 'positive' | 'negative') => {
    const a = byEn.get(en);
    return a && a.type === type ? a : undefined;
  };

  const fixed = layout.positive.map((en) => find(en, 'positive')).filter((a): a is TemplateAction => !!a);
  const fixedNames = new Set(fixed.map((a) => a.name.en));
  const slots = layout.focusSlots ?? Math.max(0, GRID_POSITIVE - layout.positive.length);

  const wanted = (chosenFocus ?? layout.focus ?? []).slice(0, slots);
  const focusActs: TemplateAction[] = [];
  for (const en of wanted) {
    const a = find(en, 'positive');
    if (a && !fixedNames.has(a.name.en) && !focusActs.includes(a)) focusActs.push(a);
  }

  const negative = layout.negative
    .map((en) => find(en, 'negative'))
    .filter((a): a is TemplateAction => !!a)
    .slice(0, GRID_NEGATIVE);

  const basePositive = [...fixed, ...focusActs];
  if (basePositive.length + negative.length < 6) return null;

  const baseNames = new Set([...basePositive, ...negative].map((a) => a.name.en));
  const hidden = new Set(hiddenNames);
  const visiblePositive = basePositive.filter((a) => !hidden.has(a.name.en));
  const visibleNegative = negative.filter((a) => !hidden.has(a.name.en));

  const placed = new Set<TemplateAction>([...basePositive, ...negative]);
  const extras = extraNames
    .map((en) => byEn.get(en))
    .filter((a, i, all): a is TemplateAction => !!a && !placed.has(a) && all.indexOf(a) === i);
  const positive = [...visiblePositive, ...extras.filter((a) => a.type === 'positive')];
  const negativeAll = [...visibleNegative, ...extras.filter((a) => a.type === 'negative')];

  const shown = new Set<TemplateAction>([...positive, ...negativeAll]);
  return {
    positive,
    negative: negativeAll,
    extras,
    baseNames,
    more: template.actions.filter((a) => !shown.has(a)),
    slots,
    emptySlots: Math.max(0, slots - focusActs.length),
    focusCandidates: template.actions.filter((a) => a.type === 'positive' && !fixedNames.has(a.name.en)),
    focusChosen: focusActs.map((a) => a.name.en),
    fixedNames,
  };
}

// Korta namn för knapparna (de fulla namnen visas under "Mer…" och är
// fortfarande det som sparas). Nyckeln är det engelska aktionsnamnet.
export const SHORT_NAMES: Record<string, { sv: string; en: string }> = {
  'Controlled Zone Entry': { sv: 'Zoninträde', en: 'Zone entry' },
  'Successful Pass': { sv: 'Passning', en: 'Pass' },
  'Wins Board Battle': { sv: 'Sargduell', en: 'Board battle' },
  'Blocked Shot': { sv: 'Blockat skott', en: 'Blocked shot' },
  'Poke Check': { sv: 'Poke check', en: 'Poke check' },
  'Difficult Save': { sv: 'Svår räddning', en: 'Difficult save' },
  'On Ice For Goal (FOR)': { sv: 'På isen: mål för', en: 'On ice: goal for' },
  'On Ice For Goal (AGAINST)': { sv: 'På isen: mål mot', en: 'On ice: goal against' },
  'Failed Pass': { sv: 'Missad passning', en: 'Failed pass' },
  'Turnover': { sv: 'Pucktapp', en: 'Turnover' },
  'Denies Entry (Gap Control)': { sv: 'Bra gap', en: 'Gap control' },
  'Solves Pressured Situation': { sv: 'Löser press', en: 'Beats pressure' },
  'Controlled Defensive Clear': { sv: 'Rensning', en: 'Clean clear' },
  'Kept Zone': { sv: 'Höll blålinjen', en: 'Kept the line' },
  'Panic Turnover / Throwaway': { sv: 'Panikrensning', en: 'Panic clear' },
  'Faceoff Win': { sv: 'Vunnen tekning', en: 'Faceoff win' },
  'Faceoff Loss': { sv: 'Förlorad tekning', en: 'Faceoff loss' },
  'Successful Deke': { sv: 'Dribbling', en: 'Deke' },
  'Scoring Chance Created': { sv: 'Målchans', en: 'Scoring chance' },
  'Forecheck Puck Recovery': { sv: 'Forecheck', en: 'Forecheck' },
  'Backcheck Puck Recovery': { sv: 'Backcheck', en: 'Backcheck' },
  'Low Slot Coverage': { sv: 'Täcker fickan', en: 'Covers slot' },
  'Covers the Point': { sv: 'Täcker backen', en: 'Covers point' },
  'Supports Defenseman Down Low': { sv: 'Hjälper backen', en: 'Helps D low' },
  'Missed Shot': { sv: 'Missat skott', en: 'Missed shot' },
  'Shot Blocked (Own)': { sv: 'Mitt skott blockat', en: 'My shot blocked' },
  'Offensive Zone Turnover': { sv: 'Pucktapp off. zon', en: 'O-zone turnover' },
  'Loses Defensive Coverage': { sv: 'Tappar täckning', en: 'Lost coverage' },
  'Faceoff Win (Defensive Zone)': { sv: 'Tekning egen zon', en: 'D-zone faceoff' },
  'Faceoff Win (Offensive Zone)': { sv: 'Tekning off. zon', en: 'O-zone faceoff' },
  'Faceoff Loss (Defensive Zone)': { sv: 'Förl. tekning egen zon', en: 'D-zone faceoff loss' },
  'Third Man High Coverage': { sv: 'Tredje man', en: 'Third man high' },
  'Breakout Support': { sv: 'Utspelsstöd', en: 'Breakout support' },
  'Net-Front Presence': { sv: 'Framför mål', en: 'Net-front' },
  'Puck Protection (Cycle)': { sv: 'Skyddar pucken', en: 'Puck protection' },
  'Shutout (Period)': { sv: 'Hållen nolla', en: 'Shutout (period)' },
  'Controlled Rebound': { sv: 'Kontr. retur', en: 'Controlled rebound' },
  'Successful Puck Play': { sv: 'Puckspel lyckat', en: 'Puck play OK' },
  'Failed Puck Play': { sv: 'Puckspel missat', en: 'Puck play failed' },
  'Goal Against': { sv: 'Insläppt mål', en: 'Goal against' },
};

export function shortName(action: TemplateAction, language: 'sv' | 'en'): string {
  return SHORT_NAMES[action.name.en]?.[language] ?? action.name[language] ?? action.name.en;
}
