// Hämtar färdigt ljud för ett klipp från getListenAudio (Googles text-till-tal
// i EU). Returnerar blob-URL:er (en per mening), eller null med en felkod om det
// av något skäl inte går — då använder sidan telefonens egen röst i stället, så
// att ett saknat/otillgängligt moln aldrig tystar klippen.
import { httpsCallable } from 'firebase/functions';
import { euFunctions } from '../services/firestore';

function base64ToUrl(b64: string): string {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
}

export type VoiceGender = 'f' | 'm';

export interface ClipAudioResult {
  urls: string[] | null;
  /** Kort felkod när urls är null (visas i testläget på kortet). */
  error?: string;
}

export async function fetchClipAudio(
  token: string,
  lang: string,
  sentences: string[],
  voice: VoiceGender
): Promise<ClipAudioResult> {
  try {
    const call = httpsCallable<
      { token: string; lang: string; sentences: string[]; voice: VoiceGender },
      { audio: string[] }
    >(euFunctions, 'getListenAudio');
    const res = await call({ token, lang, sentences, voice });
    const audio = res.data?.audio;
    if (!Array.isArray(audio) || audio.length !== sentences.length) {
      return { urls: null, error: 'bad-response' };
    }
    return { urls: audio.map(base64ToUrl) };
  } catch (err: any) {
    return { urls: null, error: String(err?.code || err?.message || 'error').replace('functions/', '').slice(0, 40) };
  }
}
