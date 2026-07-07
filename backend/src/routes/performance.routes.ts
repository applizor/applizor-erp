import express from 'express';
import * as performanceController from '../controllers/performance.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/okrs', authenticate, performanceController.createOKR);
router.get('/okrs', authenticate, performanceController.getOKRs);

router.post('/reviews', authenticate, performanceController.createPerformanceReview);

router.post('/exit', authenticate, performanceController.initiateExit);
router.get('/exit/:employeeId/fnf', authenticate, performanceController.getFnFStatement);

// Review Cycles
router.post('/cycles', authenticate, performanceController.createReviewCycle);
router.get('/cycles', authenticate, performanceController.listReviewCycles);
router.post('/cycles/:id/close', authenticate, performanceController.closeReviewCycle);

export default router;
