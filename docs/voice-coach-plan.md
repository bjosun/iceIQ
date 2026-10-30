# Röstcoach — kodplan

Status: plan, inget byggt. Skriven 2026-10-03.

## Mål

Föräldern följer **en spelare** under matchen med hörlurar och pratar fritt. Coachen (Gemini Live) tolkar talet, registrerar händelser i den aktiva mallen, svarar i örat och kan prata om statistiken. Inget klickande behövs.

- "Snygg tackling" → Tackling +1
- "Han missade passningen" → Misslyckad passning +1
- "Åh vilket skott!" (oklart) → coachen frågar kort: "Var det Elias?"
- "Ångra" / "nej, fel" → senaste händelsen tas bort
- "Hur många passningar har han?" → svar i örat utifrån matchens siffror

### Fasta beslut
- Hörlurar och alltid-lyssnande. Ingen push-to-talk som standard.
- **Ljud sparas aldrig.** Bara text sparas: inmatningslogg och coachchatt.
- En spelare per användare. Flera spelare löses med fler "scouter", eller en i taget på video efteråt.
- Röst är en betalfunktion. Alla får **3 gratis röstmatcher** (totalt, inte per månad).
- Webb först. App (Capacitor) först om låst skärm eller telefon i fickan visar sig behövas.

### Öppna beslut
| Beslut | Förslag |
|---|---|
| Vilken plan inkluderar röst? | Elite (ingen fjärde plan). Alternativ: tillägg till Premium. |
| Pris | Sätts efter fas 0, när kostnaden per match är uppmätt. |
| Live-modell | Senaste Live-modellen med native audio. Namnet ligger i en konstant och verifieras vid bygget. |

---

## Arkitektur

```
Webbläsare (Dashboard)                     Firebase Functions (europe-west1)
┌────────────────────────────┐   1. token  ┌──────────────────────────────┐
│ useVoiceCoach              │ ──────────▶ │ mintVoiceSession             │
│  ├ micCapture (16 kHz PCM) │ ◀────────── │  - auth + plan/kvot-koll     │
│  ├ playback (24 kHz PCM)   │  ephemeral  │  - räknar röstmatcher        │
│  ├ voiceTools (funktioner) │   token     │  - authTokens.create()       │
│  └ transkript → chatt      │             └──────────────────────────────┘
└──────────┬─────────────────┘
           │ 2. WebSocket direkt (ljud in/ut, tool calls, transkript)
           ▼
      Gemini Live API
```

**Varför en direkt WebSocket från webbläsaren:** lägst latens och ingen egen ljudserver. API-nyckeln stannar i Functions. Klienten får bara en kortlivad token som är låst till modell och konfiguration.

**Varför en ny nyckel och inte Vertex:** `askCoach` använder `new GoogleGenAI({ vertexai: true })` ([functions/index.js:419](../functions/index.js)). Kortlivade tokens för Live API finns bara i Gemini Developer API. Därför behövs secret `GEMINI_API_KEY` (AI Studio-projekt **med fakturering påslaget**: på betalnivån används data inte för att träna modellerna, vilket integritetslöftet bygger på).
*Alternativ om data måste stanna i EU:* en WebSocket-proxy på Cloud Run mot Vertex Live i `europe-west1`. Det ger mer drift och lite högre latens. Ta ställning efter fas 0.

### Ljud
- `getUserMedia({ audio: { echoCancellation, noiseSuppression, autoGainControl } })`
- En AudioWorklet nedsamplar till 16 kHz PCM16 → `session.sendRealtimeInput({ audio })`
- Utljud: 24 kHz PCM, köas i en `AudioContext`
- `AudioContext` måste startas i klick-handlern (iOS), samma mönster som NoSleep i `ActionGrid`
- Transkription påslagen åt båda hållen (`inputAudioTranscription`, `outputAudioTranscription`). Texten sparas, ljudet kastas.

### Sessioner
- Live-anslutningar har tidsgränser. Använd `sessionResumption` och `contextWindowCompression`.
- Vid frånkoppling: hämta en ny token från `mintVoiceSession` med samma `matchId` (räknas inte som ny match) och återuppta med resumption-handle.
- Nätavbrott: visa "Återansluter…". Knapparna fungerar som vanligt under tiden.

---

## Verktyg (function calling)

Byggs dynamiskt från `currentTemplate.actions` så att egna mallar fungerar direkt.

