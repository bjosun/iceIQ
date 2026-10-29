// Förstaparts-besöksmätning mot Squareverse-plattformens publika track-endpoint
// (/webhooks/track/{company} → analytics_tool → funnel → SEO-veckorapporten).
// Samma modell som company_template: ingen cookie, inget fingeravtryck, slumpad
// sessions-UUID per flik, värdnamn och sökväg — aldrig fullständiga adresser
// eller frågesträngar (de kan innehålla personuppgifter).
//
// Det är enda sättet att se direkttrafik och AI-referrals (chatgpt.com,
// perplexity.ai, …) — Search Console räknar bara Google-klick.
//
// Rutter som aldrig mäts: spelarlänken /p/ (läs-bar, inga nätverksanrop får
// läggas till i rutinflödet), de inloggade app-vyerna och interna labbet.
// Alla fel sväljs — mätning får aldrig störa appen.

import { parseReferrerHost } from './acquisitionContext.ts';
import { peekUtmParams } from './helpers.ts';

const COMPANY_ID = 'iceiq';
const TRACK_URL = `https://api.squareversegroup.com/webhooks/track/${COMPANY_ID}`;

const EXCLUDED_PREFIXES = ['/p/', '/dashboard', '/match', '/voice-lab'];

export function isTrackablePath(pathname: string): boolean {
  const path = String(pathname || '').split(/[?#]/)[0];
  return !!path && !EXCLUDED_PREFIXES.some((p) => path.startsWith(p));
}

let sessionId: string | null = null;
let sessionReferrer: string | null | undefined; // undefined = inte undersökt ännu

function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem('sv_tid');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('sv_tid', sessionId);
    }
  } catch {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

// Avsändarens värdnamn fångas en gång per flik — document.referrer är den
// externa avsändaren på landningen (chatgpt.com, google.com, …); SPA-navigering
// ändrar den inte, så den följer med hela sessionens sidvisningar.
function getReferrer(): string | null {
  if (sessionReferrer !== undefined) return sessionReferrer;
  try {
    sessionReferrer = parseReferrerHost(document.referrer, window.location.hostname);
  } catch {
    sessionReferrer = null;
  }
  return sessionReferrer;
}

function buildProps(pathname: string): Record<string, string> {
  const props: Record<string, string> = {
    path: String(pathname).split(/[?#]/)[0].slice(0, 64),
  };
  const ref = getReferrer();
  if (ref) props.ref = ref.slice(0, 64);
  // UTM hålls i minnet (ingen lagring) av helpers.ts — peekar, konsumerar inte:
  // ett besöks-event får inte stjäla attributionen från kontoskapandet.
  const utm = peekUtmParams();
  if (utm) {
    for (const key of ['source', 'medium', 'campaign', 'content'] as const) {
      const v = String(utm[key] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
      if (v) props[`utm_${key}`] = v;
    }
  }
  return props;
}

export function trackPageView(pathname: string): void {
  try {
    if (!isTrackablePath(pathname)) return;
    const body = JSON.stringify({
      event: 'page_view',
      props: buildProps(pathname),
      session_id: getSessionId(),
    });
    // sendBeacon överlever sidnavigering; text/plain håller det till en CORS
    // "simple request" (ingen preflight). Gatewayen parsar ändå JSON.
    const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
    if (navigator.sendBeacon && navigator.sendBeacon(TRACK_URL, blob)) return;
    fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* telemetri får aldrig störa appen */
  }
}

/** Bara för test: nollställ sessionsminnet. */
export function resetTrackForTest(): void {
  sessionId = null;
  sessionReferrer = undefined;
}
