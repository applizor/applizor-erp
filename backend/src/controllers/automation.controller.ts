import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { SchedulerService } from '../services/scheduler.service';
import { leaveAccrualService } from '../services/leave-accrual.service';

export const getRules = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const rules = await prisma.automationRule.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
};

export const createRule = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const { name, triggerType, triggerConfig, actionType, actionConfig } = req.body;

        const rule = await prisma.automationRule.create({
            data: {
                projectId,
                name,
                triggerType,
                triggerConfig,
                actionType,
                actionConfig
            }
        });

        res.status(201).json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create rule' });
    }
};

export const deleteRule = async (req: AuthRequest, res: Response) => {
    try {
        const { ruleId } = req.params;
        await prisma.automationRule.delete({ where: { id: ruleId } });
        res.json({ message: 'Rule deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete rule' });
    }
};

export const triggerMonthlyAccrual = async (req: AuthRequest, res: Response) => {
    try {
        await leaveAccrualService.processMonthlyAccruals();
        res.json({ message: 'Monthly accruals triggered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to trigger accruals' });
    }
};

export const triggerProbationConfirmation = async (req: AuthRequest, res: Response) => {
    try {
        await leaveAccrualService.processProbationConfirmations();
        res.json({ message: 'Probation confirmations triggered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to trigger probation check' });
    }
};

export const triggerQuotationReminders = async (req: AuthRequest, res: Response) => {
    try {
        await SchedulerService.processQuotationReminders();
        res.json({ message: 'Quotation reminders triggered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to trigger reminders' });
    }
};
