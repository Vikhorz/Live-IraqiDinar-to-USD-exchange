import React, { useState, useEffect, useRef } from 'react';

interface RateDisplayProps {
  value: number;
  loading: boolean;
  label: string;
  description: string;
  currency: string;
}

const DollarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 16v-1m0 1v.01M12 16c-1.11 0-2.08-.402-2.599-1M12 16H9.401M12 8h2.599M12 8V6m0 12v-2m0-10V4m0 16v-2" />
    </svg>
);


export const RateDisplay: React.FC<RateDisplayProps> = ({ value, loading, label, description, currency }) => {
  const [iconHighlightClass, setIconHighlightClass] = useState('');
  const [rateChangeClass, setRateChangeClass] = useState('');
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Don't animate on initial render or if value is 0
    if (prevValueRef.current === value || value === 0) {
        prevValueRef.current = value;
        return;
    }

    // --- Icon Highlight Animation ---
    setIconHighlightClass('bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400');
    const iconTimer = setTimeout(() => {
        setIconHighlightClass('');
    }, 500);

    // --- Rate Value Color Flash Animation ---
    if (value > prevValueRef.current) {
      setRateChangeClass('text-green-500 dark:text-green-400');
    } else if (value < prevValueRef.current) {
      setRateChangeClass('text-red-500 dark:text-red-400');
    }
    
    const rateTimer = setTimeout(() => {
        setRateChangeClass('');
    }, 500); // Highlight duration

    prevValueRef.current = value; // Update the ref with the new value
    
    return () => {
      clearTimeout(iconTimer);
      clearTimeout(rateTimer);
    };
  }, [value]);


  const bgColor = 'bg-gray-50 dark:bg-gray-900/40';
  const textColor = 'text-gray-600 dark:text-gray-300';

  const iconClasses = iconHighlightClass || 'bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400';

  return (
    <div className={`p-4 md:p-5 rounded-xl ${bgColor} transition-colors duration-300 relative`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
           <div className={`p-2 rounded-full border border-white/50 transition-colors duration-500 ${iconClasses}`}>
              <DollarIcon />
           </div>
          <div>
            <p className={`font-semibold ${textColor}`}>{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl md:text-3xl font-bold relative origin-right rtl:origin-left transition-colors duration-300 ${rateChangeClass || 'text-gray-900 dark:text-white'}`} dir="ltr">
            {Math.floor(value).toLocaleString()}
            {loading && (
              <span className="absolute -top-1 -right-4 h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </span>
            )}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{currency}</p>
        </div>
      </div>
    </div>
  );
};