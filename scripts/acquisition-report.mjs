#!/usr/bin/env node
// Hämtar acquisitionReport (Cloud Function) och skriver ut den som en
// läsbar tabell istället för rå JSON.
//
// Körs så här:
//   node --env-file=.env scripts/acquisition-report.mjs
//   node --env-file=.env scripts/acquisition-report.mjs --since=2026-08-01
//
// Kräver REPORTS_TOKEN i .env (samma värde som satts med
// `firebase functions:secrets:set REPORTS_TOKEN`). .env är redan
// git-ignorerad, så token hamnar aldrig i repot.

const REPORT_URL = 'https://us-central1-squareverse-36179.cloudfunctions.net/acquisitionReport';

const token = process.env.REPORTS_TOKEN;
if (!token) {
  console.error('REPORTS_TOKEN saknas. Lägg till REPORTS_TOKEN=... i .env och kör med --env-file=.env.');
  process.exit(1);
}

const sinceArg = process.argv.find((a) => a.startsWith('--since='));
const since = sinceArg ? sinceArg.split('=')[1] : null;
const url = since ? `${REPORT_URL}?since=${encodeURIComponent(since)}` : REPORT_URL;

const res = await fetch(url, { headers: { 'x-reports-token': token } });
if (!res.ok) {
  console.error(`Fel från servern (${res.status}):`, await res.text());
  process.exit(1);
}

const report = await res.json();

const pct = (paid, signups) => (signups > 0 ? `${Math.round((paid / signups) * 100)}%` : '—');

const printTable = (title, bucket) => {
  const rows = Object.entries(bucket).sort((a, b) => b[1].signups - a[1].signups);
  console.log(`\n${title}`);
  if (rows.length === 0) {
    console.log('  (inga ännu)');
    return;
  }
  const nameWidth = Math.max(...rows.map(([k]) => k.length), 6);
  console.log(`  ${'namn'.padEnd(nameWidth)}  signups  betalande  konvertering`);
  for (const [key, v] of rows) {
    console.log(`  ${key.padEnd(nameWidth)}  ${String(v.signups).padStart(7)}  ${String(v.paid).padStart(9)}  ${pct(v.paid, v.signups).padStart(12)}`);
  }
};

console.log(`Acquisition-rapport${report.since ? ` (från ${report.since})` : ' (alla konton)'}`);
console.log(`Totalt: ${report.totalUsers}  ·  med källa: ${report.totalWithAcquisition}  ·  direkt/okänd: ${report.totalDirect}`);
printTable('Per källa', report.bySource);
printTable('Per kampanj', report.byCampaign);
