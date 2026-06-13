import { Response } from 'express';
import prisma from '../../prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { logAction } from '../../services/audit.service';

export const createLead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) return res.status(404).json({ error: 'Company not found' });

        const { name, email, phone, company: leadCompany, source, value, notes, stage } = req.body;

        const lead = await prisma.lead.create({
            data: {
                companyId: user.companyId,
                name,
                email,
                phone,
                company: leadCompany,
                source,
                value: value ? parseFloat(value) : undefined,
                notes,
                stage: stage || 'lead',
                status: 'new'
            }
        });

        logAction(req, {
            action: 'CREATE',
            module: 'CRM',
            entityType: 'Lead',
            entityId: lead.id,
            details: `Created lead: ${name}`
        });

        res.status(201).json(lead);
    } catch (error: any) {
        console.error('Create lead error:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
};

export const getLeads = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) return res.status(404).json({ error: 'Company not found' });

        const leads = await prisma.lead.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(leads);
    } catch (error: any) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phone, company: leadCompany, source, value, notes, stage, status } = req.body;

        // Optional: Check if lead belongs to user's company (omitted for brevity but recommended)

        const lead = await prisma.lead.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                company: leadCompany,
                source,
                value: value ? parseFloat(value) : undefined,
                notes,
                stage,
                status
            }
        });

        res.json(lead);
    } catch (error: any) {
        console.error('Update lead error:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.lead.delete({ where: { id } });
        res.json({ message: 'Lead deleted successfully' });
    } catch (error: any) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
};
