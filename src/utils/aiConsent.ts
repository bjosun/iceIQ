// Samtycke innan spelardata skickas till AI-coachen. Coachen skickar spelarens
// namn, matchstatistik och poäng till Google (Vertex AI i EU) för att skapa
// svaret. Det gäller uppgifter om barn, så användaren ska först få veta det
// och säga ja. Samtycket sparas per konto och gäller en viss version av
// texten: ändras texten bumpas versionen och man får frågan igen.
import { firestore } from '../services/firestore';

export const AI_CONSENT_VERSION = 'v1';
const key = (uid: string) => `iceiq-ai-consent:${uid}`;

export function hasAiConsent(uid: string): boolean {
  try {
    return localStorage.getItem(key(uid)) === AI_CONSENT_VERSION;
  } catch {
    return false;
  }
}

export async function recordAiConsent(uid: string): Promise<void> {
  try {
    localStorage.setItem(key(uid), AI_CONSENT_VERSION);
  } catch {
    /* blockerad lagring: samtycket gäller då bara den här sessionen */
  }
  // Spåra också på kontot (bästa försök), så det går att visa när och vad som
  // godkänts även om telefonen byts.
  try {
    await firestore.updateUserData(uid, {
      aiConsent: { version: AI_CONSENT_VERSION, at: new Date().toISOString() },
    });
  } catch (err) {
    console.warn('Kunde inte spara AI-samtycke på kontot:', err);
  }
}
