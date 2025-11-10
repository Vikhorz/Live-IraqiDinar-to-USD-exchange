import React from 'react';
import type { Translation } from '../types';
import { Spinner } from './Spinner';

interface StartupLoaderProps {
    t: Translation;
}

export const StartupLoader: React.FC<StartupLoaderProps> = ({ t }) => {
    return (
        <div className="fixed inset-0 bg-gray-100/50 dark:bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in text-center">
            <Spinner />
            <h1 className="mt-6 text-3xl font-bold text-gray-700 dark:text-gray-200 transition-colors duration-300">{t.loadingTitle}</h1>
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">{t.loadingSubtitle}</p>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};