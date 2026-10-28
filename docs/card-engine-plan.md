# Kortmotor: plan

Status: utkast, inget byggt. Utgår från `RoutineStack` (src/components/routines/RoutineStack.tsx) och beslut 1A i docs/legal-review-chatgpt-triage.md (spelarlänken är skrivskyddad, ingenting samlas in från barnet).

## Problem

Spelarlänken visar samma fyra kort ("Kvällen före match") varje gång. Det finns ingen variation, ingen känsla av att komma vidare och ingen notering av vad som är sett. Deepstash löser inte detta pedagogiskt heller: flödet är bara stort, och jag hittade inget stöd för att de använder spaced repetition.

## Principer (ärvda, ändras inte)

1. Barnet ser bara granskad text. Ingen LLM improviserar mot barnet i körning (se content/routines/kvallen-fore-match.md).
2. Ingenting från barnet skickas till servern eller lagras där (beslut 1A).
3. Inget kort ersätter vuxen hjälp. Varje kort om nerver bär trygghetsraden.

## Del 1: kortbibliotek

Ett kort blir data, inte JSX:

```ts
interface Card {
  id: string;            // stabilt, t.ex. 'breath-box-01'
  concept: string;       // 'box-breathing' - varianter delar concept
  track: string;         // 'game-nerves' | 'focus' | 'after-mistake' | 'routine'
  level: 1 | 2 | 3;      // svårighet / byggt på tidigare nivå
  requires?: string[];   // concept som ska vara sett först
  ageMin: number; ageMax: number;
  lang: 'sv' | 'en';
  title: string; body?: string;
  input?: { placeholder: string; errorText: string };  // som i dag, bara i minnet
  reflect?: string;      // valfri "tänk efter"-fråga, inget svar sparas
  status: 'draft' | 'approved';
}
```

- Lagras som granskade filer i repot (`content/cards/<track>/*.json`) och byggs in i appen. Ingen databas, ingen läsning i körning från server.
- `RoutineStack` ändras minimalt: tar kort från motorn i stället för en hårdkodad array. Dagens rutin blir ett första "pass" av fyra kort med id:n.
- Ett pass = 3-4 kort av ett koncept, max ~2 minuter, som i dag.

## Del 2: LLM-genererade varianter (offline, med granskning)

LLM används som författarverktyg, aldrig som runtime mot barnet.

1. Skript `scripts/generate-card-variants.mjs` tar ett godkänt kort (eller ett koncept + nivå) och ber modellen om N varianter: annan formulering, annat exempel, annan åldersnivå. Systemprompt bär copy-reglerna (enkelhet först, inga användarantal-påståenden, trygghetsrad) och förbjuder medicinska råd och diagnosspråk.
2. Skriptet skriver filer med `status: 'draft'` i `content/cards/_review/`.
3. Automatisk spärr före granskning: längdgräns, förbjudna ord, kräver trygghetsrad på nervkort, samma `concept` som källan.
4. Människa godkänner (flyttar filen, sätter `approved`). Bara `approved` byggs in.
5. Svenska och engelska granskas var för sig, inte maskinöversatta rakt av.

Kostnad: engångskörning per batch, inga LLM-anrop i användarflödet.

## Del 3: sett/förstått utan att bryta beslut 1A

Allt barn-relaterat stannar på enheten.

**Sett:** `localStorage` på barnets enhet: `{ seen: { cardId: lastSeenISO }, passes: n }`. Servern ser aldrig detta. Nackdelar som vi accepterar: nollas om barnet byter telefon eller rensar webbläsaren, och föräldern ser det inte.

**Förstått (skattat av barnet, inte testat):** på sista kortet i passet två knappar, "Det här fastnade" / "Visa igen senare". Ingen fri text sparas, bara ett av två värden per kort-id i localStorage. Vi kallar det aldrig "förstått" i UI, bara "fastnade".

**Val av nästa pass (enkel regel, ingen AI):**
1. Kort markerade "visa igen" kommer tillbaka efter 2 och sedan 5 besök (enkel spaced repetition på besöksantal, inte datum, eftersom matcher är oregelbundna).
2. Annars: nästa osedda kort i samma `track`, uppåt i `level` när `requires` är uppfyllda.
3. Är allt i en track sett: byt track, eller visa en ny variant (samma concept) av ett kort som fastnat.
4. Fri text-input behålls bara på kortet i minnet, som i dag.

**Förälderns vy (valfritt, senare, beslut 1C):** om föräldern uttryckligen godkänner per spelare kan sett/fastnade synkas till förälderns konto. Det kräver samtyckesflöde och rättslig grund, så det ingår inte här.

## Faser

| Fas | Innehåll | Beroenden |
|---|---|---|
| 0 | Skriv ner kortschema + migrera dagens fyra kort till data. Ingen synlig ändring. | - |
| 1 | Lokal sett-lista + regel "nästa osedda kort". Två tracks, 6-8 godkända kort vardera. | Fas 0 |
| 2 | Varianttskriptet + granskningsflöde. | Fas 0 |
| 3 | "Fastnade / Visa igen" + återkomstregel. | Fas 1 |
| 4 | Förälderns synk (kräver beslut 1C + juridik). | Samtycke, DPIA |

## Åldersklass 13+ i App Store

Appen är klassad 13+. Det ändrar mindre än man kan tro:

- Klassen gäller appen i App Store. Spelarlänken är en webbsida som föräldern delar, och barn under 13 kan öppna den. Rutinen är skriven för 8-18 år (`ageMin: 8`). Vi kan inte med en åldersetikett avgöra att tjänstens barnriktade del inte finns, se docs/legal-review-draft.md P17. Därför gäller beslut 1A och lokal lagring för länken oförändrat.
- Det som öppnas: spelare 13+ (Sverige: dataskyddslagen 2 kap. 4 §) kan senare få en egen väg in i appen med eget samtycke, och då kan sett/fastnade synkas till deras eget konto. Den vägen ligger efter fas 3 och kräver juridisk bedömning per region, eftersom 13 inte är en gräns i USA/Kanada för allt.
- Kort med `ageMin` under 13 ska bara visas på länken (lokal lagring), aldrig i en inloggad appvy med serversynk.
- Kortschemat får ett fält `surface: 'link' | 'app' | 'both'` så att innehåll kan styras per yta.

## Öppna frågor

- Ska "fastnade"-knappen finnas alls för barn under 10? Kan ge pekskärmsfel och press. Alternativ: bara automatiskt "sett".
- Hur många kort per track innan det känns som framsteg, inte bara variation? Förslag: 8 kort per track för start.
- Ska föräldern kunna se vilken track barnet är på utan att något sparas? Ja möjligen genom att länken innehåller track-val (förälderns val, inte barnets data).
- DPIA: bekräfta med juristen att lokal lagring på barnets enhet utan serversynk faller utanför insamling (cookie-/ePrivacy-bedömning för localStorage).
