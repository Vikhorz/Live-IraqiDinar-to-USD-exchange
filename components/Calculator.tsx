

import React, { useState, useMemo } from 'react';
import type { Translation } from '../types';

interface CalculatorProps {
  rates: {
    [key: string]: number;
  };
  t: Translation;
  onCurrencySelect: (currencyCode: string) => void;
}

const SwapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

// Reusable Tooltip Component defined locally
const Tooltip: React.FC<{ text: string; children: React.ReactNode; className?: string }> = ({ text, children, className }) => {
  return (
    <div className={`group relative ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
        {text}
      </div>
    </div>
  );
};


export const Calculator: React.FC<CalculatorProps> = ({ rates, t, onCurrencySelect }) => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('IQD');

  const currencies = useMemo(() => [
    { code: 'USD', name: t.usd },
    { code: 'IQD', name: t.iqd },
    { code: 'EUR', name: t.eur },
    { code: 'TRY', name: t.try },
    { code: 'GBP', name: t.gbp },
    { code: 'IRT', name: t.irt },
  ], [t]);

  const currencyTooltips: { [key: string]: keyof Translation } = useMemo(() => ({
    USD: 'usdTooltip',
    IQD: 'iqdTooltip',
    EUR: 'eurTooltip',
    TRY: 'tryTooltip',
    GBP: 'gbpTooltip',
    IRT: 'irtTooltip',
  }), []);

  const directRate = useMemo(() => {
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (typeof fromRate !== 'number' || typeof toRate !== 'number' || fromRate <= 0) {
      return 0;
    }
    return toRate / fromRate;
  }, [fromCurrency, toCurrency, rates]);

  const calculatedResult = useMemo(() => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || directRate <= 0) {
      return '0';
    }

    const result = numericAmount * directRate;

    const formatOptions: Intl.NumberFormatOptions = {};
    if (toCurrency === 'IQD' || toCurrency === 'IRT') {
        formatOptions.maximumFractionDigits = 0;
    } else {
        formatOptions.minimumFractionDigits = 2;
        formatOptions.maximumFractionDigits = 2;
    }

    return result.toLocaleString('en-US', formatOptions);
  }, [amount, toCurrency, directRate]);


  const handleSwap = () => {
    const tempFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempFrom);
  };
  
  const selectClasses = "w-full appearance-none bg-transparent p-2 pt-3 text-center font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 transition-colors duration-300 focus:outline-none";


  return (
    <div>
      <div className="relative">
        <label htmlFor="amount" className="absolute -top-2 right-3 text-xs bg-white dark:bg-gray-800 px-1 text-gray-500 transition-colors duration-300">{t.amount}</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t.amountPlaceholder}
          className="w-full p-3 sm:p-4 text-lg sm:text-xl md:text-2xl font-mono bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors duration-300 text-left"
          dir="ltr"
        />
      </div>

      <div className="flex items-center justify-between my-3 sm:my-4 space-x-2 rtl:space-x-reverse">
        <div className="flex-1 relative">
          <label className="absolute -top-2 right-3 text-xs bg-white dark:bg-gray-800 px-1 text-gray-500 dark:text-gray-400 transition-colors duration-300 z-10">{t.from}</label>
          <Tooltip text={t[currencyTooltips[fromCurrency]]} className="w-full">
            <div className="text-center bg-gray-100 dark:bg-gray-700/50 rounded-lg transition-colors duration-300 relative overflow-hidden">
              <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className={selectClasses}>
                {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </Tooltip>
        </div>
        
        <button onClick={handleSwap} className="flex-shrink-0 p-1.5 sm:p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-sky-500" aria-label="Swap currencies">
            <SwapIcon className="w-5 h-5 sm:w-6 sm:h-6 transform transition-transform duration-300" />
        </button>

        <div className="flex-1 relative">
          <label className="absolute -top-2 right-3 text-xs bg-white dark:bg-gray-800 px-1 text-gray-500 dark:text-gray-400 transition-colors duration-300 z-10">{t.to}</label>
           <Tooltip text={t[currencyTooltips[toCurrency]]} className="w-full">
             <div className="text-center bg-gray-100 dark:bg-gray-700/50 rounded-lg transition-colors duration-300 relative overflow-hidden">
                <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className={selectClasses}>
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
             </div>
           </Tooltip>
        </div>
      </div>
      
      <Tooltip text={t.resultTooltip} className="w-full">
        <div className="mt-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/40 rounded-lg text-center transition-colors duration-300">
          <p className="text-sm text-green-700 dark:text-green-300 mb-1 transition-colors duration-300">{t.result}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-green-800 dark:text-green-200 transition-colors duration-300" dir="ltr">
              {calculatedResult}
          </p>
          {directRate > 0 && fromCurrency !== toCurrency && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-mono" dir="ltr">
                  1 <button onClick={() => onCurrencySelect(fromCurrency)} className="font-semibold underline hover:text-green-700 dark:hover:text-green-300 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 transition-colors">{fromCurrency}</button> 
                  ≈ {directRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} 
                  <button onClick={() => onCurrencySelect(toCurrency)} className="font-semibold underline hover:text-green-700 dark:hover:text-green-300 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 transition-colors">{toCurrency}</button>
              </p>
          )}
        </div>
      </Tooltip>
    </div>
  );
};