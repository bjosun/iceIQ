// Säsong löper augusti–juli: matcher från augusti 2026 hör till 2026/27.
// Spelare byter klubb och lag (J18/J20) mellan och inom säsonger, så säsongen
// räknas enbart ur matchens datum, aldrig ur lagnamnet.

export type SeasonKey = number | 'all';

export function seasonStartOf(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const safe = isNaN(d.getTime()) ? new Date() : d;
  return safe.getMonth() >= 7 ? safe.getFullYear() : safe.getFullYear() - 1;
}

export function seasonLabel(start: number): string {
  return `${start}/${String(start + 1).slice(2)}`;
}

/** Säsongsstarter som finns i matcherna, nyast först. */
export function seasonsIn(games: { date: string }[]): number[] {
  return Array.from(new Set(games.map(g => seasonStartOf(g.date)))).sort((a, b) => b - a);
}

export function inSeason<T extends { date: string }>(games: T[], season: SeasonKey): T[] {
  return season === 'all' ? games : games.filter(g => seasonStartOf(g.date) === season);
}

export function avgOf(games: { points?: number }[]): number {
  if (games.length === 0) return 0;
  const sum = games.reduce((a, g) => a + (g.points || 0), 0);
  return Number((sum / games.length).toFixed(1));
}

/**
 * Sista dagen ett säsongspass gäller: 31 juli. Köps det med mindre än 60 dagar
 * kvar (juni–juli) löper det ut nästa år i stället. Samma regel som
 * seasonPassEnd i functions/season_pass.js.
 */
export function seasonPassEnd(now: Date = new Date()): Date {
  const start = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  let end = new Date(Date.UTC(start + 1, 6, 31, 23, 59, 59));
  if (end.getTime() - now.getTime() < 60 * 24 * 60 * 60 * 1000) {
    end = new Date(Date.UTC(start + 2, 6, 31, 23, 59, 59));
  }
  return end;
}
