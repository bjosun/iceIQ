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
