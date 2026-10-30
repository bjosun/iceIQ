# Ice IQ – juridiskt granskningsutkast

**Granskningsdatum: 12 oktober 2026.**  
**Status: arbetsmaterial – kräver mänsklig jurist före publicering och lanseringsbeslut.**

Detta dokument återger granskningsutkastet från samtalet. Systemfakta kommer enbart från de fem angivna underlagen; rättsliga bedömningar bygger även på kontrollerade myndighetskällor och Apples dokumentation. Underlagen har inte granskats på nytt vid sparandet.

Granskningen är **inte** en verifiering av produktionsmiljön, leverantörsavtalen eller faktiskt ifyllda uppgifter i App Store Connect. Där bilagorna motsäger varandra anges det uttryckligen. Utkastet är AI-genererat och inte ett utlåtande från en advokat.

## Underlag

- [Tekniskt och faktiskt underlag](legal-review-brief.md)
- [Föreslagen mappning enligt GDPR art. 6](gdpr-art6-mapping.md)
- [Integritetspolicy](../src/pages/Privacy.tsx)
- [Användarvillkor](../src/pages/Terms.tsx)
- [App Store-underlag, särskilt Åldersgräns och App Privacy](app-store-listing.md)

**Säkerhetsgrader:**
- **Hög:** tydligt stöd i underlagen eller rättsregeln.
- **Medel:** slutsatsen beror på närmare klassificering, utformning eller kompletterande fakta.
- **Låg:** otillräckligt underlag för en tillförlitlig slutsats.

---

# 1. Faktakontroll

## 1.1 Motsägelser som måste lösas först

### A. Export och avstängning av spelarlänk

Policyn säger:

> “Download a copy of your data (in the app: My account, Your information)”

> “Switch off a player link (in the app, in the dialog that shows the link)”

Men mappningen säger:

> “Länkåterkallning och export saknar gränssnitt.”

Det tekniska underlaget beskriver samtidigt återkallning och export som tillgängliga möjligheter.

**Bedömning:** bilagorna ger inte en entydig bild av vilka användarfunktioner som faktiskt finns. Policyn får inte ange en meny eller knapp som saknas. Serverstöd är inte samma sak som en fungerande användarfunktion.

**Öppen fråga:** vilken version av appen ska skickas till Apple, och fungerar export respektive återkallning där?

**Rättsligt stöd:** GDPR art. 5.1 a, 12.1–2, 15, 20 och 25; Apple 5.1.1(i).  
**Säkerhet: hög om motsägelsen, låg om faktisk implementation.**

Källställen vid granskningen: `src/pages/Privacy.tsx`, rader 115–126; `docs/gdpr-art6-mapping.md`, rader 80–86.

### B. Ljudcache

Policyn säger:

> “We store only a short-lived copy of the generated audio”

Underlaget säger att cachen har ett `expireAt`-fält men att aktiv radering inte är konfigurerad.

**Bedömning:** ett utgångsdatum i databasen innebär inte att uppgifterna faktiskt raderas. ”Kortlivad” är därför inte styrkt. Inte heller ”30 dagar” får anges som faktiskt genomförd lagringstid innan raderingen fungerar.

**Rättsligt stöd:** GDPR art. 5.1 a och e, 13.2 a, 25; Apple 5.1.1(i).  
**Säkerhet: hög.**

Källställen vid granskningen: `src/pages/Privacy.tsx`, rader 160–165; `docs/legal-review-brief.md`, rader 81–90.

## 1.2 Integritetspolicyn – övriga avvikelser och luckor

| Nr | Citat/avsnitt | Avvikelse eller öppen fråga | Bedömning och stöd |
|---|---|---|---|
| P1 | “Your data is encrypted both in transit and at rest” | Underlagen styrker inte kryptering för samtliga kopior: lokal cache, ljudcache, loggar, e-post och eventuella säkerhetskopior. | Inte bevisat fel, men ett alltför omfattande löfte utan verifiering. Specificera skyddet. Art. 5.1 a, 24, 32. **Medel.** |
| P2 | “Only you can open your account” | Absolut formulering som inte redovisar administrativ åtkomst eller leverantörers åtkomst. Dessa åtkomstvägar är inte kartlagda. | Beskriv behörighetsstyrning, inte en garanti om att ingen annan kan få åtkomst. Art. 5.1 a, 13.1 e, 32. **Medel.** |
| P3 | “Account information: email address and name, and the sign-in method…” | Språk, skapandetid och konto-ID framgår av underlagen men inte av uppräkningen. | Komplettera kontokategorin. Varje databasfält behöver inte räknas upp, men kategorier och ändamål ska vara rättvisande. Art. 12–14. **Hög.** |
| P4 | “Payment information… It is handled by Stripe” | SquareVerse lagrar också Stripe-kund-ID, plan, status och förnyelsedatum. | Texten kan ge intryck av att alla betalningsrelaterade uppgifter endast finns hos Stripe. Specificera vad ni själva sparar. Art. 13.1 c och e. **Hög.** |
| P5 | Insamlade uppgifter | Samtyckeslogg med version/tidpunkt samt identifierbara användningsräknare per spelarlänk saknas. | Skilj dessa från anonym statistik. Art. 5.1 a, 13–14. **Hög.** |
| P6 | “Basic information about how you found us” | Lagring av UTM-källa på enheten före kontoregistrering framgår inte. | Beskriv både lokal lagring och kopplingen till kontot, ändamål, tid och valmöjlighet. LEK 9 kap. 28 §; GDPR art. 13. **Hög.** |
| P7 | “Send service messages and a weekly summary by email” | Aktiveringspåminnelse saknas. Det framgår inte vilka mejl som är valfria eller hur de stoppas. | Klassificera mejlen efter innehåll och syfte, inte rubriken ”service”. MFL 19–20 §§; GDPR art. 21.2–4. **Hög om luckan; medel om marknadsföringsklassificeringen.** |
| P8 | “Improve and develop new features” | Ingen konkret behandling för detta breda ändamål beskrivs, utöver viss statistik. | Begränsa till verifierad användning. Texten ger inte rätt att återanvända barnchattar för produktutveckling eller modellträning. Art. 5.1 b, 6, 13. **Hög.** |
| P9 | “Nothing is sent until you ask” | Påståendet finns i AI-avsnittet, men lyssnakort skickar också personuppgifter till Google när lyssnasidan används. | Avgränsa formuleringen till Vertex-anropet. TTS måste beskrivas med egen utlösande händelse och giltigt tillstånd. Art. 7, 12–13; Apple 5.1.2(i). **Hög.** |
| P10 | “We do not send your email address or payment details” | Underlaget anger att strukturerade e-post- och betalningsfält inte skickas. Frågan är fri text. | Ett absolut löfte kräver att sådana uppgifter även hindras eller tas bort ur fritext. Skriv annars att ni inte hämtar dessa uppgifter från kontot för AI-anropet. Art. 5.1 a och c, 25. **Medel.** |
| P11 | “You can stop at any time by not using the coach” | Fortsatt lagring av samtal och minne upphör inte genom att användaren slutar ställa frågor. | Detta beskriver inte återkallande av samtycke. Lägg till verklig återkallning och vad som då stoppas/raderas. Art. 7.3, 13.2 c, 17.1 b. **Hög.** |
| P12 | “These notes… are removed when you delete the player or your account” | Kontoradering beskrivs, men fullständig radering vid enskild spelarradering är inte tydligt verifierad. | Testa minne, samtal, token, rutiner, ljudcache, räknare och kopior. Art. 5.2, 17, 25. **Medel.** |
| P13 | “Most of this runs in the EU” | Firestores region är uttryckligen okänd. Resends behandlingsplats och underbiträden är inte verifierade. | ”Most” saknar tillräckligt underlag. EU-slutpunkt för AI/TTS bevisar inte att all relaterad behandling sker inom EU. Art. 5.1 a, 13.1 f, 44–46. **Hög.** |
| P14 | “the part that handles payments and some emails” | Underlaget anger EU- och USA-funktioner, men fördelar inte tydligt varje betalnings-/mejlflöde mellan regionerna. | Verifiera den mer specifika beskrivningen innan publicering. Art. 13.1 c–f. **Medel.** |
| P15 | “until you delete your account” | Saknar separata tider för ljud, token, rutiner, säkerhetsloggar, samtyckesbevis, e-post och eventuella säkerhetskopior. | En kontolivstid är inte automatiskt en nödvändig lagringstid för varje kategori. Art. 5.1 e, 13.2 a. **Hög.** |
| P16 | “all player data” | Fullständig radering av samtliga härledda uppgifter och mottagarkopior är inte verifierad. Bokföringsundantaget står på annan plats. | Beskriv omfattning, undantag och eventuella fördröjningar utan att utlova mer än systemet gör. Art. 12, 17, 19, 28.3 g. **Medel.** |
| P17 | “the service is not directed to children under 13” | Barn kan redan öppna en personlig spelarsida, lyssna och registrera rutiner. | Vuxenkonton utesluter inte en barnriktad del av tjänsten. Detta är en rättslig klassificering, inte ett faktum som bolaget kan bestämma genom policytext. GDPR art. 8; COPPA 16 CFR 312.2–3; Apple 5.1.4. **Hög om behovet av omprövning.** |
| P18 | “Parents and guardians may record information about their own child” | Policyn inleder med att även tränare är användare; tränarens behandling av andras barn förklaras inte. | Beskriv tränarflöde, behörighet, informationslämnande och ansvarsfördelning. Art. 4.7–8, 6, 14, 26/28 där tillämpligt. **Hög.** |
| P19 | “use it only to provide the service you ask for” | Står i viss spänning med det bredare ändamålet ”Improve and develop new features”. | Klargör om barnuppgifter används för något annat än individuell tjänsteleverans. Art. 5.1 a–b. **Hög.** |
| P20 | Policyn som helhet | Rättslig grund per ändamål och berättigade intressen anges inte. | Lägg till ändamålsbaserad tabell. Art. 13.1 c–d, 14.1 c och 14.2 b. **Hög.** |
| P21 | “Your Rights” | Rätt till begränsning, återkallande, klagomål till tillsynsmyndighet och villkoren för dataportabilitet saknas. | Skilj art. 15-utdrag från art. 20-portabilitet; alla AI-slutsatser behöver inte omfattas av portabilitet men kan omfattas av tillgång. Art. 12, 15–21, 77. **Hög.** |
| P22 | Policyn som helhet | Information till barnet som egen registrerad saknas. | Uppgifter från förälder/tränare aktualiserar art. 14; direkt barnanvändning aktualiserar art. 13. Åldersanpassad information behövs. **Hög.** |
| P23 | “We use these providers…” | Roller, tillräckligt preciserade juridiska mottagare och överföringsmekanismer saknas. | Inte alla leverantörer är nödvändigtvis biträden för alla ändamål. Art. 13.1 e–f, 28, 44–46. **Hög.** |
| P24 | Policyn som helhet | Obligatoriska respektive valfria uppgifter och konsekvenser av att inte lämna dem förklaras otillräckligt. | Förklara exempelvis att grundläggande loggning fungerar utan AI. Art. 13.2 e, 7.4. **Hög.** |

