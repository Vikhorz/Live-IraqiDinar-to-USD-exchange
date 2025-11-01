
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExchangeRateData, GroundingChunk, ExchangeRateErrorType } from '../types';
import { GoogleGenAI } from "@google/genai";

const FETCH_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const EXCHANGE_RATE_URL = 'https://alanchand.com/en/exchange-rates/iqd-usd';

const CACHED_RATE_KEY = 'dinarLive_cachedRate';
const CACHED_SOURCES_KEY = 'dinarLive_cachedSources';
const REFRESH_COOLDOWN_KEY = 'dinarLive_refreshCooldown';


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
  const [isLoading, setIsLoading] = useState<boolean>(!rate); // Only true on initial load if no cache
  const [error, setError] = useState<ExchangeRateErrorType>(null);

  const [cooldownExpiry, setCooldownExpiry] = useState<number>(() => parseInt(localStorage.getItem(REFRESH_COOLDOWN_KEY) || '0', 10));
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  
  const hasInitialData = useRef(!!rate);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.ceil((cooldownExpiry - now) / 1000);
      setCooldownRemaining(remaining > 0 ? remaining : 0);
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [cooldownExpiry]);


  const fetchExchangeRate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `
        Provide the latest currency exchange rates for the following pairs. Use real-time data from reliable financial sources.
        1. The 'buy' exchange rate for 100 US Dollars (USD) to Iraqi Dinar (IQD) specifically from the website ${EXCHANGE_RATE_URL}. This value is typically found in a green-highlighted section on the page.
        2. The exchange rate for 1 Euro (EUR) to US Dollars (USD).
        3. The exchange rate for 1 US Dollar (USD) to Turkish Lira (TRY).
        
        Return ONLY a raw JSON object with no other text, explanation, or markdown formatting. The JSON object must have these exact keys: "iqdPer100Usd", "usdPerEur", "tryPerUsd".
        Example of a valid response: {"iqdPer100Usd": 147500, "usdPerEur": 1.08, "tryPerUsd": 32.5}
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

      // The IQD rate is mandatory.
      if (!parsedData.iqdPer100Usd || typeof parsedData.iqdPer100Usd !== 'number' || parsedData.iqdPer100Usd <= 0) {
        throw new Error('Parsed JSON data is missing or has an invalid "iqdPer100Usd" field.');
      }
      
      const iqdPerUsd = parsedData.iqdPer100Usd / 100;
      
      // Secondary rates are optional. Default to 0 if invalid or missing.
      const usdPerEur = (typeof parsedData.usdPerEur === 'number' && parsedData.usdPerEur > 0) ? parsedData.usdPerEur : 0;
      const tryPerUsd = (typeof parsedData.tryPerUsd === 'number' && parsedData.tryPerUsd > 0) ? parsedData.tryPerUsd : 0;

      const newRate: ExchangeRateData = {
        iqd: iqdPerUsd,
        usdPerEur: usdPerEur,
        tryPerUsd: tryPerUsd,
        updated: new Date().toISOString(),
      };

      const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] ?? [];
      const uniqueChunks = Array.from(new Map(groundingChunks.filter(item => item.web?.uri).map(item => [item.web!.uri, item])).values());

      setRate(newRate);
      setSources(uniqueChunks);
      hasInitialData.current = true;

      localStorage.setItem(CACHED_RATE_KEY, JSON.stringify(newRate));
      localStorage.setItem(CACHED_SOURCES_KEY, JSON.stringify(uniqueChunks));

    } catch (e: unknown) {
      console.error('Error fetching exchange rate:', e);
      if (e instanceof Error) {
        const message = e.message.toLowerCase();
        if (message.includes('api key not valid') || message.includes('api_key_invalid') || message.includes('requested entity was not found') || message.includes('quota')) {
          setError('API_KEY');
        } else if (message.includes('failed to fetch')) {
          setError('FETCH');
        } else if (message.includes('parsed') || e instanceof SyntaxError || message.includes('json')) {
          setError('PARSE');
        } else {
          setError('UNKNOWN');
        }
      } else {
        setError('UNKNOWN');
      }
      if (!hasInitialData.current) {
        setRate(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    const now = Date.now();
    const isCoolingDown = now < cooldownExpiry;
    
    if (isCoolingDown) {
      console.warn("Refresh action ignored due to active cooldown.");
      return;
    }
    
    const newExpiry = now + REFRESH_COOLDOWN_MS;
    localStorage.setItem(REFRESH_COOLDOWN_KEY, newExpiry.toString());
    setCooldownExpiry(newExpiry);
    
    await fetchExchangeRate();
  }, [cooldownExpiry, fetchExchangeRate]);


  useEffect(() => {
    // Don't fetch if there's fresh data from cache
    if (!rate) {
        fetchExchangeRate();
    }
    const intervalId = setInterval(fetchExchangeRate, FETCH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchExchangeRate, rate]);

  return {
    rate,
    sources,
    loading: isLoading,
    error,
    refetch,
    cooldownRemaining
  };
};
