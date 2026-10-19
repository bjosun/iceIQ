// Ett-klicks-svar i aktiveringsnudgen: "Vad kom i vägen?". Tre länkar i mejlet,
// en bekräftelsesida, ett sparat svar på kontots eget dokument
// (nudgeFeedback: { reason, comment, at }). Svaren läses i veckorapporten.
//
// Samma mönster som unsubscribeEmail i index.js: länken bär kontots id och en
// signatur (HMAC), och en GET ändrar ingenting — den visar bara en sida med en
// knapp. Först knappen (POST) sparar. Det skyddar mot mejlskannrar och
// förhandsvisningar som hämtar alla länkar i ett mejl; utan det skulle de ge
// ett falskt svar på varje fråga.
//
// Nyckeln är den befintliga DIGEST_TEST_TOKEN med ett eget prefix, så ingen
// ny hemlighet behöver sättas.

const crypto = require("crypto");

const REASONS = ["start", "auto", "notnow"];

const LABELS = {
  en: {
    start: "I wasn't sure how to get started",
    auto: "I expected it to follow the game automatically",
    notnow: "Not for me right now",
  },
  sv: {
    start: "Jag visste inte hur jag skulle komma igång",
    auto: "Jag väntade mig att den skulle följa matchen automatiskt",
    notnow: "Inte något för mig just nu",
  },
};

const label = (reason, lang) => (LABELS[lang === "en" ? "en" : "sv"][reason]);

const feedbackToken = (secret, uid, reason) =>
  crypto.createHmac("sha256", secret).update(`nudge-feedback:${uid}:${reason}`).digest("hex");

const feedbackUrl = (base, secret, uid, reason, lang) =>
  `${base}?u=${encodeURIComponent(uid)}&r=${reason}&t=${feedbackToken(secret, uid, reason)}&l=${lang === "en" ? "en" : "sv"}`;

const isValid = (secret, uid, reason, given) => {
  if (!uid || !REASONS.includes(reason) || typeof given !== "string" || given.length !== 64) return false;
  const expected = Buffer.from(feedbackToken(secret, uid, reason));
  const got = Buffer.from(given);
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function createNudgeFeedback({ functions, getUsersCollection, secret, baseUrl, appUrl, supportEmail }) {
  return functions.runWith({ secrets: [secret] }).https.onRequest(async (req, res) => {
    const uid = String(req.query.u || "");
    const reason = String(req.query.r || "");
    const token = String(req.query.t || "");
    const en = req.query.l === "en";

    const page = (title, body, status = 200) => {
      res.status(status).set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      }).send(`<!doctype html>
<html lang="${en ? "en" : "sv"}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} – Ice IQ</title></head>
<body style="margin:0;background:#f3f4f6;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;">
<div style="max-width:460px;margin:48px auto;padding:0 16px;">
<div style="background:#ffffff;border-radius:16px;padding:28px;">
<h2 style="margin:0 0 16px;">Ice <span style="color:#0891b2;">IQ</span></h2>
${body}
</div></div></body></html>`);
    };

    if (!isValid(secret.value(), uid, reason, token)) {
      return page(
        en ? "Invalid link" : "Ogiltig länk",
        `<p>${en ? "This link is invalid or has expired. You can always reply to the email and tell us instead:" : "Länken är ogiltig eller har gått ut. Du kan alltid svara på mejlet och berätta i stället:"} <a href="mailto:${esc(supportEmail)}">${esc(supportEmail)}</a>.</p>`,
        400,
      );
    }

    const chosen = label(reason, en ? "en" : "sv");
    const action = `${baseUrl}?u=${encodeURIComponent(uid)}&amp;r=${reason}&amp;t=${esc(token)}&amp;l=${en ? "en" : "sv"}`;

    if (req.method === "POST") {
      try {
        const doc = getUsersCollection().doc(uid);
        // Bara riktiga konton sparar något. En förhandsvisning (testmejl) eller
        // ett raderat konto får samma tackssida utan att något skrivs.
        if ((await doc.get()).exists) {
          const comment = String((req.body && req.body.comment) || "").trim().slice(0, 500);
          await doc.set(
            { nudgeFeedback: { reason, ...(comment ? { comment } : {}), at: new Date().toISOString() } },
            { merge: true },
          );
        }
      } catch (err) {
        console.error("nudgeFeedback misslyckades:", err);
        return page(en ? "Something went wrong" : "Något gick fel",
          `<p>${en ? "We could not save that. Please try again in a moment." : "Det gick inte att spara. Försök igen om en stund."}</p>`, 500);
      }
      return page(
        en ? "Thank you" : "Tack",
        `<p style="font-size:16px;"><strong>${en ? "Thank you, that really helps." : "Tack, det hjälper verkligen."}</strong></p>
         <p style="color:#6b7280;">${en
           ? "Want to say more? Just reply to the email and it goes straight to a person."
           : "Vill du berätta mer? Svara bara på mejlet, så går det direkt till en människa."}</p>
         <p style="margin-top:20px;"><a href="${esc(appUrl)}/dashboard" style="background:#0891b2;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;">${en ? "Open Ice IQ" : "Öppna Ice IQ"}</a></p>`,
      );
    }

    // GET: visa bara sidan. Inget sparas förrän knappen trycks.
    return page(
      en ? "What got in the way?" : "Vad kom i vägen?",
      `<p style="font-size:16px;margin:0 0 6px;">${en ? "You chose:" : "Du valde:"}</p>
       <p style="font-size:16px;font-weight:bold;margin:0 0 16px;">${esc(chosen)}</p>
       <form method="POST" action="${action}">
         <label for="c" style="display:block;color:#6b7280;font-size:14px;margin-bottom:6px;">${en ? "Anything you'd like to add? (optional)" : "Något du vill lägga till? (valfritt)"}</label>
         <textarea id="c" name="comment" maxlength="500" rows="3" style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:8px;font:inherit;margin-bottom:14px;"></textarea>
         <button type="submit" style="background:#0891b2;color:#ffffff;border:0;padding:12px 20px;border-radius:10px;font-weight:bold;font-size:15px;cursor:pointer;">${en ? "Send" : "Skicka"}</button>
       </form>`,
    );
  });
}

module.exports = { REASONS, label, feedbackToken, feedbackUrl, isValid, createNudgeFeedback };
