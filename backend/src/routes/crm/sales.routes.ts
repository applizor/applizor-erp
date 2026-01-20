import { Router } from 'express';
import { createSalesTarget, getSalesTargets, updateProgress } from '../../controllers/crm/sales.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/', authenticate, createSalesTarget);
router.get('/', authenticate, getSalesTargets);
router.post('/calculate-progress', authenticate, updateProgress);

export default router;
