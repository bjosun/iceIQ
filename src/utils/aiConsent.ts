// Samtycke innan spelardata skickas till AI-coachen. Coachen skickar spelarens
// namn, matchstatistik och poäng till Google (Vertex AI i EU) för att skapa
// svaret. Det gäller uppgifter om barn, så användaren ska först få veta det
// och säga ja. Samtycket sparas per konto och gäller en viss version av
// texten: ändras texten bumpas versionen och man får frågan igen.
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore, db, getAppId, getPlayersCollectionRef } from '../services/firestore';

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
      aiConsent: { version: AI_CONSENT_VERSION, at: new Date().toISOString(), withdrawnAt: null },
    });
  } catch (err) {
    console.warn('Kunde inte spara AI-samtycke på kontot:', err);
  }
}

// Återkallar samtycket till AI-coachen: inga fler anrop (servern stoppar dem
// också), och på begäran raderas sparade coachsamtal och coachens anteckningar
// om spelarna. Matchloggningen fungerar som förut.
export async function withdrawAiConsent(uid: string, eraseHistory: boolean): Promise<void> {
  try {
    localStorage.removeItem(key(uid));
  } catch {
    /* ignoreras */
  }
  await firestore.updateUserData(uid, {
    aiConsent: { version: AI_CONSENT_VERSION, at: null, withdrawnAt: new Date().toISOString() },
  });
  if (!eraseHistory) return;

  const chats = await getDocs(collection(db, 'artifacts', getAppId(), 'users', uid, 'coachChats'));
  await Promise.all(chats.docs.map((c) => deleteDoc(c.ref)));

  const players = await getDocs(getPlayersCollectionRef(uid));
  await Promise.all(
    players.docs.map((p) => updateDoc(doc(getPlayersCollectionRef(uid), p.id), { coachTimeline: [] }))
  );
}
