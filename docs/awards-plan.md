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

## Återstår
- [ ] Rita tillbehör till övriga utmärkelser (idag har bara Hattrick, Målkungen, Spelfördelaren, Muren, Jägaren, Iceman och Nollan egna). Förslag: hjälm (Dörrvakten), målvaktsmask (Räddningsmaskinen), katana (Skarpskytten).
- [ ] Justera trösklar när riktiga matcher finns (nuvarande siffror är gissningar för barnhockey).
- [ ] Nivåer (brons/silver/guld) på samma gem vid upprepade utmärkelser.
- [ ] Låt AI formulera en kort textrad vid utmärkelsen när coachen ändå frågats (valfritt).
- [ ] Visa gemet även i den delbara matchbilden (`shareCanvas.ts`).
- [ ] Besluta om samuraj-titlarna (`sub`) ska vara synliga för barnen.
- [ ] Låta barnen själva välja stil och utvärdera i produktion innan `deploy:prod`.
