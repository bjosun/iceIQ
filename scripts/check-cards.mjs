#!/usr/bin/env node
import { loadCardLibrary } from './card-library.mjs';

try {
  const records = loadCardLibrary(process.cwd());
  const approved = records.filter((c) => c.status === 'approved');
  const drafts = records.filter((c) => c.status === 'draft');
  const logical = (list) => new Set(list.map((c) => c.id)).size;
  console.log(`Card library OK: ${records.length} localized records`);
  console.log(`  approved: ${logical(approved)} cards (${approved.length} localized records)`);
  console.log(`  draft:    ${logical(drafts)} cards (${drafts.length} localized records)`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
