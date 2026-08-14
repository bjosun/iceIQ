import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

// Lyssnar i realtid på användarens AI-krediter så att alla vyer
// (dashboard-pillen och chatten) visar samma siffra.
//
// Krediterna ligger i två hinkar: månadsransonen (aiCredits), som nollställs
// vid varje periodskifte, och köpta krediter (purchasedCredits), som ligger
// kvar tills de används. Båda exponeras separat så att UI:t kan visa kunden
// att de köpta är orörda — annars ser det ut som att de försvunnit när
// månadsransonen fylls på.
export function useAiCredits() {
  const { user } = useAuth();

  // 3 = gratisplanens månadskrediter; visas tills snapshotten hunnit svara
  const [monthlyCredits, setMonthlyCredits] = useState<number>(
    (user as any)?.aiCredits !== undefined ? (user as any).aiCredits : 3
  );
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'artifacts', 'default-app-id', 'users', user.uid);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const userData = docSnap.data();
      if (userData.aiCredits !== undefined) setMonthlyCredits(userData.aiCredits);
      setPurchasedCredits(userData.purchasedCredits || 0);
    });

    return () => unsubscribe();
  }, [user]);

  return {
    credits: monthlyCredits + purchasedCredits,
    monthlyCredits,
    purchasedCredits,
  };
}
