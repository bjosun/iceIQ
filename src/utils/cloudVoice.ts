// Hämtar färdigt ljud för ett klipp från getListenAudio (Googles text-till-tal
// i EU). Returnerar blob-URL:er (en per mening) eller null om det av något skäl
// inte går — då använder sidan telefonens egen röst i stället, så att ett
// saknat/otillgängligt moln aldrig tystar klippen.
import { httpsCallable } from 'firebase/functions';
import { euFunctions } from '../services/firestore';

function base64ToUrl(b64: string): string {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
}

export async function fetchClipAudio(
  token: string,
  lang: string,
  sentences: string[]
): Promise<string[] | null> {
  try {
    const call = httpsCallable<
      { token: string; lang: string; sentences: string[] },
      { audio: string[] }
    >(euFunctions, 'getListenAudio');
    const res = await call({ token, lang, sentences });
    const audio = res.data?.audio;
    if (!Array.isArray(audio) || audio.length !== sentences.length) return null;
    return audio.map(base64ToUrl);
  } catch {
    return null;
  }
}
