import React from 'react';
import type { Translation } from '../types';

interface ApiKeySelectorProps {
  onSelectKey: () => void;
  t: Translation;
}

const KeyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.602l-4.135 4.135a2.25 2.25 0 01-3.182 0l-1.26-1.26a2.25 2.25 0 010-3.182l4.135-4.135A6 6 0 0118.75 8.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onSelectKey, t }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/50 dark:bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center transform transition-all animate-scale-in">
        <KeyIcon />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t.apiKeyRequiredTitle}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{t.apiKeyRequiredDescription}</p>
        <button
          onClick={onSelectKey}
          className="w-full px-5 py-3 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          {t.selectApiKeyButton}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          {t.billingInfoText}{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 dark:text-sky-400 hover:underline"
          >
            {t.learnMore}
          </a>
        </p>
      </div>
       <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
           @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
          .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
        `}</style>
    </div>
  );
};
