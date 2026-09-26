// Genererar statiska HTML-filer per engelsk landningssida efter `vite build`.
//
// Varför: index.html delar EN <title>/description/canonical/OG-tagg för alla
// routes (se kommentaren i index.html) eftersom firebase.json skriver om allt
// till /index.html. Det fungerar för startsidan, men en delad länk till t.ex.
// /hockey-tracking-app visade ändå startsidans titel/bild i Facebook- eller
// Slack-förhandsvisningen, eftersom de scrapers inte kör JavaScript (useSEO i
// React hinner aldrig sätta rätt taggar). Den här filen klonar den byggda
// dist/index.html per landningssida, byter ut titel/description/canonical/
// OG/Twitter/FAQ-JSON-LD och den statiska #root-texten mot sidans egen
// copy — men behåller exakt samma <script>/<link>-taggar, så samma React-app
// bootar och tar över routingen precis som på alla andra sidor.
//
// Kopian av copy nedan är avsiktlig, inte DRY-brott: att importera JSX från
// src/pages/landing hit skulle kräva att köra React i Node under bygget för
// en handfull sidor som sällan ändras.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');

// Delas med React (Footer + LandingPage): lista över guidesidorna och den
// längre copyn per sida. Utan interna länkar hittar Google sidorna bara via
// sitemap och prioriterar ned dem ("Genomsökt – inte indexerad"), därför
// måste länkarna finnas i den statiska HTML:en, inte bara i React.
const dataDir = path.join(__dirname, '..', 'src', 'data');
const guides = JSON.parse(await readFile(path.join(dataDir, 'guides.json'), 'utf8'));
const landingSections = JSON.parse(await readFile(path.join(dataDir, 'landingSections.json'), 'utf8'));

