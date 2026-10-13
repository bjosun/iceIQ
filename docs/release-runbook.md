# Release-runbook: web, funktioner och iPhone-appen

Status 2026-10-15. Beskriver hur man bygger och släpper, vilka reglage som finns, och vad som är levererat. Bygger på det som faktiskt gjorts under hösten 2026.

## 1. Webben och funktionerna

**Mål:** `prod` (iceiq.app) och `v2` (iceiq-v2.web.app, testmål). Båda går mot samma backend.

```bash
npm run build
npx firebase-tools deploy --only hosting:v2        # testmål
npx firebase-tools deploy --only hosting:prod      # produktion
npx firebase-tools deploy --only functions:askCoach,functions:getListenAudio   # enskilda funktioner
```

Att tänka på:
- **Deploya från en ren kopia av det committade**, inte från en arbetskopia med ocommittat arbete: `git worktree add --detach /tmp/deploy HEAD`. Annars följer halvfärdigt med.
- **`revenueCatWebhook`** kräver hemligheten `REVENUECAT_WEBHOOK_AUTH`, som inte är satt. Utan den går ingen funktionsdeploy att genomföra (CLI:n kräver alla hemligheter för samtliga funktioner i filen). Tills hemligheten sätts tas wiringen för `revenueCatWebhook` bort i den tillfälliga kopian före deploy. När RevenueCat kopplas: `firebase functions:secrets:set REVENUECAT_WEBHOOK_AUTH` och deploya funktionen.
- **Node 22** är körmiljön (`functions/package.json`). Node 20 dras tillbaka 2026-10-30. Alla 21 funktioner är uppgraderade.
- **`functions/.env`** är gitignorerad och innehåller röstnamn och reglage (se avsnitt 3). Den måste finnas i deploy-kopian.
- **Inloggningen** till Firebase CLI går ut efter några dagar: `npx firebase-tools login --reauth`.

## 2. iPhone-appen (Capacitor)

```bash
npm run build
npx cap sync ios
```

Därefter i Xcode (`npx cap open ios`): välj **Any iOS Device (arm64)**, **Product → Archive**, **Distribute App → App Store Connect → Upload**.

Om "Any iOS Device" saknas i Xcode går det att arkivera från kommandoraden och sedan ladda upp från Organizer (arkivet hamnar i `~/Library/Developer/Xcode/Archives/<datum>/`):

```bash
xcodebuild archive -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/IceIQ-bN.xcarchive" \
  -allowProvisioningUpdates
```

- **Byggnummer** (`CURRENT_PROJECT_VERSION` i `ios/App/App.xcodeproj/project.pbxproj`) måste vara högre än föregående uppladdning. Marknadsföringsversion är 1.0.
- **Team:** `UZM43Z3K97` (SquareVerse Group AB). **Bundle-ID:** `com.squareverse.iceiq`.
- **Capacitor-plugins** hämtas via Swift Package Manager. Om Xcode klagar på paket: ta bort `SourcePackages` i DerivedData och bygg om.
- Appen innehåller en **egen kopia av webben** (`ios/App/App/public`), så web-ändringar når appen först med ett nytt bygge.
- Nya Capacitor-plugin kräver `npx cap sync ios` och ett nytt bygge.

### Bygge 6 (arkiverat 2026-10-15)
Innehåller: Face ID-lås, Apple-/Google-inloggning, native delning (Snapchat m.fl.), betygsrutan, cache först, appfält och flikrad, "Stäng länken", "Ladda ner mina uppgifter", återkalla AI-samtycke, coachens anteckningar, skrivskyddad spelarlänk. Arkivet ligger som `IceIQ-b6.xcarchive` i Organizer. **Det är inte uppladdat** (det kräver ditt Apple-konto i Xcode).

### Bygge 7 (förberett 2026-10-13, ej arkiverat)
Som bygge 6 plus: dashboardtopp med spelare/säsong/lag, säsongsval och säsongsjämförelse, aktiveringsmejl (serversidan), supportsida på webben. **Endast iPhone** (`TARGETED_DEVICE_FAMILY = 1`), så iPad-skärmdumpar behövs inte. Webbkopian byggdes från ren HEAD (utan röstlabbet) och synkades med `cap sync ios`.

## 3. Reglage och konfiguration

