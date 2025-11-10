import React from 'react';
import { Dialog } from './Dialog';
import { currencyData } from '../currencyData';
import type { Translation } from '../types';

interface CurrencyInfoModalProps {
  currencyCode: string;
  isOpen: boolean;
  onClose: () => void;
  onBuy: () => void;
  t: Translation;
}

const InfoSection: React.FC<{title: string, content: string}> = ({title, content}) => (
    <div className="mb-4 text-left rtl:text-right">
        <h3 className="font-bold text-gray-700 dark:text-gray-200">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{content}</p>
    </div>
);

export const CurrencyInfoModal: React.FC<CurrencyInfoModalProps> = ({ currencyCode, isOpen, onClose, onBuy, t }) => {
  const data = currencyData[currencyCode];

  if (!isOpen || !data) return null;

  const footer = (
    <div className="flex items-center gap-3">
        <button onClick={onClose} className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">
            {t.closeButton}
        </button>
        { currencyCode !== 'IQD' && (
            <button onClick={onBuy} className="w-full px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                {t.buyButton(currencyCode)}
            </button>
        )}
    </div>
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t.currencyInfoTitle(data.name(t))} t={t} footer={footer}>
        <div className="text-center">
            <InfoSection title={t.isoCode} content={data.iso} />
            <InfoSection title={t.commonUses} content={data.description(t)} />
            <InfoSection title={t.funFact} content={data.fact(t)} />
        </div>
    </Dialog>
  );
};
