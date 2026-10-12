# Underlag för juristkoll och DPIA (Ice IQ)

Skrivet 2026-10-12 av utvecklingsteamet (inte av en jurist). Syftet är att en jurist, eller en AI-assistent som ska ge ett första utkast, ska få **en korrekt bild av vad appen faktiskt gör** och vilka frågor som behöver besvaras. Allt i avsnitt 2–4 är hämtat ur koden. Det som är osäkert eller inte verifierat står under "Behöver verifieras".

> Det här är inte juridisk rådgivning. Ett utkast från en AI-assistent ska granskas av en människa med juridisk kompetens innan det används.

---

## 1. Vad som behövs och varför

### Juristkoll av policyn
En genomgång av `src/pages/Privacy.tsx` (publiceras på `https://iceiq.app/privacy`) och `src/pages/Terms.tsx`, med frågan: **stämmer texten med vad systemet gör, och uppfyller den GDPR och Apples krav?** Särskilt:
- Är informationen om vilka uppgifter som samlas in, för vilket ändamål, på vilken rättslig grund och hur länge fullständig (GDPR art. 13)?
- Beskrivs barns uppgifter, AI-behandlingen, mottagare/biträden och överföringar utanför EU/EES tillräckligt?
- Är språket begripligt för en förälder (art. 12)?
- Stämmer den med App Privacy-svaren i App Store Connect (`docs/app-store-listing.md`)?
- Finns det något i Terms som är olämpligt för en tjänst som hanterar uppgifter om barn?

### DPIA (konsekvensbedömning, GDPR art. 35)
En skriftlig bedömning av risker för de registrerade, och åtgärder. Skälet: tjänsten (a) behandlar **uppgifter om barn**, (b) använder **AI för att bygga en bild av en enskild person över tid** (coachens minne), och (c) i en planerad funktion låter barn **prata med AI**. Det är kombinationer som tillsynsmyndigheter normalt vill se en DPIA för. Utkastet ska svara på: behövs den, vad är riskerna, vilka åtgärder finns redan, vad återstår.

---

## 2. Verksamheten i korthet

- **Personuppgiftsansvarig:** SquareVerse Group AB (org.nr finns i `src/utils/contact.ts`), Sverige.
- **Tjänsten:** Ice IQ, en app (iPhone, via App Store) och webb (`iceiq.app`) där föräldrar och tränare loggar en hockeyspelares matcher, ser utvecklingen mot spelarens **eget** snitt, och får feedback av en AI-coach.
- **Användare (konton):** vuxna (föräldrar, tränare). Barn skapar **inte** konton.
- **Registrerade:** (1) kontoinnehavaren, (2) **spelaren, ofta ett barn**, som föräldern lägger in, (3) spelarens e-post om föräldern anger den.
- **Marknader:** främst Kanada och USA (störst trafik), Sverige tredje. Appen är på svenska och engelska.
- **Betalning:** webben via Stripe (prenumeration och engångsköp). Inga köp i iPhone-appen i första versionen.

---

## 3. Uppgifter som behandlas (hämtat ur koden)

| Kategori | Innehåll | Var | Vem anger |
|---|---|---|---|
| Konto | e-post, namn, inloggningsmetod (e-post/Google/Apple), språk, skapad tidpunkt | Firebase Auth + användardokument i Firestore | Användaren |
| Spelare | namn, lag, senaste matchdatum, saldo (Money Mode), valfri e-post till spelaren | Firestore, `players` | Föräldern |
| Matcher | datum, lag, poäng, händelser (antal per åtgärd), mall | Firestore, `games` | Föräldern |
| AI-coach | samtal (frågor och svar), coachens korta rader och talade manus, **minne om spelaren** (daterade anteckningar, max 8), fokusområden | Firestore (`coachChats`, `coachTimeline` på spelaren) | Genereras av AI |
| Spelarlänk | slumpad token, koppling till användare och spelarnamn, återkallning | Firestore, `playerLinks` | Genereras |
| Rutiner | datum då spelaren gjort en rutin (max 60) | Firestore, på spelaren | Spelaren via länk |
| Lyssnakort | text med förnamn och poäng som görs om till tal; kort cache av ljudet (ca 30 dagar); dagsräknare per länk | Firestore (`ttsCache`, `ttsUsage`) | Genereras |
| Anonym mätning | räknare per dag (spelade du, vilken röst), inga identifierare | Firestore (`listenStats`) | Genereras |
| Marknadsföring | källa (UTM-parametrar) för hur kontot hittade tjänsten | Användardokumentet | Automatiskt |
| Samtycke | version och tidpunkt för AI-samtycke | Användardokumentet (`aiConsent`) | Användaren |
| Betalning | Stripe-kund-ID, plan, status, förnyelsedatum (kortuppgifter hos Stripe, aldrig hos oss) | Firestore + Stripe | Användaren |
| Lokalt på enheten (appen) | cache av Firestore-data, inställningar (språk, Face ID-lås, effekter), **spelarens mobilnummer för Swish-genvägen (bara lokalt, aldrig på servern)** | Telefonens lagring | Användaren |

