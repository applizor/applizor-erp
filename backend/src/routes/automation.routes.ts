import { Router } from 'express';
import {
    triggerMonthlyAccrual,
    triggerProbationConfirmation,
    triggerQuotationReminders
} from '../controllers/automation.controller';

const router = Router();

// Manual triggers for testing (URL-runnable)
router.get('/monthly-accrual', triggerMonthlyAccrual);
router.get('/probation-confirmation', triggerProbationConfirmation);
router.get('/quotation-reminders', triggerQuotationReminders);

export default router;
