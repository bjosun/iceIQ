# Utbetalningsgenvägar i Money Mode (per land)

Status 2026-10-10. Money Mode är förälderns egen räknare av en belöning. Appen betalar inte själv. En "genväg" öppnar bara förälderns betalapp förifylld; betalningen sker utanför Ice IQ och bekräftas av föräldern.

## Regel

Genvägen avgörs av **land** (telefonens/webbläsarens region), inte appens språk. Se `src/utils/payout.ts`:

- `sv-SE`, `en-SE`, `sv` -> Sverige -> **Swish**
- Alla andra länder -> ingen genväg. Bara knappen "Betald" (markera som betald), som förut.

Ett nytt land läggs till som en post i `PAYOUT_METHODS` plus en liten komponent som `SwishButton`. Användarens egna uppgift (nummer/användarnamn) sparas **bara lokalt** på enheten, aldrig i Firestore, aldrig i spelarvyn.

## Läge per land

| Land | Metod | Förifyllning via länk | Anmärkning |
|---|---|---|---|
| Sverige | Swish | `swish://payment?data=...` (nummer, belopp, meddelande) | **Byggd.** Inte provad på riktig telefon med Swish än. Inte ett officiellt API för privatnummer. |
| Norge | Vipps | Okänt. Vipps har inget öppet P2P-API för förifyllning som jag vet; kan vara en ren app-öppning utan belopp. | Utred innan bygge. |
| USA | Venmo, Cash App, Zelle | Venmo och Cash App har länkar med användarnamn/belopp; Zelle saknar. | Fråga användarna vilken som används innan något byggs. Flera metoder kan behövas. |
| Kanada | Interac e-Transfer | Ingen djuplänk till banken. | Troligen bara "Betald"-knappen. |
| Storbritannien | Banköverföring / Monzo / PayPal.me | Varierar | Lågt värde att bygga tills det visar sig efterfrågat. |

**Obs:** formaten ovan är inte verifierade, förutom Swish som är byggt men oprovat. Verifiera mot respektive tjänst och en riktig enhet innan en ny metod byggs.

## Att tänka på för varje land

- **Valuta:** Money Mode visar idag "kr" för svenska och "USD" för allt annat, styrt av språk (`moneyModeUnit` i `src/utils/pricing.ts`). En norsk användare skulle se USD. När ett land läggs till bör enheten också styras av region (NOK, CAD, GBP).
- **Vad ska sparas:** en identifierare per spelare (nummer eller användarnamn). Samma lokala lagring, en nyckel per metod, aldrig på servern.
- **Texter:** samma ton som övrigt: förälderns egen belöning, inget spelande.
- **App Store:** pengar mellan privatpersoner utanför appen är tillåtet. Beskriv det som förälderns utbetalning, inte som insamling.
