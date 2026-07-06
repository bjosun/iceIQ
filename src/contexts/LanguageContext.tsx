import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentTranslations: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  // 1. Initiera språk vid start
  useEffect(() => {
    const savedLang = localStorage.getItem('iceiq-language') as Language;
    const browserLang = navigator.language.toLowerCase();
    
    if (savedLang && (savedLang === 'en' || savedLang === 'sv')) {
      setLanguage(savedLang);
      document.documentElement.lang = savedLang;
    } else if (browserLang.startsWith('sv')) {
      setLanguage('sv');
      document.documentElement.lang = 'sv';
    } else {
      setLanguage('en');
      document.documentElement.lang = 'en';
    }
  }, []);

  // 2. Funktion för att byta språk
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('iceiq-language', lang);
    document.documentElement.lang = lang;
  };

  // 3. Översättningsfunktion
  const lookup = (lang: Language, key: string): string | undefined => {
    const keys = key.split('.');
    let current: any = translations[lang];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  };

  // Saknas nyckeln i valt språk faller vi tillbaka till engelska,
  // och som sista utväg visas själva nyckeln (syns direkt i UI:t).
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = lookup(language, key) ?? lookup('en', key) ?? key;

    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
      }
    }

    return text;
  };

  // 4. Context value (objektet som skickas ut)
  const providerValue: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    currentTranslations: translations[language]
  };

  return (
    <LanguageContext.Provider value={providerValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}