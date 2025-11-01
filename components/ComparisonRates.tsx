import React from 'react';
import type { Translation } from '../types';

interface ComparisonRatesProps {
    iqdRate?: number;
    eurRate?: number; // vs USD
    tryRate?: number; // vs USD
    t: Translation;
}

const ComparisonItem: React.FC<{label: string, value: string, description?: string, currency: string}> = ({ label, value, description, currency }) => (
    <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg text-center transition-colors duration-300">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</p>
        <p className="text-lg font-bold font-mono text-gray-800 dark:text-white mt-1" dir="ltr">{value} <span className="text-xs font-sans">{currency}</span></p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
    </div>
);

export const ComparisonRates: React.FC<ComparisonRatesProps> = ({ iqdRate, eurRate, tryRate, t }) => {
    if (!iqdRate || (!eurRate && !tryRate)) {
        return null; 
    }

    const iqdPerEur = eurRate ? (iqdRate / eurRate).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---';
    const iqdPerTry = tryRate ? (iqdRate / tryRate).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---';

    return (
        <div className="mt-6 animate-fade-in">
            <h3 className="text-center text-base font-bold text-gray-700 dark:text-gray-200 transition-colors duration-300 mb-3">{t.comparisonRatesTitle}</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               {eurRate && <ComparisonItem label={t.eurToIqd} value={iqdPerEur} description={t.eurRateDescription} currency={t.iqdCurrency} />}
               {tryRate && <ComparisonItem label={t.tryToIqd} value={iqdPerTry} description={t.tryRateDescription} currency={t.iqdCurrency} />}
            </div>
        </div>
    );
};