Policyns huvudtext är engelska även när språkstödet används för rubriken. För svenska föräldrar och barn bör motsvarande begriplig svensk text finnas. Det är inte automatiskt förbjudet att använda engelska, men begripligheten för målgruppen måste säkerställas. **Art. 12.1; säkerhet: hög.**

**Viktigt:** flera äldre brister i mappningstabellens kommentarer är redan rättade i den bifogade policyn. Spelarens e-post, AI-minne, rutiner, spelarlänkar, TTS och Resend nämns nu. De ska alltså inte rapporteras som helt utelämnade; kvarvarande problem gäller främst precision, rättslig grund och faktisk funktion.

## 1.3 Användarvillkoren

| Citat | Bedömning |
|---|---|
| “By accessing and using the Service, you accept…” | Att besöka en sida etablerar inte utan vidare alla avtalsvillkor. Betalningsskyldighet och centrala villkor kräver tydlig avtalsprocess. Öppen fråga: hur godkänns villkoren vid registrering/köp? Avtalslagen; distansavtalslagen 2 kap. 2–4 och 9 §§. **Medel.** |
| “responsibility for all activities that occur under your account” | För omfattande om det även omfattar aktiviteter efter intrång som användaren inte orsakat. Bolagets säkerhetsansvar kan inte flyttas över generellt. GDPR art. 32; avtalslagen 36 §; AVLK 10–11 §§. **Hög risk, medel om slutlig oskälighetsbedömning.** |
| “parent or legal guardian, or… guardian’s permission” | Förälder är inte alltid vårdnadshavare. En tränares intyg är inte i sig ett giltigt samtycke från rätt person eller COPPA-verifiering. Art. 6–8. **Hög.** |
| “The Service is for adults” | Ingen precis kontogräns eller tydlig åtskillnad mellan vuxenkonto och barnets spelarsida. Den planerade chatten får inte beskrivas som befintlig. Art. 12; Apple 5.1.4 och åldersklassificering. **Hög.** |
| “Premium features require a paid subscription” | Underlaget beskriver även engångsköp. |
| “You may cancel… through your account settings” | Funktionen styrks inte närmare i bilagorna. Verifiera. Villkoren saknar också tydliga regler om prisperiod, uppsägningens effekt, engångsköp och ångerrätt. Distansavtalslagen 2 kap.; konsumentköplagen 9 kap. **Hög om luckorna.** |
| “You use the advice at your own judgement” | Bra att riskerna nämns, men texten får inte uppfattas som att konsumenten tar över allt ansvar för felaktig eller farlig tjänst. Barnspecifik varning behövs. Konsumentköplagen 1 kap. 10 § och 9 kap.; Apple 1.4. **Medel.** |
| “shall not be liable for any indirect, incidental, special, consequential or punitive damages” | Amerikansk standardformulering som inte är anpassad till svensk tvingande konsumenträtt eller GDPR-skadestånd. Bör ersättas. Konsumentköplagen 6 och 9 kap.; avtalslagen 36 §; GDPR art. 82. **Hög risk.** |
| “modify these terms at any time” | Obegränsad ändringsrätt är problematisk. Information om ändringen gör inte automatiskt ändringen tillåten. Konsumentköplagen 9 kap. 19–20 §§; AVLK 10–11 §§. **Hög risk.** |

Money Mode beskrivs redan som en räknare och inte som en betalningstjänst. Det stämmer med underlaget. Gränsen mot Swish och bolagets ansvar för den egna appfunktionen kan dock förtydligas.

---

# 2. Rättslig grund – samtliga 19 rader

## Utgångspunkter

1. **GDPR gäller i princip även för behandlingen av kanadensiska och amerikanska användares uppgifter**, eftersom behandlingen sker inom ramen för ett svenskt bolags verksamhet. Art. 3.1.
2. **Förälderns avtal bär inte automatiskt behandlingen av barnets uppgifter.** Art. 6.1 b kräver att den registrerade är avtalspart.
3. Välj grund **per ändamål och registrerad**, inte en enda grund för hela tjänsten. Ett avtal, ett samtycke och en intresseavvägning kan behövas för olika behandlingar.
4. Byt inte i efterhand från samtycke till berättigat intresse enbart för att kunna fortsätta samma behandling efter återkallande. Art. 5.1 a, 6–7; EDPB:s riktlinjer 05/2020.

**Hög säkerhet.**

### Föreslagen mappning

