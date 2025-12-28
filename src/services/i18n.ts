import { translations, Language } from '../utils/translations';

export class I18nService {
  private currentLanguage: Language = 'en';
  private listeners: Array<(lang: Language) => void> = [];

  constructor() {
    // Initialize from localStorage or browser
    const saved = localStorage.getItem('iceiq-language') as Language;
    const browserLang = navigator.language.toLowerCase();
    
    if (saved && (saved === 'en' || saved === 'sv')) {
      this.currentLanguage = saved;
    } else if (browserLang.startsWith('sv')) {
      this.currentLanguage = 'sv';
    }
    
    document.documentElement.lang = this.currentLanguage;
  }

  get language(): Language {
    return this.currentLanguage;
  }

  set language(lang: Language) {
    this.currentLanguage = lang;
    localStorage.setItem('iceiq-language', lang);
    document.documentElement.lang = lang;
    this.notifyListeners();
  }

  t(key: string): string {
    const translation = translations[this.currentLanguage];
    if (!translation) return key;
    
    // Handle nested keys (e.g., "actions.positive")
    const keys = key.split('.');
    let value: any = translation;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Key not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  getTranslations(): typeof translations.en {
    return translations[this.currentLanguage];
  }

  subscribe(listener: (lang: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentLanguage));
  }

  // Formatting utilities
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString(this.currentLanguage === 'sv' ? 'sv-SE' : 'en-US');
  }

  formatCurrency(amount: number): string {
    const currency = this.currentLanguage === 'sv' ? 'SEK' : 'USD';
    return new Intl.NumberFormat(this.currentLanguage === 'sv' ? 'sv-SE' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat(this.currentLanguage === 'sv' ? 'sv-SE' : 'en-US').format(num);
  }
}

// Singleton instance
export const i18n = new I18nService();