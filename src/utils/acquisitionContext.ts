// Varifrån en besökare kom: avsändarens värdnamn och vilken sida de landade
// på. Kompletterar UTM-parametrarna (helpers.ts) för de många som kommer utan
// några — organisk sökning, delade länkar, direkt.
//
// Samma regler som UTM-fångsten: hålls bara i minnet (inget skrivs till
// enheten, så inget samtycke behövs för att läsa det), första-touch, och töms
// när ett konto skapas. Sparas medvetet grovt: värdnamn och sökväg, aldrig
// fullständig adress eller frågesträng — de kan innehålla personuppgifter.

export interface AcquisitionContext {
  /** Avsändarens värdnamn, t.ex. "google.com" eller "l.instagram.com". */
  referrer?: string;
  /** Sidan besökaren landade på, utan frågesträng, t.ex. "/hockey-tracking-app". */
  landing?: string;
}

const MAX_LANDING_LENGTH = 80;

/** Värdnamnet om avsändaren är en annan sajt, annars null (direkt/intern). */
export function parseReferrerHost(referrer: string, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    const own = ownHost.toLowerCase().replace(/^www\./, '');
    if (!host || host === own || host.endsWith(`.${own}`)) return null;
    return host;
  } catch {
    return null;
  }
}

export function cleanLandingPath(pathname: string): string | undefined {
  if (!pathname) return undefined;
  const path = pathname.split(/[?#]/)[0];
  return path.slice(0, MAX_LANDING_LENGTH) || undefined;
}

let memoryContext: AcquisitionContext | null = null;

export function captureAcquisitionContext(
  referrer: string = typeof document !== 'undefined' ? document.referrer : '',
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '',
  ownHost: string = typeof window !== 'undefined' ? window.location.hostname : '',
): void {
  if (memoryContext) return;
  const context: AcquisitionContext = {};
  const host = parseReferrerHost(referrer, ownHost);
  if (host) context.referrer = host;
  const landing = cleanLandingPath(pathname);
  if (landing) context.landing = landing;
  memoryContext = context;
}

/** Läses en gång vid kontoskapande och töms sedan. */
export function consumeAcquisitionContext(): AcquisitionContext | null {
  const value = memoryContext;
  memoryContext = null;
  if (!value || (!value.referrer && !value.landing)) return null;
  return value;
}

/** Bara för test: nollställ minnet. */
export function resetAcquisitionContext(): void {
  memoryContext = null;
}
