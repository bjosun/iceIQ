// TODO: implement firebase service
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

// Database paths helper
export const getAppId = () => import.meta.env.VITE_APP_ID || 'default-app-id';

// User document reference
export const getUserDocRef = (userId: string) => 
  doc(db, "artifacts", getAppId(), "users", userId);

// Player collection reference
export const getPlayersCollectionRef = (userId: string) =>
  collection(db, "artifacts", getAppId(), "users", userId, "players");

// Games collection reference for a player
export const getGamesCollectionRef = (userId: string, playerName: string) =>
  collection(db, "artifacts", getAppId(), "users", userId, "players", playerName, "games");

// Cloud Functions
export const createStripeCheckoutSession = httpsCallable(functions, 'createStripeCheckoutSession');
export const createStripePortalSession = httpsCallable(functions, 'createStripePortalSession');
export const deleteUserData = httpsCallable(functions, 'deleteUserData');

// Database operations
export const firestore = {
  // User operations
  async getUserData(userId: string) {
    const userDoc = await getDoc(getUserDocRef(userId));
    return userDoc.exists() ? userDoc.data() : null;
  },

  async updateUserData(userId: string, data: any) {
    await setDoc(getUserDocRef(userId), data, { merge: true });
  },

  async updateSubscription(userId: string, subscriptionData: any) {
    await updateDoc(getUserDocRef(userId), {
      subscriptionPlan: subscriptionData.plan,
      subscriptionStatus: subscriptionData.status,
      subscriptionInterval: subscriptionData.interval,
      subscriptionEnd: subscriptionData.subscriptionEnd,
      lastUpdated: new Date().toISOString()
    });
  },

  // Player operations
  async getPlayers(userId: string) {
    const snapshot = await getDocs(getPlayersCollectionRef(userId));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    const gamesRef = collection(
      db, 
      "artifacts", 
      getAppId(), 
      "users", 
      userId, 
      "players", 
      playerName, 
      "games"
    );
    const gameRef = doc(gamesRef);
    await setDoc(gameRef, {
      ...gameData,
      createdAt: new Date().toISOString(),
      id: gameRef.id
    });
  },

  async getGames(userId: string, playerName: string, limit?: number) {
    const gamesRef = getGamesCollectionRef(userId, playerName);
    let q = query(gamesRef, orderBy("date", "desc"));
    if (limit) q = query(q, limit(limit));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Template operations
  async saveTemplate(userId: string, templateKey: string, templateData: any) {
    const userRef = getUserDocRef(userId);
    const userData = await getDoc(userRef);
    const currentTemplates = userData.exists() ? userData.data()?.customTemplates || {} : {};
    
    await updateDoc(userRef, {
      customTemplates: {
        ...currentTemplates,
        [templateKey]: templateData
      },
      lastUpdated: new Date().toISOString()
    });
  },

  async deleteTemplate(userId: string, templateKey: string) {
    const userRef = getUserDocRef(userId);
    const userData = await getDoc(userRef);
    const currentTemplates = userData.exists() ? userData.data()?.customTemplates || {} : {};
    
    delete currentTemplates[templateKey];
    
    await updateDoc(userRef, {
      customTemplates: currentTemplates,
      lastUpdated: new Date().toISOString()
    });
  },

  // Stats operations
  async getUserStats(userId: string) {
    const players = await this.getPlayers(userId);
    let totalMatches = 0;
    
    for (const player of players) {
      const games = await this.getGames(userId, player.name, 1000); // Large limit for counting
      totalMatches += games.length;
    }
    
    return {
      playerCount: players.length,
      totalMatches
    };
  }
};