const pages = [
  {
    slug: 'hockey-tracking-app',
    title: 'Hockey Tracking App with an AI Coach | Ice IQ',
    description: "Ice IQ is a hockey tracking app for parents, players, and coaches. Log a game in a couple of minutes and get concrete, AI-generated advice on what to work on next. Free to start.",
    ogTitle: 'Hockey Tracking App with an AI Coach',
    h1: 'The Hockey Tracking App That Tells You What to Work On Next',
    intro: "Most hockey tracking apps stop at a scoresheet. Ice IQ logs a game in a couple of minutes, then its AI coach turns that stat line into specific, tactical advice — for parents watching from the stands, players who want a plan, and coaches who don't have time to build one after every game.",
    features: [
      ['Log a Game in Minutes', 'A simple action grid for goals, assists, shots, and more — built to use rinkside, not at a desk after the fact.'],
      ['AI Coach Feedback', 'After every logged game, the AI coach reads the stats and gives tactical, specific advice instead of a raw number dump.'],
      ['Stats That Show Progress', 'Track performance across a season and see development over time, not just one game in isolation.'],
      ['Synced Everywhere', 'Log from a phone at the rink and review from any device afterward — everything is backed up automatically.'],
    ],
    faqs: [
      ['What can I track in Ice IQ?', 'Game actions like goals, assists, shots on goal, and more, plus season-level stats built from every logged game.'],
      ['Is it built for youth hockey?', 'Yes — Ice IQ is built for hockey parents, players, and coaches at every level, from grassroots youth hockey to competitive teams.'],
      ['Do I need a spreadsheet or a separate scoresheet?', 'No. Logging happens directly in the app during or right after the game, and the stats and AI feedback are generated automatically.'],
      ['Is Ice IQ free?', 'Yes. The free plan includes up to 3 saved players, match scoring, match history, and a few AI credits per month.'],
    ],
  },
  {
    slug: 'youth-hockey-stats',
    title: 'Youth Hockey Stats Tracking App | Ice IQ',
    description: 'Track youth hockey stats game by game with Ice IQ. See player development over a season, manage multiple kids or a full team, and get AI feedback after every game. Free to start.',
    ogTitle: 'Youth Hockey Stats, Tracked Game by Game',
    h1: 'Youth Hockey Stats, Tracked Game by Game',
    intro: "A single good game doesn't tell you much about a young player's development — a season of logged games does. Ice IQ tracks youth hockey stats after every game and turns them into a clear picture of what's actually improving, for one player or a whole roster.",
    features: [
      ['Season-Long Tracking', 'Every logged game rolls into season stats, so progress is visible across months, not just one outing.'],
      ['Manage Multiple Players', "Track more than one child or a full team roster from a single account, without juggling separate spreadsheets."],
      ["See What's Actually Improving", 'The AI coach turns raw game stats into specific, tactical feedback a young player can act on.'],
      ['Mental Training, Too', 'Short pre-game routines that help young players prepare and stay calm — free for everyone.'],
    ],
    faqs: [
      ['How many players can I track?', 'The free plan includes up to 3 saved players. Premium and Elite plans support more players and teams.'],
      ['What stats does Ice IQ track for youth players?', 'Game actions like goals, assists, and shots on goal, rolled up into season history and averages for each player.'],
      ['Is this just for competitive teams?', 'No — Ice IQ is built for every level, from grassroots youth hockey where kids are still learning the game to competitive travel teams.'],
      ['Can a coach use this for the whole team?', 'Yes. Team management lets a coach or stats-minded parent track multiple players under one account.'],
    ],
  },
  {
    slug: 'hockey-scouting-template',
    title: 'Hockey Scouting & Player Evaluation Without a Spreadsheet | Ice IQ',
    description: 'Skip the hockey scouting spreadsheet template. Ice IQ logs shots, goals, assists, and more per player during the game, and organizes it into stats automatically — no manual template to maintain.',
    ogTitle: 'Hockey Scouting & Player Evaluation Without a Spreadsheet',
    h1: 'Skip the Scouting Template — Log It Straight to Stats',
    intro: "A scouting or evaluation template is really just a way to structure what you write down during a game. Ice IQ does that structuring for you: log a player's actions — shots on goal, blocked shots, goals, assists — as they happen, and it's organized into season stats automatically, no spreadsheet to build or maintain.",
    features: [
      ['Log During the Game', "A tap-based action grid replaces a paper or spreadsheet template — built to use rinkside, not typed up afterward."],
      ['Structured Automatically', 'Every logged action feeds directly into per-player and season stats — no manual tallying or formulas to keep straight.'],
      ['One Player or a Full Roster', "Evaluate a single player you're following or manage multiple players and teams from one account."],
      ['Always Backed Up', 'Everything syncs to the cloud automatically — no lost spreadsheet, no version confusion between devices.'],
    ],
    faqs: [
      ['Is there a downloadable scouting template?', 'Yes — the free printable game tracking template has a shot chart, a faceoff tally, and a shift chart on one page, no account needed. If you would rather skip paper, Ice IQ logs the same actions in the app and builds the stats for you.'],
      ['What can I log for evaluation purposes?', 'Actions like shots on goal, missed shots, blocked shots, goals, and assists, tracked per player and rolled into season history.'],
      ['Can I evaluate more than one player?', 'Yes. Team management supports tracking multiple players or a full roster from a single account.'],
      ['Is this meant for coaches or for parents?', "Both. It's built for hockey parents, players, and coaches who want structured game data without doing paperwork after every game."],
    ],
  },
  {
    slug: 'measure-corsi-youth-hockey',
    title: 'Measuring Shot Attempts (Corsi) for Youth Hockey Players | Ice IQ',
    description: "Corsi is built for the NHL, not a 10U roster. Ice IQ tracks the building blocks — shots on goal, missed shots, and blocked shots — per youth player, without the pro-level jargon.",
    ogTitle: "You Don't Need Full Corsi to Track Shot Attempts",
    h1: "You Don't Need Full Corsi to Track Shot Attempts",
    intro: "Corsi — a team's shot-attempt differential at 5-on-5 — is an NHL analytics stat, built for a level where every shift and matchup is tracked by a full staff. At the youth level, chasing the exact pro-style number usually isn't worth the overhead. What actually helps a parent or coach is simpler: how many shots is this player getting on net, missing, or having blocked, game after game. Ice IQ tracks exactly that, per player, without a stopwatch or a spreadsheet.",
    features: [
      ['Shot-by-Shot Logging', 'Log shots on goal and missed shots as the game happens, and add an action for blocked attempts with a custom template — the same raw actions Corsi is built from.'],
      ['Per-Player, Per-Game', 'See shot activity broken down by game and rolled up across a season, instead of one aggregate team number.'],
      ['AI Coach Turns It Into Advice', "Rather than a raw shot-attempt percentage, the AI coach explains what the numbers actually mean for that player's next game."],
      ['Built for Youth Rosters', 'No dedicated stats staff required — one parent, player, or coach can log a full roster from their phone.'],
    ],
    faqs: [
      ['What is Corsi, in plain terms?', "It's a shot-attempt differential — shots on goal, missed shots, and blocked shots for a team versus against — used in the NHL as a rough proxy for puck possession."],
      ['Does Ice IQ calculate an official Corsi rating?', 'No. Ice IQ tracks the underlying actions per player — shots on goal and missed shots out of the box, plus blocked attempts if you add them to a custom template — which is the practical, youth-level version of what Corsi measures at the team level.'],
      ['Why not just track full team Corsi at the youth level?', 'It requires tracking every shot attempt for both teams at 5-on-5, which needs a dedicated tracker per game. Per-player shot logging gives a parent or coach useful signal without that overhead.'],
      ['Is this useful without an analytics background?', 'Yes — that’s the point. The AI coach explains what the logged shots mean instead of leaving you to interpret a raw stat.'],
    ],
  },
  {
    // Lead magnet-sidan är tvåspråkig i React (språkväxlaren), men den
    // statiska HTML:en är engelsk som övriga guider. Utan en egen fil här
    // serverade /game-tracking-template startsidans titel och en canonical
    // som pekade på startsidan — Google såg den som en dubblett.
    // Copy speglar leadMagnet.* i src/utils/translations.ts (en).
    slug: 'game-tracking-template',
    title: 'Free Hockey Game Tracking Template (PDF) | Ice IQ',
    description: 'Download a free, printable hockey game tracking template — shot chart, faceoffs, and shift chart on one page. No account needed.',
    descriptionSv: 'Ladda ner en gratis, utskrivbar matchspårningsmall för hockey — skottkarta, tekningar och bytesschema på en sida. Inget konto behövs.',
    ogTitle: 'Free Hockey Game Tracking Template (PDF)',
    h1: 'A Free Game Tracking Template — Shot Chart, Faceoffs, Shift Chart',
    intro: "Print one per game and track shots, faceoffs, and shifts by hand — no account needed. When you're ready to skip the paper, Ice IQ logs the same things automatically and adds AI coach feedback.",
    download: {
      href: '/downloads/ice-iq-game-tracking-template-en.pdf',
      text: 'Download the free PDF',
      note: 'One page · PDF · print at home',
      hrefSv: '/downloads/ice-iq-game-tracking-template-sv.pdf',
      textSv: 'Swedish version (PDF)',
    },
    features: [],
    faqs: [],
  },
];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJson(str) {
  // JSON.stringify already escapes for embedding inside a <script type="application/ld+json">.
  return JSON.stringify(str).slice(1, -1);
}

