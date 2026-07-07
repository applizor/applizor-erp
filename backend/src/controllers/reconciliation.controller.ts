import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

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
        const isAR = type !== 'ap';

        const accounts = await prisma.ledgerAccount.findMany({
            where: {
                companyId,
                type: isAR ? 'asset' : 'liability',
                name: { contains: isAR ? 'Receivable' : 'Payable', mode: 'insensitive' }
            }
        });

        const now = new Date();
        const agingBuckets = [
            { label: '0-30 days', min: 0, max: 30 },
            { label: '31-60 days', min: 31, max: 60 },
            { label: '61-90 days', min: 61, max: 90 },
            { label: '90+ days', min: 91, max: 99999 },
        ];

        const result: any[] = [];

        for (const account of accounts) {
            const lines = await prisma.journalEntryLine.findMany({
                where: {
                    accountId: account.id,
                    journalEntry: { companyId, status: 'posted' }
                },
                include: {
                    journalEntry: { select: { date: true, description: true, reference: true } }
                },
                orderBy: { journalEntry: { date: 'desc' } }
            });

            const buckets = agingBuckets.map(b => {
                const items = (lines as any[]).filter((l: any) => {
                    const daysDiff = Math.floor((now.getTime() - new Date(l.journalEntry.date).getTime()) / (1000 * 60 * 60 * 24));
                    return daysDiff >= b.min && daysDiff <= b.max;
                });
                return {
                    bucket: b.label,
                    count: items.length,
                    total: (items as any[]).reduce((sum: number, l: any) => sum + Number(l.debit) - Number(l.credit), 0)
                };
            });

            if (buckets.some(b => b.count > 0)) {
                result.push({ account: account.name, code: account.code, buckets });
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Aging report error:', error);
        res.status(500).json({ error: 'Failed to generate aging report' });
    }
};
