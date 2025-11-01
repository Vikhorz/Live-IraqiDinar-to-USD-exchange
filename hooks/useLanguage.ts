import { useState, useEffect, useCallback } from 'react';

export type Language = 'ku' | 'ar' | 'en';

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return 'ku'; // Default for SSR
  }
  const storedLang = localStorage.getItem('language');
  if (storedLang === 'ku' || storedLang === 'ar' || storedLang === 'en') {
    return storedLang;
  }
  
  // If no language is stored, default to Kurdish.
  return 'ku';
};

export const useLanguage = (): [Language, (lang: Language) => void] => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = (language === 'en' ? 'ltr' : 'rtl');
    localStorage.setItem('language', language);
  }, [language]);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  return [language, changeLanguage];
};