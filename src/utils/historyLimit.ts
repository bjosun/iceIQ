import { FREE_HISTORY_GAMES } from './constants';

// Gratiskontots synliga historik: de senaste matcherna. Inget raderas — de
// äldre ligger kvar och låses upp när kontot blir betalande.
//
// Gränsen finns bara där ett köpflöde finns (webben). iPhone-appen saknar det,
// och att låsa något man inte kan låsa upp vore en återvändsgränd.
// Gränsen sitter i klienten, som spelargränsen: den styr vad som visas, inte
// vad Firestore släpper ut.
export function limitHistory<T extends { date: string }>(
  games: T[],
  limited: boolean,
): { visible: T[]; lockedCount: number } {
  if (!limited || games.length <= FREE_HISTORY_GAMES) {
    return { visible: games, lockedCount: 0 };
  }
  const newest = [...games]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, FREE_HISTORY_GAMES);
  const keep = new Set(newest);
  return {
    visible: games.filter(g => keep.has(g)), // behåller ursprunglig ordning
    lockedCount: games.length - FREE_HISTORY_GAMES,
  };
}
