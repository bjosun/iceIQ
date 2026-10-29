# Ice IQ

React + Vite + TypeScript app (`npm run dev`, port 3000). Node >= 20 required — the
`.test.mjs` suites import `.ts` files directly via native type stripping.

## Verify before done

- `npm run test:cards` — card engine unit tests (node:test, no browser)
- `npm run check:cards` — validates `content/cards/**/*.json`
- `npm run check:i18n` — translation key parity
- `npx eslint <changed files>` and `npx tsc --noEmit`
- `npm run build` — fails if the card library is invalid

## Card engine conventions

- Card copy lives ONLY in `content/cards/<track>/*.json` (one sv + one en record
  per card id). `status: 'draft'` cards are validated but never bundled — the
  build-time virtual module `virtual:iceiq-cards` exports only `approved` cards.
- Never author child-facing copy without review. Drafts stay empty
  (`title: ''`, `sectionTitle: ''`) until text is approved.
- Player progress is on-device only (`localStorage`, ids + ISO timestamps — no
  free text, no identifiers). The player link is read-only: no network calls may
  be added to the routine flow.
- `pickNextPass` is a pure function — no randomness, no globals, no mutation.
- Cards quoting or paraphrasing a real person (track `legends`) must carry
  `source: { person, work, year, verified, url? }`, identical in sv and en. An
  approved card needs `verified: true`, set only by a human who has read the
  source. Never let an LLM supply a quote or attribution from memory, and never
  imply the person endorses Ice IQ. Paraphrase; quote only a short exact line.
- Draft cards from the editor script (`scripts/generate-card-drafts.mjs`) live in
  `content/card-drafts/`, which the app never reads. A human fact-checks them
  against the source, then moves them to `content/cards/legends/` as approved
  with `source.verified: true`. See docs/card-learning-loop.md.
- `npm run test:cards` also covers the editor logic; coach-focus logic is tested
  with `node --test functions/cardFocus.test.js`.

