import db from '@/config/database';
import axios from 'axios';
import { CRYPTO_CURRENCIES, FIAT_CURRENCIES, CRYPTO_CONFIG } from '@/constants';

interface CoinGeckoPriceResponse {
  [key: string]: {
    [key: string]: number;
  };
}

export const getExchangeRate = async (
  cryptoCurrency: string,
  fiatCurrency: string = CRYPTO_CONFIG.DEFAULT_FIAT_CURRENCY
): Promise<number> => {
  const now = new Date();
  const cacheCutoff = new Date(now.getTime() - CRYPTO_CONFIG.RATE_CACHE_TTL_SECONDS * 1000);

  const cachedRate = await db('crypto_exchange_rates')
    .where({
      currency: cryptoCurrency.toUpperCase(),
      fiat_currency: fiatCurrency.toUpperCase(),
    })
    .where('created_at', '>=', cacheCutoff)
    .orderBy('created_at', 'desc')
    .first();

  if (cachedRate) {
    return parseFloat(cachedRate.rate);
  }

  const rate = await fetchExchangeRateFromAPI(cryptoCurrency, fiatCurrency);

  await db('crypto_exchange_rates').insert({
    currency: cryptoCurrency.toUpperCase(),
    fiat_currency: fiatCurrency.toUpperCase(),
    rate,
    source: 'coingecko',
    created_at: now,
  });

  return rate;
};

const fetchExchangeRateFromAPI = async (
  cryptoCurrency: string,
  fiatCurrency: string
): Promise<number> => {
  try {
    const coinId = getCoinGeckoId(cryptoCurrency);
    const response = await axios.get<CoinGeckoPriceResponse>(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: coinId,
          vs_currencies: fiatCurrency.toLowerCase(),
        },
        timeout: 5000,
      }
    );

    if (response.data[coinId] && response.data[coinId][fiatCurrency.toLowerCase()]) {
      return response.data[coinId][fiatCurrency.toLowerCase()];
    }

    throw new Error('Invalid response from exchange rate API');
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return getFallbackRate(cryptoCurrency, fiatCurrency);
  }
};

const getCoinGeckoId = (currency: string): string => {
  const coinMap: Record<string, string> = {
    [CRYPTO_CURRENCIES.BTC]: 'bitcoin',
    [CRYPTO_CURRENCIES.ETH]: 'ethereum',
    [CRYPTO_CURRENCIES.USDT]: 'tether',
    [CRYPTO_CURRENCIES.BCH]: 'bitcoin-cash',
    [CRYPTO_CURRENCIES.LTC]: 'litecoin',
  };
  return coinMap[currency.toUpperCase()] || currency.toLowerCase();
};

const getFallbackRate = (cryptoCurrency: string, fiatCurrency: string): number => {
  const fallbackRates: Record<string, Record<string, number>> = {
    [CRYPTO_CURRENCIES.BTC]: { USD: 65000, EUR: 60000, CNY: 470000, GBP: 52000, JPY: 9750000 },
    [CRYPTO_CURRENCIES.ETH]: { USD: 3500, EUR: 3230, CNY: 25300, GBP: 2800, JPY: 525000 },
    [CRYPTO_CURRENCIES.USDT]: { USD: 1, EUR: 0.92, CNY: 7.23, GBP: 0.80, JPY: 150 },
    [CRYPTO_CURRENCIES.BCH]: { USD: 450, EUR: 415, CNY: 3250, GBP: 360, JPY: 67500 },
    [CRYPTO_CURRENCIES.LTC]: { USD: 80, EUR: 74, CNY: 580, GBP: 64, JPY: 12000 },
  };

  const currency = cryptoCurrency.toUpperCase();
  const fiat = fiatCurrency.toUpperCase();

  if (fallbackRates[currency] && fallbackRates[currency][fiat]) {
    return fallbackRates[currency][fiat];
  }

  if (fallbackRates[currency] && fallbackRates[currency].USD) {
    return fallbackRates[currency].USD;
  }

  return 1;
};

export const convertFiatToCrypto = async (
  fiatAmount: number,
  cryptoCurrency: string,
  fiatCurrency: string = CRYPTO_CONFIG.DEFAULT_FIAT_CURRENCY
): Promise<number> => {
  const rate = await getExchangeRate(cryptoCurrency, fiatCurrency);
  return fiatAmount / rate;
};

export const convertCryptoToFiat = async (
  cryptoAmount: number,
  cryptoCurrency: string,
  fiatCurrency: string = CRYPTO_CONFIG.DEFAULT_FIAT_CURRENCY
): Promise<number> => {
  const rate = await getExchangeRate(cryptoCurrency, fiatCurrency);
  return cryptoAmount * rate;
};

export const getAllExchangeRates = async (
  fiatCurrency: string = CRYPTO_CONFIG.DEFAULT_FIAT_CURRENCY
): Promise<{ [key: string]: number }> => {
  const rates: { [key: string]: number } = {};
  const currencies = Object.values(CRYPTO_CURRENCIES);

  for (const currency of currencies) {
    try {
      rates[currency] = await getExchangeRate(currency, fiatCurrency);
    } catch (error) {
      console.error(`Error getting rate for ${currency}:`, error);
    }
  }

  return rates;
};
