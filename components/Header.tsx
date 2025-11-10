import React from 'react';
import type { Translation } from '../types';

interface HeaderProps {
  t: Translation;
}

export const Header: React.FC<HeaderProps> = ({ t }) => {
  return (
    <div className="text-center pt-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
            {t.headerTitle}
        </h2>
        <p className="mt-1 text-base md:text-lg text-gray-500 dark:text-gray-400 transition-colors duration-300">
            {t.headerSubtitle}
        </p>
    </div>
  );
};