// Ljud till lyssnaklippen på spelarens länk, med Googles text-till-tal (EU-
// slutpunkt). Klienten skickar klippets meningar; vi gör om dem till mp3.
//
// Skyddsräcken, eftersom funktionen nås utan inloggning (token är behörigheten):
//  - giltig, ej återkallad spelarlänk krävs
//  - högst 6 meningar à 160 tecken per anrop
//  - dagstak i tecken per länk (räknas bara på det som faktiskt syntetiseras)
//  - inget ljud sparas (texten innehåller spelarens förnamn)
// Inget ljud sparas som en inspelning av någon: det är syntetiserat tal av
// text som redan finns på sidan.
//
// Röst: sätt LISTEN_VOICE_SV / LISTEN_VOICE_EN i functions/.env till en
// röstnamn ur "voices.list" för språket (t.ex. en Chirp3-HD- eller Neural2-röst).
// Utan namn väljer Google en standardröst efter språk och kön (sämre kvalitet).

const { GoogleAuth } = require("google-auth-library");

const TTS_URL = "https://eu-texttospeech.googleapis.com/v1/text:synthesize";
// Takt: 1,0 är rösten som den är byggd. Lägre = lugnare. Ingår i cachenyckeln,
// så en ändring här skapar nya klipp i stället för att återanvända gamla.
const SPEAKING_RATE = 1.08;
const MAX_SENTENCES = 6;
const MAX_LENGTH = 160;
const DAILY_CHAR_CAP = 3000;

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

const escapeXml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Hela klippet i ETT anrop, med en tydlig, jämn paus efter varje mening.
// Mening för mening gav rusande uttal (rösten saknade sammanhang) och
// ojämna pauser (tystnad på slutet av varje fil plus uppspelningsglapp).
//  - Chirp 3 HD: pausmarkering i "markup"-fältet ([pause short]).
//  - Övriga röster: SSML med <break>.
function buildInputs(sentences, isChirp) {
  const plain = sentences.join(" ");
  if (isChirp) {
    return [
      { markup: sentences.join(" [pause short] ") },
      { text: plain }, // reserv om markup inte godtas
    ];
  }
  return [
    { ssml: `<speak>${sentences.map(escapeXml).join('<break time="320ms"/>')}</speak>` },
    { text: plain },
  ];
}

async function synthesize(sentences, voice) {
  const client = await getAuthClient();
  const voiceSelection = voice.name
    ? { languageCode: voice.languageCode, name: voice.name }
    : { languageCode: voice.languageCode, ssmlGender: voice.gender === "m" ? "MALE" : "FEMALE" };
  const isChirp = /chirp/i.test(voice.name || "");
  const inputs = buildInputs(sentences, isChirp);
  let lastError;
  for (const input of inputs) {
    try {
      return await request(client, input, voiceSelection, voice);
    } catch (err) {
      lastError = err;
      // Bara ogiltig indata (400) ger en ny chans med enklare text.
      if (!(err && (err.status === 400 || err.code === 400))) break;
    }
  }
  throw lastError;
}

async function request(client, input, voiceSelection, voice) {
  const res = await client.request({
    url: TTS_URL,
    method: "POST",
    data: {
      input,
      voice: voiceSelection,
      // Takten styrs av SPEAKING_RATE ovan. Chirp-rösterna
      // stöder inte tonhöjdsinställningen (den avvisas), så den utelämnas där.
      audioConfig: /chirp/i.test(voice.name || "")
        ? { audioEncoding: "MP3", speakingRate: SPEAKING_RATE }
        : { audioEncoding: "MP3", speakingRate: SPEAKING_RATE, pitch: 0 },
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

      // Hela klippet är ETT ljud (se buildInputs). Ljudet sparas inte: texten
      // innehåller spelarens förnamn och poäng, och att behålla en kopia vore
      // onödigt. Klienten återanvänder det under sessionen.
      const clipText = sentences.join("\n");
      const chars = clipText.length;

      // Dagstak per länk.
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

      let buf;
      try {
        buf = await synthesize(sentences, voice);
      } catch (err) {
        console.error("getListenAudio synthesis failed:", err);
        throw new functions.https.HttpsError("internal", "Kunde inte skapa ljudet.");
      }

      return { audio: [buf.toString("base64")], whole: true };
    });
}

// --- Anonym mätning av lyssnakortet ---
// Räknare per dag, helt utan identifierare: ingen token, inget spelarnamn,
// ingen enhet sparas. Svarar på "vad väljer man och var hoppar man av" och
// ingenting om vem. Läses i Firestore: artifacts/{appId}/listenStats/{YYYY-MM-DD}.
const STAT_EVENTS = new Set([
  "open", "play", "again", "next", "finished",
  "clip_1_done", "clip_2_done", "clip_3_done",
  "voice_m", "voice_f", "lang_sv", "lang_en",
  "cloud_ok", "cloud_fallback",
]);

function createListenStats({ functions, admin, db, appId, resolvePlayerLink }) {
  return functions
    .region("europe-west1")
    .runWith({ memory: "128MB", timeoutSeconds: 10 })
    .https.onCall(async (data) => {
      await resolvePlayerLink(data && data.token); // giltig, ej återkallad länk krävs
      const event = data.event;
      if (typeof event !== "string" || !STAT_EVENTS.has(event)) {
        throw new functions.https.HttpsError("invalid-argument", "Okänd händelse.");
      }
      const day = new Date().toISOString().slice(0, 10);
      await db
        .collection("artifacts").doc(appId)
        .collection("listenStats").doc(day)
        .set({ [`e_${event}`]: admin.firestore.FieldValue.increment(1) }, { merge: true });
      return { ok: true };
    });
}

module.exports = { createListenAudio, createListenStats };
