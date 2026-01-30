
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const createPolicy = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, category, fileUrl } = req.body;
        const policy = await prisma.policy.create({
            data: {
                title,
                description,
                category,
                fileUrl,
                companyId: req.user!.companyId,
                createdBy: req.userId!
            }
        });
        res.status(201).json(policy);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create policy' });
    }
};

export const getPolicies = async (req: AuthRequest, res: Response) => {
    try {
        const policies = await prisma.policy.findMany({
            where: { companyId: req.user!.companyId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(policies);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch policies' });
    }
};

export const deletePolicy = async (req: AuthRequest, res: Response) => {
    try {
        await prisma.policy.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ message: 'Policy deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete policy' });
    }
};
