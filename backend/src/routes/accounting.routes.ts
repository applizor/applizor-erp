
import express from 'express';
import { authenticate } from '../middleware/auth';
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
    deleteJournalEntry
} from '../controllers/accounting.controller';

const router = express.Router();

router.get('/accounts', authenticate, getChartOfAccounts);
router.post('/accounts', authenticate, createAccount);
router.post('/entries', authenticate, createManualEntry);

// Reports
router.get('/reports/general-ledger/:accountId', authenticate, getGeneralLedgerReport);
router.get('/reports/balance-sheet', authenticate, getBalanceSheetReport);
router.get('/reports/profit-loss', authenticate, getProfitAndLossReport);
router.get('/journal', authenticate, getJournalEntries);
router.get('/reports/gst-summary', authenticate, getGstSummaryReport);
router.post('/reconcile', authenticate, reconcileLedger);
router.delete('/journal/:id', authenticate, deleteJournalEntry);

export default router;