| Verktyg | Parametrar | Effekt |
|---|---|---|
| `register_action` | `action` (enum av mallens `name.en`), `delta` (1 \| -1), `phrase` (vad som sades) | Uppdaterar `actionCounts` och loggar en händelse |
| `undo_last` | – | Tar bort senaste röstregistreringen |
| `get_match_stats` | – | Returnerar aktuella räknare, poäng och period |
| `pause_listening` | – | Mikrofonen stängs. Återuppta med ett tryck på skärmen. |

Mappning: `action` (`name.en`) → `JSON.stringify(action.name)`, samma nyckel som `ActionGrid` och `Dashboard` använder idag.

Säsongsöversikt (`buildSeasonSummary`) och `coachTimeline` skickas med i systeminstruktionen vid start. De behövs inte som verktyg, eftersom de inte ändras under matchen.

### Systeminstruktion (kärna, sv/en)
- Du följer **{spelarnamn}**. Allt gäller den spelaren om inget annat sägs.
- Registrera bara när det är tydligt att det gäller {spelarnamn}. Vid osäkerhet: fråga kort "Var det {namn}?" och registrera först vid ett ja.
- Ignorera prat som inte är en händelse (samtal med grannen, publikljud, andra spelare).
- Bekräfta kort: "Tackling, plus ett." Inga långa svar under spel.
- Frågor om statistik: anropa `get_match_stats`. Räkna aldrig själv. (Samma regel som i `askCoach`.)
- Svara på användarens språk (`language` från `LanguageContext`).
- Inga påståenden om tidigare samtal om tidslinjen är tom (samma regel som `askCoach` 4b).

---

## Datamodell

### Händelselogg (ny)
```ts
interface MatchEvent {
  t: number;              // ms sedan matchstart
  key: string;            // JSON.stringify(action.name)
  delta: 1 | -1;
  source: 'voice' | 'tap';
  phrase?: string;        // tolkad fras, bara för röst
  undone?: boolean;
}
```
- Hålls i state i `Dashboard` och sparas i match-draften (`iceiq-match-draft`) så att den överlever omladdning.
- Sparas på matchdokumentet via `saveGame` (nytt valfritt fält `events`).
- Knapptryck i `ActionGrid` loggas också (`source: 'tap'`), så loggen blir komplett.

### Coachchatt
- Transkriptet sparas som en vanlig chatt i `coachChats` via `useCoachChats.saveChat`. Det nya fältet `mode: 'voice'` låter historiklistan visa en mikrofonikon.
- Spara bara turer med innehåll. Korta bekräftelser ("Tackling, plus ett") filtreras bort, eftersom de redan finns i händelseloggen.

### Kvot (användardokumentet)
- `voiceMatchesUsed: number` och `voiceMatchIds: string[]` (de senaste, för idempotens)
- **Måste läggas till i `protectedFields()` i `firestore.rules`.** Annars kan användaren nollställa sin kvot själv.

---

## Filer

### Nya
| Fil | Innehåll |
|---|---|
| `functions/index.js` → `mintVoiceSession` | onCall, europe-west1. Auth → plan/kvot → idempotent per `matchId` → `authTokens.create()` med låst modell och config. Returnerar `{ token, model, freeLeft }`. |
| `src/voice/useVoiceCoach.ts` | Hook: start/stopp, anslutning, resumption, tool-hantering, status (`idle\|connecting\|listening\|speaking\|reconnecting\|paused`), nivåmätare för pulscirkeln |
| `src/voice/micCapture.ts` + `src/voice/pcm-worklet.js` | Mikrofon → 16 kHz PCM16 |
| `src/voice/playback.ts` | 24 kHz PCM-uppspelning med kö, avbryts när användaren börjar prata |
| `src/voice/voiceTools.ts` | Bygger funktionsdeklarationer från mallen och mappar tool calls till Dashboard-handlers |
| `src/voice/voicePrompt.ts` | Systeminstruktion (sv/en) |
| `src/components/voice/VoiceCoachPanel.tsx` | Pulscirkel, senaste händelsen i stor text, transkript i liten text, logg med ångra per rad, stoppknapp |
| `src/components/voice/PocketMode.tsx` | Svart helskärm som ignorerar tryck, upplåsning med långtryck eller svep. Sparar batteri och förhindrar oavsiktliga tryck. |

Röstmodulen lazy-laddas (`React.lazy`) så att `@google/genai` inte tynger startsidan.

