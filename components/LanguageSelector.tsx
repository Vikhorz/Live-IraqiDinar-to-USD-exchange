import React from 'react';
import type { Language } from '../hooks/useLanguage';

interface LanguageSelectorProps {
  currentLang: Language;
  onChangeLang: (lang: Language) => void;
}

const languages: { code: Language; name: string }[] = [
  { code: 'ku', name: 'کوردی' },
  { code: 'ar', name: 'العربية' },
  { code: 'en', name: 'English' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLang, onChangeLang }) => {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 p-1 transition-colors duration-200 z-10">
      {languages.map(({ code, name }) => {
        const isRtlLang = code === 'ku' || code === 'ar';
        return (
          <button
            key={code}
            onClick={() => onChangeLang(code)}
            className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
              currentLang === code
                ? 'bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            } ${isRtlLang ? 'font-noto-kufi-arabic' : ''}`}
            aria-pressed={currentLang === code}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
};