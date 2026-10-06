import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyDqNv_T3YlD3k68-Xzsj7dE_R0daChru_I",
  authDomain: "squareverse-36179.firebaseapp.com",
  projectId: "squareverse-36179",
  storageBucket: "squareverse-36179.firebasestorage.app",
  messagingSenderId: "478064861646",
  appId: "1:478064861646:web:6a4b8d7351f60dd7668b9f"
};

// Bara app + auth här. Firestore/Functions ligger i services/firestore.ts och
// laddas dynamiskt — annars drar AuthProvider (som alla sidor renderas under,
// inklusive den oautentiserade startsidan) in hela Firestore-SDK:t innan
// appen ens hunnit mounta.
export const app = initializeApp(firebaseConfig);
// getAuth() hänger sig i iOS-skalet (WKWebView) eftersom den väntar på
// popup/redirect-stöd som inte finns där. Inloggningen sker native (se
// AuthContext), så i appen räcker det med persistens i IndexedDB.
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);
export const googleProvider = new GoogleAuthProvider();