| # | Behandling | Rekommenderad grund och kort motivering | Risk/säkerhet |
|---|---|---|---|
| 1 | Kontouppgifter | **6.1 b** för nödvändiga uppgifter för vuxenkontot. Säkerhetsändamål kan separat stödjas på **f**. Namn måste inte göras obligatoriskt om e-post/ID räcker. | Avtalsgrund kräver objektiv nödvändighet, inte bara omnämnande i Terms. **Hög.** |
| 2 | Spelarnamn, lag, matcher, poäng, saldo | För en familjeinriktad lansering rekommenderas **6.1 a**, från behörig samtyckesgivare, för barnprofilen; Money Mode som separat val. **6.1 f** kan vara möjligt för begränsad grundläggande statistik efter barnspecifik intresseavvägning, men är inte styrkt här. | Vem får samtycka? Är tränaren behörig? Är fullständigt namn nödvändigt? Ett samtycke måste kunna återkallas utan att barnet utsätts för otillbörlig press. **Medel – kräver mänsklig jurist.** |
| 3 | Spelarens e-post | **6.1 a**, separat och frivilligt. Förälderns val att skicka ska kompletteras med korrekt information och behörighet; äldre barns egen vilja måste beaktas. | Fel adress kan röja barnuppgifter. Kontrollerad delning är bättre än återkommande automatisk e-post. **Medel – kräver mänsklig jurist.** |
| 4 | AI-analys | **6.1 a** rekommenderas för den valfria AI-funktionen, för berörda personer. Befintlig ruta är bara tillräcklig om information, behörighet, frivillighet och återkallande fungerar. | Samtycke gör inte onödig överföring av namn proportionerlig. Hälsouppgifter kräver även art. 9-undantag. **Medel – kräver mänsklig jurist.** |
| 5 | AI-minne | **6.1 a**, tydligt avgränsat från engångsanalys. Rekommendation: eget avstängt standardval för minne över tid. | Profilering enligt art. 4.4. Åtta anteckningar kan vara mycket integritetskänsliga och gamla. **Hög om profilering; medel om samtyckesutformning.** |
| 6 | Sparade samtal | **6.1 a** för barnuppgifter och valfri historik. **b** kan bara bära nödvändig behandling av vuxenpartens egna uppgifter; den bär inte automatiskt blandat barninnehåll. | Skilj mellan att skapa ett svar och att spara hela dialogen länge. **Medel.** |
| 7 | Spelarlänk | **6.1 a** för den valfria personliga delningen. **f** för snävt säkerhetsändamål kring token. | En klickning är inte informerat samtycke utan information om att länken ger innehavaren åtkomst. Länken verifierar inte barnets identitet. **Medel.** |
| 8 | Rutindatum | **6.1 a**. Direkt barninmatning är en egen insamlingssituation, inte bara förälderns tidigare registrering. | Kräver barninformation och jurisdiktionsanpassat samtycke. ”Max 60” är inte lagringstid. **Medel.** |
| 9 | TTS och ljudcache | **6.1 a** rekommenderas för valfri personaliserad uppläsning och nödvändig kort cache. Ska uttryckligen täckas före första överföringen. | Nuvarande coachsamtycke täcker enligt mappningen inte TTS. Undersök namnfri text och uppläsning på enheten som mindre ingripande alternativ. **Medel.** |
| 10 | Samtyckesbevis | **6.1 c**, med art. 7.1 och 5.2, för nödvändigt bevis på samtycke. Eventuell fortsatt begränsad lagring för konkreta rättsanspråk kan kräva **f**. | Inte ett nytt samtycke till att spara samtycket. Version/tid räcker inte alltid för att visa vem som samtyckt för vilket barn och ändamål. **Hög.** |
| 11 | Anonym statistik | Utanför GDPR **endast om faktiskt anonym**, inklusive möjligheten att kombinera med loggar och små grupper. Föregående insamling/anonymisering kan vara GDPR-behandling. Om identifierbar: pröva **f** eller **a** beroende på flödet. | Inga direkta ID:n är inte samma sak som anonymitet. LEK och Apple kan ändå kräva information/tillstånd. Skäl 26; art. 4.1, 6. **Hög om principen.** |
| 12 | UTM på konto/enhet | Ändra huvudförslaget till **6.1 a** för frivillig kampanjmätning med lokal lagring. **f** kan övervägas för annan avgränsad serverbaserad mätning utan samtyckespliktig enhetsåtkomst. | UTM-lagring är normalt inte nödvändig för den tjänst användaren begär. **LEK-samtycke krävs före lagringen/åtkomsten. Hög.** |
| 13 | Prenumeration/betalning | **6.1 b** för kund-ID, tillgång och fakturering; **c** för nödvändig räkenskapsinformation. | Sjuårsregeln omfattar inte automatiskt all abonnemangsmetadata. Stripe kan ha flera roller. **Hög.** |
| 14 | Servicemejl | **6.1 b** för nödvändiga avtalsmeddelanden; **c** där konkret lagkrav finns. | Välkomstmejl med erbjudanden är inte nödvändigtvis ett rent servicemejl. **Medel.** |
| 15 | Veckomejl/aktivering | Av användaren begärd, ren rapport kan stödjas på **b** för vuxenleveransen, med barnuppgifternas egen grund. För engagemangs-/marknadsföringsmejl rekommenderas **a**. **f** kan vara möjligt inom lagligt kundundantag och efter avvägning. | Gratis konto är inte automatiskt en försäljning enligt MFL 19 §. Direktmarknadsföring omfattas av ovillkorlig invändningsrätt enligt art. 21.2–3. **Medel – kräver mänsklig jurist.** |
| 16 | Säkerhet, kvoter, loggar | **6.1 f**, med specificerat skyddsintresse och dokumenterad nödvändighet. Vissa särskilda skyldigheter kan ha **c**. | Inte ”okontroversiellt” när loggar innehåller barnchatt, token eller känsliga uppgifter. Minimera innehåll och tid. **Hög om möjlig grund; medel om omfattningen.** |
| 17 | Support | **6.1 b** för nödvändig kundsupport, **f** för andra förfrågningar. **c** för hantering av GDPR-rättighetsbegäran. | Uppgifter om barnet och hälsa kräver särskild bedömning; ett supportärende ger inte fri återanvändningsrätt. **Medel.** |
| 18 | Lokal cache, inställningar, Swish-nummer | **Ändra ”inte behandlat av oss”.** Lokal behandling kan omfattas av ert ansvar om ni bestämmer ändamål och medel. Konto-/funktionsuppgifter: **b** där nödvändigt; barnuppgifter följer sin grund, rekommenderat **a** för valfri nummerfunktion. | LEK-undantag måste bedömas per funktion. ”Snabbare start” gör inte all cache strikt nödvändig. Art. 4.2 och 4.7; LEK 9 kap. 28 §. **Hög om korrigeringen; medel om roll/grunder.** |
| 19 | Face ID/Touch ID | Enligt underlaget behandlar ni **inte själva biometriska mallar**. Inställningen och eventuellt identifierbart ja/nej-resultat är ändå behandling, normalt **b** för valt applås eller **f** för säkerhet. | Ja/nej-resultatet är inte automatiskt en biometrisk uppgift enligt art. 9. Kontrollera att ingen biometrisk data exponeras eller sparas. **Hög.** |

## 2.1 AI, hälsa och automatiserade beslut

### Hälsouppgifter

Matchpoäng är **inte automatiskt** hälsouppgifter. Men frågor om skador, psykisk ohälsa eller slutsatser om barnets hälsa kan omfattas av art. 9. Även AI-härledda uppgifter kan vara hälsouppgifter.

En allmän uppmaning ”skriv inte känsliga uppgifter” räcker inte om funktionen samtidigt uppmuntrar sådant innehåll eller förutsebart sparar det.

**Rekommendation:** avgränsa coachen till hockeyutveckling. Inför skydd före extern överföring där möjligt, undvik medicinska slutsatser och bestäm hur oavsiktligt mottagen känslig information ska hanteras. Om sådan behandling avsiktligt ska erbjudas behövs både art. 6-grund och exempelvis **uttryckligt samtycke enligt art. 9.2 a**, med särskild barnbedömning.

**Säkerhet: hög om rättsregeln, medel om faktisk förekomst – kräver mänsklig jurist.**

### Profilering kontra art. 22

Coachens minne och personliga bedömningar talar tydligt för profilering enligt art. 4.4.

Underlagen visar däremot inte ett **helt automatiserat beslut med rättsliga eller liknande betydande följder** enligt art. 22. Råd och en räknare räcker inte i sig. Bedömningen måste göras om ifall tränare använder resultaten för exempelvis laguttagning eller andra betydande beslut.

**Säkerhet: medel.** Avsaknad av art. 22-beslut tar inte bort kraven i art. 5, 6, 12–14, 25 och 35.

## 2.2 Mejl och lokal lagring

- **Sverige:** MFL 19 § kräver normalt förhandssamtycke till marknadsföringsmejl. Kundundantaget kräver adress från försäljning, egna likartade produkter och enkel kostnadsfri opt-out både vid insamling och i varje mejl. MFL 20 § kräver giltig avregistreringsadress.
- **Kanada:** PIPEDA räcker inte som mejlregel. Även **CASL**, särskilt §§ 6, 10–11, måste bedömas.
- **USA:** även **CAN-SPAM**, framför allt 15 USC § 7704, kan aktualiseras.
- **Enhetslagring:** LEK 9 kap. 28 § gäller inte bara cookies. Även lokal lagring omfattas. Nödvändighetsundantaget ska bedömas per ändamål.

**Säkerhet: hög om ramverken; mejlmallarna måste granskas av mänsklig jurist.**

---

# 3. Barn och samtycke

## 3.1 Sverige och EU

### Föräldratjänst och barntjänst måste skiljas åt

När en vuxen registrerar barnets matcher är det inte självklart att art. 8 är direkt tillämplig på just den insamlingen. Barnets rättigheter och kraven på giltigt samtycke gäller ändå.

När barnet använder en personlig spelarsida eller chattar direkt med AI blir frågan om en informationssamhällets tjänst erbjuds direkt till barnet betydligt tydligare. Eget konto krävs inte för att art. 8 ska bli relevant.

**Stöd:** art. 4.11, 6–8, 12; skäl 38 och 58.  
**Säkerhet: hög om principen, medel om gränsdragningen.**

### Ålder

- För barn som **bor i Sverige** gäller 13 år enligt dataskyddslagen 2 kap. 4 §.
- I andra EU-länder kan motsvarande gräns vara 13–16 år.
- Den svenska 13-årsregeln får inte automatiskt användas för alla barn i USA och Kanada. GDPR gäller genom bolagets etablering, och tillämplig art. 8-tröskel för dessa barn behöver bedömas. Utgå inte från en global 13-årsregel.
- Utanför art. 8-situationen finns inte en enda generell svensk samtyckesålder för all personuppgiftsbehandling; barnets förståelse, mognad och behandlingens risker spelar roll.
- Dataskyddssamtycke är inte samma sak som behörighet att ingå ett abonnemangsavtal.

**Säkerhet: hög – gränsöverskridande tillämpning kräver mänsklig jurist.**

### Utformning

Samtyckesflödet bör:

1. Identifiera **vilken spelare** samtycket gäller.
2. Skilja vårdnadshavare från tränare och annan vuxen.
3. Visa tydliga ändamål och mottagare före behandling.
4. Ge separata val för behandlingar som användaren rimligen kan vilja välja oberoende: AI-analys, långtidsminne, personlig delning/TTS och marknadsföring.
5. Förklara vilka funktioner som fortfarande fungerar efter ett nej.
6. Spara samtyckets innehåll/version, tid, ändamål, spelarkoppling och behörighets-/verifieringsstatus.
7. Tillåta lika enkel återkallning som lämnande.
8. Ge barnet begriplig information och respektera dess ökande självbestämmande.

**Art. 7, 8.2, 12 och 25; EDPB 05/2020. Hög säkerhet.**

En kryssruta ”jag är förälder” är **inte bevisad tillräcklig** för den planerade riskfyllda barnchatten. Kontrollens styrka ska stå i proportion till risken. Samtidigt får ni inte slentrianmässigt samla in passkopior eller mer åldersinformation än nödvändigt.

## 3.2 COPPA – USA

### Vad som utlöser COPPA

