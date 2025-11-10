export interface ExchangeRateData {
  iqd: number; // IQD per USD
  eurPerUsd: number; // EUR per USD
  tryPerUsd: number; // TRY per USD
  gbpPerUsd: number; // GBP per USD
  irtPerUsd: number; // IRT (Toman) per USD
  updated: string;
}

export interface RateHistoryEntry {
    date: string; // ISO 8601 string
    rate: number; // IQD per 100 USD
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export type ExchangeRateErrorType = 'FAILED_AFTER_RETRIES' | null;

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Translation {
  [key: string]: any; // Allow indexing with string for error messages
  appName: string;
  headerTitle: string;
  headerSubtitle: string;
  marketRateLabel: string;
  marketRateDescription: string;
  centralBankRateLabel: string;
  centralBankRateDescription:string;
  iqdCurrency: string;
  errorFetching: string;
  errorFetchingOtherRates: string;
  fetchingRates: string;
  updated: string;
  justNow: string;
  secondsAgo: (seconds: number) => string;
  minutesAgo: (minutes: number) => string;
  hoursAgo: (hours: number) => string;
  calculatorTitle: string;
  amountPlaceholder: string;
  amount: string;
  from: string;
  to: string;
  result: string;
  usd: string;
  iqd: string;
  eur: string;
  try: string;
  gbp: string;
  irt: string;
  invalidRateInputError: string;
  retryButton: string;
  comparisonRatesTitle: string;
  eurToIqd: string;
  tryToIqd: string;
  gbpToIqd: string;
  irtToIqd: string;
  tryRateDescription: string;
  eurRateDescription: string;
  gbpRateDescription: string;
  // FIX: Corrected a typo from 'irrRateDescription' to 'irtRateDescription' to match its usage for Iranian Toman.
  irtRateDescription: string;
  updatingRates: string;
  sourcesTitle: string;
  aboutButton: string;
  sourcesButton: string;
  shareButton: string;
  aboutDialogTitle: string;
  aboutDialogContent: string;
  shareMessage: (marketRate: string, centralBankRate: string) => string;
  copiedToClipboard: string;
  closeButton: string;
  loadingTitle: string;
  loadingSubtitle: string;
  pullToRefresh: string;
  errorAfterRetriesTitle: string;
  errorAfterRetriesMessage: string;
  // Chat feature translations
  chatTitle: string;
  chatWelcomeMessage: string;
  chatInputPlaceholder: string;
  sendButton: string;
  assistantTyping: string;
  // Rate History and Cooldown
  rateHistoryTitle: string;
  noHistoryData: string;
  refreshCooldown: (time: string) => string;
  // Calculator Tooltips
  usdTooltip: string;
  iqdTooltip: string;
  eurTooltip: string;
  tryTooltip: string;
  gbpTooltip: string;
  irtTooltip: string;
  resultTooltip: string;
}