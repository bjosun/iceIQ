# Sortering av ChatGPT-granskningen (2026-10-12) mot nuläget (2026-10-14)

Granskningen var utförd mot underlag från 12 oktober. Flera av dess punkter har sedan dess åtgärdats, och den utgick delvis från den äldre mappningen. Det här dokumentet sorterar varje punkt. Inte juridisk rådgivning.

Förklaring: **✅** åtgärdat · **🔧** kan åtgärdas av teknik/text · **🧑‍⚖️** kräver människa med juridisk kompetens · **❓** beslut för ägaren.

## 1. Motsägelser den hittade (båda är nu lösta)

| Punkt | Status |
|---|---|
| Policyn lovar export och avstängning av spelarlänk i appen, men mappningen sa att gränssnitt saknas | ✅ Knapparna byggdes och deployades 2026-10-13 ("Ladda ner mina uppgifter" under Konto, "Stäng länken" i länkdialogen). Mappningen är uppdaterad |
| Policyn säger "kortlivad kopia" av ljud men raderingen var inte aktiv | ✅ Ljud sparas inte längre alls (cachen är borttagen) |
| "Most of this runs in the EU" utan att Firestore-regionen var känd | ✅ Verifierat: Firestore ligger i `eur3` (europeisk multiregion). Policyn säger nu det, och att vissa funktioner körs i USA |

## 2. Faktapunkter i policyn

| Punkt | Status |
|---|---|
| P1 "krypterat i vila och under överföring" (för stort löfte) | ✅ Nu: "våra molnleverantörer krypterar" |
| P2 "Only you can open your account" (absolut) | ✅ Mjukat; spelarlänken beskrivs som ett lösenord |
| P11 "sluta använda coachen" är inte återkallande av samtycke | ✅ Riktig återkallelse byggd: "Återkalla mitt samtycke till AI-coachen" (med val att radera sparade samtal och anteckningar). Servern stoppar AI-anrop tills samtycke ges igen |
| P3–P5, P7, P8 (kategorier, Stripe-uppgifter, samtyckeslogg, mejltyper, "improve") | 🔧 Kan förtydligas i nästa textrunda. Ingen faktamässig brist, men precisionen kan bli bättre |
| P6 UTM sparas på enheten före registrering (ePrivacy) | ✅ UTM hålls nu i minnet, inte i enhetens lagring. Kontot får fortfarande källan vid registrering (berättigat intresse) |
| P13/P14 plats och mottagare | ✅/🧑‍⚖️ Plats verifierad. Avtal och mekanism (DPF/SCC) per leverantör återstår |
| P15/P16 lagringstider per kategori | ✅ Delvis: ljud finns inte, anteckningar kan raderas, inaktiva konton rensas (se nedan). 🧑‍⚖️ Tider per kategori ska beslutas |
| P17/P18/P22 barnriktad del, tränarflöde, barninformation | 🧑‍⚖️ Kräver beslut om hur länken ska klassificeras (se avsnitt 4) |
| P20/P21/P23/P24 rättslig grund, rättigheter (begränsning, klagomål), roller, obligatoriska uppgifter | 🧑‍⚖️ Texten skrivs när grunderna är beslutade (mappningen är underlaget) |

## 3. Villkor (Terms)

| Punkt | Status |
|---|---|
| Amerikansk "indirect damages"-friskrivning passar inte svensk konsumenträtt | 🧑‍⚖️ Byt ut mot förslaget i granskningens avsnitt 8.5 (inget generellt tak) efter jurist |
| Obegränsad ändringsrätt, "ansvar för all aktivitet" | 🧑‍⚖️ Byt ut |
| Vårdnadshavarintyg, åldersgräns, AI-råd, Money Mode | 🔧 Utkast finns i granskningens 8.1–8.4 och är rimliga att utgå från; **jurist ska godkänna** |
| Köpvillkor: engångsköp, prisperiod, uppsägning, ångerrätt | 🧑‍⚖️ Saknas; kritiskt för webbköp |

## 4. Barn, COPPA och spelarlänken (den stora frågan)

Granskningen tar upp tre saker som ändrar bilden:
1. Barnets uppgifter kan inte generellt bäras av avtalet med föräldern (se mappningen rad 2).
2. "Bara lyssna" är inte automatiskt undantaget från COPPA **om barnets besök eller rutiner samlas in och kopplas till spelaren**.
3. Dagens spelarlänk samlar faktiskt in två sådana saker: **rutindatum** (barnet markerar en rutin som gjord) och **användningsräknare per länk** (dagsgräns för ljud).

Det betyder att det inte bara är den planerade barnchatten som är en fråga, utan även delar av länken idag.

### ❓ Beslut 1: vad ska spelarlänken göra i version 1?

