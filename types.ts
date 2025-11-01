export interface ExchangeRateData {
  iqd: number; // IQD per USD
  usdPerEur: number; // USD per EUR
  tryPerUsd: number; // TRY per USD
  updated: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export type ExchangeRateErrorType = 'API_KEY' | 'FETCH' | 'PARSE' | 'UNKNOWN' | null;

export interface Translation {
  appName: string;
  headerTitle: string;
  headerSubtitle: string;
  marketRateLabel: string;
  marketRateDescription: string;
  centralBankRateLabel: string;
  centralBankRateDescription: string;
  iqdCurrency: string;
  errorFetching: string;
  errorFetchingOtherRates: string;
  fetchingRates: string;
  updated: string;
  justNow: string;
  secondsAgo: (seconds: number) => string;
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
  invalidRateInputError: string;
  retryButton: string;
  comparisonRatesTitle: string;
  eurToIqd: string;
  tryToIqd: string;
  tryRateDescription: string;
  eurRateDescription: string;
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
  loadingAppData: string;
  pullToRefresh: string;
  apiKeyError: string;
  fetchError: string;
  parseError: string;
  unknownError: string;
  refreshOnCooldown: (time: string) => string;
}