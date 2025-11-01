
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useExchangeRate } from './hooks/useExchangeRate';
import { Header } from './components/Header';
import { RateDisplay } from './components/RateDisplay';
import { LastUpdated } from './components/LastUpdated';
import { Calculator } from './components/Calculator';
import { translations } from './translations';
import { ThemeToggle } from './components/ThemeToggle';
import { RateDisplaySkeleton } from './components/RateDisplaySkeleton';
import { ComparisonRates } from './components/ComparisonRates';
import { ComparisonRatesSkeleton } from './components/ComparisonRatesSkeleton';
import { useLanguage } from './hooks/useLanguage';
import { LanguageSelector } from './components/LanguageSelector';
import { GroundingSources } from './components/GroundingSources';
import { Dialog } from './components/Dialog';
import { Footer } from './components/Footer';
import { StartupLoader } from './components/StartupLoader';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './components/PullToRefreshIndicator';

// Official Central Bank of Iraq rate for cash sales to the public: 1 USD = 1310 IQD
const CENTRAL_BANK_RATE = 1310;

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);


export default function App(): React.ReactElement {
  const { rate, sources, loading, error, refetch, cooldownRemaining } = useExchangeRate();
  
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [language, setLanguage] = useLanguage();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const t = translations[language];

  const { isRefreshing, pullPosition, pullToRefreshThreshold, touchStart, touchMove, touchEnd } = usePullToRefresh(refetch);

  const iqdRateValue = useMemo(() => rate?.iqd ?? 0, [rate]);
  const usdPerEurValue = useMemo(() => rate?.usdPerEur ?? 0, [rate]);
  const tryPerUsdValue = useMemo(() => rate?.tryPerUsd ?? 0, [rate]);
  const rateForDisplay = useMemo(() => iqdRateValue * 100, [iqdRateValue]);
  const centralBankRateForDisplay = useMemo(() => CENTRAL_BANK_RATE * 100, []);
  const eurPerUsd = useMemo(() => (usdPerEurValue > 0 ? 1 / usdPerEurValue : 0), [usdPerEurValue]);
  
  const isInitialLoading = loading && !rate && !error;
  
  const handleShare = async () => {
    if (!rate) return;

    const shareText = t.shareMessage(
      Math.floor(rateForDisplay).toLocaleString(),
      centralBankRateForDisplay.toLocaleString()
    );

    const shareData: ShareData = {
      title: t.headerTitle,
      text: shareText,
    };
    
    const isShareableUrl = window.location.protocol.startsWith('http');
    if (isShareableUrl) {
      shareData.url = window.location.href;
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        const clipboardText = isShareableUrl ? `${shareText}\n\n${window.location.href}` : shareText;
        await navigator.clipboard.writeText(clipboardText);
        setShareFeedback(t.copiedToClipboard);
        setTimeout(() => setShareFeedback(''), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };


  return (
    <>
      {isInitialLoading && <StartupLoader t={t} />}

      <main 
        className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-filter duration-500 ${isInitialLoading ? 'blur-sm' : ''}`}
        onTouchStart={touchStart}
        onTouchMove={touchMove}
        onTouchEnd={touchEnd}
      >
        <PullToRefreshIndicator 
            isRefreshing={isRefreshing} 
            pullPosition={pullPosition} 
            threshold={pullToRefreshThreshold}
            t={t}
        />
        <div 
          className="w-full max-w-md sm:max-w-lg transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${pullPosition}px)` }}
        >
          <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 transition-all duration-300 relative">
            <ThemeToggle />
            <LanguageSelector currentLang={language} onChangeLang={setLanguage} />
            <Header t={t} />
            
            {loading && !rate && !error && (
              <>
                <div className="mt-6 space-y-4">
                  <RateDisplaySkeleton />
                  <RateDisplaySkeleton />
                </div>
                <ComparisonRatesSkeleton />
              </>
            )}

            {error && (
              <div className="my-6 text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg transition-colors duration-300">
                <p className="font-semibold">{t.errorFetching}</p>
                <p className="text-sm">{t[error] ?? t.unknownError}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 px-5 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {t.retryButton}
                </button>
              </div>
            )}

            {!loading && rate && (
              <>
                <div className="mt-6 space-y-4 animate-fade-in">
                  <RateDisplay
                    value={rateForDisplay}
                    loading={loading && !isRefreshing}
                    label={t.marketRateLabel}
                    description={t.marketRateDescription}
                    currency={t.iqdCurrency}
                  />
                  <RateDisplay
                    value={centralBankRateForDisplay}
                    loading={false}
                    label={t.centralBankRateLabel}
                    description={t.centralBankRateDescription}
                    currency={t.iqdCurrency}
                  />
                </div>

                <ComparisonRates 
                    iqdRate={iqdRateValue}
                    eurRate={eurPerUsd}
                    tryRate={tryPerUsdValue}
                    t={t}
                  />

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
                  <button
                    onClick={() => setIsCalculatorOpen(prev => !prev)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    aria-expanded={isCalculatorOpen}
                    aria-controls="calculator-content"
                  >
                    <h2 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-200 transition-colors duration-300">{t.calculatorTitle}</h2>
                    <ChevronIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isCalculatorOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    id="calculator-content"
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${isCalculatorOpen ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
                  >
                    <Calculator rates={{
                      IQD: iqdRateValue,
                      USD: 1,
                      EUR: eurPerUsd,
                      TRY: tryPerUsdValue,
                    }} t={t} />
                  </div>
                </div>
                
                <LastUpdated date={rate.updated} loading={loading && !isRefreshing} t={t} onRefresh={refetch} cooldownRemaining={cooldownRemaining} />

                <Footer
                  onAboutClick={() => setIsAboutOpen(true)}
                  onSourcesClick={() => setIsSourcesOpen(true)}
                  onShareClick={handleShare}
                  shareFeedback={shareFeedback}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </main>

      <Dialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title={t.aboutDialogTitle} t={t}>
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line text-center">{t.aboutDialogContent}</p>
      </Dialog>
      
      <Dialog isOpen={isSourcesOpen} onClose={() => setIsSourcesOpen(false)} title={t.sourcesTitle} t={t}>
        <GroundingSources sources={sources} t={t} />
      </Dialog>
    </>
  );
}
