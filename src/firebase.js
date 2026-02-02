// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // osv...
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// ISTÄLLET för import.meta.env... använder vi de riktiga strängarna direkt:
const firebaseConfig = {
  apiKey: "AIzaSyDqNv_T3YlD3k68-Xzsj7dE_R0daChru_I",
  authDomain: "squareverse-36179.firebaseapp.com",
  projectId: "squareverse-36179",
  storageBucket: "squareverse-36179.firebasestorage.app",
  messagingSenderId: "478064861646",
  appId: "1:478064861646:web:6a4b8d7351f60dd7668b9f",
  measurementId: "G-79GC01E79W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
const database = getDatabase(app);

// DEVELOPMENT MODE: Prefix all database paths
const isDevelopment = import.meta.env.DEV || window.location.hostname.includes('iceiq-react');

export const safeDatabase = {
  ref: (path) => {
    const safePath = isDevelopment ? `/dev${path}` : path;
    return ref(database, safePath);
  },
  
  // Or use a wrapper function
  getCustomers: () => {
    const path = isDevelopment ? '/dev/customers' : '/customers';
    return get(ref(database, path));
  }
};
