// Vilken match som senast visades på den här enheten, så spelarlänken kan
// öppna rätt flik och markera att något är nytt. Bara ett matchdatum i
// localStorage — ingenting skickas till servern, inget som identifierar barnet.

export const LINK_VISIT_KEY = 'iceiq-link-lastseen-v1';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function readLastSeenMatch(): string | null {
  try {
    const raw = localStorage.getItem(LINK_VISIT_KEY);
    return raw !== null && ISO_DAY.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeLastSeenMatch(date: string | null): void {
  if (date === null || !ISO_DAY.test(date)) return;
  try {
    localStorage.setItem(LINK_VISIT_KEY, date);
    // eslint-disable-next-line no-empty
  } catch {
  }
}
