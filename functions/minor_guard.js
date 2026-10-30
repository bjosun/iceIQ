// Skydd mot att barn under 13 skickar personuppgifter till AI-coachen.
// Åldersgränsen är 13 (Björn, 2026-10-30), men ålder går inte att verifiera. När
// någon själv skriver att hen är under 13 i en coachfråga avbryter vi innan
// frågan skickas till AI-tjänsten och innan något sparas eller dras i krediter.
// Medvetet snävt: bara första person ("jag är 11", "I'm 12 years old"), så att
// en förälder som skriver "my son is 11" eller "I am 11 games in" inte stoppas.

const MAX_AGE = 12;

const EN = /\b(?:i\s*am|i['’]m|im)\s+(?:only\s+|just\s+)?(\d{1,2})\b(?:\s*(?:years?|yrs?)[\s-]*old\b|\s*y\/?o\b|\s*[.,!?]|\s*$|\s+and\b)/gi;
const SV = /\bjag\s+(?:är|ar)\s+(?:bara\s+)?(\d{1,2})\s*(?:år|ar)\b/gi;

/** True om texten i första person uppger en ålder 5–12. */
function statesUnder13(text) {
  if (typeof text !== "string" || !text) return false;
  for (const re of [EN, SV]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const age = Number(m[1]);
      if (age >= 5 && age <= MAX_AGE) return true;
    }
  }
  return false;
}

module.exports = { statesUnder13 };
