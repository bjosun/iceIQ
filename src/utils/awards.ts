// Utmärkelser per match — "gems" som spelaren får för det som faktiskt loggats.
//
// Samma princip som badges.ts och matchHighlight.ts: bara sådant som är
// belagt i datan, aldrig en jämförelse med andra spelare. Reglerna är
// deterministiska (ingen AI, ingen kredit) och räknas ut ur matchens sparade
// `counts`, så hyllan kan byggas om från historiken utan ny lagring.
//
// Aktionerna matchas på sitt ENGELSKA namn — det är nyckeln som saveGame
// sparar (usePlayerData). Egna mallar som döper om eller bygger egna aktioner
// får därför inga utmärkelser; det är avsiktligt, hellre ingen än en felaktig.
//
// Tröskelvärdena är kalibrerade mot sparade matcher så att de vanligaste
// utmärkelserna träffar ungefär var sjunde till var tionde match och de
// svåra mer sällan — lagom utmanande, inte gratis. Underlaget var 20 matcher
// för backar; forward- och målvaktsvärdena är utlästa i förhållande till dem
// och bör ses över när det finns riktiga matcher (se docs/awards-plan.md).

export type Ring = 'fire' | 'water' | 'earth' | 'wind' | 'void';
export type Position = 'forward' | 'center' | 'defenseman' | 'goalie';

export type AwardId =
  | 'hattrick' | 'goalKing' | 'pointKing' | 'twoWay' | 'plusGame' | 'cleanSheet'
  | 'playmaker' | 'sniper' | 'faceoffKing' | 'deker' | 'hunter' | 'homework'
  | 'tackler' | 'boardWorker' | 'tightBack'
  | 'wall' | 'boardKing' | 'doorman' | 'iceman' | 'builder' | 'pointBack'
  | 'goalBack' | 'engine' | 'blueliner' | 'forwardBack'
  | 'saveMachine' | 'miracle' | 'shutout' | 'calm' | 'thirdD' | 'goalieAssist';

export const DEFENSIVE_ACTIONS = [
  'Tackle',
  'Blocked Shot',
  'Forecheck Puck Recovery',
  'Backcheck Puck Recovery',
  'Wins Board Battle',
  'Poke Check',
  'Denies Entry (Gap Control)',
  'Low Slot Coverage',
  'Covers the Point',
  'Supports Defenseman Down Low',
  'Third Man High Coverage',
];

interface Ctx {
  n: (name: string) => number;
  positives: number;
  negatives: number;
  defensive: number;
  /** Aktioner som varken är positiva eller negativa i mallen (äldre/egna). */
  unknown: number;
}

interface AwardDef {
  id: AwardId;
  ring: Ring;
  positions: Position[];
  /** Högre = ovanligare; den högsta vinner när flera är uppfyllda. */
  priority: number;
  test: (c: Ctx) => boolean;
}

const FORWARDS: Position[] = ['forward', 'center'];
const SKATER: Position[] = ['forward', 'center', 'defenseman'];
const ALL: Position[] = ['forward', 'center', 'defenseman', 'goalie'];

