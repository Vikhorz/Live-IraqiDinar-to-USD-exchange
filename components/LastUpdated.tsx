import React, { useState, useEffect } from 'react';
import type { Translation } from '../types';

interface LastUpdatedProps {
  date: string;
  loading: boolean;
  t: Translation;
  onRefresh: () => void;
  cooldownSeconds: number;
}

const InlineSpinner: React.FC = () => (
    <svg className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const RefreshIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120 12h-3a6 6 0 00-9.45-4.55L4 4z" />
    </svg>
);

const formatCooldown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const LastUpdated: React.FC<LastUpdatedProps> = ({ date, loading, t, onRefresh, cooldownSeconds }) => {
  const [timeAgo, setTimeAgo] = useState(t.justNow);

  useEffect(() => {
    if (loading) return;
    
    const update = () => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 5) {
            setTimeAgo(t.justNow);
        } else if (seconds < 60) {
            setTimeAgo(t.secondsAgo(seconds));
        } else {
             setTimeAgo(new Date(date).toLocaleTimeString('en-GB'));
        }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [date, loading, t]);
  
  const isButtonDisabled = loading || cooldownSeconds > 0;

  return (
    <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 transition-colors duration-300 h-5">
      {loading ? (
        <>
          <InlineSpinner />
          <span>{t.updatingRates}</span>
        </>
      ) : (
        <>
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <span>{t.updated} {timeAgo}</span>
          <button 
            onClick={onRefresh} 
            disabled={isButtonDisabled}
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 relative"
            aria-label="Refresh rates"
          >
            {cooldownSeconds > 0 ? (
                <span className="text-xs font-mono w-8">{formatCooldown(cooldownSeconds)}</span>
            ) : (
                <RefreshIcon />
            )}
            
            {cooldownSeconds > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.refreshCooldown(formatCooldown(cooldownSeconds))}
                </div>
            )}
          </button>
        </>
      )}
    </div>
  );
};