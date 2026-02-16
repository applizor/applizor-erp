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

// Microsoft Auth
import { getAuthUrl, handleCallback } from '../controllers/microsoft-auth.controller';
router.get('/microsoft/auth-url', getAuthUrl);
router.get('/microsoft/callback', handleCallback);

export default router;
