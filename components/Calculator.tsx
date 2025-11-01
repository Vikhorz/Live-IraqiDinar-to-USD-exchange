import React, { useState, useMemo } from 'react';
import type { Translation } from '../types';

interface CalculatorProps {
  rates: {
    [key: string]: number;
  };
  t: Translation;
}

const SwapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

export const Calculator: React.FC<CalculatorProps> = ({ rates, t }) => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('IQD');

  const currencies = useMemo(() => [
    { code: 'USD', name: t.usd },
    { code: 'IQD', name: t.iqd },
    { code: 'EUR', name: t.eur },
    { code: 'TRY', name: t.try },
  ], [t]);

  const allRates = useMemo(() => rates, [rates]);

  const calculatedResult = useMemo(() => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || !allRates.EUR) { // Added check for rates.EUR to prevent calculation before it's ready
      return '0';
    }

    const fromRate = allRates[fromCurrency as keyof typeof allRates];
    const toRate = allRates[toCurrency as keyof typeof allRates];

    if (!fromRate || !toRate || fromRate <= 0) return '0';
    
    // Convert amount to USD first, then to the target currency
    const amountInUSD = numericAmount / fromRate;
    const result = amountInUSD * toRate;
    
    const formatOptions: Intl.NumberFormatOptions = {};
    if (toCurrency === 'IQD') {
        formatOptions.maximumFractionDigits = 0;
    } else {
        formatOptions.minimumFractionDigits = 2;
        formatOptions.maximumFractionDigits = 2;
    }

    return result.toLocaleString('en-US', formatOptions);

  }, [amount, fromCurrency, toCurrency, allRates]);

  const handleSwap = () => {
    const tempFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempFrom);
  };
  
  const selectClasses = "w-full appearance-none bg-transparent p-2 text-center font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 transition-colors duration-300 focus:outline-none";


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
        <div className="flex-1 text-center bg-gray-100 dark:bg-gray-700/50 rounded-lg transition-colors duration-300 relative">
          <label className="absolute top-0.5 right-2 text-[10px] text-gray-500 dark:text-gray-400">{t.from}</label>
          <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className={selectClasses}>
            {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        
        <button onClick={handleSwap} className="flex-shrink-0 p-1.5 sm:p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-sky-500" aria-label="Swap currencies">
            <SwapIcon className="w-5 h-5 sm:w-6 sm:h-6 transform transition-transform duration-300" />
        </button>

        <div className="flex-1 text-center bg-gray-100 dark:bg-gray-700/50 rounded-lg transition-colors duration-300 relative">
          <label className="absolute top-0.5 right-2 text-[10px] text-gray-500 dark:text-gray-400">{t.to}</label>
          <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className={selectClasses}>
            {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
      </div>
      
      <div className="mt-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/40 rounded-lg text-center transition-colors duration-300">
        <p className="text-sm text-green-700 dark:text-green-300 mb-1 transition-colors duration-300">{t.result}</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-green-800 dark:text-green-200 transition-colors duration-300" dir="ltr">
            {calculatedResult}
        </p>
      </div>
    </div>
  );
};