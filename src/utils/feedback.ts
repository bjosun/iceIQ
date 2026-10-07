// Haptik och effekter när man matar in händelser. Byggt för någon som sitter
// vid rinken och trycker många gånger i rad: effekten ska kännas, men aldrig
// bli ett störmoment. Därför dämpas den vid snabba tryck och stängs av med
// en inställning (och av systemets "minska rörelser").
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const PREF_KEY = 'iceiq-effects';
// Poäng från och med den här nivån räknas som en stor händelse (mål = 10).
export const BIG_POINTS = 8;

export type TapKind = 'plus' | 'big' | 'negative' | 'undo';

export function effectsEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setEffectsEnabled(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    /* blockerad lagring: inställningen gäller bara tills sidan laddas om */
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Tidsstämplar för de senaste trycken, för att kunna dämpa vid snabb inmatning.
const recent: number[] = [];
const RAPID_WINDOW_MS = 1500;
const RAPID_COUNT = 4;

// Returnerar true när trycket är en del av en snabb följd (4+ på 1,5 s).
function registerTap(): boolean {
  const now = Date.now();
  recent.push(now);
  while (recent.length && now - recent[0] > RAPID_WINDOW_MS) recent.shift();
  return recent.length >= RAPID_COUNT;
}

// Spelar haptiken och säger om visuella effekter ska visas.
export function tapFeedback(kind: TapKind): { visual: boolean } {
  if (!effectsEnabled()) return { visual: false };
  const rapid = registerTap();
  const visual = !prefersReducedMotion() && (!rapid || kind === 'big');

  // Stora händelser (mål) får alltid full effekt; resten dämpas vid snabb följd.
  if (rapid && kind !== 'big') return { visual };

  try {
    if (Capacitor.isNativePlatform()) {
      if (kind === 'big') Haptics.notification({ type: NotificationType.Success });
      else if (kind === 'negative') Haptics.impact({ style: ImpactStyle.Medium });
      else Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator.vibrate === 'function') {
      // iOS Safari saknar vibrate; Android-webbläsare har den.
      navigator.vibrate(kind === 'big' ? [30, 40, 60] : kind === 'negative' ? 25 : 12);
    }
  } catch {
    /* haptik är en bonus, aldrig ett fel */
  }
  return { visual };
}
