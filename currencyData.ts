import type { Translation } from './types';

export interface CurrencyDetails {
    name: (t: Translation) => string;
    iso: string;
    description: (t: Translation) => string;
    fact: (t: Translation) => string;
}

export const currencyData: Record<string, CurrencyDetails> = {
    USD: {
        name: t => t.usd_name,
        iso: 'USD',
        description: t => t.usd_description,
        fact: t => t.usd_fact,
    },
    IQD: {
        name: t => t.iqd_name,
        iso: 'IQD',
        description: t => t.iqd_description,
        fact: t => t.iqd_fact,
    },
    EUR: {
        name: t => t.eur_name,
        iso: 'EUR',
        description: t => t.eur_description,
        fact: t => t.eur_fact,
    },
    TRY: {
        name: t => t.try_name,
        iso: 'TRY',
        description: t => t.try_description,
        fact: t => t.try_fact,
    },
    GBP: {
        name: t => t.gbp_name,
        iso: 'GBP',
        description: t => t.gbp_description,
        fact: t => t.gbp_fact,
    },
    IRT: {
        name: t => t.irt_name,
        iso: 'IRT',
        description: t => t.irt_description,
        fact: t => t.irt_fact,
    },
};