COPPA är inte en generell lag om alla uppgifter som handlar om barn. FTC skiljer mellan uppgifter som samlas in **från vuxna om barn** och uppgifter som samlas in **online från barn**.

Direkt barnchatt under 13 år aktualiserar däremot tydligt COPPA om ni vet att användaren är under 13 eller tjänsten/delen är barnriktad. Även dagens personliga länk kan omfattas beroende på insamlingen av rutiner, beständiga identifierare och användningsdata.

**Stöd:** 16 CFR 312.2–3; FTC:s COPPA-vägledning.  
**Säkerhet: hög om skillnaden, medel om dagens länks slutliga klassificering.**

### ”Bara lyssna” räcker inte som juridiskt undantag

Barnet kan enligt underlaget registrera rutiner; användning räknas per länk. Det är därför inte visat att flödet är passivt eller anonymt.

Undantaget för beständiga identifierare som enbart stöder interna funktioner är snävt och kan inte utan vidare användas för ett individuellt barnminne eller en prestationsprofil. **16 CFR 312.2 och 312.5(c).**

### Krav vid direkt insamling från barn under 13

Före insamling krävs normalt:

- tydlig offentlig information och särskild direkt information till föräldern;
- **verifierbart föräldrasamtycke**;
- möjlighet till granskning, radering och stoppad fortsatt insamling;
- minimering, dokumenterad informationssäkerhet och tidsbestämd gallring;
- hantering av mottagare och eventuell separat samtyckespliktig tredjepartsdelning.

De ändrade COPPA-reglernas huvudsakliga efterlevnadsfrist var **22 april 2026** och har därmed passerat vid denna granskning. **16 CFR 312.4–8 och 312.10. Hög säkerhet.**

Exempel på verifieringsmetoder i regelverket är undertecknat formulär, särskilt utformad betalningsverifiering med notifiering, utbildad personal via telefon/video eller lämplig identitetskontroll. Ett befintligt Stripe-kund-ID bevisar inte ensamt ett giltigt COPPA-samtycke.

”Email plus” kan användas under vissa förutsättningar, men är inte en generell genväg. Om flödet innebär sådan delning som inte ryms inom reglernas interna användning måste starkare metod väljas. En GDPR-biträdesetikett avgör inte COPPA-bedömningen.

**Kräver mänsklig jurist med USA-kompetens.**

## 3.3 Kanada

PIPEDA kräver meningsfullt samtycke: personen ska rimligen förstå behandlingens art, syfte och konsekvenser. OPC:s utgångspunkt är att barn under 13 normalt inte själva kan lämna sådant samtycke.

Detta är **inte en identisk kanadensisk COPPA-regel**. Verifieringen måste vara rimlig i sammanhanget och behandlingen måste dessutom ha ett godtagbart ändamål.

**Stöd:** PIPEDA § 5(3), § 6.1 och Schedule 1, särskilt 4.3–4.7; OPC:s vägledning.  
**Säkerhet: hög.**

**Québec är särskilt viktigt:** privatsektorslagen innehåller regler om barn under **14**, bland annat §§ 4.1 och 14. Profilering och överföringar utanför Québec aktualiserar dessutom §§ 8.1 respektive 17. Alberta och British Columbia har också egna privatsektorsregler.

**Öppen fråga:** i vilka provinser finns användarna och vilka lokala regler blir tillämpliga?  
**Kräver mänsklig jurist med kanadensisk kompetens.**

## 3.4 Två föreslagna lösningar

### Lägsta risk-reducerande lanseringslösning

Detta är inte en garanti om laglighet:

- Lansera **utan direkt barnchatt**.
- Behåll AI-användning hos den vuxne med valfritt, korrekt samtyckesflöde.
- För barn under tillämpliga trösklar: undvik tills vidare personlig onlineanvändning som samlar in barnets aktivitet, om inte samtyckes- och verifieringsfrågorna är lösta.
- Låt i stället den vuxne visa eller spela upp en redan skapad rapport tillsammans med barnet.
- Stäng av långtidsminne, spelarlänk och barnets e-post som standard.
- Ingen marknadsföring till barnet.

**Stöd:** art. 5, 7–8, 25 och 35; COPPA 312.3–5; PIPEDA 4.3–4.4.  
**Säkerhet: medel – kräver mänsklig jurist för lanseringsgränserna.**

### Rimligt användarvänlig lösning

- En föräldrapanel per barn med land/provins och minsta nödvändiga åldersintervall.
- Riskanpassad föräldrakontroll; starkare verifiering där COPPA eller motsvarande bedömning kräver det.
- Kort barninformation före första interaktionen.
- Tydligt separata reglage för chatt, minne, TTS och delning.
- Kortlivad aktiveringslänk som byts mot begränsad session; inte samma beständiga lästoken som ensam rätt att chatta.
- Självservice för stopp, återkallning, minnesradering och länkradering.
- Skydd mot skadliga råd, tydlig rapporteringsväg och inga medicinska bedömningar.
- Ny information/samtyckeshantering när barnet når relevant ålder.

Åldersuppgift, verifierat vuxenskap och vårdnadsbehörighet är **tre olika frågor**. En lösning måste hantera alla relevanta delar utan överinsamling.

---

# 4. Tredjelandsbehandling

## 4.1 Vad som faktiskt är känt

| Flöde | Underlagets uppgift | Vad återstår? |
|---|---|---|
| Cloud Functions | Funktioner i Belgien och USA. | Vilka personuppgifter, loggar och underbiträden berör respektive funktion? |
| Firestore | Databasregion inte verifierad. | Region, säkerhetskopior, replikering, administrativ åtkomst. |
| Vertex AI | EU-region anges. | Avtalad dataplats, loggar, supportåtkomst, underbiträden och eventuell återanvändning. |
| Text-to-Speech | EU-slutpunkt anges. | Samma kontroll; slutpunkt är inte bevis för hela behandlingskedjan. |
| Stripe | Webbetalningar. | Avtalspart, roller, länder, vidareöverföringar och rättsliga mekanismer. |
| Resend | E-postleverantör; behandlingsplats och DPA okända. | Mottagaruppgifter, meddelandeinnehåll, loggar, underbiträden, retention och mekanism. |
| Apple/Google-inloggning | Respektive leverantör används. | Vilka data flödar, i vilka roller och till vilka länder? |

Att ett företag har amerikanskt moderbolag bevisar inte ensamt en viss överföring. EU-lagring bevisar inte heller frånvaro av tredjelandsöverföring eller fjärråtkomst.

**Art. 13.1 f, 28 och 44–46. Hög säkerhet.**

## 4.2 Rekommenderad mekanism

1. **Kartlägg den faktiska mottagande juridiska personen och rollen.**
2. För USA-mottagare: använd **art. 45 och EU–US Data Privacy Framework** endast om mottagaren har aktiv certifiering som täcker den aktuella överföringen och beslutet gäller.
3. Om detta inte är tillämpligt: använd lämplig mekanism enligt **art. 46**, normalt relevanta standardavtalsklausuler, med bedömning av överföringen och kompletterande skydd där det behövs.
4. Använd inte art. 49-samtycke som standardlösning för återkommande molndrift.
5. Ingå art. 28-avtal för biträdesbehandling. Ett biträdesavtal och en överföringsmekanism löser **olika** krav.

**Säkerhet: hög om modellen; låg om dagens avtalsläge – kräver mänsklig jurist.**

Flytta USA-funktioner till EU där det är tekniskt rimligt. Det minskar exponeringen men ersätter inte avtals- och åtkomstkontrollen.

## 4.3 Policytext – fyll i först efter verifiering

> Vi använder [leverantörens juridiska namn] för [funktion]. För detta behandlas [uppgifter] i [länder].
>
> När uppgifter förs över till en mottagare i USA använder vi [den verifierade överföringsmekanismen]. Om överföringen bygger på EU:s standardavtalsklausuler har vi också bedömt vilka ytterligare skydd som behövs.
>
> Du kan kontakta oss för information om överföringarna och en kopia av tillämpliga skyddsåtgärder.

Publicera inte ”vi använder DPF eller SCC” utan att kunna säga vilket som gäller för respektive flöde. **Art. 13.1 f och 14.1 f.**

---

# 5. Lagringstider

Följande är **förslag till beslut och implementation**, inte beskrivning av dagens funktioner. Exakta tider är inte generellt föreskrivna i GDPR.

Grundregel: behov per ändamål, automatisk gallring, fungerande radering och dokumenterade undantag. **Art. 5.1 c och e, 17, 25; COPPA 312.10; PIPEDA 4.5.**

