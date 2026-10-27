# Räknare för första användningen

Byggt 2026-10-15 för att kunna se *var* nya konton tar slut. Appen hade ingen produktanalys alls.

## Vad som mäts
Milstolpar, en gång per konto, som tidsstämp på användarens eget dokument:

`artifacts/default-app-id/users/{uid}` → `funnel.{steg}` = ISO-tidsstämp

| Steg | Betyder |
|---|---|
| `dashboardViewed` | öppnade dashboarden |
| `addPlayerOpened` | öppnade "lägg till spelare" |
| `demoActionTapped` | tryckte en aktion i exempelläget |
| `demoSaveBlocked` | försökte spara i exempelläget |
| `actionTapped` | tryckte en aktion med en riktig spelare |
| `saveTapped` | tryckte spara |
| `gameSaved` | matchen sparades |
| `historyLockSeen` | såg att äldre matcher är låsta (gratisfönstret, 5 matcher) |
| `historyUnlockClicked` | tryckte "lås upp" i den rutan |

Vid kontoskapande sparas dessutom `acquisition.referrer` (avsändarens värdnamn, t.ex. `google.com`) och `acquisition.landing` (sidans sökväg utan frågesträng).

## Vad som inte mäts
Inget innehåll (inga namn, aktioner eller poäng), ingen händelseström, ingen ip-adress, ingen enhetsidentitet, inga tredjepartsverktyg, ingenting skrivs till enhetens lagring. Referrer och landning hålls i minnet tills kontot skapas, samma princip som UTM-fångsten (`utils/helpers.ts`).

## Var det syns
Veckorapporten till Björn (`opsDigest`, måndagar 07:30), avsnittet "Första användningen". Torrkörning: `runOpsDigestNow` ger `funnel` och `funnelAccounts` i svaret.

## Att tänka på
- Räknas bara från att mätningen startade, och bara för konton som öppnat appen efter det.
- Tratten visar var kedjan tar slut, inte varför. Det svaret kommer från att fråga folk (se `outreach-stalled-users.md`).
- Integritetspolicyn bör nämna att användningsmilstolpar och avsändare sparas — kontrollera mot den svenska policytexten innan produktion.
- `getUserDataCached` är cache-först, så ett steg kan i sällsynta fall få ett senare datum än det första tillfället. Räknas ändå som nått.

## Kod
- `src/utils/funnel.ts` — `trackFunnel(uid, steg)`
- `src/utils/acquisitionContext.ts` — avsändare och landning
- `src/pages/Dashboard.tsx` — mätpunkterna
- `src/contexts/AuthContext.tsx` — slår ihop UTM och avsändare vid registrering
- `functions/index.js` — `runOpsDigest`

## Ett-klicks-svar i nudge-mejlet ("Vad kom i vägen?")
Nudge-mejlet har tre klickbara svar: *Jag visste inte hur jag skulle komma igång*, *Jag väntade mig att den skulle följa matchen automatiskt*, *Inte något för mig just nu*.

- Länken bär kontots id och en signatur (HMAC, samma mönster som avprenumerationen). En klick på länken **sparar ingenting**; den visar en sida med en knapp och en valfri kommentar, och först knappen (POST) sparar. Det skyddar mot mejlskannrar som hämtar alla länkar i ett mejl.
- Svaret sparas på användarens eget dokument: `nudgeFeedback: { reason, comment?, at }`. Kommentaren är högst 500 tecken.
- Adressen är `https://www.iceiq.app/nudge-feedback` (hosting-rewrite till funktionen `nudgeFeedback`).
- Veckorapporten har avsnittet "Vad kom i vägen?" med antal per svar och de tio senaste, med e-post, så att du kan följa upp med just den personen.
- Kod: `functions/nudgeFeedback.js` (med test `functions/nudgeFeedback.test.js`) och `buildActivationNudgeEmail` i `functions/index.js`.
- Nyckeln är den befintliga `DIGEST_TEST_TOKEN` med ett eget prefix.

