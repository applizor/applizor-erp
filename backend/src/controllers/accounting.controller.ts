
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import accountingService from '../services/accounting.service';

export const getChartOfAccounts = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        // Lazy seed
        await accountingService.seedAccounts(companyId);

        const accounts = await accountingService.getTrialBalance(companyId);
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
};

export const createManualEntry = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { date, description, reference, lines } = req.body;

        const entry = await accountingService.createJournalEntry(
            companyId,
            new Date(date),
            description,
            reference,
            lines,
            true // Auto-post manual entries for now
        );

        res.json(entry);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to create entry' });
    }
};
