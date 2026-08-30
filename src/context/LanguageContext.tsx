import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TRANSLATIONS, Translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, fallback?: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateStr: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('vault_language') as Language) || 'en-US';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('vault_language', newLang);
  };

  const t = (key: keyof Translations, fallback?: string): string => {
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS['en-US'];
    return currentDict[key] || fallback || key;
  };

  const formatCurrency = (amount: number): string => {
    if (language === 'pt-BR') {
      return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    if (language === 'es-LA') {
      return `$ ${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr + (dateStr.length <= 10 ? 'T12:00:00' : ''));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : language === 'es-LA' ? 'es-ES' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatCurrency, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if not inside provider
    return {
      language: 'en-US',
      setLanguage: () => {},
      t: (key: keyof Translations, fallback?: string) => TRANSLATIONS['en-US'][key] || fallback || key,
      formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
      formatDate: (d: string) => d,
    };
  }
  return context;
};
