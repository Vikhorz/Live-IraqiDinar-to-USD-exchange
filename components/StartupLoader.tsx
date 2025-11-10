import React from 'react';
import type { Translation } from '../types';
import { Spinner } from './Spinner';

interface StartupLoaderProps {
    t: Translation;
}

export const StartupLoader: React.FC<StartupLoaderProps> = ({ t }) => {
    return (
        <div className="fixed inset-0 bg-gray-100/50 dark:bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in text-center p-4">
            {/* Main content wrapper */}
            <div className="flex flex-col items-center">
                {/* Top Part: Logo and App Name */}
                <div className="flex items-center gap-3 mb-24">
                    <img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3ccircle cx='50' cy='50' r='48' fill='%23FBBF24' stroke='%23B45309' stroke-width='4'/%3e%3ctext x='50' y='60' font-family='Noto Kufi Arabic, sans-serif' font-size='40' font-weight='bold' fill='%23B45309' text-anchor='middle'%3eد.ع%3c/text%3e%3c/svg%3e" alt="DinarLive Logo" className="h-12 w-12" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{t.appName}</h1>
                </div>

                {/* Bottom Part: Spinner and Loading Text */}
                <div className="flex flex-col items-center">
                    <Spinner />
                    <h2 className="mt-6 text-2xl font-bold text-gray-700 dark:text-gray-200 transition-colors duration-300">{t.loadingTitle}</h2>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">{t.loadingSubtitle}</p>
                </div>
            </div>
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