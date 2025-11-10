import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExchangeRateData, GroundingChunk, ExchangeRateErrorType, RateHistoryEntry } from '../types';
import { GoogleGenAI } from "@google/genai";

const FETCH_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const EXCHANGE_RATE_URL = 'https://alanchand.com/en/exchange-rates/iqd-usd';
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
      if (cooldownTimerRef.current) {
          clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
      }
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
        Analyze real-time financial data from reliable sources to extract currency exchange rates. Your primary goal is accuracy.

        **Primary Sources:**
        - For IQD, EUR, TRY, GBP: Use ${EXCHANGE_RATE_URL}.
        - For IRT (Iranian Toman): Prioritize data from bonbast.com. If unavailable, use another reliable source. Note: 1 Toman = 10 Iranian Rials (IRR). Ensure you provide the rate for Toman (IRT), not Rial (IRR).

        **Task:**
        Provide two sets of data in a single, raw JSON object response with no other text, explanation, or markdown.

        1.  **Current Rates**:
            - From ${EXCHANGE_RATE_URL}, find the 'buy' rate for 100 US Dollars (USD) to Iraqi Dinar (IQD). This is a critical value, often located in a 'buy' section or highlighted (e.g., in green). Please double-check this value for accuracy.
            - The exchange rate for 1 US Dollar (USD) to Euro (EUR).
            - The exchange rate for 1 US Dollar (USD) to Turkish Lira (TRY).
            - The exchange rate for 1 US Dollar (USD) to British Pound (GBP).
            - The exchange rate for 1 US Dollar (USD) to Iranian Toman (IRT).

        2.  **Historical Data**:
            - From ${EXCHANGE_RATE_URL}, extract the historical exchange rates for USD to IQD for the past 3 days. Look for a history table or list on the page.

        **JSON Output Format:**
        The JSON object must have these exact top-level keys: "current" and "history".
        - The "current" object must contain: "iqdPer100Usd", "eurPerUsd", "tryPerUsd", "gbpPerUsd", "irtPerUsd".
        - The "history" array must contain objects, each with "date" (in YYYY-MM-DDTHH:mm:ssZ ISO 8601 format) and "rate" (the value for 100 USD to IQD).
        
        Example of a valid response:
        {
          "current": {"iqdPer100Usd": 147500, "eurPerUsd": 0.92, "tryPerUsd": 32.5, "gbpPerUsd": 0.79, "irtPerUsd": 59000},
          "history": [
            {"date": "2023-10-27T10:00:00Z", "rate": 147250},
            {"date": "2023-10-26T18:00:00Z", "rate": 147000}
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

      const rawText = response.text.trim();
      const jsonStartIndex = rawText.indexOf('{');
      const jsonEndIndex = rawText.lastIndexOf('}');

      if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonEndIndex < jsonStartIndex) {
        throw new Error('No valid JSON object found in the response.');
      }

      const jsonStr = rawText.substring(jsonStartIndex, jsonEndIndex + 1);
      const parsedData = JSON.parse(jsonStr);

      if (!parsedData.current?.iqdPer100Usd || typeof parsedData.current.iqdPer100Usd !== 'number' || parsedData.current.iqdPer100Usd <= 0) {
        throw new Error('Parsed JSON data is missing or has an invalid "iqdPer100Usd" field.');
      }
      
      const iqdPerUsd = parsedData.current.iqdPer100Usd / 100;
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
      console.error(`Error fetching exchange rate (Attempt ${retryCount.current + 1}):`, e);
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