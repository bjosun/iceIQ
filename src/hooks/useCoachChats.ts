import { useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface CoachChatMessage {
  role: 'ai' | 'user';
  text: string;
  /**
   * Coachens delbara en-radare för det här svaret (se shareHighlight i
   * askCoach). Utelämnas helt när den saknas — Firestore avvisar
   * undefined som fältvärde, så den får aldrig sättas till undefined.
   */
  highlight?: string;
  /**
   * Fasta nyckelord (se FOCUS_TAGS i functions/index.js) som pekar ut om
   * något i rutinbiblioteket är relevant för det här svaret — t.ex.
   * fokus_press för andningsövningen. Tom lista/utelämnat är det vanliga.
   */
  focusTags?: string[];
}

export interface CoachChat {
  id: string;
  playerName: string;
  messages: CoachChatMessage[];
  updatedAt: Timestamp | null;
}

// Coach-chattar sparas i Firestore (per användare) så att en konversation
// överlever omladdning, följer med mellan enheter och kan öppnas igen
// från historiklistan.
export function useCoachChats() {
  const { user } = useAuth();

  const chatsRef = useCallback(() => {
    if (!user) throw new Error('Not logged in');
    return collection(db, 'artifacts', 'default-app-id', 'users', user.uid, 'coachChats');
  }, [user]);

  const listChats = useCallback(async (max = 20): Promise<CoachChat[]> => {
    if (!user) return [];
    const snap = await getDocs(query(chatsRef(), orderBy('updatedAt', 'desc'), limit(max)));
    return snap.docs.map((d) => ({
      id: d.id,
      playerName: d.data().playerName || '',
      messages: d.data().messages || [],
      updatedAt: d.data().updatedAt || null,
    }));
  }, [user, chatsRef]);

  // Skapar en ny chatt (chatId = null) eller uppdaterar en befintlig.
  // Returnerar chattens id.
  const saveChat = useCallback(async (
    chatId: string | null,
    playerName: string,
    messages: CoachChatMessage[]
  ): Promise<string> => {
    if (!user) throw new Error('Not logged in');
    if (chatId) {
      await updateDoc(doc(chatsRef(), chatId), { messages, updatedAt: serverTimestamp() });
      return chatId;
    }
    const created = await addDoc(chatsRef(), {
      playerName,
      messages,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return created.id;
  }, [user, chatsRef]);

  const deleteChat = useCallback(async (chatId: string): Promise<void> => {
    if (!user) return;
    await deleteDoc(doc(chatsRef(), chatId));
  }, [user, chatsRef]);

  return { listChats, saveChat, deleteChat };
}