function buildGuidesNav(guideList, heading) {
  const items = guideList
    .map((guide) => `            <li><a href="${guide.path}">${escapeHtml(guide.en)}</a></li>`)
    .join('\n');
  return `        <nav aria-label="${escapeHtml(heading)}">
          <h2>${escapeHtml(heading)}</h2>
          <ul>
${items}
          </ul>
        </nav>`;
}

function buildStaticBody(page) {
  const parts = [
    `        <h1>${escapeHtml(page.h1)}</h1>`,
    `        <p>${escapeHtml(page.intro)}</p>`,
  ];

  if (page.download) {
    const d = page.download;
    parts.push(`        <p><a href="${d.href}" download>${escapeHtml(d.text)}</a> (${escapeHtml(d.note)})</p>`);
    parts.push(`        <p><a href="${d.hrefSv}" download lang="sv">${escapeHtml(d.textSv)}</a></p>`);
  }

  for (const [title, desc] of page.features) {
    parts.push(`        <section>\n          <h3>${escapeHtml(title)}</h3>\n          <p>${escapeHtml(desc)}</p>\n        </section>`);
  }

  for (const section of landingSections[page.slug] ?? []) {
    const paragraphs = section.paragraphs.map((p) => `          <p>${escapeHtml(p)}</p>`).join('\n');
    const link = section.link
      ? `\n          <p><a href="${section.link.path}">${escapeHtml(section.link.text)}</a></p>`
      : '';
    parts.push(`        <section>\n          <h2>${escapeHtml(section.heading)}</h2>\n${paragraphs}${link}\n        </section>`);
  }

  if (page.faqs.length) {
    const faqs = page.faqs
      .map(([q, a]) => `          <h3>${escapeHtml(q)}</h3>\n          <p>${escapeHtml(a)}</p>`)
      .join('\n');
    parts.push(`        <section>\n          <h2>Frequently Asked Questions</h2>\n${faqs}\n        </section>`);
  }

  parts.push(buildGuidesNav(guides.filter((g) => g.path !== `/${page.slug}`), 'More guides'));

  return `    <div id="root">
      <main>
${parts.join('\n')}
      </main>
    </div>`;
}

