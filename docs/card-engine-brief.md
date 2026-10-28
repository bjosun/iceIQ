# Uppdrag: kortmotor för spelarlänken (Ice IQ)

Du ska bygga fas 0-1 av en kortmotor. Läs först docs/card-engine-plan.md (hela planen), docs/legal-review-chatgpt-triage.md (beslut 1A) och content/routines/kvallen-fore-match.md.

## Bakgrund

Spelarlänken (src/pages/PlayerLinkPage.tsx) visar ett kortflöde via src/components/routines/RoutineStack.tsx. Det finns bara en rutin ("Kvällen före match", fyra kort), hårdkodad som en `RoutineStep[]`, så barnet får samma kort varje gång. Vi vill att barnet kommer vidare: nya kort, ökande nivå, och att det som redan sett inte upprepas i onödan.

## Hårda regler (får inte brytas)

1. **Inget från barnet skickas till servern eller lagras där.** Spelarlänken är skrivskyddad (beslut 1A). `logRoutineCompletion` i functions/index.js ska förbli avstängd (`ROUTINE_LOGGING_ENABLED`) och `handleRoutineComplete` får inte börja anropa servern.
2. **Ingen LLM i körning mot barnet.** Allt innehåll är granskad text som ligger i repot.
3. Inga nya nätverksanrop, spårare eller identifierare för barnets användning.
4. All copy på både svenska och engelska. Följ copy-tonen: enkelhet först, inga påståenden om antal användare, trygghetsrad på kort som handlar om nerver.
5. `RoutineStack` ska fortsätta fungera visuellt som i dag. Ändra minimalt.

## Att bygga (fas 0 och 1)

**Fas 0: kortschema och migrering (ingen synlig ändring)**
- Definiera typen `Card`:
  `id, concept, track, level (1|2|3), requires?, ageMin, ageMax, surface ('link'|'app'|'both'), lang, title, body?, input?, reflect?, footnote?, status ('draft'|'approved')`.
- Lägg korten som JSON i `content/cards/<track>/*.json`, bygg in dem i appen vid build (inte hämtade vid körning). Bara `status: 'approved'` byggs in.
- Migrera dagens fyra kort ("Kvällen före match") till data. Texten ska vara identisk med dagens `routines.nightBeforeGame.*` i src/utils/translations.ts, och beteendet oförändrat (input på kort 2, speglat svar på sista kortet, knappen som scrollar till andningsövningen).
- Lägg till en enkel validering (script eller test) som failar om ett kort saknar sv/en, trygghetsrad på nervkort, giltiga `requires`-id:n eller har `ageMin` under 13 och `surface` annat än `link`.

**Fas 1: sett-lista och urval, bara på enheten**
- Ett litet lagringsmodul, t.ex. `src/lib/cardProgress.ts`, som läser/skriver `localStorage` (försiktigt: try/catch, ska fungera om lagring är blockerad). Format: `{ seen: { [cardId]: lastSeenISO }, passes: number }`. Ingen fri text sparas, inget som kan identifiera barnet.
- Urvalsfunktion `pickNextPass(cards, progress)` som returnerar 3-4 kort av ett koncept:
  1. Nästa osedda kort i samma spår, uppåt i nivå när `requires` är uppfyllda.
  2. Är spåret slut: byt spår, eller välj en annan variant av ett redan sett koncept.
  3. Ren funktion, ingen slump som inte kan seedas, enhetstestad.
- `PlayerLinkPage` använder motorn för att välja passet. Skapa minst två spår med 6-8 godkända kort vardera (använd det befintliga kortet som utgångspunkt, skriv inte nytt kopy utan att vi granskar det: markera nya kort `draft`).
- Markera ett pass som sett när barnet når sista kortet (samma tidpunkt som `onComplete` i dag). Inget skickas.

## Utanför omfattning (bygg inte)

- Variantskriptet med LLM (fas 2), "Fastnade/Visa igen"-knappen (fas 3), synk till förälderns konto (fas 4).
- Ändringar i Firestore, functions eller Stripe.
- Inloggade appvyer.

## Klart när

- Dagens rutin ser och beter sig exakt som förut för en ny besökare.
- Efter att ha gjort ett pass visas ett nytt pass vid nästa besök på samma enhet.
- Rensad `localStorage` ger första passet igen utan fel. Blockerad `localStorage` ger också fungerande kort.
- Nätverksfliken visar inga nya anrop från kortflödet.
- Enhetstester för `pickNextPass` och validering, och `npm run build` går igenom.
- Beskriv i PR:en vilka kort som är `draft` och behöver textgranskning.

## Öppna frågor till mig (stanna och fråga, gissa inte)

- Ska kort för barn under 13 få en "fastnade"-knapp senare? Bygg inte nu.
- Antal kort per spår utöver de första 6-8.
