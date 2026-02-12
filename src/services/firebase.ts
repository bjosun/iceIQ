import { initializeApp } from 'firebase/app';
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
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDqNv_T3YlD3k68-Xzsj7dE_R0daChru_I",
  authDomain: "squareverse-36179.firebaseapp.com",
  projectId: "squareverse-36179",
  storageBucket: "squareverse-36179.firebasestorage.app",
  messagingSenderId: "478064861646",
  appId: "1:478064861646:web:6a4b8d7351f60dd7668b9f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

// --- HELPERS ---
export const getAppId = () => 'default-app-id';

export const getUserDocRef = (userId: string) => 
  doc(db, "artifacts", getAppId(), "users", userId);

export const getPlayersCollectionRef = (userId: string) =>
  collection(db, "artifacts", getAppId(), "users", userId, "players");

export const getGamesCollectionRef = (userId: string, playerName: string) =>
  collection(db, "artifacts", getAppId(), "users", userId, "players", playerName, "games");

// --- CLOUD FUNCTIONS ---
export const createStripeCheckoutSession = httpsCallable(functions, 'createStripeCheckoutSession');
export const createStripePortalSession = httpsCallable(functions, 'createStripePortalSession');
export const deleteUserStripeAccount = httpsCallable(functions, 'deleteUserStripeAccount');

// --- FIRESTORE OPERATIONS ---
export const firestore = {
  // User operations
  async getUserData(userId: string) {
    const userDoc = await getDoc(getUserDocRef(userId));
    return userDoc.exists() ? userDoc.data() : null;
  },

  async updateUserData(userId: string, data: any) {
    await setDoc(getUserDocRef(userId), data, { merge: true });
  },

  // Player operations
  async getPlayers(userId: string) {
    const snapshot = await getDocs(getPlayersCollectionRef(userId));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },

  async savePlayer(userId: string, playerName: string, data: any) {
    const playerRef = doc(db, "artifacts", getAppId(), "users", userId, "players", playerName);
    await setDoc(playerRef, { name: playerName, ...data, lastUpdated: new Date().toISOString() }, { merge: true });
  },

  async deletePlayer(userId: string, playerName: string) {
    const playerRef = doc(db, "artifacts", getAppId(), "users", userId, "players", playerName);
    await deleteDoc(playerRef);
  },

  // Game operations
  async saveGame(userId: string, playerName: string, gameData: any) {
    const gamesRef = getGamesCollectionRef(userId, playerName);
    const gameRef = doc(gamesRef);
    await setDoc(gameRef, {
      ...gameData,
      createdAt: new Date().toISOString(),
      id: gameRef.id
    });
  },

  async deleteGame(userId: string, playerName: string, gameId: string) {
    const gameRef = doc(db, "artifacts", getAppId(), "users", userId, "players", playerName, "games", gameId);
    await deleteDoc(gameRef);
  },

  async getGames(userId: string, playerName: string, limitCount?: number) {
    const gamesRef = getGamesCollectionRef(userId, playerName);
    let q = query(gamesRef, orderBy("date", "desc"));
    if (limitCount) q = query(q, limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },

  // Template operations
  async saveTemplate(userId: string, templateKey: string, templateData: any) {
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

  async deleteTemplate(userId: string, templateKey: string) {
    const userRef = getUserDocRef(userId);
    const userData = await getDoc(userRef);
    if (!userData.exists()) return;

    const currentTemplates = userData.data()?.customTemplates || {};
    delete currentTemplates[templateKey];
    
    await updateDoc(userRef, {
      customTemplates: currentTemplates,
      lastUpdated: new Date().toISOString()
    });
  },

  // Cleanup operations
  async deleteUserRoot(userId: string) {
    const userDocRef = getUserDocRef(userId);
    await deleteDoc(userDocRef);
  },

  // Stats operations
  async getUserStats(userId: string) {
    const players = await this.getPlayers(userId);
    let totalMatches = 0;
    
    for (const player of players) {
      const games = await this.getGames(userId, player.name, 1000); 
      totalMatches += games.length;
    }
    
    return {
      playerCount: players.length,
      totalMatches
    };
  }
};