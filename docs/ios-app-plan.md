# iPhone-app (App Store) — plan och status

Status: Capacitor-skal uppsatt, ej byggt eller testat. Skriven 2026-10-05.

## Mål

Ice IQ som app i App Store. Efterfrågan kommer från spelare som säger att deras föräldrar börjar använda tjänsten. Appen ska vara samma produkt som webben, inte en separat kodbas.

## Gjort

- Capacitor 8 + iOS-plattform i `ios/`, konfiguration i `capacitor.config.ts`.
- App-ID `com.squareverse.iceiq`, namn "Ice IQ". **ID:t kan inte ändras efter första inskickningen.**
- Plugins: app, status-bar, splash-screen, haptics, keyboard. Swift Package Manager, ingen CocoaPods.
- `npm run build` + `npx cap sync ios` kopierar webbygget till iOS-projektet.

## Arbetsflöde

```
npm run build
npx cap sync ios
npx cap open ios      # öppnar Xcode
```

Xcode: välj team (Developer-kontot), Product → Archive → Distribute App → App Store Connect.

## Krav (ägaren)

1. Nyare macOS (krävs för aktuell Xcode).
2. Xcode från Mac App Store, därefter `sudo xcode-select -s /Applications/Xcode.app`.
3. Apple Developer-konto, 99 USD/år.
4. App Store Connect: appost, kategori (förslag: Sport), App Privacy-formulär, åldersgräns.

## Kända blockerare i koden

| Problem | Status |
|---|---|
| Google-inloggning med popup fungerar inte i iOS-skalet | **Löst i koden** (2026-10-05). `src/contexts/AuthContext.tsx` använder `@capacitor-firebase/authentication` i appen och popup på webben. Kräver konfiguration, se nedan. |
| "Sign in with Apple" krävs av Apple (guideline 4.8) | **Löst i koden.** `src/components/auth/AppleSignInButton.tsx`, visas bara i iOS-appen. Kräver konfiguration, se nedan. |
| Relativa API-adresser | **Icke-problem.** Stripe går via Firebase callable functions (absoluta adresser). `API_ENDPOINTS` i `constants.ts` används inte. |
| Stripe-redirect får inte användas för digitala köp i appen | **Dolt i appen** (2026-10-06) via `isNativeApp` i `src/utils/platform.ts`: prismodal, kreditköp, hantera-prenumeration, förfallen-betalning-banner och prissektionen på startsidan. Webben opåverkad. In-App Purchase är inte byggt än. |
| `public/manifest.json` var tom | **Löst.** Ifylld och länkad från `index.html`. `icon-512.png` är uppskalad från 192 px, byt mot riktig 512/1024-ikon. |

Firebase är uppgraderat 10 → 12 (kravet från inloggningspluginet). Bygget och i18n-kontrollen går igenom, men appen är inte körtestad efteråt: testa inloggning, matcher och Stripe på webben innan deploy.

### Konfiguration som krävs för inloggningen (ägaren)

Testat i simulatorn 2026-10-06: appen startar och inloggningssidan visar Google- och Apple-knapparna. Utan `GoogleService-Info.plist` ger Google-knappen felet "Google sign-in provider is not enabled" (missvisande: pluginet hoppar över all setup när filen saknas). Det försvinner när steg 2 nedan är gjort.

1. **Firebase Console → Authentication → Sign-in method:** aktivera Apple (och bekräfta Google).
2. **Firebase Console → Project settings → lägg till iOS-app** med bundle-ID `com.squareverse.iceiq`. Ladda ner `GoogleService-Info.plist` och lägg den i `ios/App/App/` (Xcode: dra in, "Copy items if needed", target App).
3. **Xcode → App → Signing & Capabilities:** lägg till "Sign in with Apple".
4. **Xcode → Info → URL Types:** lägg till `REVERSED_CLIENT_ID` från plist-filen som URL scheme (krävs för Google-inloggning).
5. **Apple Developer → Identifiers:** aktivera Sign in with Apple för app-ID:t, och koppla Apple-leverantören i Firebase (Services ID, key, team ID).
6. Lägg till `NSMicrophoneUsageDescription` i `Info.plist` när röstcoachen kommer med.

Apple kan avvisa en ren webbsida i skal (guideline 4.2). Native push, haptik och offline-stöd gör appen tillräckligt "app". Räkna med 1–2 avslagsrundor första gången.

## Betalning

Två kassor, ett konto. Användaren ser aldrig skillnaden.

- **Webb:** Stripe som idag.
- **iPhone:** Apple In-App Purchase via RevenueCat. 15 % provision under 1 M USD/år (Small Business Program), annars 30 %.
- **Gemensamt:** Firebase-användaren har ett Pro-fält som sätts av antingen Stripe-webhooken eller RevenueCat-webhooken. Appen frågar bara "är användaren Pro?".
- Köp gjort på webben får användas i appen. Appen får inte uppmana till webbköp.
- Priset i appen får vara något högre för att täcka Apples andel.
- Länk-ut-till-Stripe är tillåtet i USA men reglerna ändras. Verifiera aktuellt läge innan beslut.

