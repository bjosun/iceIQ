# GDPR art. 6: vilken rättslig grund bär vilken uppgift (Ice IQ)

Utkast 2026-10-12. Kopplar varje uppgift i appen till ändamål, **förslag** på rättslig grund och var i integritetspolicyn den ska stå. Underlaget för vilka uppgifter som finns är [legal-review-brief.md](legal-review-brief.md) (hämtat ur koden).

> Inte juridisk rådgivning. Kolumnen "förslag" är en arbetshypotes för en jurist att bekräfta eller ändra. Rader märkta **⚠** har en egentlig osäkerhet som inte går att lösa utan en bedömning.

## Förklaring av grunderna (art. 6.1)

| Kod | Grund | Passar när |
|---|---|---|
| **a** | Samtycke | Personen (eller vårdnadshavaren) uttryckligen sagt ja till ett visst ändamål, och kan ångra sig |
| **b** | Avtal | Behandlingen är nödvändig för ett avtal **som den registrerade är part i** |
| **c** | Rättslig förpliktelse | Lag kräver det (till exempel bokföring) |
| **f** | Berättigat intresse | Vårt eller någon annans intresse väger tyngre än den registrerades. Kräver en dokumenterad intresseavvägning, och barn väger tungt |

**Barn och art. 8:** Sveriges gräns för att själv samtycka till informationssamhällets tjänster som riktas direkt till barn är 13 år. Tjänsten är riktad till föräldrar, men uppgifterna handlar om barnet, så frågan är vem som är "den registrerade" och vem som samtycker (se rad 2).

## Mappning

| # | Uppgift | Vem uppgiften handlar om | Ändamål | Förslag | Kommentar | Plats i policyn |
|---|---|---|---|---|---|---|
| 1 | E-post, namn, inloggningsmetod, språk, konto-ID | Förälder/tränare (kontoinnehavaren) | Skapa och driva kontot | **b** | Kontoinnehavaren är part i avtalet (Terms). | Information We Collect → Account |
| 2 | Spelarens namn, lag, matchdata, poäng, saldo (Money Mode) | **Barnet** | Leverera tjänsten föräldern beställt: logga och följa utveckling | **a** (vårdnadshavarens samtycke) eller **f** ⚠ | **b** passar inte rent: barnet är inte part i avtalet. Antingen samtycke av den som har vårdnaden (kan åberopas vid kontoregistreringen, med tydlig text om att man lägger in uppgifter om ett barn) eller berättigat intresse med särskild avvägning för barn. Jurist avgör. | Information We Collect → Player data; Children's Privacy |
| 3 | Spelarens e-postadress (valfri) | Barnet | Skicka coachens analys till spelaren på förälderns begäran | **a** (vårdnadshavare) ⚠ | Ingen e-post skickas utan att föräldern aktivt delar. Saknas idag i policyn. | Information We Collect (**saknas**) |
| 4 | AI-coachens analys: namn, statistik, poäng, kort historik och frågan skickas till Google (Vertex AI, EU) | Barnet (och förälderns fråga) | Skapa personlig feedback | **a** | Naturligt samtycke: samtyckesrutan innan första anropet, version och tidpunkt sparas (`aiConsent`). Går att dra tillbaka genom att sluta använda coachen (**en tydlig "återkalla"-väg saknas i appen**). | AI Coach; Third-Party Services |
| 5 | Coachens minne om spelaren (`coachTimeline`, upp till 8 daterade anteckningar) | Barnet | Göra råd personliga över tid | **a** ⚠ | **Profilering av ett barn** över tid. Samma samtycke som rad 4 måste uttryckligen täcka minnet, och föräldern behöver kunna se och radera det. Saknas i policyn. DPIA-fråga. | AI Coach (**saknas**), Your Rights |
| 6 | Sparade coachsamtal (frågor och svar) | Barnet/föräldern | Visa historik, ge sammanhang | **a** (som rad 4) eller **b** | Följer med AI-coachen. | AI Coach; Data Retention |
| 7 | Spelarlänk: token, koppling till användare och spelarnamn | Barnet | Ge spelaren egen insyn efter förälderns val | **a** (förälderns aktiva delning) ⚠ | Länken öppnas utan inloggning; den som har länken har åtkomst. Policyns text om "team members you invite" stämmer inte med systemet och ska rättas. | Access Control (**fel**), Information We Collect |
| 8 | Rutiner: datum då spelaren gjort en rutin (max 60) | Barnet | Visa streak/belöning | **a** (som rad 7) | Saknas i policyn. | Information We Collect (**saknas**) |
| 9 | Lyssnaklipp: förnamn och poäng omvandlas till tal hos Google (Text-to-Speech, EU), ljudet cachas ca 30 dagar | Barnet | Läsa upp matchen | **a** ⚠ | **Glapp:** den nuvarande AI-samtyckesrutan nämner coachen, inte röst. Samtyckestexten behöver täcka text-till-tal, eller så får föräldern ett eget moment vid delning av länken. | AI Coach / Third-Party Services |
| 10 | Samtyckesloggen (`aiConsent`: version, tidpunkt) | Användaren | Kunna visa att samtycke getts (art. 7.1) | **c/f** | Behandlingen krävs för att uppfylla skyldigheten att kunna visa samtycke. | Information We Collect |
| 11 | Anonym användningsstatistik (`listenStats`) | Ingen identifierad | Förstå hur funktionen används | **utanför GDPR** om verkligen anonym, annars **f** | Inga token, namn eller enhets-ID lagras. Verifiera att den inte går att koppla till någon. | Information We Collect |
| 12 | Marknadsföringskälla (UTM) som sparas på kontot | Kontoinnehavaren | Veta vilka kanaler som fungerar | **f** ⚠ | Parametrarna sparas även i enhetens lagring innan kontot finns: **ePrivacy-reglerna (cookies/lagring på enhet) kan kräva samtycke** även om GDPR-grunden är f. Jurist bedömer. | Information We Collect |
| 13 | Prenumeration: Stripe-kund-ID, plan, status, förnyelse (kortdata hos Stripe) | Kontoinnehavaren | Fakturera, ge tillgång | **b**, bokföring **c** | Bokföringslagen kräver att räkenskapsinformation sparas (normalt sju år). Stripe är eget biträde/ansvarig. | Payment; Data Retention |
| 14 | Service-mejl (välkomst, kvitto, påminnelser om betalning) | Kontoinnehavaren | Leverera tjänsten | **b** | | How We Use |
| 15 | Veckosammanfattning och aktiveringspåminnelse (e-post) | Kontoinnehavaren | Engagera och hjälpa användaren | **f** ⚠ | Beroende på innehållet kan det räknas som **direkt marknadsföring**: då gäller marknadsföringslagen (samtycke, eller kundrelation + liknande produkter + avregistrering). Avregistreringsmöjlighet måste finnas. | How We Use |
| 16 | Säkerhet, missbruksskydd (dagsgräns per länk, loggar) | Alla användare | Skydda tjänsten | **f** | Normalt okontroversiellt, kort avvägning. | Data Security |
| 17 | Supportärenden (e-post till supportadressen) | Den som skriver | Besvara frågor | **b/f** | | Contact Us |
| 18 | Enhetens lokala lagring: cache av data, inställningar, **spelarens mobilnummer till Swish (bara lokalt)** | Förälder (barnets nummer) | Snabbare start, genväg | **Inte behandlat av oss** (stannar på enheten); för cache/inställningar gäller ePrivacys undantag för "strikt nödvändigt" | Beskriv i policyn att numret inte lämnar telefonen. | Information We Collect |
| 19 | Face ID/Touch ID | Användaren | Låsa appen | **Inte behandlat av oss** | iOS hanterar det; vi får bara ja/nej. Säg det. | Information We Collect |

