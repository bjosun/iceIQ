# Förslag på copy till de tolv utkastkorten

Status: godkänd av Björn 2026-10-28 och införd i content/cards/ som `approved`. Frågorna längst ned besvarades med förslagens standardval (ålder 13-18, ett ord som svar, hockeyspråk kvar, trygghetsrad bara på nervkorten). Engelskan bör ändå läsas av någon som kan hockeyspråk.

Utgår från samma ton som det godkända kortet (content/cards/routine/night-before-game.json): kort, direkt, inget löfte om resultat, ingen "forskning visar", inga påståenden om hur många som gör något. Ikonerna ligger fast per kortplats i JSON (1 ryggsäck, 2 penna, 3 måne, 4 bock).

Tre pass om fyra kort:

| Pass | Spår | Nivå | Kräver | Tema |
|---|---|---|---|---|
| routine-next | routine | 2 | kvällsrutinen (alla fyra kort) | Matchdagen, i omklädningsrummet |
| focus-first | focus | 1 | inget | Hitta tillbaka när tankarna far iväg |
| focus-next | focus | 2 | focus-first | Efter ett misstag, de första fem sekunderna |

Kort 4 i `routine-next` och `focus-next` handlar om nerver eller misstag, så de bär trygghetsraden (`nerves: true`). `focus-first` handlar inte om nerver och behöver den inte, men lägg gärna till den om ni vill vara på den säkra sidan.

---

## Pass 1: routine-next (sektionsrubrik: "Matchdagen" / "Game day")

**routine-next-01** (intro)
- sv: Du gjorde kvällsrutinen. Här är en liten sak till, i omklädningsrummet på matchdagen.
- en: You did the night-before routine. Here's one more small thing, in the locker room on game day.

**routine-next-02** (fråga med svar)
- sv: Vilket ORD vill du ta med dig ut på isen?
  - placeholder: t.ex. lugn, snabb, modig
  - errorText: Skriv ett ord innan du går vidare.
- en: What ONE WORD do you want to take onto the ice?
  - placeholder: e.g. calm, quick, brave
  - errorText: Write one word before you continue.

**routine-next-03** (andning, knapp till andningsövningen)
- title sv: Medan du knyter skridskorna
- body sv: Ta tre lugna andetag. Säg ditt ord för dig själv, en gång per andetag.
- action sv: Gå till andningsövningen
- title en: While you lace your skates
- body en: Take three slow breaths. Say your word to yourself, once on each breath.
- action en: Go to the breathing exercise

**routine-next-04** (belöning, `nerves: true`)
- title sv: Nu är du redo
- reward sv, med svar: Du valde: {answer}. Du har gjort din del. Resten gör du på isen.
- reward sv, tomt: Du har gjort din del. Resten gör du på isen.
- footnote sv: Känns nerverna större än så här — prata med din tränare eller en vuxen du litar på. Den här rutinen är till för matchnerver, inte för allt.
- title en: Now you're ready
- reward en, with answer: You chose: {answer}. You've done your part. The rest happens on the ice.
- reward en, empty: You've done your part. The rest happens on the ice.
- footnote en: If the nerves feel bigger than this, talk to your coach or an adult you trust. This routine is for game-day nerves, not for everything.

---

## Pass 2: focus-first (sektionsrubrik: "Fokus" / "Focus")

**focus-first-01** (intro)
- sv: Alla tappar tråden ibland, även de som är riktigt bra. Det som skiljer är hur snabbt man hittar tillbaka.
- en: Everyone loses the thread sometimes, even players who are really good. What differs is how fast you find your way back.

**focus-first-02** (fråga med svar)
- sv: Vad kan du titta på för att komma tillbaka in i spelet?
  - placeholder: t.ex. pucken, min man, klubban
  - errorText: Skriv en sak innan du går vidare.
- en: What can you look at to get back into the game?
  - placeholder: e.g. the puck, my man, my stick
  - errorText: Write one thing before you continue.

