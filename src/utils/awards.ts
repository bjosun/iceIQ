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
// Tröskelvärdena är en första gissning för barnhockey och ska justeras när
// riktiga matcher finns att jämföra mot (se docs/awards-plan.md).

export type Ring = 'fire' | 'water' | 'earth' | 'wind' | 'void';
export type Position = 'forward' | 'defenseman' | 'goalie';

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
];

interface Ctx {
  n: (name: string) => number;
  positives: number;
  negatives: number;
  defensive: number;
}

interface AwardDef {
  id: AwardId;
  ring: Ring;
  positions: Position[];
  /** Högre = ovanligare; den högsta vinner när flera är uppfyllda. */
  priority: number;
  test: (c: Ctx) => boolean;
}

const SKATER: Position[] = ['forward', 'defenseman'];
const ALL: Position[] = ['forward', 'defenseman', 'goalie'];

export const AWARDS: AwardDef[] = [
  // Alla utespelare
  { id: 'hattrick', ring: 'fire', positions: SKATER, priority: 100, test: (c) => c.n('Goal') >= 3 },
  { id: 'goalKing', ring: 'fire', positions: SKATER, priority: 90, test: (c) => c.n('Goal') >= 2 },
  { id: 'pointKing', ring: 'fire', positions: SKATER, priority: 85, test: (c) => c.n('Goal') + c.n('Assist') >= 3 },
  { id: 'twoWay', ring: 'wind', positions: SKATER, priority: 60, test: (c) => c.n('Goal') + c.n('Assist') >= 1 && c.defensive >= 4 },
  { id: 'plusGame', ring: 'wind', positions: SKATER, priority: 50, test: (c) => c.n('On Ice For Goal (FOR)') >= 2 && c.n('On Ice For Goal (AGAINST)') === 0 },
  { id: 'cleanSheet', ring: 'void', positions: ALL, priority: 40, test: (c) => c.positives >= 5 && c.negatives === 0 },

  // Forward
  { id: 'playmaker', ring: 'water', positions: ['forward'], priority: 75, test: (c) => c.n('Assist') >= 3 },
  { id: 'sniper', ring: 'fire', positions: ['forward'], priority: 74, test: (c) => c.n('Shot on Goal') >= 5 },
  { id: 'faceoffKing', ring: 'earth', positions: ['forward'], priority: 55, test: (c) => c.n('Faceoff Win') >= 5 && c.n('Faceoff Win') > c.n('Faceoff Loss') },
  { id: 'deker', ring: 'water', positions: ['forward'], priority: 58, test: (c) => c.n('Successful Deke') >= 3 },
  { id: 'hunter', ring: 'wind', positions: ['forward'], priority: 56, test: (c) => c.n('Forecheck Puck Recovery') >= 3 },
  { id: 'homework', ring: 'wind', positions: ['forward'], priority: 54, test: (c) => c.n('Backcheck Puck Recovery') >= 3 },
  { id: 'tackler', ring: 'earth', positions: ['forward'], priority: 52, test: (c) => c.n('Tackle') >= 4 },
  { id: 'boardWorker', ring: 'earth', positions: ['forward'], priority: 53, test: (c) => c.n('Wins Board Battle') >= 4 },
  { id: 'tightBack', ring: 'void', positions: ['forward'], priority: 45, test: (c) => c.defensive >= 3 && c.n('On Ice For Goal (AGAINST)') === 0 },

  // Back
  { id: 'goalBack', ring: 'fire', positions: ['defenseman'], priority: 88, test: (c) => c.n('Goal') >= 1 },
  { id: 'pointBack', ring: 'fire', positions: ['defenseman'], priority: 80, test: (c) => c.n('Goal') + c.n('Assist') >= 2 },
  { id: 'wall', ring: 'earth', positions: ['defenseman'], priority: 72, test: (c) => c.n('Blocked Shot') >= 4 },
  { id: 'doorman', ring: 'earth', positions: ['defenseman'], priority: 70, test: (c) => c.n('Denies Entry (Gap Control)') >= 3 },
  { id: 'iceman', ring: 'void', positions: ['defenseman'], priority: 68, test: (c) => c.n('Solves Pressured Situation') >= 2 && c.n('Panic Turnover / Throwaway') === 0 },
  { id: 'boardKing', ring: 'earth', positions: ['defenseman'], priority: 66, test: (c) => c.n('Wins Board Battle') >= 4 },
  { id: 'blueliner', ring: 'fire', positions: ['defenseman'], priority: 64, test: (c) => c.n('Shot on Goal') >= 4 },
  { id: 'engine', ring: 'water', positions: ['defenseman'], priority: 62, test: (c) => c.n('Controlled Zone Entry') >= 3 },
  { id: 'builder', ring: 'water', positions: ['defenseman'], priority: 57, test: (c) => c.n('Successful Pass') >= 6 && c.n('Failed Pass') <= 1 },
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

export function isPosition(template: string | undefined): template is Position {
  return template === 'forward' || template === 'defenseman' || template === 'goalie';
}

export function awardsForPosition(position: Position): AwardDef[] {
  return AWARDS.filter((a) => a.positions.includes(position));
}

/**
 * Alla utmärkelser en match kvalificerar för, ovanligast först. `counts` är
 * matchens sparade antal per ENGELSKT aktionsnamn. `negativeNames` är
 * mallens negativa aktioner — utan dem går "rent bord" inte att avgöra, så
 * anroparen måste ange dem.
 */
export function awardsForGame(
  position: Position,
  counts: Record<string, number>,
  negativeNames: ReadonlySet<string>,
): AwardId[] {
  let positives = 0;
  let negatives = 0;
  let defensive = 0;
  for (const [name, count] of Object.entries(counts)) {
    if (!(count > 0)) continue;
    if (negativeNames.has(name)) negatives += count;
    else positives += count;
    if (DEFENSIVE_ACTIONS.includes(name)) defensive += count;
  }
  const ctx: Ctx = { n: (name) => counts[name] || 0, positives, negatives, defensive };

  return awardsForPosition(position)
    .filter((a) => a.test(ctx))
    .sort((a, b) => b.priority - a.priority)
    .map((a) => a.id);
}

/** Den enda utmärkelse matchen får, eller null. */
export function topAward(
  position: Position,
  counts: Record<string, number>,
  negativeNames: ReadonlySet<string>,
): AwardId | null {
  return awardsForGame(position, counts, negativeNames)[0] ?? null;
}

/**
 * Hur många gånger varje utmärkelse delats ut över hela historiken. Räknar
 * bara den ENDA utmärkelse varje match fick (samma som matchen visade), så
 * hyllan och resultatskärmen aldrig säger emot varandra.
 */
export function earnedAwards(
  games: { template?: string; counts?: Record<string, number> }[],
  negativesFor: (position: Position) => ReadonlySet<string>,
): Partial<Record<AwardId, number>> {
  const earned: Partial<Record<AwardId, number>> = {};
  for (const g of games) {
    if (!isPosition(g.template) || !g.counts) continue;
    const id = topAward(g.template, g.counts, negativesFor(g.template));
    if (id) earned[id] = (earned[id] ?? 0) + 1;
  }
  return earned;
}
