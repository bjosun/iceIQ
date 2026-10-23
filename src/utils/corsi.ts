// Individuell Corsi (iCF): spelarens egna skottförsök, alltså skott på mål +
// missade skott + egna skott som blockerats. Det är volym, inte en differens
// mot motståndarens försök (det kräver att man loggar vem som är på isen).
//
// "Blocked Shot" är något annat: det är när spelaren blockar MOTSTÅNDARENS
// skott, och räknas därför inte hit. Egna blockerade försök sparas som
// "Shot Blocked (Own)". Nycklarna är de engelska aktionsnamnen i sparade matcher.

export const CORSI_ACTIONS = ['Shot on Goal', 'Missed Shot', 'Shot Blocked (Own)'] as const;

type Counts = Record<string, number> | undefined;

export function individualCorsi(counts: Counts): number {
  if (!counts) return 0;
  return CORSI_ACTIONS.reduce((sum, name) => sum + Math.max(0, counts[name] || 0), 0);
}

export interface CorsiSummary {
  /** Totalt antal skottförsök. */
  attempts: number;
  /** Antal matcher där minst ett skottförsök loggats. */
  gamesWithData: number;
  /** Skottförsök per match, räknat över matcher med data. */
  perGame: number;
  /** Andel av försöken som var på mål (0–100), eller null utan försök. */
  onTargetPct: number | null;
}

export function corsiSummary(games: { counts?: Record<string, number> }[]): CorsiSummary {
  let attempts = 0;
  let gamesWithData = 0;
  let onTarget = 0;
  for (const g of games) {
    const n = individualCorsi(g.counts);
    if (n > 0) gamesWithData += 1;
    attempts += n;
    onTarget += Math.max(0, g.counts?.['Shot on Goal'] || 0);
  }
  return {
    attempts,
    gamesWithData,
    perGame: gamesWithData ? Number((attempts / gamesWithData).toFixed(1)) : 0,
    onTargetPct: attempts ? Math.round((onTarget / attempts) * 100) : null,
  };
}