### Ändrade
| Fil | Ändring |
|---|---|
| `src/pages/Dashboard.tsx` | `matchEvents`-state och draft; en gemensam `applyAction(key, delta, source, phrase?)`; startknapp för röstcoachen; panelen |
| `src/components/dashboard/ActionGrid.tsx` | Ny valfri prop `onAction(key, delta)` så att tryck loggas. Wake lock-logiken återanvänds, och röstläget slår på "håll skärmen tänd" automatiskt. |
| `src/hooks/usePlayerData.ts` | `saveGame` tar valfria `events` |
| `src/hooks/useCoachChats.ts` | Valfritt `mode` på chatten |
| `firestore.rules` | `voiceMatchesUsed`, `voiceMatchIds` i `protectedFields()` |
| `src/utils/translations.ts` | Nya nycklar sv/en (kontrolleras med `npm run check:i18n`) |
| `src/components/modals/SubscriptionModal.tsx` | "Röstcoach" i Elite-listan, "3 gratis röstmatcher" |
| `src/pages/Privacy.tsx` | Ljud spelas aldrig in eller sparas; det bearbetas i realtid av Google och bara text sparas |
| `package.json` | `@google/genai` i frontend |

`src/pages/MatchTracker.tsx` (`/match`) rörs inte. Den är en stub, och den riktiga trackern ligger i Dashboard. Den kan städas bort separat.

---

## Faser och vad du testar

### Fas 0: Röstlabb (testa i hall)
Dold route `/voice-lab` (bara inloggad, ingen kvot). Minimal UI: start/stopp, pulscirkel, live-transkript, lista med tool calls och en tokenmätare (`usageMetadata`) som räknar fram en uppskattad kostnad per minut.
- `mintVoiceSession` (utan kvot), `useVoiceCoach`, ljud, `register_action`, `undo_last`
- **Du testar:** en riktig match med hörlurar. Hur ofta blir det rätt? Hur ofta registreras något som inte borde? Hur stor är fördröjningen? Vad kostar en period? Tål det hallens täckning?
- **Beslut efter fas 0:** fortsätta eller inte, pris, och om lokal tystnadsgrind (se fas 2) behövs för kostnaden.

### Fas 1: Röst i Dashboard
- Händelselogg (röst och tryck), draft, `saveGame` med `events`
- `VoiceCoachPanel`, `get_match_stats` (frågor om statistik under matchen)
- Transkriptet sparas som coachchatt
- **Du testar:** en hel match enbart med röst. Spara den, kontrollera att siffrorna stämmer i historiken, att loggen visar varje händelse och att chatten finns i coachens historik.

### Fas 2: Betalvägg, fickläge, integritet
- Kvot i `mintVoiceSession` (Elite obegränsat, övriga 3 totalt) och skyddade fält i reglerna
- Uppgraderingsdialog när gratismatcherna är slut
- `PocketMode`, `pause_listening`
- Text i integritetspolicyn och prenumerationsdialogen
- Valfritt, om fas 0 visar hög kostnad: en lokal tystnadsgrind (energibaserad VAD med 300 ms förbuffert som skickar ljud bara när någon pratar, med `automaticActivityDetection` avstängd och manuella `activityStart`/`activityEnd`)
- **Du testar:** ett gratiskonto får exakt 3 röstmatcher och en återanslutning räknas inte som en ny. Elite har obegränsat. Det går inte att nollställa kvoten från klienten. Fickläget fungerar i fickan.

### Fas 3: Röstsamtal efter matchen
- Efter att matchen sparats: "Prata med coachen". Samma Live-session, men utan `register_action`, med matchens slutsiffror, säsongsöversikt och `coachTimeline` i instruktionen.
- Anteckningar till `coachTimeline` uppdateras på samma sätt som i `askCoach`
- **Du testar:** fråga om matchen och om tips med rösten, och kontrollera att samtalet finns kvar som text.

### Fas 4: App (bara om det behövs)
- Capacitor kring den befintliga React-koden: mikrofon med låst skärm, hörlurarnas knappar, App Store
- Beslutas utifrån hur röstläget faktiskt används efter fas 2

---

## Risker
| Risk | Hantering |
|---|---|
| Felregistreringar från bakgrundsprat | Strikt prompt, fråga vid osäkerhet, ångra med rösten och logg att rätta i efteråt |
| Kostnad med alltid-lyssnande | Mät i fas 0; kontextkompression; lokal tystnadsgrind i fas 2 |
| Dålig täckning i hallar | Resumption, tydlig status, knapparna fungerar alltid |
| iOS tappar mikrofonen när skärmen låses | Wake lock och fickläge i webben; Capacitor i fas 4 |
| Integritet (barn i hallen) | Inget ljud sparas, betalnivå hos Google, text i integritetspolicyn; EU-proxy som alternativ |
| Live API ändras (modellnamn, gränser) | Modell och config i konstanter i `mintVoiceSession`; tokenen låser konfigurationen på servern |
