// User Types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserData {
  subscriptionPlan: 'free' | 'premium';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  subscriptionInterval?: 'monthly' | 'yearly';
  subscriptionEnd?: string | null;
  carriedOverBonus: number;
  customTemplates: Record<string, Template>;
  createdAt: string;
  lastUpdated: string;
}

// Subscription Types
export interface Subscription {
  plan: 'free' | 'premium';
  status: 'active' | 'inactive' | 'cancelled';
  interval?: 'monthly' | 'yearly';
  subscriptionEnd?: string;
}

// Template Types
export interface TemplateAction {
  name: { sv: string; en: string };
  points: number;
  type: 'positive' | 'negative';
}

export interface Template {
  id: string;
  name: { sv: string; en: string };
  actions: TemplateAction[];
  softSkills?: TemplateAction[];
}

// Game Types
export interface GameRecord {
  id?: string;
  date: string;
  team: string;
  points: number;
  bonus: number;
  counts: Record<string, number>;
  softSkillCounts?: Record<string, number>;
  template: string;
  createdAt?: string;
}

export interface Player {
  id: string;
  name: string;
  lastGameDate?: string;
  gameCount?: number;
  totalPoints?: number;
  avgPoints?: number;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }>;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// Payment Types
export interface CheckoutSession {
  id: string;
  url: string;
}

export interface PaymentStatus {
  success: boolean;
  message: string;
}

// Stats Types
export interface PlayerStats {
  totalGames: number;
  avgPoints: number;
  bestGame: GameRecord;
  worstGame: GameRecord;
  totalPoints: number;
  recentGames: GameRecord[];
  topActions: Array<[string, number]>;
  trend?: 'up' | 'down' | 'stable';
}

// Language Types
export type Language = 'en' | 'sv';

// Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

export interface SubscriptionContextType {
  subscription: Subscription;
  loading: boolean;
  upgradeToPremium: (interval: 'monthly' | 'yearly') => Promise<void>;
  manageSubscription: () => Promise<void>;
  checkUserSubscription: () => Promise<void>;
}

export interface TemplateContextType {
  templates: Record<string, Template>;
  currentTemplate: Template | null;
  currentTemplateId: string;
  customTemplates: Record<string, Template>;
  loading: boolean;
  setCurrentTemplate: (templateId: string) => void;
  saveTemplate: (templateId: string, template: Template) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  addAction: (action: TemplateAction) => void;
  updateAction: (actionIndex: number, updates: Partial<TemplateAction>) => void;
  deleteAction: (actionIndex: number) => void;
}

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentTranslations: Record<string, string>;
}

// Component Props Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'premium' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
  fullWidth?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ size?: number }>;
  helperText?: string;
  fullWidth?: boolean;
}