export const AWARDS: AwardDef[] = [
  // Alla utespelare
  { id: 'hattrick', ring: 'fire', positions: SKATER, priority: 100, test: (c) => c.n('Goal') >= 3 },
  { id: 'goalKing', ring: 'fire', positions: SKATER, priority: 90, test: (c) => c.n('Goal') >= 2 },
  { id: 'pointKing', ring: 'fire', positions: SKATER, priority: 85, test: (c) => c.n('Goal') + c.n('Assist') >= 3 },
  { id: 'twoWay', ring: 'wind', positions: SKATER, priority: 60, test: (c) => c.n('Goal') + c.n('Assist') >= 1 && c.defensive >= 8 },
  { id: 'plusGame', ring: 'wind', positions: SKATER, priority: 50, test: (c) => c.n('On Ice For Goal (FOR)') >= 2 && c.n('On Ice For Goal (AGAINST)') === 0 },
  { id: 'cleanSheet', ring: 'void', positions: ALL, priority: 40, test: (c) => c.positives >= 5 && c.negatives === 0 && c.unknown === 0 },

  // Forward
  { id: 'playmaker', ring: 'water', positions: FORWARDS, priority: 75, test: (c) => c.n('Assist') >= 3 },
  { id: 'sniper', ring: 'fire', positions: FORWARDS, priority: 74, test: (c) => c.n('Shot on Goal') >= 5 },
  { id: 'faceoffKing', ring: 'earth', positions: FORWARDS, priority: 55, test: (c) => {
    const wins = c.n('Faceoff Win') + c.n('Faceoff Win (Defensive Zone)') + c.n('Faceoff Win (Offensive Zone)');
    const losses = c.n('Faceoff Loss') + c.n('Faceoff Loss (Defensive Zone)');
    return wins >= 5 && wins > losses;
  } },
  { id: 'deker', ring: 'water', positions: FORWARDS, priority: 58, test: (c) => c.n('Successful Deke') >= 3 },
  { id: 'hunter', ring: 'wind', positions: FORWARDS, priority: 56, test: (c) => c.n('Forecheck Puck Recovery') >= 3 },
  { id: 'homework', ring: 'wind', positions: FORWARDS, priority: 54, test: (c) => c.n('Backcheck Puck Recovery') >= 3 },
  { id: 'tackler', ring: 'earth', positions: FORWARDS, priority: 52, test: (c) => c.n('Tackle') >= 5 },
  { id: 'boardWorker', ring: 'earth', positions: FORWARDS, priority: 53, test: (c) => c.n('Wins Board Battle') >= 5 },
  { id: 'tightBack', ring: 'void', positions: FORWARDS, priority: 45, test: (c) => c.defensive >= 3 && c.n('On Ice For Goal (AGAINST)') === 0 },

  // Back
  { id: 'goalBack', ring: 'fire', positions: ['defenseman'], priority: 88, test: (c) => c.n('Goal') >= 1 },
  { id: 'pointBack', ring: 'fire', positions: ['defenseman'], priority: 80, test: (c) => c.n('Goal') + c.n('Assist') >= 2 },
  { id: 'wall', ring: 'earth', positions: ['defenseman'], priority: 72, test: (c) => c.n('Blocked Shot') >= 4 },
  { id: 'doorman', ring: 'earth', positions: ['defenseman'], priority: 70, test: (c) => c.n('Denies Entry (Gap Control)') >= 4 },
  { id: 'iceman', ring: 'void', positions: ['defenseman'], priority: 68, test: (c) => c.n('Solves Pressured Situation') >= 3 && c.n('Panic Turnover / Throwaway') === 0 },
  { id: 'boardKing', ring: 'earth', positions: ['defenseman'], priority: 66, test: (c) => c.n('Wins Board Battle') >= 5 },
  { id: 'blueliner', ring: 'fire', positions: ['defenseman'], priority: 64, test: (c) => c.n('Shot on Goal') >= 5 },
  { id: 'engine', ring: 'water', positions: ['defenseman'], priority: 62, test: (c) => c.n('Controlled Zone Entry') >= 4 },
  { id: 'builder', ring: 'water', positions: ['defenseman'], priority: 57, test: (c) => c.n('Successful Pass') >= 10 && c.n('Failed Pass') <= 1 },
  { id: 'forwardBack', ring: 'wind', positions: ['defenseman'], priority: 48, test: (c) => c.n('On Ice For Goal (FOR)') >= 3 && c.n('On Ice For Goal (AGAINST)') === 0 },

  // Målvakt
  { id: 'shutout', ring: 'void', positions: ['goalie'], priority: 95, test: (c) => c.n('Shutout (Period)') >= 3 },
  { id: 'goalieAssist', ring: 'water', positions: ['goalie'], priority: 84, test: (c) => c.n('Assist') >= 1 },
  { id: 'miracle', ring: 'earth', positions: ['goalie'], priority: 66, test: (c) => c.n('Difficult Save') >= 3 },
  { id: 'saveMachine', ring: 'earth', positions: ['goalie'], priority: 64, test: (c) => c.n('Save') >= 10 },
  { id: 'calm', ring: 'void', positions: ['goalie'], priority: 58, test: (c) => c.n('Controlled Rebound') >= 5 && c.n('Bad Rebound') === 0 },
  { id: 'thirdD', ring: 'water', positions: ['goalie'], priority: 56, test: (c) => c.n('Successful Puck Play') >= 3 && c.n('Failed Puck Play') === 0 },
];

