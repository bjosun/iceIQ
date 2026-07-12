import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

// Lyssnar i realtid på användarens AI-krediter så att alla vyer
// (dashboard-pillen och chatten) visar samma siffra.
export function useAiCredits() {
  const { user } = useAuth();

  // 3 = gratisplanens månadskrediter; visas tills snapshotten hunnit svara
  const [credits, setCredits] = useState<number>(
    (user as any)?.aiCredits !== undefined ? (user as any).aiCredits : 3
  );

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'artifacts', 'default-app-id', 'users', user.uid);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.aiCredits !== undefined) {
          setCredits(userData.aiCredits);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  return { credits, setCredits };
}
