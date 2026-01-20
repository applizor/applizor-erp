
import express from 'express';
import { authenticate } from '../middleware/auth';
import { getChartOfAccounts, createManualEntry } from '../controllers/accounting.controller';

const router = express.Router();

router.get('/accounts', authenticate, getChartOfAccounts);
router.post('/entries', authenticate, createManualEntry);

export default router;
