
import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireModule } from '../middleware/enforcePlanLimit';
import {
    getChartOfAccounts,
    createManualEntry,
    getGeneralLedgerReport,
    getBalanceSheetReport,
    getProfitAndLossReport,
    getGstSummaryReport,
    createAccount,
    getJournalEntries,
    reconcileLedger,
    deleteJournalEntry,
    exportReport
} from '../controllers/accounting.controller';

const router = express.Router();

router.use(authenticate);
router.use(requireModule('accounting'));

router.get('/accounts', getChartOfAccounts);
router.post('/accounts', createAccount);
router.post('/entries', createManualEntry);

// Reports
router.get('/reports/general-ledger/:accountId', getGeneralLedgerReport);
router.get('/reports/balance-sheet', getBalanceSheetReport);
router.get('/reports/profit-loss', getProfitAndLossReport);
router.get('/journal', getJournalEntries);
router.get('/reports/gst-summary', getGstSummaryReport);
router.post('/reconcile', reconcileLedger);
router.delete('/journal/:id', deleteJournalEntry);
router.get('/reports/export', exportReport);

export default router;
