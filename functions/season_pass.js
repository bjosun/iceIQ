// Säsongspass: Premium fram till säsongens slut, betalt en gång.
//
// Säsongen löper augusti–juli (samma regel som src/utils/season.ts). Passet
// gäller till och med 31 juli. Köps det när mindre än MIN_DAYS återstår
// (juni–juli) hade kunden betalat för några veckor, så då löper det i stället
// ut 31 juli nästa år.
//
// Ren funktion, testbar utan Firebase eller Stripe.

const MIN_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {Date} now  @returns {Date} sista ögonblicket passet gäller (UTC) */
function seasonPassEnd(now) {
  const seasonStart = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  let end = new Date(Date.UTC(seasonStart + 1, 6, 31, 23, 59, 59));
  if (end.getTime() - now.getTime() < MIN_DAYS * DAY_MS) {
    end = new Date(Date.UTC(seasonStart + 2, 6, 31, 23, 59, 59));
  }
  return end;
}

module.exports = { seasonPassEnd, MIN_DAYS };
