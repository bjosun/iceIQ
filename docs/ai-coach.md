# AI-coachen: vad den ser och vad den kostar

Coachen är Cloud Function `askCoach` (europe-west1) i `functions/index.js`. Klienten är `src/components/ai/AiCoach.tsx`.

## Underlag till modellen

Allt nedan byggs ihop till ett datablock i prompten.

| Underlag | Källa | Täcker |
|---|---|---|
| Pågående session | klienten (`playerStats.stats`) | dagens match, inte sparad än |
| Historik | klienten (`playerStats.history`) | de 3 senaste matcherna i detalj |
| Säsongsöversikt | klienten (`playerStats.season`) | snitt, bästa match, snitt senaste 5 |
| Säsongstotaler per aktion | servern, `computeSeasonTotals` | summa över **alla** sparade matcher |
| Matchlogg | servern, `computeSeasonTotals` | en rad per match (datum · lag · poäng · aktioner), äldst först, max `COACH_GAME_LOG_MAX` = 80 |
| Tidslinje | spelardokumentet (`coachTimeline`) | coachens daterade anteckningar om spelaren, om föräldern inte stängt av minnet (`coachMemoryOff`) |
| Chatthistorik | klienten | de 10 senaste meddelandena |

Totalerna och matchloggen läses från `users/{uid}/players/{namn}/games` med en enda fråga, så de ger ingen extra väntetid. Aktionsnycklarna är de engelska namnen. Äldre matcher har JSON-nycklar `{sv,en}`, som normaliseras på samma sätt som i `src/utils/awards.ts`.

**Begränsningar**
- Totalerna gäller alla sparade matcher, inte en enskild säsong.
- Dagens osparade match räknas inte in i totalerna.
- Motståndarlag sparas inte, så coachen kan inte jämföra prestation per motstånd. Ett valfritt motståndarfält byggs först om användare efterfrågar det.

## Krediter

- Månadsransonen ligger i `aiCredits` och köpta krediter i `purchasedCredits`. Gratisplanen får `FREE_MONTHLY_CREDITS`.
- `deductAiCredit` drar en kredit per svar, månadsransonen först.

**Exempelspelaren**

När kontot inte har några spelare visar dashboarden "Erik (example)" / "Erik (exempel)".
- Frågor om exempelspelaren är gratis upp till `DEMO_COACH_FREE` = 3.
- De räknas i `artifacts/default-app-id/coachDemoUsage/{uid}`, som bara servern kan skriva till.
- Svaret innehåller `demoFreeLeft`, och klienten visar hur många gratisfrågor som återstår.

**Exempelspelaren sparas aldrig**
- `askCoach` sparar tidslinjen bara på spelare som redan finns.
- `savePlayer` och `saveGame` i `src/services/firestore.ts` ignorerar demonamnen (`isDemoPlayerName` i `src/utils/demoData.ts`).

## I appen

Säsongsvyn (`SeasonOverview`) visar rutan "Totalt" (`SeasonTotals.tsx`): total och snitt per match för varje aktion i vald period, de 8 vanligaste först.

## Elite-analys

Elite (`gemini-2.5-pro`) får samma underlag som övriga planer, plus "Snitt per säsong" (klienten skickar `playerStats.seasons`, servern validerar med `eliteSeasons`). Den första matchanalysen utökas då med rubrikerna "Säsongen hittills" och "Utvecklingsplan (3 veckor)", byggda på matchloggen och säsongstotalerna ovan. Uppföljningsfrågor och mentalt läge påverkas inte. Svarstaket är högre för Elite (`maxOutputTokens` 5632).

## Deploy

```bash
npx -y firebase-tools deploy --only functions:askCoach --project squareverse-36179
```

Ändringar i appen deployas med `hosting:prod` (iceiq.app) eller `hosting:v2` (iceiq-v2.web.app). Båda målen delar funktioner och regler.
