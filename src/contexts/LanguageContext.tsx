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

  // 3. Översättningsfunktion (fixad loop-variabel)
  const t = (key: string): string => {
    const translation = translations[language];
    if (!translation) return key;
    
    const keys = key.split('.');
    let current: any = translation; // Döp om från 'value' till 'current'
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return key; 
      }
    }
    
    return typeof current === 'string' ? current : key;
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