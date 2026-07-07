import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class CurrencyService {
  /**
   * Get the exchange rate for a given currency pair on a specific date.
   * If not found in database, it fetches from external API and caches it.
   */
  static async getRate(
    baseCurrency: string,
    targetCurrency: string,
    dateInput: Date = new Date()
  ): Promise<number> {
    const base = baseCurrency.toUpperCase().trim();
    const target = targetCurrency.toUpperCase().trim();

    if (base === target) {
      return 1.0;
    }

    // Standardize to YYYY-MM-DD date at midnight
    const date = new Date(dateInput);
    date.setUTCHours(0, 0, 0, 0);

    try {
      // 1. Try finding in DB
      const dbRate = await prisma.exchangeRate.findFirst({
        where: {
          baseCurrency: base,
          targetCurrency: target,
          date: date,
        },
      });

      if (dbRate) {
        return Number(dbRate.rate);
      }

      // 2. If not found in DB for that specific date, try syncing latest rates
      await this.syncRatesFromApi(base);

      // 3. Try finding in DB again
      const updatedRate = await prisma.exchangeRate.findFirst({
        where: {
          baseCurrency: base,
          targetCurrency: target,
          date: date,
        },
      });

      if (updatedRate) {
        return Number(updatedRate.rate);
      }

      // 4. Fallback: Find the most recent rate available in DB
      const latestDbRate = await prisma.exchangeRate.findFirst({
        where: {
          baseCurrency: base,
          targetCurrency: target,
        },
        orderBy: {
          date: 'desc',
        },
      });

      if (latestDbRate) {
        return Number(latestDbRate.rate);
      }

      return 1.0; // Fail-safe default
    } catch (error) {
      console.error(`[CurrencyService] Error fetching rate for ${base} -> ${target}:`, error);
      return 1.0;
    }
  }

  /**
   * Convert an amount between two currencies.
   */
  static async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date = new Date()
  ): Promise<{ convertedAmount: number; rate: number }> {
    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();

    if (from === to) {
      return { convertedAmount: amount, rate: 1.0 };
    }

    const rate = await this.getRate(from, to, date);
    const convertedAmount = Math.round(amount * rate * 100) / 100;

    return { convertedAmount, rate };
  }

  /**
   * Sync rates from public API for a given base currency.
   * Caches rates in the database.
   */
  static async syncRatesFromApi(baseCurrency: string): Promise<void> {
    const base = baseCurrency.toUpperCase().trim();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    try {
      // open.er-api.com is free, requires no API key, and is highly available.
      const url = `https://open.er-api.com/v6/latest/${base}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        result: string;
        rates: Record<string, number>;
        time_last_update_utc?: string;
      };

      if (data.result !== 'success' || !data.rates) {
        throw new Error('Invalid response structure from exchange rate API');
      }

      const rates = data.rates;
      const rateDate = data.time_last_update_utc ? new Date(data.time_last_update_utc) : today;
      rateDate.setUTCHours(0, 0, 0, 0);

      // Perform batch upsert
      const upsertPromises = Object.entries(rates).map(([target, rate]) => {
        const targetUpper = target.toUpperCase().trim();
        return prisma.exchangeRate.upsert({
          where: {
            baseCurrency_targetCurrency_date: {
              baseCurrency: base,
              targetCurrency: targetUpper,
              date: rateDate,
            },
          },
          update: {
            rate: new Prisma.Decimal(rate),
          },
          create: {
            baseCurrency: base,
            targetCurrency: targetUpper,
            rate: new Prisma.Decimal(rate),
            date: rateDate,
            source: 'api',
          },
        });
      });

      // Execute in batch/chunks to avoid Postgres connection overload
      await Promise.all(upsertPromises);
      console.log(`[CurrencyService] Successfully synced exchange rates for base: ${base}`);
    } catch (error) {
      console.error(`[CurrencyService] Failed to sync rates for base: ${base}`, error);
    }
  }
}
