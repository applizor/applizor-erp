import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { SchedulerService } from '../services/scheduler.service';
import { leaveAccrualService } from '../services/leave-accrual.service';

export const getRules = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const rules = await prisma.automationRule.findMany({
            where: { projectId, project: { companyId: req.user!.companyId } },
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

        const project = await prisma.project.findFirst({
            where: { id: projectId, companyId: req.user!.companyId }
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });

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

export const updateRule = async (req: AuthRequest, res: Response) => {
    try {
        const { ruleId } = req.params;
        const { name, triggerType, triggerConfig, actionType, actionConfig, isActive } = req.body;

        const existing = await prisma.automationRule.findFirst({
            where: { id: ruleId, project: { companyId: req.user!.companyId } }
        });
        if (!existing) return res.status(404).json({ error: 'Rule not found' });

        const rule = await prisma.automationRule.update({
            where: { id: ruleId },
            data: {
                name,
                triggerType,
                triggerConfig,
                actionType,
                actionConfig,
                isActive
            }
        });

        res.json(rule);
    } catch (error) {
        console.error('Update Rule Error:', error);
        res.status(500).json({ error: 'Failed to update rule' });
    }
};

export const deleteRule = async (req: AuthRequest, res: Response) => {
    try {
        const { ruleId } = req.params;

        const existing = await prisma.automationRule.findFirst({
            where: { id: ruleId, project: { companyId: req.user!.companyId } }
        });
        if (!existing) return res.status(404).json({ error: 'Rule not found' });

        await prisma.automationRule.delete({ where: { id: ruleId } });
        res.json({ message: 'Rule deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete rule' });
    }
};

export const getRuleLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { ruleId } = req.params;
        
        const existing = await prisma.automationRule.findFirst({
            where: { id: ruleId, project: { companyId: req.user!.companyId } }
        });
        if (!existing) return res.status(404).json({ error: 'Rule not found' });

        const logs = await prisma.automationLog.findMany({
            where: { ruleId },
            orderBy: { executedAt: 'desc' },
            take: 50
        });
        
        res.json(logs);
    } catch (error) {
        console.error('Fetch rule logs error:', error);
        res.status(500).json({ error: 'Failed to fetch rule logs' });
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
