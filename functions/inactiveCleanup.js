// Rensar konton som inte använts på 24 månader: först en varning med 30 dagars
// frist, därefter radering. Går bara att ta bort genom att logga in igen.
//
// SÄKERT STANDARDLÄGE: funktionen körs varje måndag men gör ingenting annat än
// att logga hur många konton den SKULLE ha varnat/raderat, tills
// INACTIVE_CLEANUP_ENABLED=true sätts i functions/.env och funktionen deployas
// om. Börja med att läsa loggen några veckor.
//
// Skydd: konton med aktiv/obetald prenumeration eller köpta krediter rörs aldrig.

const INACTIVE_DAYS = 730; // ca 24 månader
const WARN_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Ren beslutsfunktion (testbar utan Firebase).
//   lastActiveMs: senaste inloggning/uppdatering av session, annars skapad
//   warnedAtMs:   när varningen skickades (eller null)
//   protectedAccount: betalande eller har köpta krediter
function classifyAccount({ lastActiveMs, warnedAtMs, protectedAccount, now }) {
  if (protectedAccount) return "skip";
  const inactive = now - lastActiveMs >= INACTIVE_DAYS * DAY_MS;
  if (!inactive) return warnedAtMs ? "reset" : "active";
  if (!warnedAtMs) return "warn";
  // Aktivitet efter varningen betyder att användaren är tillbaka.
  if (lastActiveMs > warnedAtMs) return "reset";
  return now - warnedAtMs >= WARN_DAYS * DAY_MS ? "delete" : "waiting";
}

function warningEmail(lang) {
  if (lang === "en") {
    return {
      subject: "Your Ice IQ account will be deleted in 30 days",
      html: `<p>Hi,</p><p>You haven't used Ice IQ for about two years. To keep your information from being stored longer than needed, we delete accounts that stay unused.</p><p><b>Your account and all player data will be deleted in 30 days.</b> To keep it, just log in at <a href="https://iceiq.app">iceiq.app</a> or in the app.</p><p>If you would like a copy of your data first, you can download it under My account after logging in.</p><p>Ice IQ, SquareVerse Group AB</p>`,
    };
  }
  return {
    subject: "Ditt Ice IQ-konto raderas om 30 dagar",
    html: `<p>Hej,</p><p>Du har inte använt Ice IQ på ungefär två år. För att inte spara uppgifter längre än nödvändigt raderar vi konton som förblir oanvända.</p><p><b>Ditt konto och alla spelaruppgifter raderas om 30 dagar.</b> Vill du behålla det räcker det att logga in på <a href="https://iceiq.app">iceiq.app</a> eller i appen.</p><p>Vill du ha en kopia av dina uppgifter först kan du ladda ner dem under Konto efter att du loggat in.</p><p>Ice IQ, SquareVerse Group AB</p>`,
  };
}

function createInactiveCleanup({ functions, admin, db, appId, sendEmail, getStripe, secrets }) {
  const usersCol = () => db.collection("artifacts").doc(appId).collection("users");

  return functions
    .runWith({ secrets, memory: "512MB", timeoutSeconds: 540 })
    .pubsub.schedule("0 4 * * 1")
    .timeZone("Europe/Stockholm")
    .onRun(async () => {
      const enabled = process.env.INACTIVE_CLEANUP_ENABLED === "true";
      const now = Date.now();
      const tally = { enabled, scanned: 0, warn: 0, delete: 0, reset: 0, errors: 0 };

      let pageToken;
      do {
        const page = await admin.auth().listUsers(1000, pageToken);
        pageToken = page.pageToken;

        for (const u of page.users) {
          tally.scanned += 1;
          try {
            const ref = usersCol().doc(u.uid);
            const snap = await ref.get();
            if (!snap.exists) continue; // ingen app-data: rör inte

            const d = snap.data();
            const lastActiveMs = Math.max(
              Date.parse(u.metadata.lastSignInTime || "") || 0,
              Date.parse(u.metadata.lastRefreshTime || "") || 0,
              Date.parse(u.metadata.creationTime || "") || 0
            );
            const warnedAtMs = d.inactivityWarnedAt ? Date.parse(d.inactivityWarnedAt) || null : null;
            const status = d.subscriptionStatus;
            const protectedAccount =
              status === "active" || status === "past_due" || (d.purchasedCredits || 0) > 0;

            const action = classifyAccount({ lastActiveMs, warnedAtMs, protectedAccount, now });

            if (action === "reset") {
              tally.reset += 1;
              if (enabled) await ref.update({ inactivityWarnedAt: admin.firestore.FieldValue.delete() });
            } else if (action === "warn") {
              tally.warn += 1;
              if (enabled && u.email) {
                const mail = warningEmail(d.language === "en" ? "en" : "sv");
                await sendEmail(u.email, mail.subject, mail.html);
                await ref.update({ inactivityWarnedAt: new Date(now).toISOString() });
              }
            } else if (action === "delete") {
              tally.delete += 1;
              if (enabled) {
                if (d.stripeCustomerId) {
                  try { await getStripe().customers.del(d.stripeCustomerId); } catch (e) { /* redan borta */ }
                }
                const links = await db.collection("artifacts").doc(appId).collection("playerLinks")
                  .where("userId", "==", u.uid).get();
                await Promise.all(links.docs.map((l) => l.ref.delete()));
                await db.recursiveDelete(ref);
                await admin.auth().deleteUser(u.uid);
              }
            }
          } catch (err) {
            tally.errors += 1;
            console.error(`inactiveCleanup: fel för ${u.uid}:`, err.message);
          }
        }
      } while (pageToken);

      console.log("inactiveCleanup:", JSON.stringify(tally));
      return null;
    });
}

module.exports = { createInactiveCleanup, classifyAccount };
