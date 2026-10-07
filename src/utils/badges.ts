// Märken för vana och egen utveckling — aldrig för att vara bättre än någon
// annan. Poängen sätts av föräldrar och är subjektiva, så märkena bygger bara
// på sådant som är sant oavsett vem som räknar: hur många matcher som loggats
// och hur spelaren ligger till jämfört med sig SJÄLV.
//
// Allt räknas ut ur spelarens poänghistorik (äldst -> nyast), så ingen ny
// lagring behövs. Ett märke kan inte tas ifrån någon.

export type BadgeId =
  | 'firstGame'
  | 'games5'
  | 'games10'
  | 'games25'
  | 'games50'
  | 'personalBest'
  | 'threeAboveAverage';

export type BadgeGroup = 'habit' | 'growth';

export const BADGES: { id: BadgeId; group: BadgeGroup }[] = [
  { id: 'firstGame', group: 'habit' },
  { id: 'games5', group: 'habit' },
  { id: 'games10', group: 'habit' },
  { id: 'games25', group: 'habit' },
  { id: 'games50', group: 'habit' },
  { id: 'personalBest', group: 'growth' },
  { id: 'threeAboveAverage', group: 'growth' },
];

const GAME_COUNT_BADGES: Record<number, BadgeId> = {
  1: 'firstGame',
  5: 'games5',
  10: 'games10',
  25: 'games25',
  50: 'games50',
};

// Märken som den NYSS sparade matchen låser upp. previousPoints är matcherna
// FÖRE den, äldst -> nyast.
export function newBadges(previousPoints: number[], points: number): BadgeId[] {
  const earned: BadgeId[] = [];
  const gameNumber = previousPoints.length + 1;

  const countBadge = GAME_COUNT_BADGES[gameNumber];
  if (countBadge) earned.push(countBadge);

  // Personbästa: kräver ett par matcher att slå, annars betyder det inget.
  if (previousPoints.length >= 2 && points > 0 && points > Math.max(...previousPoints)) {
    earned.push('personalBest');
  }

  // Tre matcher i rad över det egna snittet (den här + de två närmast före).
  if (previousPoints.length >= 3 && points > 0) {
    const average = previousPoints.reduce((a, b) => a + b, 0) / previousPoints.length;
    const last = previousPoints[previousPoints.length - 1];
    const beforeLast = previousPoints[previousPoints.length - 2];
    if (points > average && last > average && beforeLast > average) {
      earned.push('threeAboveAverage');
    }
  }

  return earned;
}

// Alla märken spelaren har, och hur många gånger de upprepats. Spelar upp
// historiken match för match.
export function earnedBadges(pointsHistory: number[]): Partial<Record<BadgeId, number>> {
  const counts: Partial<Record<BadgeId, number>> = {};
  for (let i = 0; i < pointsHistory.length; i++) {
    for (const id of newBadges(pointsHistory.slice(0, i), pointsHistory[i])) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }
  return counts;
}
