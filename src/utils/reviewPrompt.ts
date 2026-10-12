// Ber om betyg i App Store med Apples egen ruta, men bara vid ett bra tillfälle:
// efter en sparad match som gick bra eller gav ett märke, efter minst tre
// loggade matcher, och högst en gång per fyra månader. Apple begränsar dessutom
// själv hur ofta rutan faktiskt visas (högst tre gånger per år), så ett "ja"
// här betyder inte att rutan alltid syns.
import { isNativeApp } from './platform';

const KEY = 'iceiq-review-asked-at';
const MIN_GAMES = 3;
const MIN_GAP_MS = 120 * 24 * 60 * 60 * 1000;

export async function maybeAskForReview(games: number, positiveMoment: boolean): Promise<void> {
  if (!isNativeApp || !positiveMoment || games < MIN_GAMES) return;
  try {
    const last = Number(localStorage.getItem(KEY) || 0);
    if (last && Date.now() - last < MIN_GAP_MS) return;
    localStorage.setItem(KEY, String(Date.now()));
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch {
    /* ett betygsförfrågan är en bonus och får aldrig synas som fel */
  }
}
