# App Store: material och granskningsanteckningar

Utkast 2026-10-09. Allt här ska läsas igenom av ägaren innan det klistras in i App Store Connect. Sekretess- och barnfrågor bör dessutom läsas av någon med juridisk kompetens (integritetspolicyn i `src/pages/Privacy.tsx` är ett utkast, inte juridisk rådgivning).

Tonen följer [copy-tonen](../README.md): inga påståenden om antal användare, enkelhet först, vuxenriktat och utvecklingsfokuserat. Money Mode beskrivs som förälderns egen belöning, aldrig som spel.

## Grunduppgifter

| Fält | Värde |
|---|---|
| Bundle ID | `com.squareverse.iceiq` |
| SKU | `iceiq-ios` |
| Säljare | SquareVerse Group AB |
| Primär kategori | Sport |
| Sekundär kategori | Hälsa och träning (valfri) |
| Support-URL | `https://iceiq.app` (en sida med kontaktuppgift, helst `/privacy` eller en egen supportsida) |
| Integritetspolicy-URL | `https://iceiq.app/privacy` |
| Supportadress | `support-iceiq@squareversegroup.com` |
| Pris | Gratis. Inga köp i appen i version 1 (Stripe är dolt i appen). |
| Exportregler (kryptering) | Svara: bara standardkryptering (HTTPS). `ITSAppUsesNonExemptEncryption = false` finns redan i Info.plist, så frågan ställs inte vid varje uppladdning. |

## Svenska (primärt språk)

**Namn (max 30):** `Ice IQ – Hockey Stats` (21)
**Undertitel (max 30):** `Matchstatistik & AI-coach` (25)
**Nyckelord (max 100, kommatecken utan mellanslag):**
`hockey,ishockey,statistik,ungdom,spelare,tracker,föräldrar,träning,scouting,matchstatistik,poäng,lag`
(100 tecken. Ord som redan står i namn eller undertitel ska inte upprepas, och Apple tittar inte på mellanslag.)

**Marknadstext (max 170, kan ändras utan ny granskning):**
Logga en match på ett par minuter och få konkreta råd av AI-coachen. Enkelt nog för alla föräldrar, spelare och tränare.

**Beskrivning:**
```
Ice IQ gör det enkelt att hålla koll på en hockeyspelares utveckling.

Logga en match på ett par minuter. Tryck på det som händer: pass, tacklingar, mål. Se hur spelaren utvecklas över säsongen, mot sitt eget snitt.

SÅ FUNGERAR DET
• Lägg till en spelare och välj en mall
• Tryck in händelserna under matchen
• Spara och få en sammanfattning, märken för vana och framsteg, och något att tänka på till nästa gång

AI-COACH
Ice IQ Coach läser matchstatistiken och ger konkret feedback: det som gick bra och det som är värt att öva på. Du bestämmer själv när du frågar. Spelarens uppgifter skickas bara efter ditt godkännande.

DIN EGEN UTVECKLING
Allt jämförs med spelarens eget snitt, aldrig med andra spelare. Fel och misstag syns, men som något man kan öva bort.

MONEY MODE (VALFRITT)
Vill du koppla en liten belöning till det du vill uppmuntra bestämmer du själv vad som räknas och när det ska betalas ut. I Sverige öppnar en genväg Swish.

SMÅ DETALJER
• Dela en matchbild med laget
• Valfritt Face ID-lås
• Data sparas på telefonen så appen öppnas snabbt
• Radera kontot och all data direkt i appen

Ice IQ drivs av SquareVerse Group AB.
```

## English

**Name:** `Ice IQ – Hockey Stats`
**Subtitle:** `Game stats & AI coach` (21)
**Keywords (max 100):** `hockey,youth hockey,stats,tracker,parents,player development,scouting,ice hockey,game log,coach` (95)
**Promotional text:** Log a game in a couple of minutes and get concrete advice from the AI coach. Simple enough for any parent, player or coach.

**Description:**
```
Ice IQ makes it easy to follow a hockey player's development.

Log a game in a couple of minutes. Tap what happens: passes, tackles, goals. See how the player develops through the season, measured against their own average.

HOW IT WORKS
• Add a player and pick a template
• Tap the events during the game
• Save it and get a recap, badges for habits and progress, and something to think about for next time

AI COACH
Ice IQ Coach reads the game stats and gives concrete feedback: what went well and what is worth practising. You decide when to ask. The player's information is only sent after you agree to it.

YOUR OWN PROGRESS
Everything is compared with the player's own average, never with other players. Mistakes are visible, as something to practise away.

MONEY MODE (OPTIONAL)
If you want to attach a small reward to what you want to encourage, you decide what counts and when it is paid out. In Sweden a shortcut opens Swish.

SMALL DETAILS
• Share a game image with the team
• Optional Face ID lock
• Data is kept on the phone so the app opens quickly
• Delete your account and all data right in the app

Ice IQ is operated by SquareVerse Group AB.
```

## Skärmdumpar