**focus-first-03** (instruktion, ingen knapp)
- title sv: På nästa byte
- body sv: Sitt på bänken och titta på just den saken i tio sekunder. Mer än så är övningen inte.
- title en: On your next shift change
- body en: Sit on the bench and look at just that one thing for ten seconds. That's the whole exercise.

**focus-first-04** (belöning)
- title sv: Prova det
- reward sv, med svar: Du valde: {answer}. Prova det nästa gång tankarna far iväg. Det är okej om det inte funkar direkt, det är en övning.
- reward sv, tomt: Prova det nästa gång tankarna far iväg. Det är okej om det inte funkar direkt, det är en övning.
- title en: Give it a try
- reward en, with answer: You chose: {answer}. Try it next time your mind drifts. It's okay if it doesn't work right away. It's practice.
- reward en, empty: Try it next time your mind drifts. It's okay if it doesn't work right away. It's practice.

---

## Pass 3: focus-next (sektionsrubrik: "Efter ett misstag" / "After a mistake")

**focus-next-01** (intro)
- sv: Alla gör misstag. Det som spelar roll är vad du gör de närmaste fem sekunderna.
- en: Everyone makes mistakes. What matters is what you do in the next five seconds.

**focus-next-02** (fråga med svar)
- sv: Vad vill du göra direkt efter ett misstag?
  - placeholder: t.ex. andas ut och titta på nästa puck
  - errorText: Skriv en sak innan du går vidare.
- en: What do you want to do right after a mistake?
  - placeholder: e.g. breathe out and look for the next puck
  - errorText: Write one thing before you continue.

**focus-next-03** (instruktion, valfri andningsknapp)
- title sv: Tre steg, fem sekunder
- body sv: Andas ut. Säg "nästa" för dig själv. Titta på nästa sak i spelet.
- title en: Three steps, five seconds
- body en: Breathe out. Say "next" to yourself. Look at the next thing in the game.
- (om ni vill ha andningsknappen här: samma action som i routine-next-03)

**focus-next-04** (belöning, `nerves: true`)
- title sv: Det räcker
- reward sv, med svar: Du valde: {answer}. Du behöver inte vara perfekt, bara redo för nästa byte.
- reward sv, tomt: Du behöver inte vara perfekt, bara redo för nästa byte.
- footnote sv: Om misstag ofta får dig att må riktigt dåligt — prata med din tränare eller en vuxen du litar på. Den här övningen är till för att komma tillbaka i spelet, inte för allt.
- title en: That's enough
- reward en, with answer: You chose: {answer}. You don't have to be perfect, just ready for the next shift.
- reward en, empty: You don't have to be perfect, just ready for the next shift.
- footnote en: If mistakes often make you feel really bad, talk to your coach or an adult you trust. This exercise is for getting back into the game, not for everything.

---

## Frågor till er innan godkännande

1. **Ålder:** utkasten är satta till 13-18. Texterna är enkla nog för 10-12, men ni har bestämt att länken för yngre barn är skrivskyddad och lokal, så vill ni sänka `ageMin` är det ett medvetet val.
2. **"Ord" som svar (pass 1):** ett enda ord är lättare att skriva än en mening och ger ett tydligare speglat svar. Vill ni hellre ha en fras, ändra placeholdern.
3. **Hockeyspråk:** "byte", "bänken", "man" och "puck" antar spelare på lagnivå. Vill ni ha mer allmänt språk för individuellt tränande kan "byte" bytas mot "paus".
4. **Svenska och engelska:** engelskan är skriven fritt, inte ord för ord. Låt någon som talar engelska som hockeyspråk se över "shift change" och "my man".
5. **Trygghetsrad:** ska `focus-first` också bära den? Förslag: nej, men lägg till om juristen vill.

## När ni godkänt

För varje kort: fyll `title`, `sectionTitle` och i förekommande fall `body`, `input`, `action`, `reward`, `footnote` för både sv och en, och sätt `status: "approved"`. Alla fyra kort i ett pass (på båda språken) måste godkännas innan motorn kan välja passet. Kör sedan `npm run check:cards` och `npm run test:cards`.
