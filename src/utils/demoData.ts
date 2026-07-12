import type { Language } from './translations';

// Exempeldata som visas i dashboarden när kontot inte har några spelare än,
// så att nya användare ser värdet (grafer, historik, AI-coach) direkt
// istället för en tom vy. Inget av detta sparas i databasen.

export function getDemoPlayerName(language: Language): string {
  return language === 'sv' ? 'Erik (exempel)' : 'Erik (example)';
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function getDemoHistory(language: Language) {
  const sv = language === 'sv';
  return [
    {
      date: daysAgo(2),
      points: 9,
      actions: sv
        ? ['Mål: 2', 'Assist: 1', 'Returlöpning: 4', 'Pucktapp: -1']
        : ['Goal: 2', 'Assist: 1', 'Backcheck: 4', 'Turnover: -1'],
    },
    {
      date: daysAgo(6),
      points: 7,
      actions: sv
        ? ['Mål: 1', 'Skott på mål: 3', 'Returlöpning: 3']
        : ['Goal: 1', 'Shot on goal: 3', 'Backcheck: 3'],
    },
    {
      date: daysAgo(10),
      points: 5,
      actions: sv
        ? ['Assist: 1', 'Skott på mål: 2', 'Pucktapp: -2']
        : ['Assist: 1', 'Shot on goal: 2', 'Turnover: -2'],
    },
  ];
}

export const DEMO_STATS = {
  players: 1,
  matches: 3,
  avgPoints: 7,
  thisWeek: 2,
};