| Kategori | Föreslagen tid | Motivering/risk |
|---|---|---|
| Aktivt vuxenkonto | Under kundrelationen. Inaktiva gratiskonton gallras efter 24 månader, med förvarning exempelvis 30 dagar före. | Rimlig utgångspunkt, men definiera aktivitet. Betalande konto och ett barns profilanvändning behöver skiljas åt. |
| Spelarprofil/matchhistorik | Rullande 24 månader som standard; längre säsongsarkiv endast efter konkret behovsbedömning och tydligt val. | Utveckling över tid kan motivera historik, men obegränsat arkiv kräver mer än att kontot finns kvar. |
| Money Mode-saldo | Under aktiv användning; historik högst 12 månader om ingen längre funktionell anledning finns. | Inte bolagets räkenskapsinformation bara för att den uttrycks i pengar. |
| Spelarens e-post | Tills funktionen stängs av eller adressen tas bort; årlig behovskontroll. | Skilj sparad adress från ett enstaka utskick. |
| AI-samtal | 90 dagar som standard. Separat sparval kan motivera längre tid, exempelvis högst 12 månader före omprövning. | Minskar risken för känslig fritext och gamla felaktiga slutsatser. |
| AI-minne | Högst 8 anteckningar **och** exempelvis högst 90 dagar per anteckning. | Antalsgräns räcker inte. Förläng bara om anteckningen faktiskt behövs, inte genom automatisk omdatering. |
| Spelarlänkar | Tidsbegränsad giltighet, exempelvis 30 dagar, med aktiv förnyelse. Omedelbar åtkomstspärr vid återkallning. | Separera länkens giltighet från eventuell kort säkerhetslogg. |
| Rutindatum | Rullande 90 dagar och högst 60 poster. | Tillräckligt för en kort rutinöversikt; längre behov måste visas. |
| Ljudcache | Pröva 7 dagar som standard; högst 30 dagar endast om återanvändningen motiverar det. | Aktivera faktisk gallring. Radera även vid relevant återkallande/profilradering. |
| Dagsräknare per länk | 48–72 timmar om de endast behövs för dagskvot. | Behåll inte identifierbar användningshistorik för ett rent kvotändamål. |
| Vanliga säkerhetsloggar | 30 dagar; upp till 90 dagar för dokumenterat behov. | Incidentutdrag kan sparas separat så länge utredningen kräver det. Undvik token och chattinnehåll i loggar. |
| UTM på enhet | Exempelvis 30 dagar efter samtycke. | Kort attribueringsfönster; ingen obegränsad identifierarkoppling. |
| UTM på konto | Exempelvis 90 dagar, därefter verklig aggregering/anonymisering om längre statistik behövs. | Kontot behöver inte behålla kampanjursprunget hela livstiden. |
| Mejl-/leveransloggar | Exempelvis 30 dagar; upp till 90 för dokumenterade leveransproblem. | Separera kvitton som är räkenskapsinformation. |
| Support | 12 månader efter avslutat ärende som utgångspunkt. | Kortare för känsliga bilagor; längre endast för identifierat anspråk eller annat dokumenterat behov. |
| Samtyckesbevis | Under behandlingen; därefter separat minimal bevispost med föreslagen omprövning efter 24 månader. | Ingen generell ”samtycke + all preskriptionstid”. Jurist måste besluta relevant bevisbehov och tid. |
| Marknadsföringsspärr | Minimal spärrpost så länge den behövs för att inte återimportera eller kontakta personen igen. | Får inte användas för marknadsföring. Även hash kan vara personuppgift. |
| Räkenskapsinformation | Till och med sjunde året efter utgången av kalenderåret då räkenskapsåret avslutades. | Bokföringslagen 7 kap. 2 §. Gäller nödvändig räkenskapsinformation, inte hela spelarprofilen. |
| Säkerhetskopior | Om sådana finns: föreslagen rotationsgräns 30 dagar, isolerad åtkomst och förnyad radering vid återställning. | Existens och tekniska möjligheter är öppna frågor. |
| Lokal lagring | Rensas vid relevant utloggning, kontoradering och funktionsavstängning; kontrollera enhetsbackup. | Underlaget styrker rensning av lokal cache vid utloggning, inte nödvändigtvis alla lagringstyper. |
| Verkligt anonym statistik | Kan sparas längre om återidentifiering rimligen inte är möjlig. | ”Obegränsat” är inte nödvändigt som standard. Dokumentera anonymiteten och statistikbehovet. |

**Säkerhet:** hög för rättsprinciperna och bokföringsregeln; **medel för föreslagna tider**. Samtyckesbevis, rättsanspråk och internationella särkrav **kräver mänsklig jurist**.

---

# 6. DPIA – komplett arbetsutkast enligt art. 35

## 6.1 Dokumentstatus och beslutspunkt

**Personuppgiftsansvarig:** SquareVerse Group AB, enligt underlaget.  
**Process:** Ice IQ – matchloggning, spelarprofilering, AI-coach, TTS, spelarlänkar och tillhörande drift.  
**Version:** granskningsutkast 2026-10-12.  
**Beslutsägare:** ska utses av bolaget.  
**Tekniskt ansvarig:** ska anges.  
**Dataskyddsombud:** inte känt om sådant finns eller krävs. Bedöm art. 37 separat.  
**Godkännandestatus:** inte godkänd för lanseringsbeslut.

**DPIA bedöms behövas redan för den befintligt beskrivna kombinationen** av utvärdering/profilering och behandling av sårbara registrerade, särskilt barn. Ny AI-teknik förstärker bedömningen. Det krävs inte att art. 22 är tillämplig eller att enbart stor omfattning visas.

**Stöd:** art. 35.1 och 35.4; IMY:s förteckning, särskilt kriterierna utvärdering/poängsättning, sårbara registrerade och ny teknik.  
**Säkerhet: hög.**

Barnchatten ska vara en **separat ändrings- och godkännandepunkt** innan den byggs färdigt och tas i bruk.

## 6.2 Systematisk beskrivning

### Ändamål

- Ge vuxna möjlighet att logga och följa en spelares hockeyutveckling.
- Ge frivillig personlig AI-feedback och uppläsning.
- Ge spelaren begränsad insyn via länk.
- Hantera konto, betalning, support och säkerhet.
- Genomföra avgränsad mätning och eventuella vuxenutskick.

Marknadsföring, profilering och individuella råd får inte behandlas som ett enda ospecificerat ändamål.

### Registrerade

- Vuxna kontoinnehavare.
- Spelare, ofta barn.
- Personer vars uppgifter kan förekomma i fritext.
- Supportkontakter.

### Uppgifter

Kontakter, konto-ID, spelaridentitet, lag, matchstatistik, belöningssaldo, frivillig spelar-e-post, chattar, AI-anteckningar, rutindatum, token, syntetiskt ljud, kvotdata, kampanjkälla, samtyckesbevis och betalningsmetadata.

Eventuella hälsouppgifter är en **förutsebar risk**, inte ett verifierat befintligt register.

### Flöde

1. Vuxen registrerar konto via Firebase.
2. Spelar- och matchuppgifter lagras i Firestore.
3. Valda uppgifter skickas via EU-funktion till Vertex AI.
4. AI-svar och kort minne sparas.
5. TTS skapar syntetiskt ljud från personanknuten text.
6. Spelarlänk ger innehavaren tillgång till utvalda uppgifter.
7. Rutiner och användningsräknare lagras.
8. Resend levererar mejl; Stripe hanterar webbetalningar.
9. Lokal cache finns i appen.

### Omfattning och platser

Antal registrerade, åldersfördelning, datavolymer, trafik per land/provins, Firestore-region, backup och administrativa åtkomstplatser är **öppna frågor**. Dessa ska fyllas i före slutligt godkännande.

### Ansvarsroller

SquareVerse anges som ansvarig för konsumenttjänsten. Tränare/föreningar kan ha eget ansvar, och en särskild organisationsprodukt kan innebära andra roller. Google, Stripe och Resend ska klassificeras **per behandling**, inte kollektivt som biträden.

**Art. 4.7–8, 26, 28 och 35.7 a.**

## 6.3 Nödvändighet och proportionalitet

| Kontrollfråga | Bedömning/krav |
|---|---|
| Krävs identifierbart namn för statistik? | Inte visat. Tillåt smeknamn och minimera identitet. |
| Krävs namn hos AI/TTS? | Inte visat. Pröva pseudonym/namnfri prompt och lokalt tillägg av tilltal. Pseudonymisering är inte anonymisering. |
| Krävs sparat minne för AI-svar? | Nej enligt underlaget: loggning fungerar utan AI. Pröva även AI utan långtidsminne. |
| Krävs hela samtalshistoriken? | Inte visat. Begränsa kontext och sparandetid. |
| Krävs permanent länk utan inloggning? | Bekvämt men integritetsriskfyllt. Tidsgräns, rotation och begränsad session är mindre ingripande alternativ. |
| Krävs barnets e-post? | Nej, funktionen är valfri. Överväg vuxenförmedlad delning. |
| Krävs USA-funktionerna? | Inte visat. Utred EU-drift. |
| Krävs hälsouppgifter? | Inte visat för hockeyloggningen. Avgränsa funktionen. |
| Finns giltig grund? | Föreslagen i avsnitt 2, ännu inte beslutad och genomförd för samtliga behandlingar. |
| Kan rättigheter utövas? | Kontoradering uppges finnas. Export/länkåterkallning motsägelsefulla. Samtyckesåterkallning och minneskontroll behöver åtgärdas. |

**Art. 5, 6–9, 12–22, 25 och 35.7 b.**

## 6.4 Befintliga skydd – enligt underlagen, inte tekniskt reviderade

- AI-samtyckesruta med version/tid.
- AI/TTS via angivna EU-regioner/slutpunkter.
- Ingen strukturerad e-post-, saldo- eller betalningsdata i AI-anrop.
- Inget saldo eller e-post i delningsbilder; inget saldo/betalning på spelarlänken.
- Slumpad länk-token och serverstöd för återkallning.
- Högst åtta minnesanteckningar och högst 60 rutindatum.
- Dagsgräns per länk.
- Ingen annonsering eller spårning över andra tjänster enligt underlaget.
- Jämförelse med eget snitt, inte ranking mellan barn.
- Kontoradering och rensning av lokal cache vid utloggning uppges finnas.
- Valfritt iOS-baserat applås.

