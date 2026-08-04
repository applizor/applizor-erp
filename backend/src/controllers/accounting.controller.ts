
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import accountingService from '../services/accounting.service';
import { PermissionService } from '../services/permission.service';

export const getChartOfAccounts = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'read')) {
            return res.status(403).json({ error: 'Access denied: Requires Accounting.read permission' });
        }

        const companyId = req.user!.companyId;
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { isPlatform: true },
        });
        if (company?.isPlatform) {
            return res.status(400).json({
                error: 'Platform books are managed under Super Admin → Platform Accounting, not tenant Accounting.',
            });
        }

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
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'create')) {
            return res.status(403).json({ error: 'Access denied: Requires Accounting.create permission' });
        }

        const companyId = req.user!.companyId;
        const { date, description, reference, lines } = req.body;

        const entry = await accountingService.createJournalEntry(
            companyId,
            new Date(date),
            description,
            reference,
            lines,
            true, // Auto-post manual entries for now
            req.user!.id // Pass userId for audit
        );

        res.json(entry);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to create entry' });
    }
};

export const updateManualEntry = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'update')) {
            return res.status(403).json({ error: 'Access denied: Requires Accounting.update permission' });
        }

        const companyId = req.user!.companyId;
        const { id } = req.params;
        const { date, description, reference, lines } = req.body;

        const entry = await accountingService.updateJournalEntry(
            id,
            companyId,
            {
                date: new Date(date),
                description,
                reference,
                lines
            },
            req.user!.id
        );

        res.json(entry);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to update entry' });
    }
};

export const getGeneralLedgerReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

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
    } catch (error: any) {
        res.status(error.message === 'Account not found' ? 404 : 500).json({
            error: error.message || 'Failed to fetch General Ledger'
        });
    }
};

export const getBalanceSheetReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = req.user!.companyId;
        const data = await accountingService.getBalanceSheet(companyId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Balance Sheet' });
    }
};

export const getProfitAndLossReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

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
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = req.user!.companyId;
        const { code, name, type } = req.body;

        const account = await accountingService.ensureAccount(companyId, code, name, type);
        res.json(account);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create account' });
    }
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'update')) {
            return res.status(403).json({ error: 'Access denied: Requires Accounting.update permission' });
        }

        const companyId = req.user!.companyId;
        const { id } = req.params;
        const { code, name, type, isActive } = req.body;

        const account = await accountingService.updateAccount(
            companyId,
            id,
            { code, name, type, isActive },
            req.user!.id
        );
        res.json(account);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to update account' });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'delete')) {
            return res.status(403).json({ error: 'Access denied: Requires Accounting.delete permission' });
        }

        const companyId = req.user!.companyId;
        const { id } = req.params;

        const result = await accountingService.deleteAccount(companyId, id, req.user!.id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to delete account' });
    }
};

export const getGstSummaryReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

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
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = req.user!.companyId;
        const entries = await accountingService.getJournalEntries(companyId);
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
};

export const reconcileLedger = async (req: AuthRequest, res: Response) => {
    try {
        // Reconciliation usually requires update/manage permissions
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = req.user!.companyId;
        const result = await accountingService.reconcileCompanyLedger(companyId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Reconciliation failed' });
    }
};

export const deleteJournalEntry = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'delete')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const result = await accountingService.deleteJournalEntry(id, req.user!.id, req.user!.companyId);
        res.json({ success: true, entry: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to delete entry' });
    }
};

export const exportReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = req.user!.companyId;
        const { type, startDate, endDate, format, agingType } = req.query;

        if (!type) {
            return res.status(400).json({ error: 'Report type is required' });
        }

        const dateStart = startDate ? new Date(startDate as string) : undefined;
        const dateEnd = endDate ? new Date(endDate as string) : undefined;
        const exportFormat = String(format || 'pdf').toLowerCase();
        const reportType = String(type).toUpperCase() as any;

        if (exportFormat === 'csv' || exportFormat === 'excel' || exportFormat === 'xlsx') {
            const csv = await accountingService.generateReportCSV(
                companyId,
                reportType,
                dateStart,
                dateEnd,
                (agingType as 'ar' | 'ap') || 'ar'
            );
            const filename = `${reportType}_Report.csv`;
            // Excel opens UTF-8 CSV reliably with BOM
            const payload = '\uFEFF' + csv;
            res.set({
                'Content-Type': exportFormat === 'csv'
                    ? 'text/csv; charset=utf-8'
                    : 'application/vnd.ms-excel; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            });
            return res.send(payload);
        }

        const pdfBuffer = await accountingService.generateReportPDF(
            companyId,
            reportType,
            dateStart,
            dateEnd
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${reportType}_Report.pdf"`,
            'Content-Length': pdfBuffer.length
        });

        res.end(pdfBuffer);
    } catch (error: any) {
        console.error('Export Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
};
