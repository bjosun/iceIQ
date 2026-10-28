import type { Card, CardProgress } from './cardTypes.ts';

export const CARD_PROGRESS_KEY = 'iceiq-card-progress-v1';

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

const isCanonicalISO = (v: unknown): v is string =>
  typeof v === 'string' && ISO_RE.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v;

const empty = (): CardProgress => ({ seen: {}, passes: 0 });

function sanitize(raw: unknown, knownIds: readonly string[]): CardProgress {
  const known = new Set(knownIds);
  const progress = empty();
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return progress;
  const seen = (raw as Record<string, unknown>).seen;
  if (seen !== null && typeof seen === 'object' && !Array.isArray(seen)) {
    for (const key of Object.keys(seen as Record<string, unknown>)) {
      const value = (seen as Record<string, unknown>)[key];
      if (known.has(key) && isCanonicalISO(value)) progress.seen[key] = value;
    }
  }
  const passes = (raw as Record<string, unknown>).passes;
  progress.passes = typeof passes === 'number' && Number.isSafeInteger(passes) && passes >= 0 ? passes : 0;
  return progress;
}

export function readCardProgress(knownIds: readonly string[]): CardProgress {
  try {
    const raw = localStorage.getItem(CARD_PROGRESS_KEY);
    if (raw === null) return empty();
    return sanitize(JSON.parse(raw), knownIds);
  } catch {
    return empty();
  }
}

export function writeCardProgress(progress: CardProgress, knownIds: readonly string[]): void {
  try {
    const clean = sanitize(progress, knownIds);
    localStorage.setItem(CARD_PROGRESS_KEY, JSON.stringify({ seen: clean.seen, passes: clean.passes }));
    // eslint-disable-next-line no-empty
  } catch {
  }
}

export function markPassSeen(
  progress: CardProgress,
  cards: readonly Pick<Card, 'id'>[],
  nowISO: string,
): CardProgress {
  const seen: Record<string, string> = { ...progress.seen };
  for (const card of cards) seen[card.id] = nowISO;
  return { seen, passes: progress.passes + 1 };
}
