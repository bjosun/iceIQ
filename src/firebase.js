// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const app = initializeApp(firebaseConfig);
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
