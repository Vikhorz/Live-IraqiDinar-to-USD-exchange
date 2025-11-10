import React from 'react';
import type { Translation } from '../types';

interface ComparisonRatesProps {
    iqdRate?: number;
    eurRate?: number; // vs USD
    tryRate?: number; // vs USD
    gbpRate?: number; // vs USD
    irtRate?: number; // vs USD
    t: Translation;
}

const ComparisonItem: React.FC<{label: string, value: string, description?: string, currency: string}> = ({ label, value, description, currency }) => (
    <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg text-center transition-colors duration-300">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</p>
        <p className="text-lg font-bold font-mono text-gray-800 dark:text-white mt-1" dir="ltr">{value} <span className="text-xs font-sans">{currency}</span></p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
    </div>
);

export const ComparisonRates: React.FC<ComparisonRatesProps> = ({ iqdRate, eurRate, tryRate, gbpRate, irtRate, t }) => {
    if (!iqdRate || (!eurRate && !tryRate && !gbpRate && !irtRate)) {
        return null; 
    }

    const iqdPerEur = eurRate ? (iqdRate / eurRate).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---';
    const iqdPerTry = tryRate ? (iqdRate / tryRate).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---';
    const iqdPerGbp = gbpRate ? (iqdRate / gbpRate).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '---';
    const iqdPerIrt = irtRate ? (iqdRate / irtRate).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '---';


    return (
        <div className="mt-6 animate-fade-in">
            <h3 className="text-center text-base font-bold text-gray-700 dark:text-gray-200 transition-colors duration-300 mb-3">{t.comparisonRatesTitle}</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               {eurRate > 0 && <ComparisonItem label={t.eurToIqd} value={iqdPerEur} description={t.eurRateDescription} currency={t.iqdCurrency} />}
               {tryRate > 0 && <ComparisonItem label={t.tryToIqd} value={iqdPerTry} description={t.tryRateDescription} currency={t.iqdCurrency} />}
               {gbpRate > 0 && <ComparisonItem label={t.gbpToIqd} value={iqdPerGbp} description={t.gbpRateDescription} currency={t.iqdCurrency} />}
               {irtRate > 0 && <ComparisonItem label={t.irtToIqd} value={iqdPerIrt} description={t.irtRateDescription} currency={t.iqdCurrency} />}
            </div>
        </div>
    );
};