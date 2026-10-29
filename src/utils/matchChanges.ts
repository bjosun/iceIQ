// Vad som ändrats mellan spelarens senaste matcher, räknat ur data som redan
// finns på spelarlänken (datum, poäng, antal per aktion). Ren logik utan React
// och nätverk: node --test src/utils/matchChanges.test.mjs
//
// Syftet är att länken ska se ny ut efter varje match och peka på det som
// faktiskt hänt. Tonen är jämförelse med spelaren SJÄLV, aldrig med andra, och
// en försämring markeras neutralt (se tone) — bara en förbättring får färg.

export interface LinkGame {
  date: string;
  points: number;
  template?: string;
  counts?: Record<string, number>;
}

export type Polarity = 'positive' | 'negative';

export interface ActionChange {
  /** Engelskt aktionsnamn (nyckeln i sparade matcher). */
  action: string;
  previous: number;
  current: number;
  delta: number;
  tone: 'better' | 'worse' | 'neutral';
  /** Högst fem värden, äldst -> nyast, sista = senaste matchen. */
  recent: number[];
  /** Senaste värdet är strikt lägst/högst av alla matcher (kräver minst fyra matcher). */
  extreme: 'lowest' | 'highest' | null;
}

const RECENT = 5;
const MIN_GAMES_FOR_EXTREME = 4;

// Äldre matcher har JSON-nycklar {sv,en}; normalisera till engelskt namn,
// som i SeasonTotals och awards.
export function normalizeActionKey(key: string): string {
  if (!key.startsWith('{')) return key;
  try {
    const parsed = JSON.parse(key);
    return parsed.en || parsed.sv || key;
  } catch {
    return key;
  }
}

export function actionCounts(game: Pick<LinkGame, 'counts'>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(game.counts ?? {})) {
    const n = Number(value);
    if (!Number.isFinite(n)) continue;
    const name = normalizeActionKey(key);
    out[name] = (out[name] ?? 0) + n;
  }
  return out;
}

export function sortedGames<T extends { date: string }>(games: readonly T[]): T[] {
  return [...games].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function toneFor(delta: number, polarity: Polarity | undefined): ActionChange['tone'] {
  if (!polarity || delta === 0) return 'neutral';
  const improved = polarity === 'positive' ? delta > 0 : delta < 0;
  return improved ? 'better' : 'worse';
}

/**
 * Aktioner vars antal ändrats mellan den senaste och näst senaste matchen,
 * störst förändring först. Tom lista med färre än två matcher.
 */
export function latestChanges(
  games: readonly LinkGame[],
  polarity: Readonly<Record<string, Polarity>>,
  max = 6,
): ActionChange[] {
  const ordered = sortedGames(games);
  if (ordered.length < 2) return [];
  const counts = ordered.map(actionCounts);
  const last = counts[counts.length - 1];
  const prev = counts[counts.length - 2];

  const names = new Set([...Object.keys(last), ...Object.keys(prev)]);
  const changes: ActionChange[] = [];
  for (const action of names) {
    const current = last[action] ?? 0;
    const previous = prev[action] ?? 0;
    const delta = current - previous;
    if (delta === 0) continue;

    const series = counts.map((c) => c[action] ?? 0);
    const others = series.slice(0, -1);
    let extreme: ActionChange['extreme'] = null;
    if (ordered.length >= MIN_GAMES_FOR_EXTREME) {
      if (current < Math.min(...others)) extreme = 'lowest';
      else if (current > Math.max(...others)) extreme = 'highest';
    }
    changes.push({
      action,
      previous,
      current,
      delta,
      tone: toneFor(delta, polarity[action]),
      recent: series.slice(-RECENT),
      extreme,
    });
  }

  changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.action.localeCompare(b.action));
  return changes.slice(0, max);
}

/** Poäng i senaste matchen minus spelarens snitt, avrundat till en decimal. Null utan underlag. */
export function pointsVsAverage(latestPoints: number, averagePoints: number | null | undefined): number | null {
  if (typeof averagePoints !== 'number' || !Number.isFinite(averagePoints)) return null;
  return Math.round((latestPoints - averagePoints) * 10) / 10;
}

export function latestGameDate(games: readonly Pick<LinkGame, 'date'>[]): string | null {
  if (!games.length) return null;
  return sortedGames(games)[games.length - 1].date;
}

/** Finns en match nyare än den som sist visades på den här enheten? Första besöket räknas som ny. */
export function hasNewMatch(latestDate: string | null, lastSeenDate: string | null): boolean {
  if (!latestDate) return false;
  return lastSeenDate === null || latestDate > lastSeenDate;
}