## Frågor som är svårare än tabellen låter

1. **Barnet är den registrerade men inte part (rad 2–9).** Det är den viktigaste juridiska frågan. Alternativen är vårdnadshavarens samtycke (a) eller berättigat intresse (f) med barn-specifik avvägning. Välj *en* konsekvent grund och beskriv den.
2. **Särskilda kategorier (art. 9)?** Prestationsdata är inte hälsodata, men coachen svarar på frågor om nerver, press och "mående". Om användare skriver in sådant kan det i praktiken röra sig om hälsouppgifter. Bedöm om det kräver uttryckligt samtycke eller filter.
3. **Automatiserat beslutsfattande (art. 22).** Tjänsten fattar inga beslut med rättslig eller liknande verkan; coachens råd är rådgivande. Skriv det.
4. **ePrivacy för lagring på enheten** (rad 12 och 18) är en separat grund från art. 6.
5. **Tredjelandsöverföring.** Funktioner i `us-central1`, Stripe och e-posttjänsten (Resend) kan innebära behandling i USA. Mekanismen (Data Privacy Framework eller standardavtalsklausuler) ska anges och biträdena namnges i policyn.

## Förslag på lagringstider (att bekräfta)

| Uppgift | Förslag |
|---|---|
| Konto och spelardata | Tills kontot raderas (användaren kan göra det i appen); rensa konton som varit inaktiva i 24 månader efter varning |
| Coachsamtal och minne | Tills spelaren/kontot raderas, med möjlighet att radera enskilda delar |
| Ljudcache (Text-to-Speech) | 30 dagar (finns som `expireAt`, aktiv radering saknas idag) |
| Anonym statistik | Obegränsat (inga personuppgifter) |
| Betalningsuppgifter | Enligt bokföringslagen (normalt 7 år) |
| Samtyckeslogg | Så länge samtycket gäller + preskriptionstid |

## Det som behöver ändras i policyn (faktafel, oberoende av rättslig grund)

Från granskningen och den här mappningen. Det här är sakfel jag kan rätta direkt; formuleringen av rättslig grund och tredjelandsmekanism ska en jurist skriva.

- [ ] Lägg till **spelarens e-post** under insamlade uppgifter.
- [ ] Beskriv **coachens minne** (anteckningar över tid) som profilering av spelaren.
- [ ] Rätta "authorized team members you invite": systemet har **spelarlänkar**, inte kontoinbjudningar, och en länk kan öppnas av vem som helst som har den.
- [ ] Lägg till **rutiner** (datum) och **lyssnaklipp/text-till-tal**.
- [ ] Namnge biträden: **Google (Firebase/Cloud/Vertex AI/Text-to-Speech)**, **Stripe**, **Resend**.
- [ ] Ange **tredjelandsöverföring** (USA) och mekanism.
- [ ] Ange **lagringstider** och rättslig grund per behandling (enligt tabellen när jurist bekräftat).

## Det som behöver ändras i Terms (förslag från granskningen, formuleras av jurist)

- Användaren intygar att hen är **vårdnadshavare eller har tillåtelse** att lägga in uppgifter om barnet.
- **AI-friskrivning:** råd kan vara felaktiga eller ofullständiga och används på egen risk; ersätter inte tränare, läkare eller annan fackperson.
- **Åldersgräns** som speglar policyn (kontot är för vuxna; barn pratar inte direkt med coachen utan förälderns val).
- **Money Mode:** Ice IQ tillhandahåller bara räknaren, aldrig betalningstjänsten mellan förälder och barn.
