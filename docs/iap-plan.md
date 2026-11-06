# Plan: köp i appen (In-App Purchase via RevenueCat), v1.1

Status 2026-11-06. Bygger på `docs/ios-app-plan.md` (serversidan finns) och på att v1.0 är godkänd utan köp i appen.

## Läget

| Del | Status |
|---|---|
| Webhook `revenueCatWebhook` + `functions/revenuecat.js` (tester: `node --test functions/revenuecat.test.js`) | Byggd, **inte deployad** (hemligheten `REVENUECAT_WEBHOOK_AUTH` är inte satt) |
| Produkt-ID:n bestämda (`iceiq_premium_monthly/yearly`, `iceiq_elite_monthly/yearly`, `iceiq_credits_15`) | Klart |
| Fältet `subscriptionSource` (`stripe` / `apple`) som hindrar att en kassa nollar den andras prenumeration | Klart |
| Paid Apps-avtal, bank- och skatteuppgifter | **Klart** (bekräftat av Björn 2026-11-06) |
| RevenueCat-projekt och App Store Connect-produkter | **Oklart, kontrolleras först** (se steg 0) |
| Klientkod (SDK, inloggning mot RevenueCat, köpskärm, Restore Purchases) | **Byggd 2026-11-06, avstängd** (`VITE_IAP_ENABLED=false`). iOS-bygget kompilerar med pluginet |
| Köpskärmar i appen | Dolda med `isNativeApp` i 10 filer (se längst ned) |

## Steg 0: kontrollera vad som redan finns (10 minuter, du)

1. **RevenueCat** (app.revenuecat.com): finns ett projekt för Ice IQ? Finns en **iOS-app** kopplad med bundle-ID `com.squareverse.iceiq`? Finns produkter, en *offering* och **public SDK key** (`appl_...`)?
2. **App Store Connect → appen → Monetization → Subscriptions**: finns produkter eller en *subscription group*?

Resultatet avgör hur mycket av steg 1 till 3 som redan är gjort.

## Fas 1: Apple och RevenueCat (du, ingen kod; tar längst tid)

1. ~~Avtal, bank och skatt~~ **Klart.** (Kontrollera bara att Paid Apps står som *Active* under Business.)
2. **Small Business Program** (ansök hos Apple): 15 % provision i stället för 30 % under 1 miljon USD per år. Gör det **före** första köpet.
3. **Produkter i App Store Connect** (exakt dessa ID:n):
   - *Subscription group* "Ice IQ Pro" med fyra auto-förnyande prenumerationer: Premium månad/år och Elite månad/år (Elite i högre nivå än Premium).
   - En *consumable*: `iceiq_credits_15` (krediter).
   - För varje: namn och beskrivning på svenska och engelska, pris, och en **skärmdump av köpskärmen** (krävs för granskningen).
4. **Priser:** Apple har fasta pris­punkter, så exakt 29 kr och 29 USD går inte alltid att få. Välj närmaste punkt. Appen visar Apples pris, så en liten skillnad mot Stripe syns inte som ett fel, men bestäm om du vill ha prisparitet.
5. **RevenueCat:**
   - Koppla App Store (använd nyckeln för *In-App Purchase* (.p8) och/eller App Store Connect API-nyckeln).
   - Importera produkterna, skapa **entitlements** (`premium`, `elite`) och en **offering** (standard) med paketen.
   - Kopiera **public SDK key** (`appl_...`). Den används i appen och är inte hemlig.
6. **Webhook:** sätt hemligheten (`firebase functions:secrets:set REVENUECAT_WEBHOOK_AUTH`, ett långt slumpvärde), ange samma värde som `Bearer <värdet>` i RevenueCats webhook-inställning, och peka den mot funktionens URL. (Jag deployar `revenueCatWebhook` när hemligheten är satt.)

## Fas 2: kod (jag, ca 2 till 3 dagars arbete)

1. `npm i @revenuecat/purchases-capacitor` och `npx cap sync ios`.
2. **Konfiguration** vid appstart i native: `Purchases.configure({ apiKey })`.
3. **Inloggning mot RevenueCat:** `Purchases.logIn(firebaseUid)` när användaren loggar in och `logOut()` när hen loggar ut. Utan det hamnar köp på ett anonymt ID och webhooken ignorerar dem (webhooken känner igen kontot via uid).
4. **Köpskärm** (bara i appen): hämtar offering och visar Premium och Elite, månad och år, med priset från Apple. Krav från Apple på skärmen: tydligt pris och längd, att den förnyas automatiskt, **länkar till Användarvillkor och Integritetspolicy**, och en knapp **Restore Purchases**.
5. **Krediter:** köp av `iceiq_credits_15` som engångsköp (hanteras redan av webhooken).
6. **Efter köp:** appen väntar på att Firestore-fälten ändras (webhooken skriver dem) och visar det nya läget. Visa ett tydligt läge om det dröjer.
7. **Webb och app ihop:** har kontot en aktiv **Stripe**-prenumeration (`subscriptionSource = 'stripe'`) visar appen "Hanteras på webben" i stället för köpskärmen, så att ingen betalar två gånger. Har kontot en **Apple**-prenumeration pekar webbens hantera-knapp mot Apple.
8. **Hantera prenumeration** i appen: länk till `itms-apps://apps.apple.com/account/subscriptions`.
9. **Slå på de dolda delarna igen** (bara när köp finns): se listan nedan.
10. **Uppdatera svaret i Notes** och policyn så att de beskriver köp i appen (och Privacy: köp- och prenumerationsstatus finns redan med).