| Reglage | Var | Standard | Betydelse |
|---|---|---|---|
| `LISTEN_VOICE_SV_F` / `_M`, `LISTEN_VOICE_EN_F` / `_M` | `functions/.env` | Chirp 3 HD: Zephyr (kvinna), Umbriel (man) | Röster för lyssnaklippen. Byt namn och deploya `getListenAudio` |
| `INACTIVE_CLEANUP_ENABLED` | `functions/.env` | av (bara loggning) | Slår på varning och radering av konton inaktiva i 24 månader |
| `ROUTINE_LOGGING_ENABLED` | `functions/.env` | av | Spelarlänken sparar rutindatum. Av i v1 (länken är skrivskyddad) |
| `VITE_APP_STORE_ID`, `VITE_APP_STORE_URL` | `.env` | tomma | Slår på App Store-knapp, Smart App Banner och strukturerad data efter publicering |
| `VITE_STRIPE_PUBLISHABLE_KEY` m.fl. | `.env` | satta | Stripe på webben |

## 4. Det som är byggt (kort)

- **Spelarlänken** (`/p/:token`): kurva, märken, lyssnaklipp (Google Chirp 3 HD, EU, ingen cache, namnfri text), andningsövning. Skrivskyddad. Se `docs/player-link-coach-plan.md`.
- **Coachen:** talat manus, korten "det som gick bra" och "att tänka på", anteckningar som går att se, rensa och stänga av, samtyckesruta, återkallelse.
- **Rättigheter i appen:** radera konto, ladda ner uppgifter, stäng spelarlänk, återkalla AI-samtycke.
- **Integritet:** Firestore i `eur3`, AI och text-till-tal via EU, inga ljud sparas, UTM i minnet, rensning av inaktiva konton (avstängd).
- **Betalning:** Stripe på webben. RevenueCat-webhook finns (ej deployad). Inga köp i appen i v1.
- **Mätning:** anonyma räknare för lyssnakortet i `listenStats/<datum>`.

## 5. Dokument

| Dokument | Innehåll |
|---|---|
| `docs/ios-app-plan.md` | iPhone-appens plan och beslut |
| `docs/app-store-listing.md` | Texter, skärmdumpar, App Privacy, granskaranteckningar, checklista |
| `docs/player-link-coach-plan.md` | Spelarlänk, lyssnaklipp, framtida barnchatt, juridik |
| `docs/legal-review-brief.md` | Fakta för jurist/AI-granskning |
| `docs/legal-review-prompt.md` | Färdig prompt för juristgranskning och DPIA |
| `docs/gdpr-art6-mapping.md` | Rättslig grund per uppgift, minimering |
| `docs/legal-review-chatgpt-triage.md` | Sorterad granskning och beslut |
| `docs/payout-methods.md` | Swish och andra länders utbetalningsgenvägar |
| `docs/voice-coach-plan.md` | Röstcoach för föräldrar (inte byggd) |

## 6. Före inskickning till App Store (checklista)

- [ ] Ladda upp bygge 6 (eller nyare) till TestFlight och prova på telefon: inloggning (Apple, Google, e-post), radera konto, Face ID, AI-samtycke och återkallelse, delning till Snapchat, "Stäng länken", "Ladda ner uppgifter"
- [ ] Testkonto med testdata och granskaranteckningar
- [ ] App Privacy och åldersklass i App Store Connect
- [ ] Trader-uppgifter (DSA): namn, adress, telefon, e-post
- [ ] Skärmdumpar uppladdade (`marketing/app-store-screenshots/`)
- [ ] Juristgenomgång: rättslig grund per behandling, leverantörsavtal och överföringsmekanism, villkoren (ansvar, ändringsrätt, köp/ångerrätt), DPIA signerad
- [ ] Efter publicering: sätt `VITE_APP_STORE_ID`/`VITE_APP_STORE_URL`, bygg och deploya webben

## 7. Kända luckor

- Radera konto med Apple-inloggning (token-återkallelse) är inte provad på riktig enhet.
- iPad är inte anpassad (rekommendation: iPhone-only i v1; ändra under Deployment Info i Xcode).
- Barnchatt är inte byggd och ska hållas avstängd tills barnflöde och regionala regler är lösta.
- Röstkoden (`src/voice`, `VoiceLab`) är ocommittad arbetskopia och är inte del av någon release.