**Biometri:** Face ID/Touch ID hanteras helt av iOS. Appen får bara ett ja/nej och tar aldrig emot biometriska data.

---

## 4. Flöden och mottagare

1. **Registrering och inloggning:** Firebase Authentication (Google). Inloggning med Google eller Apple går via respektive leverantör.
2. **Lagring:** Cloud Firestore (Google). Funktioner körs i `europe-west1` (Belgien) och `us-central1` (USA).
3. **AI-coach:** spelarens namn, matchstatistik och poäng, en kort historik och frågan skickas från en funktion i `europe-west1` till Googles AI-tjänst (Vertex AI, EU-region) för att skapa svaret. Svaret sparas. E-postadress och betaldata skickas **inte**. Användaren får först en samtyckesruta (`AiConsentModal`) och godkännandet sparas med version.
4. **Lyssnakort (text till tal):** korta meningar med spelarens förnamn och poäng skickas till Google Cloud Text-to-Speech (EU-slutpunkt) för att skapa ljud. Rösten är syntetisk; ingen inspelning av en användare sparas.
5. **E-post:** tjänstemejl, veckosammanfattning och aktiveringspåminnelse skickas via en e-posttjänst (Resend). Mejl till en spelare skickas bara om föräldern angett spelarens e-post och väljer att dela.
6. **Betalning (webb):** Stripe.
7. **Spelarlänk:** en persistent länk utan inloggning där token är behörigheten. Visar spelarens kurva, poäng och coachens senaste rader, **aldrig** saldo eller betalning. Föräldern kan återkalla länken.
8. **Delning:** bilder (matchrapport, coachkort) delas via telefonens delningsblad, aldrig med saldo eller e-post.

---

## 5. Barn: särskilda förhållanden

- Barn har inga konton; en förälder lägger in uppgifterna.
- Spelarlänken kan öppnas av barnet utan inloggning.
- Planerad funktion (finns som plan, inte byggd): barn pratar med coachen via länken. Beslut: bara från 13 år (och då bara om föräldern bockar i), under 13 bara lyssna, samt att USA/Kanada under 13 alltid är "bara lyssna" tills verifierbart föräldrasamtycke är löst. Se `docs/player-link-coach-plan.md`.
- Tjänsten rankar inte barn mot varandra, jämför bara med spelarens eget snitt, och delar inget utåt (till scouter, lag eller andra användare).
- Ingen annonsering och ingen spårning över andra tjänster.

---

## 6. Behöver verifieras (jag har inte kunnat bekräfta)

- **Var Firestore-databasen ligger** (region). Funktionerna ligger i EU och USA, men databasens plats har inte kontrollerats.
- **E-posttjänstens (Resend) behandlingsplats** och om ett personuppgiftsbiträdesavtal finns.
- **Biträdesavtal (DPA)** med Google (Firebase/Cloud/Vertex), Stripe och Resend, och vilka överföringsmekanismer som gäller för USA.
- **Lagringstider:** inga automatiska raderingsregler finns idag, utom att användaren kan radera sitt konto och all data i appen. Coachens minne och matchhistorik sparas tills kontot raderas. Cache för ljud har ett `expireAt`-fält men ingen aktiv radering konfigurerad.
- **Rättslig grund** för respektive behandling (avtal, samtycke, berättigat intresse) är inte uttryckligen angiven i policyn.
- **Om Apple-tokenåterkallningen** vid kontoborttagning fungerar (inte provad på riktig enhet).
- **Åldersgränsen 13 år** och "förälder intygar" som verifiering: är det tillräckligt i Sverige/EU, och i USA (COPPA kräver verifierbart samtycke under 13)?
- **Google Analytics** nämndes i en äldre version av policyn men finns inte i koden; den raden är borttagen. Bekräfta att inga andra spårare används.

---

## 7. Frågor att ställa till juristen / AI-assistenten

