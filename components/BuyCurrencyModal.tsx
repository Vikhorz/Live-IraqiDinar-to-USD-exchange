import React, { useState, useMemo } from 'react';
import { Dialog } from './Dialog';
import { currencyData } from '../currencyData';
import type { Translation } from '../types';

interface BuyCurrencyModalProps {
  currencyCode: string;
  rates: { [key: string]: number };
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
}

export const BuyCurrencyModal: React.FC<BuyCurrencyModalProps> = ({ currencyCode, rates, isOpen, onClose, t }) => {
    const [amount, setAmount] = useState('');
    const data = currencyData[currencyCode];

    const costInIqd = useMemo(() => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) return 0;
    
        const rateVsUsd = rates[currencyCode];
        const iqdPerUsd = rates['IQD'];
        if (!rateVsUsd || !iqdPerUsd) return 0;
        
        if (currencyCode === 'IQD') {
            return numericAmount;
        }

        const cost = (numericAmount / rateVsUsd) * iqdPerUsd;
        return cost;
    
      }, [amount, currencyCode, rates]);

      if (!isOpen || !data) return null;

      return (
        <Dialog isOpen={isOpen} onClose={onClose} title={t.buyCurrencyTitle(data.name(t))} t={t}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="buy-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left rtl:text-right">{t.purchaseAmount} ({currencyCode})</label>
                    <input
                        id="buy-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 text-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors duration-300 text-left"
                        dir="ltr"
                        autoFocus
                    />
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/40 rounded-lg text-center">
                    <p className="text-sm text-green-700 dark:text-green-300">{t.costInIqd}</p>
                    <p className="text-xl font-bold font-mono text-green-800 dark:text-green-200" dir="ltr">
                        {costInIqd > 0 ? costInIqd.toLocaleString('en-US', {maximumFractionDigits: 0}) : '0'}
                        {' '}
                        <span className="text-sm font-sans">{t.iqd}</span>
                    </p>
                </div>
            </div>
        </Dialog>
      );
};