**Inte befintliga verifierade skydd:** framtida ålderstrappa, verifierat föräldrasamtycke, aktiv ljudgallring eller fungerande återkallningsknappar.

## 6.5 Riskmetod

Bedöm risken för **personen**, inte bara kostnad för bolaget.

- Sannolikhet **S:** 1 låg, 2 medel, 3 hög.
- Allvar **A:** 1 begränsat, 2 påtagligt, 3 allvarligt.
- Arbetsklassning: 1–2 låg, 3–4 medel, 6–9 hög.

Siffrorna är preliminära kvalitativa bedömningar. De är inte uppmätta sannolikheter. Allvarliga barnrisker får inte avfärdas enbart för att sannolikheten bedöms låg.

## 6.6 Riskregister

”Nu” nedan betyder bedömd risk med dokumenterade men ännu inte reviderade skydd. ”Mål” är **villkorad restrisk efter genomförda och testade åtgärder**, inte dagens risk.

| Risk och möjlig skada | Befintligt skydd | Nu S×A | Återstående åtgärder | Villkorad restrisk |
|---|---|---|---|---|
| 1. Läckt spelarlänk röjer barnets utveckling, lag och personliga coachrader. | Slumpad token; återkallningsstöd. | 3×3=9 | Kort giltighet, rotation, fungerande avstängning, inget token i analys/loggar, skydd mot indexering och refererläckage, begränsad vy. | 1×3=3, medel. |
| 2. Felaktiga åtkomstregler eller kontoövertagande ger åtkomst till andra barns data. | Firebase-inloggning, valfritt applås. | 2×3=6 | Testa ägarisolering, serverbehörighet, sessions-/lösenordsflöden, administratörs-MFA och minsta behörighet. | 1×3=3, medel. |
| 3. Tränare eller annan vuxen registrerar barn utan behörighet. | Intyg i Terms. | 2×3=6 | Verifierbar behörighetskedja, särskilt tränarflöde, vårdnadshavarkontakt, process vid tvist. | 1×3=3, medel. |
| 4. Felaktigt AI-minne låser fast negativa omdömen och påverkar bemötandet av barnet. | Kort minne, eget snitt. | 3×2=6 | Visa underlag och osäkerhet, rättelse/radering, tidsgräns, undvik personlighetsetiketter, testa upprepade fel. | 1×2=2, låg. |
| 5. AI ger sårande, farliga eller medicinskt olämpliga råd. | Instruktion om balanserade råd; friskrivning. | 2×3=6 | Systematiska barnsäkerhetstester, avgränsning, filter, rapportering, vuxengranskning och stoppfunktion. | 1×3=3, medel. |
| 6. Hälsouppgifter eller annan känslig fritext skickas till AI och sparas utan art. 9-stöd. | Strukturerade betal-/e-postfält utelämnas. | 2×3=6 | Begränsa inmatning, hantera känslig text före överföring där möjligt, minimera loggar, fastställ art. 9-strategi och radering. | 1×3=3; kan förbli hög om funktionen är öppen. |
| 7. Direkt insamling från underåriga utan giltigt samtycke/verifiering. | Vuxenkonton; planerad ålderstrappa. | 3×3=9 för planerad öppen barnchatt | Håll funktionen avstängd tills land-/åldersflöde, verifiering och barninformation är klara. Granska även dagens rutiner/länkar. | 1×3=3 om rätt flöde verifieras; annars hög. |
| 8. Uppgifter stannar kvar efter återkallande/radering. | Kontoradering uppges finnas. | 3×2=6 | Testa alla datalager, biträden, cache och återställning; central återkallning och raderingsjobb. | 1×2=2, låg. |
| 9. Otillåten eller otillräckligt skyddad tredjelandsåtkomst. | EU-region för AI/TTS. | 2×3=6 | Full flödeskarta, DPA, DPF/SCC där relevant, bedömning, minimering och EU-flytt där möjligt. | 1×3=3; beroende av verifiering. |
| 10. Barnanalys skickas till fel e-post eller sprids genom delning. | Aktivt delningsval, inga saldon/e-post i bild. | 2×3=6 | Bekräfta mottagare, förhandsvisa innehåll, undvik känsliga ämnesrader, begränsa delad text. | 1×3=3, medel. |
| 11. Statistik, streaks och pengar skapar press eller skam. | Eget snitt, lugn presentation. | 2×2=4 | Frivillighet, inga bestraffande standarder, möjlighet att dölja, åldersanpassade användartester och rapportering. | 1×2=2, låg. |
| 12. Kampanjmätning eller mejl sker utan giltigt val. | Ingen tredjepartsspårning uppges. | 3×2=6 | Samtycke före UTM-lagring, separata mejlval, avregistrering och spärrlista. | 1×2=2, låg. |
| 13. Lokal cache röjs på delad eller förlorad telefon. | Valfritt applås, cache rensas vid utloggning. | 2×2=4 | Testa lagringsskydd, backup, kontobyte, utloggning och att känsligt innehåll inte visas i oskyddade vyer. | 1×2=2, låg. |
| 14. Leverantörer återanvänder data eller sparar loggar längre än avsett. | Leverantörer namnges. | 2×3=6 | Kontrollera avtalsvillkor, modellträning, logginställningar, supportåtkomst, gallring och underbiträden. | 1×3=3, medel. |
| 15. ”Anonym” statistik kan kombineras tillbaka till en spelare. | Räknare utan direkta identifierare enligt underlaget. | 2×2=4 | Kontrollera små grupper, tidsstämplar och loggkoppling; aggregera före lagring där möjligt. | 1×2=2, låg. |
| 16. Incident eller rättighetsbegäran hanteras för sent. | Kontaktväg och vissa raderingsfunktioner. | 2×3=6 | Ansvarig person, incidentplan, register över incidenter, biträdesavisering, rättighetsrutiner och övning. | 1×3=3, medel. |

**Rättsligt stöd:** art. 5, 7–9, 12–22, 24–25, 28, 32–35 och 44–46; COPPA 312.5–8 och 312.10; PIPEDA 4.3–4.9; Apple 1.1, 1.4, 1.6 och 5.1.

**Säkerhet i risknivåerna: medel till låg**, eftersom tekniska tester, omfattning och leverantörsavtal saknas.

## 6.7 Genomförande och verifieringsbevis

Före godkännande ska bolaget kunna visa:

- beslutad behandlingstabell och barnspecifika samtyckes-/intressebedömningar;
- testfall för obehörig åtkomst och länkåterkallning;
- bevis på radering i samtliga relevanta datalager;
- test av återkallning som stoppar nya AI-/TTS-anrop;
- dokumenterade leverantörsroller och överföringar;
- säkerhetstester för AI på båda språken och relevanta åldersgrupper;
- klar ansvarsfördelning vid incident, med bedömning av art. 33–34;
- barnanpassad information och test av begriplighet;
- dokumentation av synpunkter från föräldrar och, där lämpligt, barn enligt art. 35.9;
- beslut om vilka funktioner som hålls avstängda.

Ny DPIA-granskning ska ske vid barnchatt, ny modell/leverantör, nya mottagare, nya marknader, hälsobehandling eller väsentligt ändrade risker. Föreslagen ordinarie uppföljning: tre månader efter lansering och därefter årligen. **Art. 35.11.**

## 6.8 Restrisk och förhandssamråd med IMY

**Nuvarande underlag räcker inte för att godkänna riskerna som tillräckligt hanterade.** Flera risker är höga och centrala åtgärder saknas eller är obekräftade.

Förhandssamråd enligt **art. 36** blir aktuellt om DPIA:n efter planerade skydd visar att behandlingen fortfarande skulle innebära hög risk som bolaget inte tillräckligt kan begränsa.

Det krävs **inte automatiskt** samråd bara för att AI och barn förekommer. Men det får inte ersättas med att bolaget accepterar en kvarvarande hög risk i ett internt dokument.

**Slutsats:** minska eller avstå från den riskfyllda behandlingen först. Om hög restrisk ändå återstår, rådgör med IMY före start. **Hög säkerhet – slutbeslut kräver mänsklig jurist.**

---

# 7. App Privacy och App Store

## 7.1 Vad som kan kontrolleras

Den bifogade tabellen är ett **deklarationsutkast**. Det finns ingen export eller skärmbild av de faktiska App Store Connect-svaren. Därför kan jag inte bekräfta att den inskickade deklarationen stämmer.

Källställe vid granskningen: `docs/app-store-listing.md`, rader 125–137.

Apple skiljer mellan:

- data som samlas in från appen och sparas längre än realtidsbehandlingen;
- data kopplad till konto, enhet eller annan identifierbar person;
- spårning genom kombination med andra företags data för annonsering/annonsmätning eller delning med datamäklare.

**GDPR-personuppgifter och Apples datakategorier är inte identiska klassificeringar.**

## 7.2 Föreslagen deklarationsmatris

**Spårning: nej i samtliga rader nedan, utifrån bilagornas uppgifter.** Detta måste verifieras för SDK:er, leverantörer och faktisk konfiguration.

