// Bygger lyssnaklippen på spelarens länk. NOLL AI-anrop: klippen sätts ihop av
// det som redan finns sparat (poäng per match, och coachens korta
// "det som gick bra" / "att tänka på" från det senaste coachsvaret). Det gör
// dem gratis, förutsägbara och säkra för barn — inget fritt AI-svar går
// direkt till barnet.
//
// Texterna är korta meningar (de spelas upp med mycket små pauser) och
// jämför bara med spelarens eget snitt, aldrig med andra.
import { newBadges } from './badges';

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
  t: (key: string, params?: Record<string, string | number>) => string;
}

const firstWord = (name: string) => name.trim().split(/\s+/)[0] || name;

export function buildListenClips({ playerName, games, coachHighlight, coachThink, t }: BuildInput): ListenClip[] {
  if (games.length === 0) return [];

  const name = firstWord(playerName);
  const last = games[games.length - 1];
  const previous = games.slice(0, -1).map((g) => g.points || 0);
  const clips: ListenClip[] = [];

  // 1. Matchen: poängen, och hur den ligger mot spelarens eget snitt.
  const match: string[] = [t('listen.match', { name, points: last.points })];
  if (previous.length === 0) {
    match.push(t('listen.firstGame'));
  } else if (previous.length >= 2) {
    const avg = previous.reduce((a, b) => a + b, 0) / previous.length;
    const diff = Math.round(last.points - avg);
    if (diff > 0) match.push(t('listen.above', { n: diff }));
    else if (diff < 0) match.push(t('listen.below'));
    else match.push(t('listen.same'));
  }
  clips.push({ id: 'match', sentences: match });

  // 2. Det som gick bra: coachens egen rad om den finns, annars ett märke
  //    eller antalet loggade matcher. Aldrig något påhittat.
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
  if (good.length > 0) clips.push({ id: 'good', sentences: good });

  // 3. Att tänka på: bara om coachen har lämnat en rad om det.
  if (coachThink) {
    clips.push({ id: 'think', sentences: [t('listen.thinkIntro'), coachThink] });
  }

  return clips;
}
