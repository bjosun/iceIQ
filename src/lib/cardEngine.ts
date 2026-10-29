import type { Card, CardProgress } from './cardTypes.ts';

interface PassGroup {
  pass: string;
  track: string;
  level: number;
  cards: Card[];
}

function groupIntoPasses(cards: readonly Card[]): PassGroup[] {
  const seenIds = new Set<string>();
  const groups = new Map<string, Card[]>();
  for (const card of cards) {
    if (card.status !== 'approved') continue;
    if (card.surface !== 'link' && card.surface !== 'both') continue;
    if (seenIds.has(card.id)) continue;
    seenIds.add(card.id);
    const list = groups.get(card.pass) ?? [];
    list.push(card);
    groups.set(card.pass, list);
  }
  const result: PassGroup[] = [];
  for (const [pass, list] of groups) {
    if (list.length < 3 || list.length > 4) continue;
    const sorted = [...list].sort((a, b) => a.order - b.order);
    if (!sorted.every((c, i) => c.order === i + 1)) continue;
    result.push({ pass, track: sorted[0].track, level: sorted[0].level, cards: sorted });
  }
  return result;
}

export interface PickOptions {
  /**
   * Spår som föräldern/coachen föreslagit (kommer från servern, se
   * suggestedTrack i getPlayerLinkData). Gäller bara så länge spåret har ett
   * pass med osedda kort: är det slut faller valet tillbaka på den vanliga
   * ordningen, så ett tips aldrig fastnar i en repris.
   */
  focusTrack?: string | null;
}

export function pickNextPass(
  cards: readonly Card[],
  progress: CardProgress,
  options: PickOptions = {},
): Card[] {
  const seen = progress.seen;
  const hasSeen = (id: string) => Object.prototype.hasOwnProperty.call(seen, id);

  const groups = groupIntoPasses(cards).filter((g) =>
    g.cards.every((c) => (c.requires ?? []).every((req) => hasSeen(req))),
  );
  if (!groups.length) return [];

  const eligible = groups.flatMap((g) => g.cards);
  const hasAnySeen = eligible.some((c) => hasSeen(c.id));
  let currentTrack: string | null = null;
  if (hasAnySeen) {
    let best = '';
    for (const card of eligible) {
      const ts = hasSeen(card.id) ? seen[card.id] : undefined;
      if (ts !== undefined && ts > best) {
        best = ts;
        currentTrack = card.track;
      }
    }
  }

  const withUnseen = groups.filter((g) => g.cards.some((c) => !hasSeen(c.id)));

  const focusTrack = options.focusTrack ?? null;
  const suggested = focusTrack !== null && withUnseen.some((g) => g.track === focusTrack);
  const defaultTrack = currentTrack ?? (groups.some((g) => g.track === 'routine') ? 'routine' : null);
  const preferredTrack = suggested ? focusTrack : defaultTrack;

  if (withUnseen.length) {
    const ranked = [...withUnseen].sort((a, b) => {
      const aPref = preferredTrack !== null && a.track === preferredTrack ? 0 : 1;
      const bPref = preferredTrack !== null && b.track === preferredTrack ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
      if (a.track !== b.track) return a.track.localeCompare(b.track);
      if (a.level !== b.level) return a.level - b.level;
      return a.pass.localeCompare(b.pass);
    });
    return [...ranked[0].cards];
  }

  const fullySeen = groups.filter((g) => g.cards.every((c) => hasSeen(c.id)));
  if (!fullySeen.length) return [];
  const ranked = [...fullySeen].sort((a, b) => {
    const aTs = Math.max(...a.cards.map((c) => Date.parse(seen[c.id])));
    const bTs = Math.max(...b.cards.map((c) => Date.parse(seen[c.id])));
    return aTs - bTs;
  });
  return [...ranked[0].cards];
}