1. Är SquareVerse ensam personuppgiftsansvarig, och är Google/Stripe/Resend personuppgiftsbiträden?
2. Vilken rättslig grund passar för (a) kontot, (b) AI-coachen, (c) coachens minne över tid, (d) ljudklippen, (e) marknadsföringskällan?
3. Räcker samtyckesrutan för AI-coachen som samtycke enligt art. 6/7, och är den tillräcklig för barns uppgifter (art. 8)?
4. Krävs DPIA, och vad ska den innehålla? Behövs förhandssamråd med IMY om risken inte kan begränsas?
5. Hur ska föräldrasamtycke för barn under 13 utformas i EU respektive USA (COPPA) och Kanada?
6. Vad bör policyn säga om lagringstid, och behövs automatisk radering av inaktiva konton?
7. Är det tillåtet att AI sparar ett "minne" om ett barn över tid, och vilka garantier krävs (insyn, radering, rättelse)?
8. Vad krävs för att barn ska få tala med en AI via en länk (planerad funktion)?
9. Stämmer App Privacy-svaren i `docs/app-store-listing.md` med policyn?
10. Behöver villkoren (Terms) kompletteras för AI-genererat innehåll och barns användning?

---

## 8. DPIA: utkast att utgå ifrån

Fyll i och korrigera med jurist. Strukturen följer det IMY och EDPB brukar förvänta sig.

### 8.1 Beskrivning av behandlingen
Se avsnitt 2–4 ovan: ändamål (att hjälpa en förälder följa och stödja ett barns utveckling i hockey), kategorier av uppgifter, registrerade, mottagare, lagring, tekniska flöden och teknik (AI, text till tal).

### 8.2 Nödvändighet och proportionalitet
- **Ändamål:** tydligt och begränsat till tjänsten; ingen annonsering eller vidareförsäljning.
- **Uppgiftsminimering:** inga födelsedatum, adresser eller telefonnummer lagras; spelarens mobilnummer för Swish finns bara lokalt.
- **Alternativ:** tjänsten går att använda utan AI-coachen (loggning och statistik fungerar utan den).
- **Registrerades rättigheter:** radering och export i appen/via kontakt; spelarlänk kan återkallas; AI-samtycke kan inte återkallas i appen idag (att bedöma).

### 8.3 Risker (att bedöma sannolikhet och allvar)
| Risk | Kommentar |
|---|---|
| Uppgifter om barn kommer i orätta händer | En läckt spelarlänk ger insyn i statistik och senaste coachrader. Token är slumpad och kan återkallas. |
| AI-text om ett barn som är felaktig, olämplig eller sårande | Coachen ombeds ge balanserade råd och inte jämföra med andra, men modellen kan ändå svara fel. |
| Profilering av ett barn över tid | Coachens minne (max 8 anteckningar) bygger en bild av spelaren. Förälderns insyn och möjlighet att radera behöver vara tydlig. |
| Press och jämförelse | Statistik kan upplevas som bedömning. Tjänsten jämför bara med eget snitt och visar misstag lugnt. |
| Överföring till tredjeland | Delar av behandlingen sker i USA-region (funktioner, Stripe). Mekanism behöver bekräftas. |
| Barn pratar med AI (planerad) | Hög risk om det byggs utan samtycke och skyddsåtgärder. Därför bara-lyssna som standard. |
| Obehörig åtkomst till konto | Skydd via Google/Apple-inloggning, e-post/lösenord och valfritt Face ID-lås i appen. |

### 8.4 Åtgärder (redan vidtagna)
- AI-samtycke med version, innan data lämnar appen till AI.
- Inga saldon, e-post eller betaldata i AI-anrop, bilder eller spelarlänk.
- Radera konto i appen (data och konto), och lokal cache rensas vid utloggning.
- Bara-lyssna som standard för barn; ålderstrappa (13 år) och föräldrabeslut vid delning (planerat).
- Daglig kostnads- och användargräns per länk, anonym mätning utan identifierare.
- Behandling inom EU för AI och text till tal.

### 8.5 Återstående åtgärder (att besluta)
- Lagringstider och automatisk radering.
- Rättslig grund per behandling och uppdaterad policy.
- DPA:er och överföringsmekanismer.
- Möjlighet att se och rensa coachens minne om en spelare.
- Verifierbart föräldrasamtycke för barn under 13 utanför EU.

### 8.6 Slutsats och granskning
Att fyllas i av ansvarig och jurist: bedömd resterande risk, behov av förhandssamråd, beslut och datum, ansvarig person, tidpunkt för nästa granskning.

---

## 9. Hur du använder det här i Gemini (förslag)

1. Klistra in hela dokumentet.
2. Be om: "Granska policyn (bifogad) mot avsnitt 3–5 och lista varje avvikelse. Ge därefter ett utkast till DPIA enligt avsnitt 8, och sammanställ det som saknas under avsnitt 6 som en att-göra-lista. Svara på svenska och peka ut vad som kräver mänsklig juridisk bedömning."
3. Bifoga `src/pages/Privacy.tsx` och `src/pages/Terms.tsx` som text.
4. Låt någon med juridisk kompetens granska resultatet innan något publiceras.
