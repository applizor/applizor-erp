import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    submitResignation,
    getExitDetails,
    clearDepartmentNOC,
    generateNOCConfirmation
} from '../controllers/exit.controller';

const router = express.Router();

// Enforce authentication
router.use(authenticate);

// Resignation submission & list
router.post('/resign', submitResignation);
router.get('/', getExitDetails);

// Clearance actions
router.post('/:id/clear', clearDepartmentNOC);
router.get('/:id/noc', generateNOCConfirmation);

export default router;