## Fas 3: test och granskning

1. **Sandbox:** skapa en *Sandbox Tester* i App Store Connect och testa köp, förnyelse, uppsägning och Restore på riktig telefon via TestFlight. Det kräver **inte** att appen finns i App Store i Sverige.
2. Kontrollera att webhooken skriver rätt fält för varje händelse (`INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `PRODUCT_CHANGE`).
3. **Skicka in som version 1.1** med produkterna kopplade till versionen. Apple granskar köpen **tillsammans med appen** (det är första gången de skickas). Beskriv i Notes hur man når köpskärmen och lägg ett sandbox-konto att köpa med.

## Det som är dolt i appen idag och ska visas igen (`isNativeApp`)

| Fil | Vad |
|---|---|
| `components/modals/SubscriptionModal.tsx` | Prenumerationsmodalen (stängd i appen) |
| `components/layout/UserDropdown.tsx` | Uppgradera/Hantera-menyn |
| `components/layout/PaymentAlertBanner.tsx` | Banner vid misslyckad betalning |
| `components/ai/AiCoach.tsx` | Köp av krediter och uppgraderingsrutan |
| `components/dashboard/TemplateSelector.tsx` | Uppgraderingsrutan för mallar |
| `components/modals/PlayerHistoryModal.tsx` | Fliken "Statistik & Trend" (Pro) |
| `components/modals/ProfileModal.tsx` | "Hantera prenumeration" |
| `components/dashboard/ActionGrid.tsx` | Egna mallar (Pro) |
| `components/modals/PlayerSelectModal.tsx` | Gränsmeddelandet (idag neutralt utan pris) |
| `pages/Dashboard.tsx` | Begränsad historik och uppgraderingslänkar |

## Risker att hålla koll på

- **Guideline 3.1.1:** när funktionerna kan köpas på webben ska de även kunna köpas i appen. Det är det här steget som löser den frågan helt.
- **Köp som inte syns:** blir `logIn(uid)` fel (till exempel anropas det före inloggning) ignorerar webhooken köpet. Testa i sandbox innan granskning.
- **Dubbla kassor:** testa uttryckligen kombinationen webbköp i Stripe och sedan inloggning i appen.
- **Priser och moms:** Apples priser inkluderar moms och skiljer sig per land. Räkna med att intäkten per köp blir lägre än via webben (15 till 30 % provision).
- **Sverige och EU:** appen kan inte köpas av svenska användare förrän trader-statusen är verifierad (se `docs/release-runbook.md`).

## Beslut som är dina

1. Behålla både Premium och Elite i appen från start, eller börja med bara Premium och krediter? (Mindre att granska och testa.)
2. Prisparitet mot Stripe eller Apples närmaste prispunkt?
3. Ska krediter (`iceiq_credits_15`) vara med i första versionen eller vänta?

## Byggt 2026-11-06 (avstängt tills produkterna finns)

- `src/services/purchases.ts`: RevenueCat-modulen (dynamisk import, bara i appen). På när `VITE_IAP_ENABLED=true` och `VITE_REVENUECAT_IOS_KEY` börjar med `appl_`. Båda ligger i `.env` (nyckeln är satt, flaggan är `false`).
- `src/components/modals/IapPaywall.tsx`: köpskärmen (Premium månad/år från offering `default`, krediter från offering `credits`, Restore Purchases, villkorslänkar, Apples juridiska text, "Hantera prenumeration").
- `AuthContext`: `Purchases.logIn(uid)` vid inloggning och `logOut()` vid utloggning. Utan det ignorerar webhooken köpen.
- `SubscriptionContext`: fältet `source` (`stripe`/`apple`) och `refreshAfterPurchase()` som väntar in webhooken.
- `SubscriptionModal` visar köpskärmen i appen (helt avstängd när flaggan är `false`). Ingångar: Mitt konto (knapp), AI-coachens kreditknapp och slut-på-krediter-rutan.
- Stripe-kunder i appen ser "Hanteras på webben" i stället för köpskärmen (ingen dubbelbetalning).

**Att slå på (v1.1):** sätt `VITE_IAP_ENABLED=true`, deploya webhooken (`REVENUECAT_WEBHOOK_AUTH`), bygg och testa i sandbox. Lägg också till capability **In-App Purchase** i Xcode (Signing & Capabilities).

**Ännu inte kopplat** (kvar att göra): fliken "Statistik & Trend" i Spelarhistorik, spelargränsmeddelandet och Elite i köpskärmen.

