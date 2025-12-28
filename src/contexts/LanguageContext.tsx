import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentTranslations: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  // Initialize language from browser or localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('iceiq-language') as Language;
    const browserLang = navigator.language.toLowerCase();
    
    if (savedLang && (savedLang === 'en' || savedLang === 'sv')) {
      setLanguage(savedLang);
    } else if (browserLang.startsWith('sv')) {
      setLanguage('sv');
    } else {
      setLanguage('en');
    }
  }, []);

  // Save language preference
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('iceiq-language', lang);
    document.documentElement.lang = lang;
  };

  // Translation function
  const t = (key: string): string => {
    const translation = translations[language];
    if (!translation) return key;
    
    // Check nested keys (e.g., "actions.positive")
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
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t,
    currentTranslations: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
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