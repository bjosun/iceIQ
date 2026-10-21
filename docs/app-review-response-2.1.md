# Svar till App Review: Guideline 2.1, Information Needed (uppdaterad 2026-10-19)

Det här är **inte ett avslag på något fel i appen**. Apple ber om mer information för att kontot har lite granskningshistorik. Svara i **Resolution Center** (App Store Connect → appen → App Review → Resolution Center), bifoga filmen, och lägg samma information i **Notes** under App Review Information.

Fyll i platshållarna `<...>` innan du skickar. Skicka in **bygge 11** (eller nyare) och spela in på just det bygget.

## 1. Skärminspelning (görs av dig, på en riktig iPhone)

Apple kräver: en riktig enhet, senaste iOS, börja med att appen startas, och visa registrering, inloggning och **radering av konto**. Appen har inget användargenererat innehåll som delas mellan användare och inga betalda funktioner, så de delarna säger vi uttryckligen i svaret.

Förberedelser: bygge 11 installerat via TestFlight, Stör ej på, ett **nytt engångskonto** för filmen (inte testkontot), skärminspelning i Kontrollcenter. Cirka 4 till 5 minuter. Skriv upp tidpunkterna medan du filmar (mallen finns i avsnitt 3).

Manus:

1. **Hemskärmen:** tryck på Ice IQ-ikonen så att appen startar.
2. **Skapa konto:** visa att man måste skriva lösenordet **två gånger** (bekräfta lösenord). Skapa kontot med e-post.
3. **Logga ut och logga in** igen med e-post och lösenord (visar att inloggning och registrering är skilda flöden).
4. **Lägg till en spelare** (ett förnamn räcker) och välj roll (Back, Forward, Center eller Målvakt).
5. **Spela in tre matcher:** tryck i knapprutnätet (de tolv plus- och sex minusknapparna, och "Mer…" med dagens fokus), tryck **Spara match** och visa recapen. Gör det tre gånger.
6. **Utveckling:** öppna fliken *Utveckling*, visa nyckeltalen, grafen och matchhistoriken.
7. **Coach:** öppna fliken *Coach*, visa **samtyckesrutan**, godkänn, ställ en fråga och visa svaret. Visa också läget *Mental träning* med en fråga.
8. **Spelarlänk:** skapa länken, öppna den (visar spelarens sida med utmärkelser) och **stäng länken** från samma dialog.
9. **Mitt konto:** visa *Dina uppgifter* (ladda ner), *Återkalla samtycke till AI-coachen*, och integritetspolicy och support.
10. **Radera konto:** skriv DELETE och **ditt lösenord**, bekräfta, och visa att du hamnar på inloggningen. Försök sedan logga in med samma uppgifter och visa att det **misslyckas**.
11. **Testkontot:** logga in med demokontot och visa att spelaren och matcherna finns.

## 2. Svar att klistra in i Resolution Center (engelska, under 4000 tecken)

```
Hello App Review team,

Thank you for the review. A screen recording from a physical iPhone (build 12) is attached. The same information is also in the Notes field.

1. Purpose and audience
Ice IQ helps parents and coaches log a youth hockey player's games and follow the player's development. After each game the adult taps the actions that happened in a button grid, saves the game and gets a score and recap. A Progress tab shows trends and history. An optional AI coach (game analysis or mental training) gives advice from the logged games. The player gets a private, read-only page through a link the adult chooses to share. The app is for adults, rated 13+; children do not create accounts.

2. Access
Demo account: granskning@squareversegroup.com / <LÖSENORDET> (a player and several games already exist). Account creation is a separate form that asks for the password twice. Sign in with Apple and Google are also available. Delete account: Account tab, type DELETE and re-enter the password; a server function then deletes all data and the sign-in.

3. Main features
Log game tab (button grid, Save, recap), Progress tab, Coach tab (consent screen on first use), player link (create, open, switch off), Account tab (download my information, withdraw AI consent, delete account).

4. External services
Firebase (Auth, Firestore EU, Functions, Hosting); Google Cloud Vertex AI (Gemini, EU) for the coach, only after explicit in-app consent; Google Cloud Text-to-Speech (EU) for the listen feature, no audio stored; Resend (email, with unsubscribe link); Stripe (optional subscription on our website only; no purchase flow or prices in the iOS app, in-app purchase planned later).

5. Regional differences
None, apart from the Swish shortcut in Money Mode (a parent's own tally of a small reward, not gambling), shown only when the device region is Sweden and Swish is installed. English and Swedish are supported.

6. Regulated industry or third-party material
None.

User-generated content: nothing is shared between users, so no reporting or blocking is needed. Paid content: none in the iOS app.

Timestamps (m:ss): 0:00 sign-up screen, 0:28 registration (password twice), 0:44 My Account, 0:52 log out and in, 1:36 add player, 2:12 button grid and today's focus, 2:32 / 3:04 / 3:36 three games saved, 3:48 history and Progress tab, 4:08 AI coach consent and answer, 5:36 player link (opened 6:00, switched off 6:56), 7:04 delete account, 7:28 sign-in screen, 8:00 failed sign-in with the deleted account.

Best regards,
<DITT NAMN>
SquareVerse Group AB
```

## 3. Notes-fältet (App Review Information, gräns 4000 tecken, ersätt hela texten)

```
Demo account
Email: granskning@squareversegroup.com
Password: <LÖSENORDET>

Purpose: Ice IQ helps parents and coaches log a youth hockey player's games and follow the player's development. It is for adults (parents, guardians, coaches), rated 13+. Children do not create accounts.

Purchases: this iOS version has no in-app purchases and no purchase flow; all upgrade screens, prices and purchase links are hidden. An optional paid subscription is sold on our website only (Stripe) and unlocks the same features after sign-in. The demo account is on the free plan. In-app purchase is planned for a later version.

How to test:
1. Sign in with the demo account (email and password). Creating an account is a separate form that asks for the password twice. Sign in with Apple and Google are also available.
2. Log game tab: pick the demo player, tap actions in the button grid and Save to see the recap. The Progress tab shows trends, season comparison and history.
3. Coach tab: on first use a consent screen explains what is sent and to whom. Accepting is required before any data leaves the app. A switch selects Game analysis or Mental training.
4. Account tab: optional Face ID lock, download my information, withdraw AI consent, and Delete account (type DELETE and your password). This removes all player data, coach conversations, player links and the sign-in.

External services: Firebase (Auth, Firestore EU, Functions), Google Cloud Vertex AI (Gemini, EU) for the AI coach after consent, Google Cloud Text-to-Speech (EU) for the listen feature, Resend (email), Stripe (website only).

Regions: the app works the same everywhere, in Swedish and English. Only the Swish payment shortcut in Money Mode (a parent's own tally of a small reward, not gambling) appears when the device region is Sweden and Swish is installed.

User-generated content: none is shared between users, so no reporting or blocking is needed. Regulated industry or third-party material: none.

A screen recording from a physical device was sent in the Resolution Center (21 Oct 2026).
```

## 4. Efter att du skickat svaret

- Svara i Resolution Center (**Reply**), bifoga filmen, och lägg Notes i versionen. Tryck **Resubmit to App Review** när Apple ber om det.
- Välj **bygge 11** på versionssidan.
- Testkontot ska fungera och ha data. Kontrollera inloggningen själv innan du skickar, och radera inte testkontot.
