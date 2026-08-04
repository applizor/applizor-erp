import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import accountingService from '../services/accounting.service';

export const getReconciliationReport = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { accountId, asOn } = req.query;
        const asOnDate = asOn ? new Date(asOn as string) : new Date();

        const account = await prisma.ledgerAccount.findUnique({
            where: { id: accountId as string }
        });
        if (!account || account.companyId !== companyId) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const entries = await prisma.journalEntryLine.findMany({
            where: {
                accountId: account.id,
                journalEntry: {
                    companyId,
                    date: { lte: asOnDate },
                    status: 'posted'
                }
            },
            include: {
                journalEntry: { select: { date: true, description: true, reference: true } }
            },
            orderBy: { journalEntry: { date: 'asc' } }
        });

        const balance = (entries as any[]).reduce((sum: number, line: any) => sum + Number(line.debit) - Number(line.credit), 0);
        const unreconciled = entries.filter(e => !e.reconciledAt);

        res.json({
            account: { id: account.id, code: account.code, name: account.name },
            asOn: asOnDate,
            balance,
            totalEntries: entries.length,
            unreconciledCount: unreconciled.length,
            entries: entries.slice(-50),
            unreconciledEntries: unreconciled.slice(-20)
        });
    } catch (error) {
        console.error('Reconciliation report error:', error);
        res.status(500).json({ error: 'Failed to generate reconciliation report' });
    }
};

export const markReconciled = async (req: AuthRequest, res: Response) => {
    try {
        const { lineIds } = req.body;
        if (!Array.isArray(lineIds) || lineIds.length === 0) {
            return res.status(400).json({ error: 'lineIds array is required' });
        }

        await prisma.journalEntryLine.updateMany({
            where: { id: { in: lineIds } },
            data: { reconciledAt: new Date() }
        });

        res.json({ message: `${lineIds.length} entries reconciled` });
    } catch (error) {
        console.error('Mark reconciled error:', error);
        res.status(500).json({ error: 'Failed to mark entries as reconciled' });
    }
};

export const getAgingReport = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { type } = req.query;
        const result = await accountingService.getAgingReportData(
            companyId,
            type === 'ap' ? 'ap' : 'ar'
        );
        res.json(result);
    } catch (error) {
        console.error('Aging report error:', error);
        res.status(500).json({ error: 'Failed to generate aging report' });
    }
};