function buildFaqJsonLd(page) {
  const mainEntity = page.faqs.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  }));
  return JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity },
    null,
    2
  );
}

function renderPage(template, page) {
  const url = `https://www.iceiq.app/${page.slug}`;
  let html = template;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);

  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeHtml(page.description)}">`
  );

  // Startsidans svenska description följde annars med till varje engelsk
  // guide — två beskrivningar, varav den ena en dubblett av startsidan.
  const svDescriptionRegex = /\s*<meta name="description" lang="sv" content="[^"]*">/;
  html = page.descriptionSv
    ? html.replace(svDescriptionRegex, `\n    <meta name="description" lang="sv" content="${escapeHtml(page.descriptionSv)}">`)
    : html.replace(svDescriptionRegex, '');

  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${url}" />`
  );

  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(page.ogTitle)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(page.description)}">`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(page.ogTitle)}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(page.description)}">`);

  // Startsidan har två FAQPage-block (en + sv). Tidigare byttes bara det
  // första, så varje guide ärvde startsidans svenska FAQ-schema — frågor som
  // inte syns på sidan, vilket bryter mot Googles regel att FAQ-markup ska
  // matcha synligt innehåll. Nu tas alla bort och sidans egen läggs till.
  const faqJsonLdRegex = /\s*<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage",[\s\S]*?<\/script>/g;
  html = html.replace(faqJsonLdRegex, '');
  if (page.faqs.length) {
    html = html.replace(
      '</head>',
      `    <script type="application/ld+json">\n    ${buildFaqJsonLd(page)}\n    </script>\n  </head>`
    );
  }

  // Ersätt hela #root-blocket (båda main-taggarna) med sidans egen statiska text.
  const rootRegex = /<div id="root">[\s\S]*?<\/div>\s*(?=\n?\s*<\/body>)/;
  html = html.replace(rootRegex, `${buildStaticBody(page)}\n    `);

  return html;
}

async function main() {
  const template = await readFile(distIndexPath, 'utf8');
  const distDir = path.dirname(distIndexPath);

  for (const page of pages) {
    const html = renderPage(template, page);
    const outPath = path.join(distDir, `${page.slug}.html`);
    await writeFile(outPath, html, 'utf8');
    console.log(`Generated dist/${page.slug}.html`);
  }

  // Startsidan är den starkaste sidan på domänen — den måste länka ut till
  // guiderna i den statiska HTML:en, inte bara via React-footern.
  const homeNav = buildGuidesNav(guides, 'Guides');
  if (!template.includes('</main>')) throw new Error('dist/index.html saknar </main> — kan inte lägga in guidelänkar');
  await writeFile(distIndexPath, template.replace('</main>', `${homeNav}\n      </main>`), 'utf8');
  console.log('Added guide links to dist/index.html');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
