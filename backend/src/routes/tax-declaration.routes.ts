import express from 'express';
import {
    getTaxDeclarations,
    submitTaxDeclaration,
    reviewInvestment
} from '../controllers/tax-declaration.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/:employeeId', authenticate, getTaxDeclarations);
router.post('/submit', authenticate, submitTaxDeclaration);
router.post('/investments/:id/review', authenticate, reviewInvestment);

export default router;
