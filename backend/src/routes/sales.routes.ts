import express from 'express';
import * as salesController from '../controllers/sales.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/targets', authenticate, salesController.createSalesTarget);
router.get('/targets', authenticate, salesController.getSalesTargets);
router.post('/targets/update-progress', authenticate, salesController.updateProgress);

export default router;
