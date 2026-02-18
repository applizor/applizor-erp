
import express from 'express';
import { authenticate } from '../middleware/auth';
import { getPlans, createPlan, updatePlan, deletePlan } from '../controllers/subscription-plan.controller';

const router = express.Router();

// Public route (authenticated but accessible to all users to view plans)
router.get('/', authenticate, getPlans);

// Admin routes (only admin can manage plans)
import { authorize } from '../middleware/auth';

router.post('/', authenticate, authorize(['Admin', 'Super Admin']), createPlan);
router.put('/:id', authenticate, authorize(['Admin', 'Super Admin']), updatePlan);
router.delete('/:id', authenticate, authorize(['Admin', 'Super Admin']), deletePlan);

export default router;
