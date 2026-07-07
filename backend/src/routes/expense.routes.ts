import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    createExpense,
    getExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    takeApprovalAction,
    getPendingApprovals,
    getConfigs,
    updateConfigs
} from '../controllers/expense.controller';

const router = express.Router();

// Enforce authentication for all expense endpoints
router.use(authenticate);

// List/Create endpoints
router.get('/', getExpenses);
router.post('/', createExpense);

// Workflow configuration endpoints (Admin)
router.get('/configs', getConfigs);
router.post('/configs', updateConfigs);

// User pending approvals queue
router.get('/pending-approvals', getPendingApprovals);

// Individual expense details, edit, delete, and action endpoints
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.post('/:id/action', takeApprovalAction);

export default router;