export const RINGS: Ring[] = ['fire', 'water', 'earth', 'wind', 'void'];

/** Mallens aktionsnamn (engelska), uppdelade efter om de ger plus eller minus. */
export interface TemplateNames {
  negative: ReadonlySet<string>;
  positive: ReadonlySet<string>;
}

// Äldre matcher kan ha sparat aktionen under hela namnobjektet som JSON
// ('{"sv":"…","en":"Failed Pass"}') i stället för bara det engelska namnet.
function normalizeCounts(counts: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts)) {
    let name = key;
    if (key.startsWith('{')) {
      try {
        const parsed = JSON.parse(key);
        name = parsed.en || parsed.sv || key;
      } catch { /* behåll nyckeln som den är */ }
    }
    out[name] = (out[name] ?? 0) + (Number(value) || 0);
  }
  return out;
}

export function isPosition(template: string | undefined): template is Position {
  return template === 'forward' || template === 'center' || template === 'defenseman' || template === 'goalie';
}

export function awardsForPosition(position: Position): AwardDef[] {
  return AWARDS.filter((a) => a.positions.includes(position));
}

/**
 * Alla utmärkelser en match kvalificerar för, ovanligast först. `counts` är
 * matchens sparade antal per ENGELSKT aktionsnamn. `names` är mallens positiva
 * och negativa aktioner — utan dem går "rent bord" inte att avgöra, och en
 * aktion som mallen inte känner igen räknas som okänd i stället för som bra.
 */
export function awardsForGame(
  position: Position,
  rawCounts: Record<string, number>,
  names: TemplateNames,
): AwardId[] {
  const counts = normalizeCounts(rawCounts);
  let positives = 0;
  let negatives = 0;
  let defensive = 0;
  let unknown = 0;
  for (const [name, count] of Object.entries(counts)) {
    if (!(count > 0)) continue;
    if (names.negative.has(name)) negatives += count;
    else if (names.positive.has(name)) positives += count;
    else unknown += count;
    if (DEFENSIVE_ACTIONS.includes(name)) defensive += count;
  }
  const ctx: Ctx = { n: (name) => counts[name] || 0, positives, negatives, defensive, unknown };

  return awardsForPosition(position)
    .filter((a) => a.test(ctx))
    .sort((a, b) => b.priority - a.priority)
    .map((a) => a.id);
}

/** Den enda utmärkelse matchen får, eller null. */
export function topAward(
  position: Position,
  counts: Record<string, number>,
  names: TemplateNames,
): AwardId | null {
  return awardsForGame(position, counts, names)[0] ?? null;
}

/**
 * Hur många gånger varje utmärkelse delats ut över hela historiken. Räknar
 * bara den ENDA utmärkelse varje match fick (samma som matchen visade), så
 * hyllan och resultatskärmen aldrig säger emot varandra.
 */
export function earnedAwards(
  games: { template?: string; counts?: Record<string, number> }[],
  namesFor: (position: Position) => TemplateNames,
): Partial<Record<AwardId, number>> {
  const earned: Partial<Record<AwardId, number>> = {};
  for (const g of games) {
    if (!isPosition(g.template) || !g.counts) continue;
    const id = topAward(g.template, g.counts, namesFor(g.template));
    if (id) earned[id] = (earned[id] ?? 0) + 1;
  }
  return earned;
}
