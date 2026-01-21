import { Request, Response } from 'express';
import { SchedulerService } from '../services/scheduler.service';
import { leaveAccrualService } from '../services/leave-accrual.service';

/**
 * Controller for manually triggering automated tasks (Cron Jobs)
 * Useful for testing and manual overrides.
 */
export const triggerMonthlyAccrual = async (req: Request, res: Response) => {
    try {
        console.log('Manual Trigger: Processing Monthly Accruals...');
        await leaveAccrualService.processMonthlyAccruals();
        res.json({ message: 'Monthly leave accrual process triggered successfully.' });
    } catch (error: any) {
        console.error('Manual Trigger Error (Accrual):', error);
        res.status(500).json({ error: 'Failed to trigger monthly accrual', details: error.message });
    }
};

export const triggerProbationConfirmation = async (req: Request, res: Response) => {
    try {
        console.log('Manual Trigger: Processing Probation Confirmations...');
        await leaveAccrualService.processProbationConfirmations();
        res.json({ message: 'Probation confirmation process triggered successfully.' });
    } catch (error: any) {
        console.error('Manual Trigger Error (Probation):', error);
        res.status(500).json({ error: 'Failed to trigger probation confirmation', details: error.message });
    }
};

export const triggerQuotationReminders = async (req: Request, res: Response) => {
    try {
        console.log('Manual Trigger: Processing Quotation Reminders...');
        await SchedulerService.processQuotationReminders();
        res.json({ message: 'Quotation reminder process triggered successfully.' });
    } catch (error: any) {
        console.error('Manual Trigger Error (Quotation):', error);
        res.status(500).json({ error: 'Failed to trigger quotation reminders', details: error.message });
    }
};
