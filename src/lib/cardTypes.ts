export type CardLanguage = 'sv' | 'en';

/** Källa till en idé eller ett citat. Språkneutral, delas av sv/en-posterna. */
export interface CardSource {
  person: string;
  work: string;
  year: number;
  /** En människa har läst källan och kontrollerat att innehållet stämmer. Krävs för godkända kort. */
  verified: boolean;
  url?: string;
}

export interface Card {
  id: string;
  concept: string;
  track: string;
  level: 1 | 2 | 3;
  requires?: string[];
  ageMin: number;
  ageMax: number;
  surface: 'link' | 'app' | 'both';
  lang: CardLanguage;
  title: string;
  body?: string;
  input?: { placeholder: string; errorText: string };
  reflect?: string;
  footnote?: string;
  status: 'draft' | 'approved';
  pass: string;
  order: number;
  sectionTitle: string;
  icon: 'backpack' | 'pen-line' | 'moon' | 'check';
  action?: { kind: 'breathing'; label: string };
  reward?: { withAnswer: string; empty: string };
  nerves?: boolean;
  source?: CardSource;
}

export interface CardProgress {
  seen: Record<string, string>;
  passes: number;
}
