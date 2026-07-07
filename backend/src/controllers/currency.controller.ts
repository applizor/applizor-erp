import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CurrencyService } from '../services/currency.service';
import prisma from '../prisma/client';

export const listCurrencies = async (req: AuthRequest, res: Response) => {
  try {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
    return res.json(currencies);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch currencies' });
  }
};

export const getRates = async (req: AuthRequest, res: Response) => {
  try {
    const { base } = req.query;
    const baseCurrency = (base as string || 'USD').toUpperCase().trim();

    const rates = await prisma.exchangeRate.findMany({
      where: {
        baseCurrency,
      },
      orderBy: [
        { date: 'desc' },
        { targetCurrency: 'asc' }
      ],
      take: 200, // Limit to recent rates to keep it performant
    });

    return res.json(rates);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
};

export const convertAmount = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, from, to, date } = req.body;

    if (amount === undefined || !from || !to) {
      return res.status(400).json({ error: 'Amount, from, and to are required' });
    }

    const conversionDate = date ? new Date(date) : new Date();
    const result = await CurrencyService.convert(Number(amount), from, to, conversionDate);

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to convert currency' });
  }
};

export const syncRates = async (req: AuthRequest, res: Response) => {
  try {
    const { base } = req.body;
    
    // Fallback to company base currency, or USD
    let baseCurrency = base as string;
    if (!baseCurrency && req.user?.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: req.user.companyId },
        select: { currency: true }
      });
      baseCurrency = company?.currency || 'USD';
    } else if (!baseCurrency) {
      baseCurrency = 'USD';
    }

    await CurrencyService.syncRatesFromApi(baseCurrency);
    return res.json({ success: true, message: `Successfully synchronized rates for base currency ${baseCurrency}` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to synchronize exchange rates' });
  }
};
