# Mallar för utespelare: gemensam bas och roller

Status 2026-10-16. Källa: `src/contexts/TemplateContext.tsx`.

Back, forward och center delar **samma basaktioner** (`skaterBase`: zoninträde, passningar, tackling, sargdueller, poke check, blockerade skott, skott på mål, mål, assist, på isen vid mål, pucktapp, utvisning). Varje roll lägger till det lilla extra:

| Roll | Extra |
|---|---|
| **Back** | Avvärjer anfall (gap), löser stressad situation, kontrollerad rensning, höll blålinjen, panikrensning (minus). Skott på mål ger 2 p (övriga 3) |
| **Forward** | Tekning, dribbling, skapad målchans, forecheck/backcheck, **defensivt arbete**: täcker fickan, täcker backen vid blå, hjälper backen i hörnet, tappar sin täckning (minus). Minus: missat skott, pucktapp offensiv zon, offside |
| **Center** | Allt forwarden har, plus tekning i egen och offensiv zon (extra poäng), täcker högt som tredje man, utspelsstöd, står framför mål, skyddar pucken (kring), förlorad tekning i egen zon (minus) |

Regler vid ändring:
- **Byt aldrig engelskt namn på en befintlig aktion.** Det är nyckeln i sparade matcher, utmärkelser (`awards.ts`) och coachens analys. Lägg bara till nya.
- Nya defensiva aktioner läggs också i `DEFENSIVE_ACTIONS` i `awards.ts` så att "tvåvägsspelare" och "tät" räknar dem.
- Utmärkelser: `center` delar forwardens utmärkelser. Tekningskungen räknar vanlig tekning plus zonvarianterna.
- Egna mallar användare redan sparat berörs inte.

Ändrade poäng för befintliga mallar: forward fick fler aktioner (passningar, poke check, blockerat skott, pucktapp) men inga befintliga poäng ändrades. Back är oförändrad.
