import type { LinkGame } from '../../utils/matchChanges';

export interface PlayerLinkData {
  playerName: string;
  games: LinkGame[];
  summary: { games: number; avgPoints: number; bestGame: number; last5Avg: number } | null;
  latestCoachNote: string | null;
  /** Coachens korta rader från det senaste svaret (se askCoach). Kan saknas. */
  coachHighlight?: string | null;
  coachThink?: string | null;
  coachSpoken?: string[];
  /** Språket coachen svarade på (förälderns konto). Styr text och röst i lyssnakortet. */
  listenLang?: 'sv' | 'en' | null;
  /** Matcher i rad med rutinen gjord — se computeRoutineStreak i functions/index.js. */
  routineStreak: number;
  /** Spår för rutinkorten som coachen pekat ut (t.ex. 'focus'), eller null. */
  suggestedTrack?: string | null;
}
