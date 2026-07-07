import { Router } from 'express';
import { getReconciliationReport, markReconciled, getAgingReport } from '../controllers/reconciliation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/reconciliation', authenticate, getReconciliationReport);
router.post('/reconciliation/mark', authenticate, markReconciled);
router.get('/reports/aging', authenticate, getAgingReport);

export default router;
