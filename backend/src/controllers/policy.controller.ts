
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const createPolicy = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, category, status } = req.body;

        const companyId = req.user?.companyId || req.user?.employee?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID is missing from user record' });
        }

        let fileUrl = null;
        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
        } else if (req.body.fileUrl) {
            fileUrl = req.body.fileUrl;
        }

        const policy = await prisma.policy.create({
            data: {
                title,
                description,
                category,
                fileUrl,
                status: status || 'DRAFT',
                companyId: companyId,
                createdBy: req.userId!
            }
        });
        res.status(201).json(policy);
    } catch (error: any) {
        console.error('Create Policy Error:', error);
        res.status(500).json({ error: `Failed to create policy: ${error.message}` });
    }
};

export const getPolicies = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId || req.user?.employee?.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID is missing' });
        }

        const isAdmin = req.user?.roles?.some((ur: any) => ur.role.name.toLowerCase() === 'admin');
        const where: any = { companyId: companyId, isActive: true };

        // Employees only see Published policies. Admins see all.
        if (!isAdmin) {
            where.status = 'PUBLISHED';
        }

        const policies = await prisma.policy.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(policies);
    } catch (error: any) {
        console.error('Fetch Policies Error:', error);
        res.status(500).json({ error: `Failed to fetch policies: ${error.message}` });
    }
};

export const updatePolicy = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, category, status } = req.body;

        const companyId = req.user?.companyId || req.user?.employee?.companyId;

        const existing = await prisma.policy.findUnique({
            where: { id }
        });

        if (!existing || existing.companyId !== companyId) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        let fileUrl = existing.fileUrl;
        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
        } else if (req.body.fileUrl) {
            fileUrl = req.body.fileUrl;
        }

        const policy = await prisma.policy.update({
            where: { id },
            data: {
                title,
                description,
                category,
                fileUrl,
                status: status || existing.status
            }
        });

        res.json(policy);
    } catch (error: any) {
        console.error('Update Policy Error:', error);
        res.status(500).json({ error: `Failed to update policy: ${error.message}` });
    }
};

export const deletePolicy = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.user?.employee?.companyId;

        const existing = await prisma.policy.findUnique({
            where: { id }
        });

        if (!existing || existing.companyId !== companyId) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // Soft delete
        await prisma.policy.update({
            where: { id },
            data: { isActive: false }
        });
        res.json({ message: 'Policy deleted' });
    } catch (error: any) {
        console.error('Delete Policy Error:', error);
        res.status(500).json({ error: `Failed to delete policy: ${error.message}` });
    }
};