| Apples datatyp | Ice IQ-data | Kopplad till användaren? | Ändamål/bedömning |
|---|---|---|---|
| **Contact Info – Name** | Vuxens och spelares namn. | Ja. | App Functionality; Product Personalization när namn/persondata används i personliga råd. |
| **Contact Info – Email Address** | Vuxens e-post och frivillig spelar-e-post. | Ja. | App Functionality. Även Developer’s Advertising or Marketing om adressen används för marknadsföringsmejl. |
| **Identifiers – User ID** | Konto-ID, relevanta kund-/spelar-ID:n och personkopplade token. | Ja. | App Functionality: konto, åtkomst, säkerhet. Även personalisering där relevant. |
| **Health & Fitness – Fitness** | Individuell hockey-/träningsstatistik. | Ja. | App Functionality och Product Personalization. **Sannolikt relevant kategori**, inte bara ”Other User Content”. **Medel säkerhet.** |
| **User Content – Other User Content** | Fritextfrågor, laguppgifter och annat eget innehåll. | Ja. | App Functionality och Product Personalization. AI-anteckningar bör också kartläggas mot underliggande kategori/Other Data Types; de får inte falla bort för att AI skapar dem. |
| **Financial Info – Other Financial Info** | Money Mode-saldo/belöningsbelopp. | Ja. | App Functionality. Rimlig preliminär klassificering trots att ni inte överför pengar. **Medel säkerhet.** |
| **Purchases – Purchase History** | Plan, abonnemangsstatus och köpanknuten tillgång. | Ja, om insamlingen omfattas av appens flöde. | App Functionality. Kartlägg skillnaden mellan ren webbinsamling och appens behandling/återrapportering. |
| **Usage Data – Product Interaction** | Rutinklick, lyssningsanvändning, räknare per länk. | Ja för personkopplad användning. | App Functionality för rutiner/kvoter; Analytics om beteendet också mäts. |
| **Usage Data – Other Usage Data** | UTM/kampanjkälla. | Ja när den sparas på kontot. | Analytics. Developer’s Advertising or Marketing endast om användningen också motsvarar det ändamålet. |
| **Other Data Types / relevant mer specifik typ** | Samtyckesversion/tid och metadata som inte passar bättre någon annanstans. | Ja. | App Functionality. Klassificera exakt utifrån Apples aktuella formulär. |
| **User Content – Customer Support** | Supportinnehåll. | Normalt ja. | App Functionality. Apples snäva undantag för frivillig, sällan förekommande supportinsamling kan prövas; inte antas generellt. |
| **Usage Data – Product Interaction**, separat anonymt flöde | Anonyma dagsräknare. | Nej endast om Apples anonymiseringskrav faktiskt uppfylls före/vid insamlingen. | Analytics. Om endast en fristående webbsida berörs måste räckvidden för appdeklarationen klarläggas. |
| **Audio Data** | Syntetiskt genererade lyssnaklipp. | Personanknutna om namn/poäng finns. | **Inte automatiskt insamling av användarens röst.** Apple beskriver typen som användarens röst eller ljudinspelningar. Bekräfta klassificeringen av servergenererad personanknuten ljudcache; underliggande persondata måste deklareras oavsett. |
| **Health** | Eventuell avsiktlig insamling av skador/hälsa. | Ja om den förekommer. | Öppen fråga. Generella fritextfält kräver enligt Apple inte att alla tänkbara innehållstyper listas, men en funktion som specifikt efterfrågar hälsa måste deklareras därefter. |

### Sådant som inte ska deklareras som insamlat utan stöd

- **Biometriska mallar:** inga enligt underlaget.
- **Telefonnummer:** inte insamlat enligt Apples definition om det verkligen bara behandlas på enheten; kontrollera Swish-flödet och eventuell telemetri.
- **Kortnummer:** inte insamlat av appen enligt underlaget, när betalningen sker utanför appen och ni inte får tillgång till kortuppgifterna.
- **Kontaktbok, exakt plats, enhets-ID, kraschdata:** ingen tillräcklig uppgift om insamling; kontrollera SDK:er och loggar.
- **Photos/Videos:** lokal generering och användarstyrd delning av rapportbild betyder inte i sig att bolaget samlar in användarens foton.

**Säkerhet: hög för Apples principer; medel för flera exakta kategorival.**

## 7.3 Övriga Apple-krav

1. **5.1.1(i–ii):** rättvisande policy, lagring/radering, begripligt återkallande och tillräckligt skydd hos mottagare. Nuvarande underlag räcker inte för att bekräfta detta.
2. **5.1.2(i):** tydlig information och uttryckligt tillstånd före delning av personuppgifter med tredjeparts-AI. GDPR-grund och Apple-tillstånd måste båda hanteras.
3. **5.1.1(v):** kontoradering i appen måste fungera. Apple-tokenåterkallningen är uttryckligen otestad.
4. **5.1.4:** barns integritet gäller även utanför Kids-kategorin. En parental gate är inte samma sak som rättsligt giltigt föräldrasamtycke.
5. **1.1, 1.4 och 1.6:** olämpligt AI-innehåll, fysiskt skadliga råd och datasäkerhet behöver testas. En friskrivning ersätter inte skydd.
6. **1.2:** underlagen visar ingen offentlig social funktion. AI-chatt är inte automatiskt en social tjänst, men Apple kan pröva innehålls- och rapporteringsfunktioner utifrån faktisk utformning.
7. **4.2:** matchloggning, statistik, delningsblad och applås talar för faktisk funktionalitet, men underlagen räcker inte för att bedöma appupplevelsen eller garantera godkännande.
8. **Åldersklassning:** ”räkna med 4+ eller 9+” är för förenklat. Apples system omfattar numera även 13+, 16+ och 18+. Svara på aktuella frågor utifrån verkligt AI-innehåll och funktioner; använd högre klassificering där appens ålderskrav motiverar det.
9. **Webbköp:** ”inga köp i appen” är inte ensamt bevis på att upplägget följer 3.1.1/3.1.3. Tillgång till webbköpta AI-funktioner måste granskas utifrån appens faktiska modell och regionala regler.

---

# 8. Konkreta villkors- och policytexter

**Samtliga texter är utkast. Publicera bara funktioner och val som faktiskt finns.**

## 8.1 Vårdnadshavarintyg

> När du lägger till ett barn ska du ha rätt att göra det. Du bekräftar att du är barnets vårdnadshavare eller har en dokumenterad behörighet från vårdnadshavaren att registrera de aktuella uppgifterna.
>
> Om du använder Ice IQ som tränare får du inte själv lämna ett samtycke som enligt lag måste lämnas av barnet eller vårdnadshavaren. Då behöver den personen godkänna behandlingen genom vårt särskilda samtyckesflöde.
>
> Berätta för barnet, på ett sätt barnet förstår, vilka uppgifter som registreras. Ta hänsyn till barnets ålder, mognad och önskemål.

**Kommentar:** avtalsintyget ersätter inte bolagets egen kontroll eller ett giltigt samtycke. Vårdnadstvister och gemensam vårdnad kräver särskild bedömning.  
**Art. 5.2, 6–8 och 12; medel säkerhet – kräver mänsklig jurist.**

## 8.2 Åldersgräns – för dagens tjänst

> Kontot är avsett för vuxna föräldrar, vårdnadshavare och tränare. För att skapa konto ska du vara minst 18 år och ha rätt att ingå avtalet där du bor.
>
> Barn ska inte skapa egna konton. En spelarsida som en vuxen delar är inte ett eget konto. Barnets användning av sidan omfattas av särskilda regler om information och samtycke.
>
> Direkt chatt mellan barnet och AI-coachen ingår inte i den här versionen.

**Kommentar:** föreslagen 18-årsgräns är ett produktval; lokal avtalsmyndighet kan kräva ytterligare anpassning. Ändra sista meningen först när barnchatten faktiskt införs och granskats.  
**Art. 8 och 12; svensk föräldrabalk 9 kap. 1 §; Apple åldersklassificering. Medel säkerhet.**

## 8.3 AI-råd

> AI-coachen skapar svar automatiskt utifrån de uppgifter som används i frågan. Svaren kan vara felaktiga, ofullständiga eller olämpliga för en viss spelare.
>
> Råden är förslag för hockeyutveckling. De är inte medicinsk eller psykologisk rådgivning och ersätter inte en tränare, läkare eller annan kvalificerad person.
>
> När råden gäller ett barn bör en vuxen läsa och bedöma dem innan de används. Använd inte ett AI-svar som enda underlag för beslut om barnets hälsa, träning eller deltagande. Avbryt en övning som gör ont eller känns olämplig.
>
> Den här informationen begränsar inte dina rättigheter enligt tvingande lag.

**Konsumentköplagen 9 kap.; avtalslagen 36 §; Apple 1.4. Hög säkerhet om behovet, sluttext kräver mänsklig jurist.**

## 8.4 Money Mode

> Money Mode är en räknare för en frivillig belöning som du själv bestämmer. Beloppet i appen är inte pengar som förvaras hos Ice IQ.
>
> Ice IQ tar inte emot, förvarar eller överför pengar mellan dig och spelaren och garanterar inte att en belöning betalas. Du bestämmer själv om och när en betalning ska göras.
>
> Om du använder en genväg till en extern betaltjänst genomförs betalningen där och omfattas av den tjänstens villkor. Detta påverkar inte vårt ansvar för fel i Ice IQ enligt tvingande lag.