| Alternativ | Vad det innebär | Juridisk börda |
|---|---|---|
| **A. Skrivskyddad länk i v1 (rekommenderas)** | Länken visar kurva, märken och lyssnaklipp. Rutinloggningen (där barnet sparar något) och barnets egna skrivningar tas bort tills samtycke/verifiering är löst. Andningsövningen kan stanna (lokal, sparar inget) | Lägst. Barnet "tittar", ingen insamling från barnet |
| B. Behåll som den är | Rutiner sparas per spelare | Kräver COPPA/PIPEDA-bedömning för användare under 13 i USA/Kanada innan lansering där |
| C. Länk bara efter förälderns uttryckliga godkännande per spelare | Förälderns val med tydlig text | Medel |

Jag rekommenderar **A** och kan bygga det (rutinloggningen kopplas bort på länken och återkommer när det finns ett juridiskt hållbart flöde).

### ❓ Beslut 2: lyssnaklippens text-till-tal

Texten innehåller förnamn och poäng och skickas till Google (EU). Alternativ som minskar risken: (a) utan namn ("Din senaste match gav 18 poäng") eller (b) bara telefonens egen röst (inget lämnar enheten). Jag rekommenderar **namnfri text** för molnrösten. Det kostar nästan ingenting i känsla.

## 5. DPIA

Granskningens avsnitt 6 är ett användbart utkast: riskregister med 16 risker, metod, åtgärder och slutsats. Den kommer fram till att **underlaget inte räcker för att godkänna riskerna**, med de centrala hindren: giltig grund för barnets uppgifter, verklig återkallelse och gallring, skydd runt länkar, leverantörsavtal och en slutförd DPIA. Flera av dessa är nu åtgärdade (återkallelse, ljudcache borta, minneskontroll, export, stäng länk, UTM) och de resterande listas i avsnitt 8 nedan.

**Praktiskt:** gör granskningens avsnitt 6 till DPIA-dokumentet, uppdatera kolumnen "Befintliga skydd" med det som byggts efter 12 oktober, och låt en jurist signera. Förhandssamråd med IMY (art. 36) blir aktuellt bara om hög risk kvarstår efter åtgärderna.

## 6. App Store

- App Privacy-matrisen i granskningens avsnitt 7 är en bra kontroll. Några val att göra rätt: **Health & Fitness** (individuell träningsstatistik), **Financial Info** (Money Mode-saldo), **Purchase History**, **Other Usage Data** (UTM), **Customer Support**.
- Apple har nu åldersklasser även 13+/16+/18+. Svara utifrån faktiskt AI-innehåll.
- Apple kräver uttryckligt tillstånd före delning med tredjeparts-AI (5.1.2(i)): AI-samtycket täcker coachen, men inte text-till-tal. **🔧 Lägg in text-till-tal i samtyckestexten** (eller använd namnfri text enligt Beslut 2, så minskar behovet).

## 7. Nya skydd byggda sedan granskningen

| Åtgärd | Datum |
|---|---|
| Stäng spelarlänk (knapp) | 2026-10-13 |
| Ladda ner mina uppgifter (knapp) | 2026-10-13 |
| Coachens anteckningar: visa, rensa, stäng av | 2026-10-13 |
| Ljud sparas inte | 2026-10-13 |
| Spelarens e-post dold bakom val; namntips | 2026-10-13 |
| Återkalla AI-samtycke (med radering på begäran) | 2026-10-14 |
| UTM i minnet, inte på enheten | 2026-10-14 |
| Rensning av inaktiva konton (24 mån + 30 dagars varning), **avstängd som standard** | 2026-10-14 |

### Rensning av inaktiva konton: så slår du på den
Funktionen `inactiveAccountCleanup` körs varje måndag men loggar bara vad den skulle göra. Läs loggen i Firebase Console i några veckor. Slå sedan på med `INACTIVE_CLEANUP_ENABLED=true` i `functions/.env` och deploya om funktionen. Den varnar först (mejl, 30 dagars frist) och raderar sedan. Konton med aktiv/obetald prenumeration eller köpta krediter rörs aldrig, och den som loggar in igen efter varningen behåller kontot.

## 8. Det som återstår (kortlista)

**Före lansering**
1. ❓ Beslut 1 och 2 ovan, och sedan jag bygger det.
2. 🧑‍⚖️ Rättslig grund per behandling, och policytext efter det.
3. 🧑‍⚖️ Leverantörsavtal (Google, Stripe, Resend) och överföringsmekanism för USA.
4. 🧑‍⚖️ Villkoren: ansvarsbegränsning, ändringsrätt, köp/ångerrätt.
5. 🧑‍⚖️ DPIA: signera och uppdatera.
6. 🔧 Samtyckestexten: lägg till text-till-tal (eller namnfri text).
7. 🔧 Provkör radera konto med Apple-inloggning och att återkallelsen verkligen stoppar nya AI-anrop.
8. ❓ App Privacy och åldersklass i App Store Connect.

**Efter lansering**
- Barnchatt: **hålls avstängd** tills barnflöde, verifiering och regionala regler är lösta (granskningen är tydlig med det).
- Ålderstrappa och verifierbart föräldrasamtycke för USA/Kanada under 13.
- Starkare säkerhetsloggar och gallring av dem, incidentövning.
