
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExchangeRateData, GroundingChunk, ExchangeRateErrorType, RateHistoryEntry } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const FETCH_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const CACHED_RATE_KEY = 'dinarLive_cachedRate';
const CACHED_SOURCES_KEY = 'dinarLive_cachedSources';
const CACHED_HISTORY_KEY = 'dinarLive_cachedHistory';
const LAST_REFRESH_KEY = 'dinarLive_lastRefresh';


const getInitialState = <T,>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        return null;
    }
};

export const useExchangeRate = () => {
  const [rate, setRate] = useState<ExchangeRateData | null>(() => getInitialState<ExchangeRateData>(CACHED_RATE_KEY));
  const [sources, setSources] = useState<GroundingChunk[]>(() => getInitialState<GroundingChunk[]>(CACHED_SOURCES_KEY) || []);
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>(() => getInitialState<RateHistoryEntry[]>(CACHED_HISTORY_KEY) || []);
  const [isLoading, setIsLoading] = useState<boolean>(!rate);
  const [error, setError] = useState<ExchangeRateErrorType>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  const retryCount = useRef(0);
  const hasInitialData = useRef(!!rate);
  const cooldownTimerRef = useRef<number | null>(null);

  const updateCooldown = useCallback(() => {
    const lastRefreshTime = getInitialState<number>(LAST_REFRESH_KEY);
    if (!lastRefreshTime) {
      setCooldownSeconds(0);
      return;
    }
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    const remainingCooldown = REFRESH_COOLDOWN_MS - timeSinceLastRefresh;

    if (remainingCooldown > 0) {
      setCooldownSeconds(Math.ceil(remainingCooldown / 1000));
    } else {
      setCooldownSeconds(0);
    }
  }, []);

  useEffect(() => {
    updateCooldown();
    cooldownTimerRef.current = window.setInterval(updateCooldown, 1000);
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [updateCooldown]);

  const fetchExchangeRate = useCallback(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `
        You are an expert financial data extraction bot. Your sole function is to visit specific webpages, extract currency exchange data, and return it in a raw JSON format. You MUST NOT use any APIs or cached knowledge. You MUST visit the URLs provided and parse their content. The entire response must be ONLY the JSON object, without any introductory text, markdown, or explanations.

        **ACTION 1: Get Iraqi Dinar (IQD) rate from Alanchand**
        - **URL**: Browse to \`https://alanchand.com/en/exchange-rates/iqd-usd\`.
        - **Find the Table**: Locate the main exchange rate table on the page. It is often under a heading like "Exchange Rates For Iraqi Dinar - IQD".
        - **Find the Row**: In that table, find the row for "USD - United States Dollar".
        - **Extract the Value**: From that exact row, get the number from the "Buy" column.
        - **Verification**: This number represents the rate for 100 USD to IQD and should be above 135,000.
        - **JSON field**: Put this number into the \`iqdPer100Usd\` field. If you cannot find a valid number after a thorough search of the page's content, you MUST use \`0\`.

        **ACTION 2: Get Iranian Toman (IRT) rate from Bonbast**
        - **URL**: Browse to \`https://bonbast.com\`.
        - **Find the Table**: Locate the main table of exchange rates.
        - **Find the Row**: In that table, find the row for the "US Dollar".
        - **Extract the Value**: From that exact row, get the number from the "Sell" column.
        - **Verification**: This number is the rate for 1 USD to IRT.
        - **JSON field**: Put this number into the \`irtPerUsd\` field. If you cannot find it, you MUST use \`0\`.

        **ACTION 3: Get rates for EUR, TRY, GBP**
        - **Method**: Use a general web search to find the current exchange rates.
        - **Required Rates**:
          - How many EUR for 1 USD?
          - How many TRY for 1 USD?
          - How many GBP for 1 USD?
        - **JSON fields**: Put these values into \`eurPerUsd\`, \`tryPerUsd\`, and \`gbpPerUsd\` respectively. If a rate is not found, use \`0\`.

        **ACTION 4: Get IQD History from Alanchand**
        - **URL**: Use the same Alanchand URL from ACTION 1.
        - **Find the Table**: Find the history table, usually titled "Last 7 Days Exchange Rate History USD to IQD".
        - **Extract Data**: From this table, extract the 'Date' and the rate ('100 USD = IQD' column) for the three most recent, unique dates.
        - **Format**: Dates must be "YYYY-MM-DD".
        - **JSON field**: Put this data as an array of objects into the \`history\` field. If you cannot find the table, return an empty array \`[]\`.

        **FINAL JSON OUTPUT STRUCTURE (RAW JSON ONLY):**
        {
          "current": {
            "iqdPer100Usd": <number | 0>,
            "eurPerUsd": <number | 0>,
            "tryPerUsd": <number | 0>,
            "gbpPerUsd": <number | 0>,
            "irtPerUsd": <number | 0>
          },
          "history": [
            { "date": "YYYY-MM-DD", "rate": <number> }
          ]
        }
      `;
    
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text;
      // Use a regex to find a JSON object within the response text.
      // This is more robust against conversational text or markdown.
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error(`Could not find a valid JSON object in the API response. Response was: "${rawText}"`);
      }
      
      const jsonStr = jsonMatch[0];
      const parsedData = JSON.parse(jsonStr);
      
      const iqdRateFromApi = parsedData.current?.iqdPer100Usd;
      // Stricter validation: Check if the rate is within a plausible market range.
      // The prompt instructs the model to return 0 if it can't find a valid rate.
      if (!iqdRateFromApi || typeof iqdRateFromApi !== 'number' || iqdRateFromApi < 135000) {
        throw new Error(`Invalid or out-of-range IQD rate received from API: ${iqdRateFromApi}`);
      }
      
      const iqdPerUsd = iqdRateFromApi / 100;
      const eurPerUsd = (typeof parsedData.current.eurPerUsd === 'number' && parsedData.current.eurPerUsd > 0) ? parsedData.current.eurPerUsd : 0;
      const tryPerUsd = (typeof parsedData.current.tryPerUsd === 'number' && parsedData.current.tryPerUsd > 0) ? parsedData.current.tryPerUsd : 0;
      const gbpPerUsd = (typeof parsedData.current.gbpPerUsd === 'number' && parsedData.current.gbpPerUsd > 0) ? parsedData.current.gbpPerUsd : 0;
      const irtPerUsd = (typeof parsedData.current.irtPerUsd === 'number' && parsedData.current.irtPerUsd > 0) ? parsedData.current.irtPerUsd : 0;

      const newRate: ExchangeRateData = {
        iqd: iqdPerUsd,
        eurPerUsd: eurPerUsd,
        tryPerUsd: tryPerUsd,
        gbpPerUsd: gbpPerUsd,
        irtPerUsd: irtPerUsd,
        updated: new Date().toISOString(),
      };
      
      const newHistory: RateHistoryEntry[] = Array.isArray(parsedData.history) ? parsedData.history.filter(
          (item: any) => typeof item.date === 'string' && typeof item.rate === 'number'
        ).sort((a: RateHistoryEntry, b: RateHistoryEntry) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

      const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] ?? [];
      const uniqueChunks = Array.from(new Map(groundingChunks.filter(item => item.web?.uri).map(item => [item.web!.uri, item])).values());

      setRate(newRate);
      setSources(uniqueChunks);
      setRateHistory(newHistory);
      
      hasInitialData.current = true;
      localStorage.setItem(CACHED_RATE_KEY, JSON.stringify(newRate));
      localStorage.setItem(CACHED_SOURCES_KEY, JSON.stringify(uniqueChunks));
      localStorage.setItem(CACHED_HISTORY_KEY, JSON.stringify(newHistory));

      retryCount.current = 0;
      setError(null);
      setIsLoading(false);

    } catch (e: unknown) {
      console.error(`Error fetching exchange rate (Attempt ${retryCount.current + 1}):`, (e as Error).message);
      retryCount.current++;

      if (retryCount.current < MAX_RETRIES) {
        setTimeout(fetchExchangeRate, RETRY_DELAY_MS);
      } else {
        setError('FAILED_AFTER_RETRIES');
        if (!hasInitialData.current) {
          setRate(null);
          setRateHistory([]);
        }
        setIsLoading(false);
      }
    }
  }, []);

  const startFetchCycle = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      const lastRefreshTime = getInitialState<number>(LAST_REFRESH_KEY);
      if (lastRefreshTime && (Date.now() - lastRefreshTime < REFRESH_COOLDOWN_MS)) {
        console.log("Refresh skipped due to cooldown.");
        updateCooldown(); // Ensure timer is accurate
        return;
      }
      localStorage.setItem(LAST_REFRESH_KEY, JSON.stringify(Date.now()));
      updateCooldown();
    }
    
    retryCount.current = 0;
    setIsLoading(true);
    setError(null);
    await fetchExchangeRate();
  }, [fetchExchangeRate, updateCooldown]);

  useEffect(() => {
    if (!rate) {
      startFetchCycle(false);
    }
    const intervalId = setInterval(() => startFetchCycle(false), FETCH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [startFetchCycle, rate]);

  return {
    rate,
    sources,
    loading: isLoading,
    error,
    refetch: () => startFetchCycle(true),
    rateHistory,
    cooldownSeconds,
  };
};
