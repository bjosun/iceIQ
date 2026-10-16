# Coachens specialistlägen och agentspåret

Status 2026-10-16.

## Beslut

En coach (`askCoach`), flera **lägen** i samma funktion i stället för flera agenter på en plattform. Skäl: datan som finns är matchdata, ett läge är ett prompttillägg (inga nya tjänster), och allt behandlas redan i EU enligt policyn.

| Läge | Status | Hur |
|---|---|---|
| **Matchanalys** | Finns (standard) | Tre rubriker (Trend, Styrkor, Fokusområde) och följdfrågor som svarar direkt |
| **Mental träning** | Byggt 2026-10-16 | Väljs med flikarna ovanför snabbfrågorna. Klienten skickar `mode: 'mental'`; servern lägger till ett specialistblock sist i systemprompten (`mode` i `functions/index.js`). Ger 2 till 4 små övningar, inga rubriker, hänvisar till vuxen vid allvarligt mående, inga diagnoser |
| Kost, sömn, fysträning | **Ej byggt, avvaktar** | Se nedan |

Läget gäller bara den aktuella sessionen (sparas inte i chatthistoriken). Standardfrågan utan text blir i mentalt läge "en kort mental träningsplan".

## Innan kost, sömn och fys byggs

1. **Hälsodata om barn** (GDPR art. 9): sömn och kost är hälsouppgifter. Kräver egen DPIA, uttryckligt samtycke från vårdnadshavare och jurist. Se `docs/gdpr-art6-mapping.md`, fråga 2.
2. **Ingen data att utgå från.** Ice IQ har matchdata. Utan sömn/kostdata blir en sådan agent en allmän chattbot.
3. **Kuraterat innehåll i stället för improviserade råd.** Granskat av fysioterapeut eller dietist, som coachen hänvisar till.
4. **Apple och åldersbetyg.** Hälsorelaterade råd till barn kan ändra granskning och betyg.

## ADK och agentplattformen (intresse, ej beslutat)

Google har enligt sekundärkällor (Cloud Next 2026) ommärkt Vertex AI Agent Builder till en "Gemini Enterprise Agent Platform" med Agent Development Kit (ADK, öppen källkod), Agent Studio, Agent Engine (hanterad körmiljö), minne, styrning och A2A. **Verifiera mot Googles egen dokumentation** innan något byggs.

Intressant när coachen ska:
- ha verktyg (hämta spelardata, söka i ett granskat övningsbibliotek),
- köra flerstegsflöden eller flera specialister som samarbetar,
- utvärderas systematiskt.

Gör så här: börja med ADK på Cloud Run eller i en Cloud Function (ingen hanterad plattform behövs), kontrollera att allt körs i EU (europe-west1/eur), och jämför kostnaden mot nuvarande en-anrops-lösning. Samtyckestext och integritetspolicy måste beskriva varje ny behandling innan den släpps.
