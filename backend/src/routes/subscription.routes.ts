import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription
} from '../controllers/subscription.controller';

const router = Router();

// Subscriptions / Memberships
router.get('/', authenticate, getSubscriptions);
router.post('/', authenticate, createSubscription);
router.put('/:id', authenticate, updateSubscription);
router.delete('/:id', authenticate, deleteSubscription);

export default router;
