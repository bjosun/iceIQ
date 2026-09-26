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
import { app } from './firebase';

export const db = getFirestore(app);
export const functions = getFunctions(app);
// askCoach ligger i europe-west1: spelardata om minderåriga behandlas inom EU
// hela vägen, inte bara i Vertex-anropet. Övriga funktioner (Stripe m.fl.)
// ligger kvar i us-central1 och använder därför standardinstansen ovan —
// stripeWebhook har dessutom en URL registrerad hos Stripe som inte får ändras.
export const euFunctions = getFunctions(app, 'europe-west1');

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
