# Utmärkelser (gems) — plan och status

Beslutad i samtal 2026-10-13. Byggt och deployat till v2-sajten (https://iceiq-v2.web.app) för granskning; **inte** i produktion (`prod`) än.

## Idé
Efter varje match får spelaren högst EN utmärkelse, om matchen förtjänar det. Det ska kännas som ett spel: poäng vunna och förlorade, och nästa match är chansen att slå den. Samlingen visas på en hylla med låsta/upplåsta gems.

## Principer (samma som badges.ts och matchHighlight.ts)
- Bara sådant som är belagt i den loggade datan. Hellre ingen utmärkelse än en felaktig.
- Aldrig en jämförelse med andra spelare.
- Regelbaserat — ingen AI, ingen kredit, deterministiskt. AI kan i framtiden formulera en textrad, men väljer aldrig gemet.
- Den ovanligaste uppfyllda utmärkelsen vinner (se `priority` i `src/utils/awards.ts`).

## Gränser
- Inga varumärken (Gucci, Rolex, riktiga spelare eller tredjeparts trofénamn).
- Inga vapen eller droger. Bling, is, guld, diamanter och kronor är okej.
- Inga sedlar eller liknande som kan läsas som spel om pengar (Money Mode finns redan).

## Fem ringar (Go Rin no Sho) = gemets färg
| Ring | Gem | Handlar om |
|---|---|---|
| Eld | Rubin | Anfall och mål |
| Vatten | Safir | Flöde och spel |
| Jord | Bärnsten | Grund och försvar |
| Vind | Smaragd | Fart och press |
| Tomhet | Diamant | Lugn och disciplin |

## Två stilar, samma regler
- **Playful** (`kid`): färgat gem med ögon och tillbehör (tophat + monokel, krona, samurajknut …).
- **Street** (`pro`): svart onyx med ringens färg som kant och guld som bling (guldpuckar, krona med diamanter, isblå solglasögon, guldtackor).
- Valet sparas i `localStorage` (`iceiq-gem-style`) och kan bytas på hyllan.

## Utmärkelser och regler
Se `AWARDS` i `src/utils/awards.ts` — det är sanningen. Aktioner matchas på sitt **engelska** namn (det är nyckeln `saveGame` sparar). Egna mallar får därför inga utmärkelser.

## Var det syns
- **Efter sparad match:** kort i matchsammanfattningen (`MatchSummaryReveal`).
- **Hylla:** under märkena i säsongsvyn (`SeasonOverview` → `AwardShelf`). I exempelläget visas hyllan med alla gems låsta.

## Trösklar
Kalibrerade 2026-10-13 mot 20 sparade backmatcher: ungefär hälften av matcherna ger en utmärkelse (11 av 20) och de som loggar lite får ingen. De vanligaste utmärkelserna träffar ungefär var sjunde match, de svåra mer sällan. Underlaget är en enda spelare på en position — forward- och målvaktsvärdena är utlästa i förhållande till backarna och bör ses över när det finns riktiga matcher.

Äldre matcher kan ha sparat aktioner under hela namnobjektet som JSON-nyckel; det normaliseras i `awards.ts`. Aktioner som mallen inte känner igen räknas som okända och blockerar "Rent bord".

## Delbar matchbild
Gemet och utmärkelsens namn ritas vid poängsiffran i bilden (`matchReport.ts`). Grafiken kommer från `utils/awardGem.ts`, samma källa som komponenten i appen, och följer den stil spelaren valt på hyllan.

## Återstår
- [ ] Justera trösklarna för forward och målvakt när riktiga matcher finns.
- [ ] Nivåer (brons/silver/guld) på samma gem vid upprepade utmärkelser.
- [ ] Låt AI formulera en kort textrad vid utmärkelsen när coachen ändå frågats (valfritt).
- [ ] Besluta om samuraj-titlarna (`sub`) ska vara synliga för barnen.
- [ ] Låta barnen själva välja stil och utvärdera i produktion.
- [ ] Rita om tillbehör som inte känns igen när de testats av målgruppen.