Apple kräver 6,9" (1320 × 2868) för iPhone, och räknar om till mindre skärmar. Fånga i simulatorn med en inloggad testanvändare med lite testdata (Cmd+S sparar en bild i rätt storlek):
1. Inmatningen under en match (stora knappar)
2. Sammanfattningen efter matchen (poäng som räknas upp, märken)
3. Coachens två kort ("Det som gick bra" och "Att tänka på")
4. Säsongsöversikten med kurvan
5. Delningsbilden (matchrapporten)

Inga skärmdumpar som visar riktiga barns namn.

## Åldersgräns och App Privacy

**Åldersgräns:** svara ärligt i formuläret. Appen har inget våld, ingen spelsimulering och inget öppet webbläge; Money Mode är en egen räknare, inte spel om pengar. Räkna med 4+ eller 9+ beroende på hur Apple tolkar AI-genererad text. Appen är inte i kategorin Barn.

**App Privacy (svara per datatyp, alla "kopplade till användaren", ej för spårning):**
| Datatyp | Används till |
|---|---|
| Kontaktinformation (e-post, namn) | Appfunktioner, kontohantering |
| Användarinnehåll (spelardata, matchstatistik, coachsamtal) | Appfunktioner |
| Identifierare (användar-ID) | Appfunktioner |
| Övrig användningsdata (källan man hittade oss via) | Analys |

"Spårar användare": **Nej.** Spelardata skickas till Google Cloud (Vertex AI, EU) som personuppgiftsbiträde för att skapa coachens svar, efter användarens godkännande. Svara på frågan om delning med tredje part med den i åtanke.

## Anteckningar till granskaren (App Review Information)

Kräver ett testkonto. **Skapa ett konto med e-post och lösenord och lägg in lite testdata** (en spelare, några matcher). Granskare kan inte använda ditt Apple- eller Google-konto.

```
Demo account
Email: <TESTKONTOT>
Password: <LÖSENORDET>

Ice IQ is a tool for parents and coaches to log a hockey player's games and follow their development. There are no purchases in this version of the app.

How to test:
1. Sign in with the demo account (email and password). Sign in with Apple and Google are also available.
2. Home > Players: pick the demo player. Tap the large "New game" button to jump to the action tiles and tap a few of them. Save the game to see the recap and share dialog.
3. Coach tab: the first time you ask the AI coach, a consent screen explains what is sent and to whom. Accepting is required before any data leaves the app.
4. Account tab: optional Face ID lock, and Delete account (type DELETE to confirm). Deleting removes all player data.

Notes: The Swish shortcut in Money Mode only appears when the app language is Swedish and the Swish app is installed; it opens Swish prefilled and the payment happens outside the app. Money Mode is a parent's own tally of a small reward, not gambling.
```

## Innan inskickning

- [ ] Appikon och splash på plats (klart, `ios/App/App/Assets.xcassets`)
- [ ] Testa på riktig iPhone: Apple-inloggning, Google-inloggning, e-post, radera konto, Face ID-lås, AI-samtycke
- [ ] Avtal i App Store Connect (Paid Apps krävs först när In-App Purchase läggs till)
- [ ] Appen skapad i App Store Connect med bundle-ID ovan
- [ ] Testkonto skapat och inlagt i granskningsanteckningarna
- [ ] Skärmdumpar uppladdade
- [ ] App Privacy ifyllt, åldersgräns ifylld
- [ ] Integritetspolicyn läst av någon med juridisk kompetens
- [ ] Skicka först till TestFlight, prova med ett par föräldrar, publicera därefter

## Kända osäkerheter

- **Radera Apple-konto:** appen loggar in med Apple på nytt före raderingen och försöker dra tillbaka Apple-token (`revokeAccessToken`). Det är inte provat på riktig enhet. Om Apple-token inte kan dras tillbaka på det sättet behöver det göras serversidan med Apples REST-API.
- **Reglerna om AI och personuppgifter** skärptes av Apple under hösten 2025. Samtyckesrutan följer det, men verifiera mot den aktuella lydelsen av riktlinje 5.1.1/5.1.2 innan inskickning.
- **Appen utan köp:** gratisanvändare ser ingen väg att köpa fler AI-krediter. Tillåtet, men en återvändsgränd som In-App Purchase löser i version 1.1.

## Efter publicering: slå på App Store-länkarna

Sidorna påstår inget om appen förrän ni sätter två värden i `.env` (och bygger om och deployar webben):

```
VITE_APP_STORE_ID=<appens numeriska ID från App Store Connect>
VITE_APP_STORE_URL=https://apps.apple.com/se/app/ice-iq/id<ID>
```

Då läggs följande in automatiskt:
- Smart App Banner (`apple-itunes-app`) på alla sidor, så att Safari på iPhone föreslår appen.
- Strukturerad data (`MobileApplication`, iOS, gratis) så att Google kan visa appen.
- En knapp "Ladda ner appen i App Store" på startsidan och i sidfoten (alltså på alla indexerade sidor).

Byt gärna textknappen mot Apples officiella "Download on the App Store"-märke (SVG finns i Apples marknadsföringsresurser, och ska användas oförändrat). Lägg kampanjparametrar på länken (`?pt=<leverantörstoken>&ct=<kampanj>`) för att se i App Store Connect vilka sidor som ger installationer.
