// Anonym räkning av hur lyssnakortet används (se createListenStats i
// functions/listenAudio.js): bara räknare per dag, aldrig token eller namn.
// Eldas av och väntas inte på; ett fel här får aldrig synas eller störa.
import { httpsCallable } from 'firebase/functions';
import { euFunctions } from '../services/firestore';

export type ListenEvent =
  | 'open' | 'play' | 'again' | 'next' | 'finished'
  | 'clip_1_done' | 'clip_2_done' | 'clip_3_done'
  | 'voice_m' | 'voice_f' | 'lang_sv' | 'lang_en'
  | 'cloud_ok' | 'cloud_fallback';

export function logListen(token: string | undefined, event: ListenEvent): void {
  if (!token) return;
  try {
    httpsCallable(euFunctions, 'logListenEvent')({ token, event }).catch(() => {});
  } catch {
    /* mätningen är en bonus */
  }
}
