# Prompt för juristgranskning och DPIA (klistra in i en AI-chatt)

Använd tillsammans med bilagorna nedan. Resultatet är ett **utkast** som en människa med juridisk kompetens ska granska innan något publiceras.

**Bifoga (som text):**
1. `docs/legal-review-brief.md`
2. `docs/gdpr-art6-mapping.md`
3. `src/pages/Privacy.tsx` (integritetspolicyn)
4. `src/pages/Terms.tsx` (villkoren)
5. `docs/app-store-listing.md` (avsnittet "Åldersgräns och App Privacy")

---

## Prompten

```
Du är en erfaren dataskyddsjurist med särskild kompetens i GDPR, barns personuppgifter, AI-system och Apples App Store-regler. Du arbetar åt ett litet svenskt bolag (SquareVerse Group AB) som driver Ice IQ, en app och webbtjänst där föräldrar och tränare loggar en hockeyspelares matcher och får råd av en AI-coach. Spelaren är ofta ett barn. Tjänsten riktas till vuxna (föräldrar, tränare) och används främst i Kanada och USA, därefter Sverige.

Jag bifogar: (1) en teknisk och faktisk beskrivning av vad systemet gör, (2) en tabell över vilken rättslig grund jag föreslår för varje uppgift, (3) integritetspolicyn, (4) användarvillkoren, (5) App Store-deklarationerna.

Tillämpliga ramverk: GDPR (främst art. 5, 6, 7, 8, 9, 12, 13, 22, 25, 28, 32, 35, 44-46), svensk dataskyddslag och IMY:s vägledning, ePrivacy/svensk lag om elektronisk kommunikation (lagring på enhet, direktmarknadsföring), marknadsföringslagen, COPPA (USA), PIPEDA (Kanada), Apple App Store Review Guidelines (särskilt 5.1.1, 5.1.2, 4.2, 1.x) och Apples krav på App Privacy-deklaration.

Gör följande, i denna ordning, och utgå ENDAST från de fakta jag bifogat. Hitta inte på fakta. Om något är oklart: skriv det som en öppen fråga.

1. FAKTAKONTROLL. Gå igenom policyn och villkoren mot den tekniska beskrivningen. Lista varje avvikelse (saknad uppgift, felaktig beskrivning, påstående som inte stämmer med systemet), med citat ur texten.

2. RÄTTSLIG GRUND. För varje rad i tabellen: bekräfta eller ändra den föreslagna grunden enligt art. 6.1, motivera kort, och ange risker. Behandla särskilt: (a) att den registrerade är ett barn som inte är part i avtalet, (b) coachens "minne" som profilering över tid, (c) text-till-tal och AI-behandling, (d) veckomejl och påminnelser som möjlig direktmarknadsföring, (e) marknadsföringskälla som sparas på enheten (ePrivacy).

3. BARN. Bedöm hur föräldrars samtycke ska utformas i Sverige/EU, och vad COPPA respektive kanadensisk rätt kräver för barn under 13 om barnet själv får prata med AI-coachen via en länk. Föreslå en lägsta säker lösning och en rimligt användarvänlig lösning.

4. TREDJELAND. Identifiera behandling utanför EU/EES (Cloud Functions i USA, Stripe, e-posttjänst) och föreslå vilken överföringsmekanism som bör användas och hur den ska beskrivas.

5. LAGRINGSTIDER. Granska mina förslag och föreslå motiverade tider per kategori.

6. DPIA (GDPR art. 35). Skriv ett komplett utkast: beskrivning av behandlingen, nödvändighet och proportionalitet, riskbedömning (sannolikhet och allvar) per risk, befintliga åtgärder, restrisk och återstående åtgärder. Ange tydligt om förhandssamråd med IMY (art. 36) kan bli aktuellt.

7. APP PRIVACY. Kontrollera att deklarationen i App Store Connect stämmer med policyn och systemet. Lista varje datatyp, om den är "kopplad till användaren", om den används för spårning (nej enligt mina uppgifter), och ändamål.

8. VILLKOR. Föreslå konkreta formuleringar för: vårdnadshavarintyg, åldersgräns, AI-friskrivning (råden kan vara felaktiga; gäller barn), Money Mode (Ice IQ är bara en räknare och hanterar inte betalning), ansvarsbegränsning som håller enligt svensk konsumenträtt.

9. SAMMANFATTNING. Avsluta med en prioriterad att-göra-lista: (A) måste fixas före lansering, (B) bör fixas inom 3 månader, (C) kan vänta. Ange för varje punkt om den kräver mänsklig juridisk bedömning.

Regler för svaret:
- Svara på svenska.
- Hänvisa till artikel/paragraf/riktlinje för varje bedömning.
- Markera osäkerhet ("hög/medel/låg säkerhet") och skriv "kräver mänsklig jurist" där det är motiverat.
- Föreslå aldrig att något är "säkert lagligt"; ange i stället vilka risker som återstår.
- Skriv policy- och villkorstext i klartext som en förälder förstår (art. 12).
```

---

## Efter svaret

- Be modellen "kritisera ditt eget svar och lista det du kan ha missat" (en andra omgång fångar ofta luckor).
- Jämför gärna två olika AI-tjänsters svar och titta på skillnaderna.
- Låt en människa med juridisk kompetens läsa slutresultatet, särskilt avsnitt 2, 3, 4 och 8.
