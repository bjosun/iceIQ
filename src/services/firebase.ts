import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
