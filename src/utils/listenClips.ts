// Bygger lyssnaklippen på spelarens länk. NOLL AI-anrop: klippen sätts ihop av
// det som redan finns sparat (poäng per match, och coachens korta
// "det som gick bra" / "att tänka på" från det senaste coachsvaret). Det gör
// dem gratis, förutsägbara och säkra för barn — inget fritt AI-svar går
// direkt till barnet.
//
// Texterna är skrivna på talspråk (korta meningar, spelas upp med små pauser)
// och jämför bara med spelarens eget snitt, aldrig med andra.
import { newBadges } from './badges';
import { speakable } from './speakable';

export interface ListenClip {
  id: 'match' | 'good' | 'think';
  /** Meningarna spelas upp en i taget. */
  sentences: string[];
}

interface BuildInput {
  playerName: string;
  games: { date: string; points: number }[];
  coachHighlight?: string | null;
  coachThink?: string | null;
  /** Coachens TALADE manus (2–4 korta meningar). Den långa analystexten läses aldrig upp. */
  coachSpoken?: string[] | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Språk för uppläsningen ('sv' eller 'en'). */
  lang?: string;
}

const firstWord = (name: string) => name.trim().split(/\s+/)[0] || name;

// Antal varianter per fras (listen.match1..N osv). Varianten väljs av matchens
// poäng och antal, så samma match låter likadant varje gång men olika matcher
// inte upprepar sig ord för ord.
const VARIANTS = 3;
const variant = (seed: number) => (Math.abs(Math.round(seed)) % VARIANTS) + 1;

export function buildListenClips({ playerName, games, coachHighlight, coachThink, coachSpoken, t, lang = 'sv' }: BuildInput): ListenClip[] {
  if (games.length === 0) return [];

  const name = firstWord(playerName);
  const last = games[games.length - 1];
  const previous = games.slice(0, -1).map((g) => g.points || 0);
  const clips: ListenClip[] = [];
  const seed = last.points + games.length;
  const say = (text: string) => speakable(text, lang);

  // 1. Matchen: poängen, och hur den ligger mot spelarens eget snitt.
  const match: string[] = [t(`listen.match${variant(seed)}`, { name, points: last.points })];
  if (previous.length === 0) {
    match.push(t('listen.firstGame'));
  } else if (previous.length >= 2) {
    const avg = previous.reduce((a, b) => a + b, 0) / previous.length;
    const diff = Math.round(last.points - avg);
    if (diff > 0) match.push(t(`listen.above${variant(seed + 1)}`, { n: diff }));
    else if (diff < 0) match.push(t(`listen.below${variant(seed + 1)}`));
    else match.push(t('listen.same'));
  }
  clips.push({ id: 'match', sentences: match.map(say) });

  // 2a. Coachens talade manus: skrivet av coachen för att läsas upp, i samma
  //     svar som analysen. Finns det används det i stället för raderna nedan.
  const spoken = (coachSpoken ?? []).filter((x) => typeof x === 'string' && x.trim());
  if (spoken.length > 0) {
    clips.push({ id: 'good', sentences: spoken.map(say) });
    return clips;
  }

  // 2b. Annars: coachens egen rad om den finns, annars ett märke eller
  //     antalet loggade matcher. Aldrig något påhittat.
  const good: string[] = [];
  if (coachHighlight) {
    good.push(t('listen.goodIntro'), coachHighlight);
  } else {
    const badges = newBadges(previous, last.points);
    if (badges.length > 0) {
      good.push(t('listen.badge', { badge: t(`badges.${badges[0]}.name`) }));
    } else if (games.length >= 3) {
      good.push(t('listen.keepGoing', { count: games.length }));
    }
  }
  if (good.length > 0) clips.push({ id: 'good', sentences: good.map(say) });

  // 3. Att tänka på: bara om coachen har lämnat en rad om det.
  if (coachThink) {
    clips.push({ id: 'think', sentences: [t('listen.thinkIntro'), coachThink].map(say) });
  }

  return clips;
}
