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
import { ChatFab } from './components/ChatFab';
import { ChatDialog } from './components/ChatDialog';
import { RateHistoryChart } from './components/RateHistoryChart';
import { RateHistoryChartSkeleton } from './components/RateHistoryChartSkeleton';

// Official Central Bank of Iraq rate for cash sales to the public: 1 USD = 1310 IQD
const CENTRAL_BANK_RATE = 1310;

const staticSources = [
    { web: { uri: 'https://alanchand.com/en/exchange-rates/iqd-usd', title: 'Alanchand Exchange' } },
    { web: { uri: 'https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=IQD', title: 'XE Currency Converter' } },
    { web: { uri: 'https://www.tradingview.com/symbols/USDIQD/', title: 'TradingView' } },
    { web: { uri: 'https://wise.com/gb/currency-converter/usd-to-iqd-rate', title: 'Wise' } },
];

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);


export default function App(): React.ReactElement {
  const { rate, sources, loading, error, refetch, rateHistory, cooldownSeconds } = useExchangeRate();
  
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(true);
  const [language, setLanguage] = useLanguage();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const t = translations[language];

  const iqdRateValue = useMemo(() => rate?.iqd ?? 0, [rate]);
  const eurPerUsdValue = useMemo(() => rate?.eurPerUsd ?? 0, [rate]);
  const tryPerUsdValue = useMemo(() => rate?.tryPerUsd ?? 0, [rate]);
  const gbpPerUsdValue = useMemo(() => rate?.gbpPerUsd ?? 0, [rate]);
  const irtPerUsdValue = useMemo(() => rate?.irtPerUsd ?? 0, [rate]);
  const rateForDisplay = useMemo(() => iqdRateValue * 100, [iqdRateValue]);
  const centralBankRateForDisplay = useMemo(() => CENTRAL_BANK_RATE * 100, []);
  
  const isInitialLoading = loading && !rate && !error;
  const showFullScreenLoader = isInitialLoading || isManualRefreshing;
  
  const handleManualRefresh = async () => {
    if (loading || cooldownSeconds > 0) return;
    setIsManualRefreshing(true);
    try {
        await refetch();
    } finally {
        setIsManualRefreshing(false);
    }
  };
  
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
      {showFullScreenLoader && <StartupLoader t={t} />}

      <div className={`min-h-screen w-full transition-filter duration-500 ${showFullScreenLoader ? 'blur-sm' : ''}`}>
        <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <header className="flex justify-between items-center mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
                <img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3ccircle cx='50' cy='50' r='48' fill='%23FBBF24' stroke='%23B45309' stroke-width='4'/%3e%3ctext x='50' y='60' font-family='Noto Kufi Arabic, sans-serif' font-size='40' font-weight='bold' fill='%23B45309' text-anchor='middle'%3eد.ع%3c/text%3e%3c/svg%3e" alt="DinarLive Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white tracking-tight">{t.appName}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <LanguageSelector currentLang={language} onChangeLang={setLanguage} />
            </div>
          </header>

          {error && (
            <div className="my-6 text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-6 rounded-2xl transition-colors duration-300 animate-fade-in max-w-2xl mx-auto shadow-lg">
                <p className="text-lg font-semibold">{t.errorAfterRetriesTitle}</p>
                <p className="mt-2">{t.errorAfterRetriesMessage}</p>
                <button
                    onClick={() => refetch()}
                    className="mt-6 px-6 py-2.5 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                    {t.retryButton}
                </button>
            </div>
          )}

          {!error && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 sm:p-6">
                    <Header t={t} />
                    {(loading && !rate) ? (
                        <div className="mt-6 space-y-4">
                            <RateDisplaySkeleton />
                            <RateDisplaySkeleton />
                        </div>
                    ) : rate && (
                        <div className="mt-6 space-y-4 animate-fade-in">
                            <RateDisplay
                            value={rateForDisplay}
                            loading={loading}
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
                    )}
                </div>
                
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 sm:p-6">
                    {(loading && !rate) ? (
                        <ComparisonRatesSkeleton />
                    ) : rate && (
                        <ComparisonRates 
                            iqdRate={iqdRateValue}
                            eurRate={eurPerUsdValue}
                            tryRate={tryPerUsdValue}
                            gbpRate={gbpPerUsdValue}
                            irtRate={irtPerUsdValue}
                            t={t}
                        />
                    )}
                </div>

                {rate && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 sm:p-6 animate-fade-in">
                        <LastUpdated 
                            date={rate.updated} 
                            loading={loading} 
                            t={t} 
                            onRefresh={handleManualRefresh}
                            cooldownSeconds={cooldownSeconds}
                        />
                        <Footer
                            onAboutClick={() => setIsAboutOpen(true)}
                            onSourcesClick={() => setIsSourcesOpen(true)}
                            onShareClick={handleShare}
                            shareFeedback={shareFeedback}
                            t={t}
                        />
                    </div>
                )}
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 sm:p-6">
                    <button
                        onClick={() => setIsChartOpen(prev => !prev)}
                        className="w-full flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        aria-expanded={isChartOpen}
                        aria-controls="chart-content"
                    >
                        <h2 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-200">{t.rateHistoryTitle}</h2>
                        <ChevronIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isChartOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div
                        id="chart-content"
                        className={`transition-all duration-500 ease-in-out overflow-hidden ${isChartOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                    >
                        {(loading && rateHistory.length === 0) ? (
                            <RateHistoryChartSkeleton />
                        ) : (
                            <RateHistoryChart history={rateHistory} t={t} />
                        )}
                    </div>
                </div>

                {rate && (
                    <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-5 sm:p-6 animate-fade-in">
                        <button
                            onClick={() => setIsCalculatorOpen(prev => !prev)}
                            className="w-full flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                            aria-expanded={isCalculatorOpen}
                            aria-controls="calculator-content"
                        >
                            <h2 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-200">{t.calculatorTitle}</h2>
                            <ChevronIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isCalculatorOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div
                            id="calculator-content"
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${isCalculatorOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                        >
                            <Calculator rates={{
                            IQD: iqdRateValue,
                            USD: 1,
                            EUR: eurPerUsdValue,
                            TRY: tryPerUsdValue,
                            GBP: gbpPerUsdValue,
                            IRT: irtPerUsdValue,
                            }} t={t} />
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title={t.aboutDialogTitle} t={t}>
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line text-center">{t.aboutDialogContent}</p>
      </Dialog>
      
      <Dialog isOpen={isSourcesOpen} onClose={() => setIsSourcesOpen(false)} title={t.sourcesTitle} t={t}>
        <GroundingSources sources={sources.length > 0 ? sources : staticSources} t={t} />
      </Dialog>

      {!isInitialLoading && (
        <>
            <ChatFab onClick={() => setIsChatOpen(true)} />
            <ChatDialog isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} rate={rate} t={t} />
        </>
      )}
    </>
  );
}