Alternativ: lansera v1 gratis (gratismatcher) och lägg till IAP i v2. Kortar vägen till första godkännande, men ingen iPhone-intäkt under tiden.

## Marknadsföring i App Store

- **Sökoptimering (ASO):** appnamn, undertitel (30 tecken) och dolt nyckelordsfält (100 tecken). Sökord: hockey stats, hockey tracker, youth hockey, scouting.
- **Skärmdumpar och förhandsvideo:** det föräldrar tittar på före installation. Återanvänd material från Instagram-rutinen.
- **Betyg:** be om betyg med Apples egen dialog efter en lyckad stund (t.ex. efter en sparad match).
- **Apple Search Ads:** vänta tills värdet av en installation är känt.
- Copy följer [copy-tonen](../README.md): inga användarantal, enkelhet först, vuxenriktat.

## Öppna frågor från spelare och föräldrar

### 1. Swish i Money Mode (Sverige)

Idé: Money Mode öppnar Swish förifyllt med bandets/lagets nummer, så att föräldern kan betala.

Bedömning: **genomförbart, men håll det enkelt.**
- Swish går att öppna från appen med en djuplänk (`swish://payment?data=...` med nummer, belopp och meddelande). Det fungerar i praktiken men är inte ett officiellt API för privatpersonsnummer. **Verifiera på riktig telefon innan vi lovar något.** Alternativ: visa Swish-QR för lagets nummer.
- Appen får ingen bekräftelse tillbaka. Det är en genväg, inte en betalintegration. Ingen Swish Handel-avtal behövs.
- Numret ska vara bandets/lagets (föreningsnummer), inte ett privat nummer, av integritetsskäl. Lagras per lag, inte per spelare.
- Betalningen sker utanför appen. Apple-risk: pengaöverföring mellan personer är tillåtet, men "donationer" i appen kan kräva godkänd ideell organisation. Formulera som förälderns egen utbetalning/belöning, inte insamling.
- Copy: vuxenriktat och utvecklingsfokuserat, inget spelande-språk.
- Bara Sverige (språk/land). Visa knappen när språk = sv.

### 2. Barnen ser sina poäng i appen

Barn vill se egna poäng och jämföra med lagkamrater och kompisar i andra lag. Det är värdefullt men känsligt: minderårigas personuppgifter, App Store-regler för barn och GDPR (Sveriges åldersgräns för samtycke är 13).

Förslag i tre steg, minst risk först:
1. **Spelarvy utan eget konto.** Föräldern delar en skrivskyddad länk eller kod. Barnet ser sin egen utveckling. Ingen inloggning, ingen chatt, ingen fri text.
2. **Lagtavla.** Lagets admin (förälder/tränare) bjuder in. Föräldern samtycker per spelare. Visas med förnamn/smeknamn, bara inom laget.
3. **Mellan lag/kompisar.** Efter samtycke och med smeknamn. Inga meddelanden mellan barn.

**Beslut (2026-10-05):** poängen sätts av föräldrar och är subjektiva, precis som när man räknar skott: ingen ser allt. En rak rankning mellan spelare vore orättvis och kan skada. Därför jämför vi **egen utveckling över tid**, aldrig "vem är bäst". Lagets snitt kan visas som sammanhang, inte som rankning. Gäller steg 1–3.

## Nästa steg

1. Ägaren uppgraderar macOS, installerar Xcode, skaffar Developer-konto.
2. ~~Ersätt popup-inloggningen~~ Klart i koden. Konfiguration enligt listan ovan.
3. Ikoner (1024 px) och splash. ~~Dölj Stripe i appen~~ Klart. Kvar: `ai.upsellDesc` talar om uppgradering, justera texten för appen när IAP finns.
4. Kör i simulatorn, åtgärda problem.
5. Betalning: RevenueCat + gemensamt Pro-fält.
6. Spelarvy (steg 1 ovan) och Swish-genväg.
7. TestFlight, därefter inskickning.

## Priser och vad folk betalar för

Nuvarande priser (webb, Stripe): Premium 29 kr/mån eller 299 kr/år ($2.99 / $29), Elite 89 kr/mån eller 890 kr/år ($9.90 / $99), kreditpaket 15 krediter för 49 kr ($4.99). Gratis: 3 välkomstkrediter. Premium: obegränsat antal spelare, molnsynk, avancerad statistik, 50 AI-krediter/mån. Elite: 500 krediter/mån, prioriterad support (röstcoach planerad här).

**Vi vet inte än vad som faktiskt säljer.** Ta fram det ur Stripe (andel Premium vs Elite vs kreditpaket, månad vs år) innan priserna ändras.

Hypoteser att mäta, inte fakta:
- Värdet föräldern betalar för är AI-råden efter matchen och att historiken följer med över säsongen, inte själva räknandet.
- Hockey är säsongsbaserat: årsplanen/säsongspasset är rimligen den viktigaste planen i appen.
- Röstcoachen är den dyra, tydligt nya funktionen och bär Elite.

Apple: samma listpris går bra, 15 % provision under 1 M USD/år. Apple har fasta prispunkter per land (t.ex. $9.99, inte $9.90). Kreditpaketet blir en förbrukningsvara (consumable) och planerna autoförnyande prenumerationer.
