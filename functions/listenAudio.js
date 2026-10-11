// Ljud till lyssnaklippen på spelarens länk, med Googles text-till-tal (EU-
// slutpunkt). Klienten skickar klippets meningar; vi gör om dem till mp3.
//
// Skyddsräcken, eftersom funktionen nås utan inloggning (token är behörigheten):
//  - giltig, ej återkallad spelarlänk krävs
//  - högst 6 meningar à 160 tecken per anrop
//  - dagstak i tecken per länk (räknas bara på det som faktiskt syntetiseras)
//  - svar cachas per (språk, röst, text) så fasta fraser bara kostar en gång
// Inget ljud sparas som en inspelning av någon: det är syntetiserat tal av
// text som redan finns på sidan.
//
// Röst: sätt LISTEN_VOICE_SV / LISTEN_VOICE_EN i functions/.env till en
// röstnamn ur "voices.list" för språket (t.ex. en Chirp3-HD- eller Neural2-röst).
// Utan namn väljer Google en standardröst efter språk och kön (sämre kvalitet).

const crypto = require("crypto");
const { GoogleAuth } = require("google-auth-library");

const TTS_URL = "https://eu-texttospeech.googleapis.com/v1/text:synthesize";
const MAX_SENTENCES = 6;
const MAX_LENGTH = 160;
const DAILY_CHAR_CAP = 3000;
const CACHE_DAYS = 30;

// Kvinnlig (f) och manlig (m) röst per språk. Namnen sätts i functions/.env
// (LISTEN_VOICE_SV_F / LISTEN_VOICE_SV_M, samma för EN); LISTEN_VOICE_SV gäller
// som kvinnlig röst för bakåtkompatibilitet. Utan namn väljer Google en
// standardröst efter språk och kön.
const VOICES = {
  sv: {
    languageCode: "sv-SE",
    f: process.env.LISTEN_VOICE_SV_F || process.env.LISTEN_VOICE_SV || undefined,
    m: process.env.LISTEN_VOICE_SV_M || undefined,
  },
  en: {
    languageCode: "en-US",
    f: process.env.LISTEN_VOICE_EN_F || process.env.LISTEN_VOICE_EN || undefined,
    m: process.env.LISTEN_VOICE_EN_M || undefined,
  },
};

let authClient = null;
async function getAuthClient() {
  if (!authClient) {
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    authClient = await auth.getClient();
  }
  return authClient;
}

async function synthesize(text, voice) {
  const client = await getAuthClient();
  const voiceSelection = voice.name
    ? { languageCode: voice.languageCode, name: voice.name }
    : { languageCode: voice.languageCode, ssmlGender: voice.gender === "m" ? "MALE" : "FEMALE" };
  const res = await client.request({
    url: TTS_URL,
    method: "POST",
    data: {
      input: { text },
      voice: voiceSelection,
      // Lite snabbare än normalt: kompis-takt, inte uppläsning. Chirp-rösterna
      // stöder inte tonhöjdsinställningen (den avvisas), så den utelämnas där.
      audioConfig: /chirp/i.test(voice.name || "")
        ? { audioEncoding: "MP3", speakingRate: 1.1 }
        : { audioEncoding: "MP3", speakingRate: 1.12, pitch: 0 },
    },
  });
  return Buffer.from(res.data.audioContent, "base64");
}

function createListenAudio({ functions, admin, db, appId, resolvePlayerLink }) {
  const base = db.collection("artifacts").doc(appId);

  return functions
    .region("europe-west1")
    .runWith({ memory: "256MB", timeoutSeconds: 40 })
    .https.onCall(async (data) => {
      await resolvePlayerLink(data && data.token); // kastar vid ogiltig/återkallad länk
      const token = data.token;

      const lang = data.lang === "en" ? "en" : "sv";
      const sentences = data.sentences;
      if (
        !Array.isArray(sentences) ||
        sentences.length === 0 ||
        sentences.length > MAX_SENTENCES ||
        sentences.some((s) => typeof s !== "string" || s.trim().length === 0 || s.length > MAX_LENGTH)
      ) {
        throw new functions.https.HttpsError("invalid-argument", "Ogiltiga meningar.");
      }

      const gender = data.voice === "m" ? "m" : "f";
      const entry = VOICES[lang];
      const voice = { languageCode: entry.languageCode, name: entry[gender], gender };
      const keyFor = (text) =>
        crypto
          .createHash("sha256")
          .update(`${lang}|${gender}|${voice.name || voice.languageCode}|${text}`)
          .digest("hex");
      const cacheRefs = sentences.map((s) => base.collection("ttsCache").doc(keyFor(s)));
      const cached = await db.getAll(...cacheRefs);

      const audio = new Array(sentences.length);
      const missing = [];
      cached.forEach((doc, i) => {
        if (doc.exists && doc.data().audio) audio[i] = Buffer.from(doc.data().audio);
        else missing.push(i);
      });

      if (missing.length > 0) {
        // Dagstak per länk, bara på det som måste syntetiseras.
        const chars = missing.reduce((n, i) => n + sentences[i].length, 0);
        const day = new Date().toISOString().slice(0, 10);
        const usageRef = base.collection("playerLinks").doc(token).collection("ttsUsage").doc(day);
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(usageRef);
          const used = snap.exists ? snap.data().chars || 0 : 0;
          if (used + chars > DAILY_CHAR_CAP) {
            throw new functions.https.HttpsError("resource-exhausted", "Dagens gräns för uppläsning är nådd.");
          }
          tx.set(usageRef, { chars: used + chars }, { merge: true });
        });

        try {
          await Promise.all(
            missing.map(async (i) => {
              const buf = await synthesize(sentences[i], voice);
              audio[i] = buf;
              await cacheRefs[i].set({
                audio: buf,
                lang,
                chars: sentences[i].length,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                // För en Firestore-TTL-policy på fältet expireAt (valfritt).
                expireAt: new Date(Date.now() + CACHE_DAYS * 24 * 60 * 60 * 1000),
              });
            })
          );
        } catch (err) {
          console.error("getListenAudio synthesis failed:", err);
          throw new functions.https.HttpsError("internal", "Kunde inte skapa ljudet.");
        }
      }

      return { audio: audio.map((b) => b.toString("base64")), cached: sentences.length - missing.length };
    });
}

module.exports = { createListenAudio };