**Kommentar:** beskrivningen stämmer med det uppgivna upplägget. Om bolaget senare hanterar medel, betalningsorder eller garanterar utbetalningar måste klassificeringen göras om.  
**MFL 10 §; konsumentköplagen 9 kap.; betalningsrättslig gränsdragning kräver jurist vid funktionsändring. Medel säkerhet.**

## 8.5 Ansvar – ersätt den generella friskrivningen

> Vi ansvarar för Ice IQ enligt tillämplig lag. Vi lovar inte ett visst idrottsligt resultat.
>
> Om tjänsten är felaktig eller inte levereras kan du ha rätt att få felet rättat, få prisavdrag, avsluta avtalet och få skadestånd enligt lag.
>
> Vi ansvarar inte för en förlust enbart för att den inträffar samtidigt som du använder Ice IQ. Ansvar bedöms utifrån vad som orsakat förlusten och de regler som gäller.
>
> Inget i dessa villkor begränsar rättigheter eller ersättning som du eller barnet har enligt tvingande konsumenträtt eller dataskyddsregler. Villkoren begränsar inte ansvar för uppsåt eller grov vårdslöshet.

Jag rekommenderar **inte ett generellt tak motsvarande abonnemangsavgiften** för konsumenter i denna version. Ett sådant tak kan bli särskilt problematiskt för personskada och integritetsskada.

**Konsumentköplagen 1 kap. 10 §, 6 kap. och 9 kap. 3 och 10 §§; avtalslagen 36 §; AVLK 10–11 §§; GDPR art. 82. Kräver mänsklig jurist.**

## 8.6 Policytext om AI-minne och återkallning

*Använd först när funktionerna fungerar:*

> Om du väljer AI-coachen använder vi spelarens matchuppgifter och din fråga för att skapa personliga råd med hjälp av Google Vertex AI.
>
> Du väljer separat om coachen får spara korta anteckningar för framtida råd. Anteckningarna är AI:s sammanfattningar och kan vara felaktiga. Du kan läsa och radera dem.
>
> Du kan stänga av AI-behandlingen och återkalla ditt samtycke under [verifierad plats]. Då stoppar vi nya AI-anrop och raderar uppgifter som vi inte längre har rätt att behålla. Du kan fortsätta använda matchloggningen utan AI.
>
> Ett återkallande påverkar inte om behandlingen före återkallandet var tillåten.

**Art. 7.3, 12–13 och 17.**

## 8.7 Kort barninformation

> Ice IQ visar uppgifter om din hockey som en vuxen har lagt in.
>
> AI-coachen är ett datorprogram, inte en människa. Den kan ha fel. Du behöver inte följa ett råd som känns fel eller gör dig ledsen.
>
> [Beskriv exakt vem som kan läsa det barnet skriver eller ser.] Den som har länken till din sida kan öppna den.
>
> Du kan be om hjälp att rätta eller ta bort uppgifter. Kontakta oss på [verifierad kontaktväg].

**Art. 12–14; PIPEDA § 6.1; COPPA 312.4 där tillämpligt.**

### Andra villkor som måste kompletteras

Betalningsvillkoren behöver även täcka engångsköp, prisperiod, uppsägning, reklamation, ångerrätt och tillåtna ändringar. Kontrollera också **distansavtalslagen 2 kap. 10 a § om onlinefunktion för ångerrätt** i den aktuella lydelsen. Underlagen visar inte hur köpflödet hanterar detta.

---

# 9. Prioriterad att-göra-lista

**A gäller före lansering av berörd funktion.** En enklare version med avstängd AI, delning eller barninteraktion kan ha färre beroenden, men är inte automatiskt godkänd.

## A. Måste åtgärdas före lansering

| Åtgärd | Mänsklig juridisk bedömning? |
|---|---|
| Bestäm ansvarsfördelning för familjekonton, tränare och eventuella föreningar. **Art. 4, 26, 28.** | **Ja – kräver mänsklig jurist.** |
| Besluta art. 6-grund per ändamål och registrerad samt strategi för möjlig hälsodata. **Art. 6–9.** | **Ja.** |
| Rätta policyns motsägelser om export, länkåterkallning, ljudcache, EU-behandling och fullständig radering. **Art. 5, 12–14.** | **Delvis:** teknik verifierar, jurist godkänner text. |
| Inför fungerande återkallning, tydligt AI/TTS-tillstånd och val för minne; säkerställ att återkallning verkställs. **Art. 7, 17, 25; Apple 5.1.1–2.** | **Ja för utformningen; teknik för implementation.** |
| Håll barnchatten avstängd tills jurisdiktion, ålder, behörighet och verifiering är lösta. Bedöm även dagens länkar/rutiner. **Art. 8; COPPA; PIPEDA/Québec.** | **Ja, inklusive USA-/Kanadakompetens.** |
| Fastställ Firestore-region, samtliga mottagare, biträdesavtal och överföringsmekanismer. **Art. 28, 44–46.** | **Ja.** |
| Aktivera och testa gallring, kontoradering, radering av härledda data och Apple-tokenåterkallning. **Art. 5.1 e, 17, 25; Apple 5.1.1(v).** | **Delvis:** juridiska undantag behöver bedömas. |
| Genomför behörighets-, länksäkerhets- och AI-barnsäkerhetstester. **Art. 25, 32, 35; Apple 1.x.** | **Delvis:** tekniskt arbete med juridisk riskbedömning. |
| Slutför DPIA, dokumentera restrisk och bedöm art. 36. | **Ja.** |
| Stoppa samtyckespliktig UTM-lagring utan giltigt val. Klassificera och rätta mejlflöden. **LEK 9:28; MFL 19–20; CASL; CAN-SPAM.** | **Ja för klassificering.** |
| Komplettera barn-/föräldrainformation, rättigheter, lagringstider och kontaktuppgifter. **Art. 12–14.** | **Ja.** |
| Rätta App Privacy, åldersklassning och granskningsanteckningar mot den faktiska releasen. | **Delvis:** juridik och releaseansvarig. |
| Ersätt bred ansvarsfriskrivning, totalansvar för kontoaktivitet och fri ändringsrätt; komplettera köp/ångerrätt. | **Ja – kräver mänsklig jurist.** |
| Utse incident- och rättighetsansvarig; skapa behandlingsregister. Småbolagsundantaget i art. 30.5 är inte självklart tillämpligt på återkommande barnbehandling. | **Ja för omfattning; operativt ansvar måste finnas.** |

**Ytterligare lanseringskontroll:** även om EU:s AI-förordning inte ingick uttryckligen i ramverkslistan bör art. 4 och 50 bedömas. Transparensreglerna i art. 50 började tillämpas den 2 augusti 2026. Roller som leverantör/användande organisation och krav för den egna AI-integrationen måste bestämmas; ”AI-coach” som etikett avgör inte hela frågan. **Kräver mänsklig jurist.**

## B. Bör slutföras inom tre månader

Dessa tidsangivelser gäller bara förbättringar som inte behövs för att hantera en redan oacceptabel risk.

| Åtgärd | Mänsklig juridisk bedömning? |
|---|---|
| Följ upp DPIA med verkliga driftdata, incidenter, klagomål och felaktiga AI-svar. **Art. 35.11.** | **Ja vid ändrad risk.** |
| Gör begriplighetstester med föräldrar och, lämpligt utformat, barn. **Art. 12, 35.9.** | **Delvis.** |
| Förbättra självservice för export och detaljerad radering om en fungerande manuell rättighetsprocess används vid lansering och policyn beskriver detta korrekt. **Art. 12, 15–20.** | **Normalt nej för gränssnittet; ja för datagränser.** |
| Fördjupa anonymitetskontroll, smågruppsrisk och leverantörsuppföljning. **Art. 5, 25, 28.** | **Delvis.** |
| Följ upp valda lagringstider mot faktisk användning och minska dem där möjligt. **Art. 5.1 e.** | **Ja vid väsentlig ändring.** |
| Öva incidenthantering och återställning med återapplicerad radering. **Art. 32–34.** | **Delvis.** |

## C. Kan vänta

| Åtgärd | Mänsklig juridisk bedömning? |
|---|---|
| Införa barnchatt över huvud taget. Funktionen kan förbli avstängd. | **Ja före aktivering.** |
| Mer avancerad regional samtyckesautomation, om en fungerande och proportionerlig lösning redan finns. | **Ja för regelmodellen.** |
| Frivilligt publicera en icke-känslig sammanfattning av DPIA:n. | **Rekommenderas.** |
| Längre säsongsarkiv, mer omfattande AI-minne eller nya delningsfunktioner. | **Ja före införande; ny DPIA-prövning.** |
| Extra certifieringar och oberoende revision utöver nödvändiga kontroller. | **Beror på omfattning och avtalskrav.** |

**Samlad slutsats:** underlagen visar flera genomtänkta begränsningar, men de bär ännu inte ett lanseringsbeslut för hela den beskrivna tjänsten. De viktigaste hindren är giltig behandling av barnets uppgifter, verklig återkallning och gallring, skyddet runt personliga länkar, leverantörs-/överföringskontrollen och en slutförd DPIA. Den planerade barnchatten bör hållas åtskild från första lanseringen tills dessa frågor har bedömts och verifierats av teknikansvarig och mänsklig jurist.
