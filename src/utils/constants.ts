export const APP_NAME = 'Ice IQ';

// Free-plan limits
export const FREE_PLAYER_LIMIT = 3;
export const APP_VERSION = '1.0.0';
export const APP_ID = 'iceiq';

// Firebase Constants
export const FIRESTORE_PATHS = {
  users: (appId: string, userId: string) => `artifacts/${appId}/users/${userId}`,
  players: (appId: string, userId: string) => `artifacts/${appId}/users/${userId}/players`,
  games: (appId: string, userId: string, playerName: string) => 
    `artifacts/${appId}/users/${userId}/players/${playerName}/games`
};

// Stripe Constants
export const STRIPE_CONFIG = {
  monthlyPriceId: 'price_monthly',
  yearlyPriceId: 'price_yearly',
  currencies: {
    SEK: 'sek',
    USD: 'usd'
  }
} as const;

// Template Constants
export const DEFAULT_TEMPLATES = {
  defenseman: 'defenseman',
  forward: 'forward',
  goalie: 'goalie'
} as const;

// Game Constants
export const MAX_FREE_PLAYERS = 1;
export const MAX_FREE_GAMES_PER_PLAYER = 10;
export const BONUS_FACTOR_DEFAULT = 10;

// UI Constants
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export const COLORS = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  accent: {
    gold: '#FFD700',
    'gold-dark': '#FFA500',
  },
  hockey: {
    blue: '#00ADEF',
    cyan: '#22d3ee',
    ice: '#88d3ee',
  }
} as const;

// Validation Constants
export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: {
    minLength: 6,
    maxLength: 128
  },
  playerName: {
    minLength: 2,
    maxLength: 50
  }
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  language: 'iceiq-language',
  theme: 'iceiq-theme',
  lastPlayer: 'iceiq-last-player',
  lastTemplate: 'iceiq-last-template',
  sessionToken: 'iceiq-session'
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  createCheckoutSession: '/api/create-checkout-session',
  createPortalSession: '/api/create-portal-session',
  webhook: '/api/webhook'
} as const;

// Feature Flags
export const FEATURES = {
  enableSoftSkills: false,
  enableTeamManagement: false,
  enableExport: true,
  enableNotifications: false,
  enableOfflineMode: true
} as const;