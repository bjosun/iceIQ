# Konto som uppger sig vara 11 år (upptäckt 2026-10-24, dokumenterat 2026-10-30)

Status 2026-10-30: **kontot raderat** (Björn godkände) och två skydd byggda och deployade, se längst ned.
Frågan om juridisk bedömning kvarstår (`docs/legal-review-draft.md`). Dokumentet innehåller medvetet inga namn eller
adresser; kontot hittas i Firestore via `coachChats` (se längst ned).

## Vad vi vet

| Fakta | Källa |
|---|---|
| Kontot registrerades 2026-09-30 med e-post och lösenord (inte Google), via formuläret `SignupForm`. | Firebase Auth |
| Två minuter senare skrev användaren i AI-coachen: att hen är 11 år och spelar i ett lag i Manitoba, Kanada. Det är den enda uppgiften om ålder. | `users/{uid}/coachChats`, en chatt |
| Användaren har aldrig skapat någon egen spelare. Det enda spelardokumentet var exempelspelaren, som skapades av ett fel i `askCoach` och togs bort 2026-10-28. | Firestore, `docs/ai-coach.md` |
| Inga matcher sparade. Coachen användes tre gånger (gratiskrediterna). | Firestore |
| Ingen fältdata om ålder, födelseår eller vårdnadshavare finns på kontot. | Firestore |
| Villkoren och integritetspolicyn säger att tjänsten är för vuxna (föräldrar, vårdnadshavare, tränare) och att barn inte skapar konton. Registreringen kräver inget intygande av det. | `src/pages/Terms.tsx`, `src/pages/Privacy.tsx`, `SignupForm.tsx` |

## Vad vi inte vet

- Om uppgiften stämmer. Den är självdeklarerad och går inte att verifiera.
- Om vårdnadshavare känner till kontot.
- Om AI-samtycket har givits på kontot. Att samtycket gavs sparas bara i webbläsarens lagring (`aiConsent.ts`); i databasen finns bara en återkallelse (`aiConsent.withdrawnAt`).

## Vilka uppgifter om personen vi har

E-postadress, en coachchatt som skickades till Googles Gemini för att besvaras, och
kontots kredit- och inloggningsdata. Inget annat, eftersom ingen spelare eller match har sparats.

## Varför det spelar roll (ej juridisk bedömning)

Amerikanska COPPA och motsvarande regler i Kanada ställer krav när en tjänst har faktisk
kännedom om att en användare är under 13. Tjänsten är inte riktad till barn, men
kännedomen finns nu i vår egen databas. Det är en fråga för någon som kan lagen.

## Alternativ

1. **Radera kontot och chatten** (finns som `deleteMyAccount`). Minst data kvar och det
   tydligaste skyddet. Ingen kontakt med barnet.
2. **Lämna kontot som det är.** Behåller kännedomen utan åtgärd. Rekommenderas inte.
3. **Kontakta uppgiven vårdnadshavare.** Vi har ingen vårdnadshavares uppgifter, bara barnets e-post.

Förslag: alternativ 1 efter Björns beslut, och att fallet tas upp i den juridiska genomgången.

## Förebyggande åtgärder att välja bland

BankID fungerar inte som lösning: trafiken är mest Kanada och USA, och BankID finns bara i Sverige.
Ålder går i praktiken inte att verifiera, så målet är rimlig omsorg och att dokumentera den.

| Åtgärd | Arbete | Effekt |
|---|---|---|
| Kryssruta vid registrering: "Jag är 18 år eller äldre, eller förälder/vårdnadshavare" | Litet | Gör villkoren aktiva och ger ett loggat intygande |
| Åldersfråga med födelseår som inte avslöjar gränsen, och avvisning under 13 | Litet–medel | Standardlösning mot barn som uppger fel ålder |
| Coachen avbryter om användaren uppger sig vara under 13 och hänvisar till en förälder | Litet (prompt) | Mindre data in till AI-tjänsten |
| Spara samtycke (version, tidpunkt) i databasen och inte bara i webbläsaren | Litet | Går att visa i efterhand |

## Så hittar du kontot

Sök i Firestore under `artifacts/default-app-id/users/*/coachChats` efter en chatt från
2026-09-30 vars första användarmeddelande nämner en ålder. Användar-id:t är mappen ovanför.

## Gjort 2026-10-30

- **Kontot raderat:** användardokumentet med coachchatten, inloggningen i Firebase Auth. Ingen Stripe-kund och inga spelarlänkar fanns. Samma steg som `deleteMyAccount`, utförda som admin.
- **Kryssruta vid registrering** (e-post, Google och Apple): "Jag är 18 år eller äldre, eller förälder eller vårdnadshavare som skapar kontot åt ett barn." (`SignupForm.tsx`)
- **Coachen avbryter** om användaren i första person uppger en ålder 5–12, före allt AI-anrop, utan att spara och utan kreditavdrag (`functions/minor_guard.js`, med tester). Förälder eller tränare som skriver "min son är 11" stoppas inte.

Kvar: att samtycket (version och tid) sparas i databasen, och den juridiska genomgången.
