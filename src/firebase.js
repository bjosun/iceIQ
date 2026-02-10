import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import { getDatabase, ref, get } from "firebase/database";
import { getFunctions, httpsCallable } from 'firebase/functions';

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

// Helpers
export const getAppId = () => 'default-app-id';

export const getUserDocRef = (userId) => 
  doc(db, "artifacts", getAppId(), "users", userId);

export const getGamesCollectionRef = (userId, playerName) =>
  collection(db, "artifacts", getAppId(), "users", userId, "players", playerName, "games");

// --- REALTIME DATABASE ---
const isDevelopment = import.meta.env.DEV || window.location.hostname.includes('iceiq-react');

export const safeDatabase = {
  ref: (path) => {
    const safePath = isDevelopment ? `/dev${path}` : path;
    return ref(database, safePath);
  },
  
  getCustomers: async () => {
    const path = isDevelopment ? '/dev/customers' : '/customers';
    return get(ref(database, path));
  }
};

// --- FIRESTORE OPERATIONS ---
export const firestore = {
  // User operations
  async getUserData(userId) {
    const userDoc = await getDoc(getUserDocRef(userId));
    return userDoc.exists() ? userDoc.data() : null;
  },

  async updateUserData(userId, data) {
    await setDoc(getUserDocRef(userId), data, { merge: true });
  },

  // Player operations
  async getPlayers(userId) {
    const playersRef = collection(db, "artifacts", getAppId(), "users", userId, "players");
    const snapshot = await getDocs(playersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async savePlayer(userId, playerName, data) {
    const playerRef = doc(db, "artifacts", getAppId(), "users", userId, "players", playerName);
    await setDoc(playerRef, { name: playerName, ...data, lastUpdated: new Date().toISOString() }, { merge: true });
  },

  async deletePlayer(userId, playerName) {
    const playerRef = doc(db, "artifacts", getAppId(), "users", userId, "players", playerName);
    await deleteDoc(playerRef);
  },

  // Game operations
  async saveGame(userId, playerName, gameData) {
    const gamesRef = getGamesCollectionRef(userId, playerName);
    const gameRef = doc(gamesRef);
    await setDoc(gameRef, {
      ...gameData,
      createdAt: new Date().toISOString(),
      id: gameRef.id
    });
  },

  async getGames(userId, playerName, limitCount) {
    const gamesRef = getGamesCollectionRef(userId, playerName);
    let q = query(gamesRef, orderBy("date", "desc"));
    if (limitCount) q = query(q, limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // NYA FUNKTIONER FÖR RENGÖRING
  async deleteGame(userId, playerName, gameId) {
    const gameRef = doc(db, "artifacts", getAppId(), "users", userId, "players", playerName, "games", gameId);
    await deleteDoc(gameRef);
  },

  async deleteUserRoot(userId) {
    const userDocRef = getUserDocRef(userId);
    await deleteDoc(userDocRef);
  },

  // Template operations
  async saveTemplate(userId, templateKey, templateData) {
    const userRef = getUserDocRef(userId);
    const userData = await getDoc(userRef);
    const currentTemplates = userData.exists() ? userData.data()?.customTemplates || {} : {};
    
    await setDoc(userRef, {
      customTemplates: {
        ...currentTemplates,
        [templateKey]: templateData
      },
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  },

  async deleteTemplate(userId, templateKey) {
    const userRef = getUserDocRef(userId);
    const userData = await getDoc(userRef);
    if (!userData.exists()) return;

    const currentTemplates = userData.data()?.customTemplates || {};
    delete currentTemplates[templateKey];
    
    await updateDoc(userRef, {
      customTemplates: currentTemplates,
      lastUpdated: new Date().toISOString()
    });
  }
};