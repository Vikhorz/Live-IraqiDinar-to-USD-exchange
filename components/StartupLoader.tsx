import React from 'react';
import type { Translation } from '../types';
import { Spinner } from './Spinner';

interface StartupLoaderProps {
    t: Translation;
}

export const StartupLoader: React.FC<StartupLoaderProps> = ({ t }) => {
    return (
        <div className="fixed inset-0 bg-gray-100/50 dark:bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in">
            <Spinner />
            <p className="mt-6 text-lg font-semibold text-gray-600 dark:text-gray-300 transition-colors duration-300">{t.loadingAppData}</p>
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