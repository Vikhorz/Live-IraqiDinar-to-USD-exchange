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
  const [loading, setLoading] = useState<boolean>(!rate); // Only true on initial load if no cache
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
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const generateNumericRate = async (prompt: string): Promise<{ value: number; chunks: GroundingChunk[] }> => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const modelTextResponse = response.text;
        const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] ?? [];

        if (!modelTextResponse) {
          throw new Error(`Model did not return a valid response for prompt: "${prompt}"`);
        }

        const cleanedRateText = modelTextResponse.trim().replace(/,/g, '');
        const numericValue = parseFloat(cleanedRateText);

        if (isNaN(numericValue) || numericValue <= 0) {
          throw new Error(`Parsed rate is invalid: '${modelTextResponse}' for prompt: "${prompt}"`);
        }

        return { value: numericValue, chunks: groundingChunks };
      };

      const iqdPrompt = `What is the current 'buy' exchange rate for 100 USD to IQD from the website ${EXCHANGE_RATE_URL}?
                         Provide ONLY the numerical value of the rate, as a whole number, without any additional text,
                         currency symbols, or formatting (like commas). The value is typically found in a green-highlighted
                         section on the page, representing the buy rate for 100 USD.`;

      const eurPrompt = `What is the current exchange rate for 1 EUR to USD? Provide ONLY the numerical value, like '1.08'.`;
      const tryPrompt = `What is the current exchange rate for 1 USD to TRY? Provide ONLY the numerical value, like '32.75'.`;

      const [iqdResult, eurResult, tryResult] = await Promise.all([
        generateNumericRate(iqdPrompt),
        generateNumericRate(eurPrompt),
        generateNumericRate(tryPrompt),
      ]);

      const allChunks = [...(iqdResult.chunks ?? []), ...(eurResult.chunks ?? []), ...(tryResult.chunks ?? [])];
      const uniqueChunks = Array.from(new Map(allChunks.filter(item => item.web?.uri).map(item => [item.web!.uri, item])).values());
      
      const iqdPerUsd = iqdResult.value / 100;

      const newRate: ExchangeRateData = {
        iqd: iqdPerUsd,
        usdPerEur: eurResult.value,
        tryPerUsd: tryResult.value,
        updated: new Date().toISOString(),
      };

      setRate(newRate);
      setSources(uniqueChunks);
      hasInitialData.current = true;

      localStorage.setItem(CACHED_RATE_KEY, JSON.stringify(newRate));
      localStorage.setItem(CACHED_SOURCES_KEY, JSON.stringify(uniqueChunks));

    } catch (e: unknown) {
      console.error('Error fetching exchange rate:', e);
      if (e instanceof Error) {
        const message = e.message.toLowerCase();
        if (message.includes('api key not valid') || message.includes('api_key_invalid')) {
          setError('API_KEY');
        } else if (message.includes('failed to fetch')) {
          setError('FETCH');
        } else if (message.includes('parsed rate is invalid')) {
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
      setLoading(false);
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
    fetchExchangeRate();
    const intervalId = setInterval(fetchExchangeRate, FETCH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchExchangeRate]);

  return {
    rate,
    sources,
    loading,
    error,
    refetch,
    cooldownRemaining
  };
};