
import express from 'express';
import { authenticate } from '../middleware/auth';
import { getPlans, createPlan, updatePlan, deletePlan } from '../controllers/subscription-plan.controller';

const router = express.Router();

// Public route (authenticated but accessible to all users to view plans)
router.get('/', authenticate, getPlans);

// Admin routes (only admin can manage plans)
// TODO: Add stricter role check middleware here if needed
router.post('/', authenticate, createPlan);
router.put('/:id', authenticate, updatePlan);
router.delete('/:id', authenticate, deletePlan);

export default router;
