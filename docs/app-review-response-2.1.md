# Svar till App Review: Guideline 2.1, Information Needed (2026-10-16)

Det här är **inte ett avslag på något fel i appen**. Apple ber om mer information för att kontot har lite granskningshistorik. Svara i **Resolution Center** (App Store Connect → appen → App Review → Resolution Center) och lägg samma information i **Notes** under App Review Information. Bifoga filmen i svaret.

Fyll i platshållarna `<...>` innan du skickar.

## 1. Skärminspelning (görs av dig, på en riktig iPhone)

Apple kräver: en riktig enhet, senaste iOS, börja med att appen startas, och visa registrering, inloggning och **radera konto**. Appen har inget användargenererat innehåll som delas mellan användare och inga betalda funktioner, så de delarna säger vi uttryckligen i svaret.

Starta inspelningen i Kontrollcenter (skärminspelning) och börja på hemskärmen. Ungefär 3 till 4 minuter:

1. Tryck på Ice IQ-ikonen så att appen startar.
2. **Skapa konto** med e-post och lösenord (använd en ny engångsadress, till exempel en alias), visa att du kommer in.
3. Lägg till en spelare (ett förnamn räcker).
4. Logga en match: tryck på några händelser, **Spara match**, visa sammanfattningen och delningsrutan.
5. Öppna **Coach**: visa samtyckesrutan, godkänn, ställ en fråga och visa svaret.
6. Skapa en **spelarlänk** och visa att länken kan **stängas** ("Stäng länken").
7. Öppna **Mitt konto**: visa **Dina uppgifter** (ladda ner), **Återkalla samtycke till AI-coachen**, och applåset (Face ID) om du vill.
8. **Radera konto**: skriv DELETE, bekräfta, visa att du kommer tillbaka till inloggningen.
9. Logga in igen med **demokontot** och visa att spelaren och matcherna finns.

Hoppa över att visa lösenord på skärmen om du kan. Spara filmen som `.mov` eller `.mp4`.

## 2. Svar att klistra in i Resolution Center (engelska)

```
Hello App Review team,

Thank you for the review. Here is the information you asked for. A screen recording from a physical iPhone running the latest iOS is attached (it starts with launching the app and covers account registration, login, account deletion, and the main flow).

1. Purpose and audience
Ice IQ helps parents and coaches log a youth hockey player's games and follow the player's development over time. After each game the adult taps the actions that happened (good plays and mistakes), saves the game, and gets a score and a short recap. The app shows trends per season and an optional AI coach gives advice based on the logged games. The app is for adults (parents, guardians and coaches), not for children, and is rated 13+. Children do not create accounts. The value is a simple, structured way to see a player's progress instead of relying on memory.

2. Account and access
Demo account: <TESTKONTOT> / <LÖSENORDET>. It already has a player and several saved games. Sign in with email and password on the first screen. Sign in with Apple and Google are also available. Account deletion: Account tab > Delete account, then type DELETE to confirm (this removes all player data).

3. How to reach the main features
- Home: pick the demo player, tap the large "New game" button, tap a few action tiles, then Save to see the recap and share dialog.
- Season view: the Home screen shows the player's matches, average and best game; the season chips switch between seasons.
- Coach tab: the first time, a consent screen explains what is sent and to whom. After accepting, ask a question to get the AI answer.
- Player link: create a read-only link for the player and switch it off again from the same dialog.
- Account tab: download my information, withdraw AI consent, optional Face ID lock, delete account.

4. External services used
- Firebase (Google): Authentication (email, Google, Sign in with Apple), Cloud Firestore (database, EU region), Cloud Functions, Hosting.
- Google Cloud Vertex AI (Gemini, EU): the AI coach. Data is sent only after the user's explicit consent in the app, and consent can be withdrawn at any time.
- Google Cloud Text-to-Speech (EU): turns short recap texts into audio for the "listen" feature. No audio is stored.
- Resend: service emails and an optional weekly summary (with an unsubscribe link).
- Stripe: payments for an optional subscription sold on our website only. There is no purchase flow in the iOS app; all purchase screens, prices and purchase links are hidden in the app. A subscription bought on the website unlocks the same features after signing in. In-app purchase is planned for a later version.

5. Regional differences
The app works the same in all regions, in Swedish and English. The only regional difference is in Money Mode, a parent's own tally of a small reward: a Swish payment shortcut is shown only when the device region is Sweden and the Swish app is installed. It just opens Swish prefilled; the payment happens outside our app. Everywhere else the same "Paid" button is shown. Money Mode is not gambling and involves no wagering.

6. Regulated industry or third-party material
The app does not operate in a regulated industry and does not include protected third-party material. It is not a medical, health, financial or gambling service.

Additional points from the recording request:
- User-generated content: users only enter data about their own players for their own use. Nothing is published or shared between users, so there is no feed, no public content, and no need for reporting or blocking. A parent can share a private read-only link with one person, and can switch it off at any time.
- Paid content: none in the iOS app.

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
1. Sign in with the demo account (email and password). Sign in with Apple and Google are also available.
2. Home > Players: pick the demo player. Tap the large "New game" button to jump to the action tiles and tap a few of them. Save the game to see the recap and share dialog.
3. Coach tab: the first time you ask the AI coach, a consent screen explains what is sent and to whom. Accepting is required before any data leaves the app.
4. Account tab: optional Face ID lock, download my information, withdraw AI consent, and Delete account (type DELETE to confirm). Deleting removes all player data.

External services: Firebase (Auth, Firestore EU, Functions), Google Cloud Vertex AI (Gemini, EU) for the AI coach after consent, Google Cloud Text-to-Speech (EU) for the listen feature, Resend for email, Stripe (website only).

Regions: the app works the same everywhere, in Swedish and English. The Swish shortcut in Money Mode appears only when the device region is Sweden and the Swish app is installed; it opens Swish prefilled and the payment happens outside the app. Money Mode is a parent's own tally of a small reward, not gambling.

User-generated content: none is shared between users, so no reporting or blocking is needed. Regulated industry or third-party material: none.

A screen recording from a physical device was sent to App Review in the Resolution Center (16 Oct 2026).
```

## 4. Efter att du skickat svaret

- Svara i Resolution Center (**Reply**), bifoga filmen, och lägg Notes i versionen. Om versionen står som låst, tryck **Submit**/**Resubmit to App Review** igen när Apple ber om det.
- Bygget får vara kvar. Byt bara om du hellre skickar bygge 8 (svensk policy i appen, nya toppkort): välj det på versionssidan och skicka in på nytt.
- Testkontot ska fungera och ha data. Kontrollera inloggningen själv innan du skickar.
