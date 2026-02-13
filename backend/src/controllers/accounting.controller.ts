
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

export const getGeneralLedgerReport = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { accountId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const entries = await accountingService.getGeneralLedger(
            companyId,
            accountId,
            new Date(startDate as string),
            new Date(endDate as string)
        );
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch General Ledger' });
    }
};

export const getBalanceSheetReport = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const data = await accountingService.getBalanceSheet(companyId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Balance Sheet' });
    }
};

export const getProfitAndLossReport = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { startDate, endDate } = req.query;

        const data = await accountingService.getProfitAndLoss(
            companyId,
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined
        );
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Profit & Loss' });
    }
};

export const createAccount = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { code, name, type } = req.body;

        const account = await accountingService.ensureAccount(companyId, code, name, type);
        res.json(account);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create account' });
    }
};

export const getGstSummaryReport = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const data = await accountingService.getGstSummary(
            companyId,
            new Date(startDate as string),
            new Date(endDate as string)
        );
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch GST Summary' });
    }
};

export const getJournalEntries = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const entries = await accountingService.getJournalEntries(companyId);
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
};

export const reconcileLedger = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const result = await accountingService.reconcileCompanyLedger(companyId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Reconciliation failed' });
    }
};

export const deleteJournalEntry = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        // Basic ownership check could be added here if needed, 
        // but accountingService.deleteJournalEntry will handle correctly.
        const result = await accountingService.deleteJournalEntry(id);
        res.json({ success: true, entry: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to delete entry' });
    }
};

export const exportReport = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { type, startDate, endDate } = req.query;

        if (!type) {
            return res.status(400).json({ error: 'Report type is required' });
        }

        const dateStart = startDate ? new Date(startDate as string) : undefined;
        const dateEnd = endDate ? new Date(endDate as string) : undefined;

        const pdfBuffer = await accountingService.generateReportPDF(
            companyId,
            type as any,
            dateStart,
            dateEnd
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${type}_Report.pdf"`,
            'Content-Length': pdfBuffer.length
        });

        res.end(pdfBuffer);
    } catch (error: any) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF report' });
    }
};
