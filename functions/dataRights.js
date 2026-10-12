// Registrerades rättigheter i appen: stäng en spelarlänk, och hämta en kopia av
// sina uppgifter. Båda kräver inloggning och rör bara den inloggades egna data.

const MAX_GAMES_PER_PLAYER = 5000;
const MAX_CHATS = 300;

// Firestore-värden (Timestamp, Buffer) -> JSON-vänligt.
function normalize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Buffer.isBuffer(value)) return undefined;
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const n = normalize(v);
      if (n !== undefined) out[k] = n;
    }
    return out;
  }
  return value;
}

function createRevokePlayerLink({ functions, admin, db, appId }) {
  return functions
    .region("europe-west1")
    .https.onCall(async (data, context) => {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Du måste vara inloggad.");
      }
      const userId = context.auth.uid;
      const playerName = data && data.playerName;
      if (!playerName || typeof playerName !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Spelarnamn saknas.");
      }
      // Bara den inloggades egna, aktiva länkar för just den spelaren.
      const snap = await db
        .collection("artifacts").doc(appId).collection("playerLinks")
        .where("userId", "==", userId)
        .where("playerName", "==", playerName)
        .where("revokedAt", "==", null)
        .get();
      if (snap.empty) return { revoked: 0 };
      const batch = db.batch();
      snap.docs.forEach((d) =>
        batch.update(d.ref, { revokedAt: admin.firestore.FieldValue.serverTimestamp() })
      );
      await batch.commit();
      return { revoked: snap.size };
    });
}

function createExportMyData({ functions, admin, db, appId }) {
  return functions
    .region("europe-west1")
    .runWith({ memory: "512MB", timeoutSeconds: 60 })
    .https.onCall(async (data, context) => {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Du måste vara inloggad.");
      }
      const userId = context.auth.uid;
      const base = db.collection("artifacts").doc(appId);
      const userRef = base.collection("users").doc(userId);

      const [userDoc, authUser] = await Promise.all([
        userRef.get(),
        admin.auth().getUser(userId).catch(() => null),
      ]);

      // Interna betalnings-ID:n tas inte med; allt annat som är kontoinnehavarens egna uppgifter gör det.
      const account = userDoc.exists ? { ...userDoc.data() } : {};
      delete account.stripeCustomerId;
      delete account.subscriptionId;

      const playersSnap = await userRef.collection("players").get();
      const players = await Promise.all(
        playersSnap.docs.map(async (p) => {
          const gamesSnap = await p.ref
            .collection("games")
            .orderBy("date", "asc")
            .limit(MAX_GAMES_PER_PLAYER)
            .get();
          return {
            name: p.id,
            ...p.data(),
            games: gamesSnap.docs.map((g) => ({ id: g.id, ...g.data() })),
          };
        })
      );

      const chatsSnap = await userRef.collection("coachChats").limit(MAX_CHATS).get();
      const coachChats = chatsSnap.docs.map((c) => ({ id: c.id, ...c.data() }));

      const linksSnap = await base.collection("playerLinks").where("userId", "==", userId).get();
      // Själva token:en tas inte med: den är en nyckel till spelarens sida.
      const playerLinks = linksSnap.docs.map((l) => {
        const d = l.data();
        return { playerName: d.playerName, createdAt: d.createdAt, active: !d.revokedAt, revokedAt: d.revokedAt || null };
      });

      return normalize({
        exportedAt: new Date().toISOString(),
        note:
          "Kopia av dina uppgifter i Ice IQ. Spelarlänkarnas adresser (token) tas inte med eftersom de fungerar som lösenord.",
        authentication: authUser
          ? {
              email: authUser.email || null,
              displayName: authUser.displayName || null,
              providers: (authUser.providerData || []).map((p) => p.providerId),
              createdAt: authUser.metadata && authUser.metadata.creationTime,
            }
          : null,
        account,
        players,
        coachChats,
        playerLinks,
      });
    });
}

module.exports = { createRevokePlayerLink, createExportMyData };
