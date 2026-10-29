# Kortens lärloop: tre steg (byggda 2026-10-29)

Mål: korten ska inte vara ett bibliotek som tar slut, utan en ingång till att prova något i en match och märka om det hjälpte. Bygger på docs/card-engine-plan.md. Barnets sida skickar fortfarande ingenting till servern (beslut 1A).

## Steg 2: coachen väljer veckans spår

1. `askCoach` returnerar redan `focusTags` (max två, bara vid tydligt mönster). Nu sparas de även på spelardokumentet som `lastFocus: { tags, at }`, men bara när coachens minne är på (`coachMemoryOff` av betyder att inget sparas) och bara när coachen faktiskt pekade ut något.
2. `getPlayerLinkData` översätter `lastFocus` till ett spårnamn (`suggestedTrack`, t.ex. `focus`) via `functions/cardFocus.js`. Bara spårnamnet lämnar servern, aldrig taggar eller datum. Tipset gäller i 21 dagar.
3. Länken ger spårnamnet till `pickNextPass` (`focusTrack`). Spåret går före barnets nuvarande spår men bara så länge det har osedda pass. Är de slut faller valet tillbaka på vanlig ordning.
4. Idag finns kortinnehåll bara för `fokus_press` (spår `focus`). Fler taggar kopplas in genom en rad i `FOCUS_TAG_TRACK` när korten finns.

## Steg 3: uppföljning i nästa analys

När föräldern kör coachen igen (match-läge) får prompten ett block med förra fokuset (45 dagar): se om mönstret finns kvar i matcher efter det datumet och säg det i en mening. Coachen vet inte om barnet gjort övningen och får aldrig påstå det. Finns inga nya matcher nämns inget. Taggnamn läcker inte in i prompten (`FOCUS_TAG_DESCRIPTION` ger vanlig svenska).

Det som mäts är alltså om mönstret i matcherna ändras, inte om barnet tittat på korten.

## Steg 1: redaktörsskriptet

`node scripts/generate-card-drafts.mjs <källfil.md> [--dry-run]`

- Källfilen (front matter: `person`, `work`, `year`, `lang`, `url?`, `slug?`, sedan texten) lägger ni in själva, t.ex. under `content/sources/`. Modellen får bara skriva ur den texten.
- Resultatet blir fyra kort (intro, fråga, prova, avslut) på sv och en som utkast i `content/card-drafts/<slug>.json`. Mappen läses inte av appen.
- Koden kontrollerar: ett enda citat som måste finnas ordagrant i källan och vara högst 15 ord (läggs bara på källspråkets kort), inga andra citattecken i modellens text, trygghetsrad på nervkort, och att posterna klarar samma regler som ett godkänt kort.
- Utkasten har `source.verified: false`. En människa läser källan, faktakontrollerar, ändrar texten, sätter `status: "approved"` och `source.verified: true`, flyttar filen till `content/cards/legends/` och kör `npm run check:cards`.
- Körs lokalt med `gcloud auth application-default login`, mot Vertex i `europe-west1` (som askCoach).
- Det första anropet mot modellen är inte provkört än: bara promptbygge, tolkning och sanering är testade.

## Att komma ihåg

- Nya spår kräver kort. `legends`-kort måste ha källa med `verified: true` för att byggas in.
- `lastFocus` är härlett ur förälderns matchdata och följer med spelardokumentet i dataexport och radering.
