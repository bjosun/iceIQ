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

## 2. Svar att klistra in i Resolution Center (engelska)

```
Hello App Review team,

Thank you for the review. Here is the information you asked for. A screen recording from a physical iPhone running the latest iOS is attached (build <11>). It starts with launching the app and covers account registration, login, logging a game, the AI coach and its consent, the player link, and account deletion.

1. Purpose and audience
Ice IQ helps parents and coaches log a youth hockey player's games and follow the player's development over time. After each game the adult taps the actions that happened (good plays and mistakes) in a fixed button grid, saves the game, and gets a score and a short recap. A Progress tab shows trends per season and match history. An optional AI coach gives advice based on the logged games, in two modes: game analysis and mental training. The player gets a private, read-only page through a link the adult chooses to share, with short audio recaps, the coach's notes and awards. The app is for adults (parents, guardians and coaches), not for children, and is rated 13+. Children do not create accounts. The value is a simple, structured way to see a player's progress instead of relying on memory.

2. Account and access
Demo account: <TESTKONTOT> / <LÖSENORDET>. It already has a player and several saved games. Sign in with email and password on the first screen. Creating an account is a separate form that asks for the password twice; signing in never creates an account. Sign in with Apple and Google are also available. Account deletion: Account tab > Delete account. The user confirms by typing DELETE and re-enters the password (or re-authenticates with Apple or Google). A server function then deletes all player data, coach conversations, player links, the payment customer and the sign-in itself; signing in again with the same credentials fails.

3. How to reach the main features
- Log game tab: pick the demo player, tap actions in the grid (a fixed layout of up to twelve positive and six negative buttons; "More…" holds the rest and today's focus), then Save to see the recap.
- Progress tab: key figures, season chips, the development graph, season comparison and match history.
- Coach tab: the first time, a consent screen explains what is sent and to whom. After accepting, ask a question to get the AI answer. The Game analysis / Mental training switch is above the quick questions.
- Player link: create a read-only link for the player, open it, and switch it off again from the same dialog.
- Account tab: download my information, withdraw AI consent, optional Face ID lock, delete account.

4. External services used
- Firebase (Google): Authentication (email, Google, Sign in with Apple), Cloud Firestore (database, EU region), Cloud Functions, Hosting.
- Google Cloud Vertex AI (Gemini, EU): the AI coach. Data is sent only after the user's explicit consent in the app, and consent can be withdrawn at any time.
- Google Cloud Text-to-Speech (EU): turns short recap texts into audio for the "listen" feature on the player's page. No audio is stored.
- Resend: service emails and an optional weekly summary (with an unsubscribe link).
- Stripe: payments for an optional subscription sold on our website only. There is no purchase flow in the iOS app; all purchase screens, prices and purchase links are hidden in the app. A subscription bought on the website unlocks the same features after signing in. In-app purchase is planned for a later version.

5. Regional differences
The app works the same in all regions, in Swedish and English. The only regional difference is in Money Mode, a parent's own tally of a small reward: a Swish payment shortcut is shown only when the device region is Sweden and the Swish app is installed. It just opens Swish prefilled; the payment happens outside our app. Everywhere else the same "Paid" button is shown. Money Mode is not gambling and involves no wagering.

6. Regulated industry or third-party material
The app does not operate in a regulated industry and does not include protected third-party material. It is not a medical, health, financial or gambling service.

Additional points from the recording request:
- User-generated content: users only enter data about their own players for their own use. Nothing is published or shared between users, so there is no feed, no public content, and no need for reporting or blocking. A parent can share a private read-only link with one person, and can switch it off at any time. The page behind the link does not ask the child for anything and saves nothing from the child.
- Paid content: none in the iOS app.

Timestamps in the recording:
- 0:00 Launch from the home screen
- <0:15> Account registration (password entered twice)
- <0:45> Logout and login
- <1:10> Add player, log three games
- <2:00> Progress tab
- <2:20> Coach: consent screen, question, mental training mode
- <3:10> Player link: open and switch off
- <3:40> Account: download data, withdraw consent
- <4:00> Delete account (DELETE + password), then a failed login attempt
- <4:30> Login with the demo account

Best regards,
<NAMN>
SquareVerse Group AB
```

## 3. Notes-fältet (App Review Information): ersätt hela texten med detta

```
Demo account
Email: <TESTKONTOT>
Password: <LÖSENORDET>

Purpose: Ice IQ helps parents and coaches log a youth hockey player's games and follow the player's development. The app is for adults (parents, guardians, coaches), rated 13+.

Purchases: this iOS version has no in-app purchases and no purchase flow; all upgrade screens, prices and links to purchase are hidden in the app. Ice IQ also offers an optional paid subscription on our website, billed by Stripe. A subscription bought there unlocks the same features in the app after signing in. The demo account is on the free plan (limit of three players). In-app purchase for iOS users is planned for a later version.

How to test:
1. Sign in with the demo account (email and password). Account creation is a separate form that asks for the password twice. Sign in with Apple and Google are also available.
2. Log game tab: pick the demo player, tap a few actions in the grid and Save to see the recap. The Progress tab shows trends, season comparison and history.
3. Coach tab: the first time you ask the AI coach, a consent screen explains what is sent and to whom. Accepting is required before any data leaves the app. A switch selects Game analysis or Mental training.
4. Account tab: optional Face ID lock, download my information, withdraw AI consent, and Delete account (type DELETE and your password to confirm). Deleting removes all player data, coach conversations, player links and the sign-in.

External services: Firebase (Auth, Firestore EU, Functions), Google Cloud Vertex AI (Gemini, EU) for the AI coach after consent, Google Cloud Text-to-Speech (EU) for the listen feature, Resend for email, Stripe (website only).

Regions: the app works the same everywhere, in Swedish and English. The Swish shortcut in Money Mode appears only when the device region is Sweden and the Swish app is installed; it opens Swish prefilled and the payment happens outside the app. Money Mode is a parent's own tally of a small reward, not gambling.

User-generated content: none is shared between users, so no reporting or blocking is needed. Regulated industry or third-party material: none.

A screen recording from a physical device was sent to App Review in the Resolution Center (<datum>).
```

## 4. Efter att du skickat svaret

- Svara i Resolution Center (**Reply**), bifoga filmen, och lägg Notes i versionen. Tryck **Resubmit to App Review** när Apple ber om det.
- Välj **bygge 11** på versionssidan.
- Testkontot ska fungera och ha data. Kontrollera inloggningen själv innan du skickar, och radera inte testkontot.
