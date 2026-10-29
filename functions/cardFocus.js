// Koppling mellan coachens fokustaggar (FOCUS_TAGS i index.js) och
// rutinkorten på spelarlänken. Ren logik utan Firestore/AI, så den går att
// testa: node --test functions/cardFocus.test.js
//
// Flödet: askCoach sparar lastFocus { tags, at } på spelaren (bara när
// föräldern inte stängt av coachens minne). getPlayerLinkData översätter det
// till ett spårnamn (suggestedTrack) som länken använder för att välja nästa
// kortpass. Nästa gång coachen analyserar en match får den en uppföljningsrad
// i prompten. Barnets sida skickar ingenting tillbaka — allt här utgår från
// förälderns egna matchdata.

// Bara taggar som har kortinnehåll. Övriga taggar (sargdueller, zonspel ...)
// saknar kort och ger inget tips — lägg till en rad här när korten finns.
const FOCUS_TAG_TRACK = {
  fokus_press: 'focus',
};

// Ett tips är färskt i 21 dagar; därefter går länken tillbaka till vanlig
// ordning i stället för att peka på en gammal analys.
const SUGGESTION_MAX_AGE_DAYS = 21;
// Uppföljningen i coachens prompt gäller längre: matcher spelas 1-3 ggr/vecka.
const FOLLOW_UP_MAX_AGE_DAYS = 45;

const FOCUS_TAG_DESCRIPTION = {
  puckhantering_press: 'pucktapp eller misslyckade passningar under press',
  sargdueller: 'närkamper vid sargen',
  zonspel: 'zoninträden eller zonförsvar',
  avslut: 'skottavslut och skapade målchanser',
  defensivt_ansvar: 'defensivt ansvar (blockerade skott, klarerade lägen, insläppta mål)',
  tekningar: 'tekningar',
  malvaktsspel: 'räddningar och returer',
  fokus_press: 'att hålla fokus och marginalerna under press',
};

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function daysBetween(fromISO, toISO) {
  if (typeof fromISO !== 'string' || typeof toISO !== 'string') return null;
  if (!ISO_DAY.test(fromISO) || !ISO_DAY.test(toISO)) return null;
  const from = Date.parse(`${fromISO}T00:00:00Z`);
  const to = Date.parse(`${toISO}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / DAY_MS);
}

// Rensar lastFocus mot den fasta taggslistan och returnerar { tags, at }
// eller null. Allt annat i fältet (okända taggar, fel datumformat) kastas.
function normalizeLastFocus(raw, knownTags) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (typeof raw.at !== 'string' || !ISO_DAY.test(raw.at)) return null;
  if (!Array.isArray(raw.tags)) return null;
  const tags = raw.tags
    .filter((t) => typeof t === 'string' && knownTags.includes(t))
    .slice(0, 2);
  if (!tags.length) return null;
  return { tags, at: raw.at };
}

// Spårnamnet länken ska föredra, eller null. Första taggen med kortinnehåll vinner.
function suggestedTrack(lastFocus, todayISO, knownTags) {
  const focus = normalizeLastFocus(lastFocus, knownTags);
  if (!focus) return null;
  const age = daysBetween(focus.at, todayISO);
  if (age === null || age < 0 || age > SUGGESTION_MAX_AGE_DAYS) return null;
  for (const tag of focus.tags) {
    if (Object.prototype.hasOwnProperty.call(FOCUS_TAG_TRACK, tag)) return FOCUS_TAG_TRACK[tag];
  }
  return null;
}

// Promptblock för coachens uppföljning, eller '' när det inte finns något att
// följa upp. Texten kräver att modellen aldrig påstår att övningen gjorts.
function followUpPromptBlock(lastFocus, todayISO, knownTags) {
  const focus = normalizeLastFocus(lastFocus, knownTags);
  if (!focus) return '';
  const age = daysBetween(focus.at, todayISO);
  if (age === null || age < 0 || age > FOLLOW_UP_MAX_AGE_DAYS) return '';
  const what = focus.tags.map((t) => FOCUS_TAG_DESCRIPTION[t] || t).join(' och ');
  return `
      UPPFÖLJNING AV FÖRRA FOKUSET (gäller bara den första, obeprompta analysen):
      - Vid analysen ${focus.at} pekade du ut: ${what}. Spelaren kan sedan dess ha fått en kort övning i sin länk, men du vet INTE om den gjorts och ska aldrig påstå eller antyda att den gjorts eller inte gjorts.
      - Finns matcher med datum efter ${focus.at} i datan: se om mönstret finns kvar, minskat eller är oförändrat, och säg det i EN kort mening under rubriken Fokusområde (eller i thinkAbout). Håll dig till siffrorna. Är underlaget en enda match eller oklart: säg det hellre än att dra en slutsats.
      - Finns inga matcher efter ${focus.at}: nämn inte uppföljningen alls.
      - Aldrig kritik, aldrig skuld. Nämn inte taggnamn eller att det finns någon "övning i länken".
`;
}

module.exports = {
  FOCUS_TAG_TRACK,
  FOCUS_TAG_DESCRIPTION,
  SUGGESTION_MAX_AGE_DAYS,
  FOLLOW_UP_MAX_AGE_DAYS,
  daysBetween,
  normalizeLastFocus,
  suggestedTrack,
  followUpPromptBlock,
};
