import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const createBranch = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) return res.status(404).json({ error: 'Company not found' });

        const { name, code, address, city, state, country, pincode, phone, email } = req.body;

        const branch = await prisma.branch.create({
            data: {
                companyId: user.companyId,
                name,
                code,
                address,
                city,
                state,
                country,
                pincode,
                phone,
                email
            }
        });

        res.status(201).json(branch);
    } catch (error: any) {
        console.error('Create branch error:', error);
        res.status(500).json({ error: 'Failed to create branch', details: error.message });
    }
};

export const getBranches = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) return res.status(404).json({ error: 'Company not found' });

        const branches = await prisma.branch.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(branches);
    } catch (error: any) {
        console.error('Get branches error:', error);
        res.status(500).json({ error: 'Failed to fetch branches' });
    }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, address, city, state, country, pincode, phone, email, isActive } = req.body;

        const branch = await prisma.branch.update({
            where: { id },
            data: {
                name,
                code,
                address,
                city,
                state,
                country,
                pincode,
                phone,
                email,
                isActive
            }
        });

        res.json(branch);
    } catch (error: any) {
        console.error('Update branch error:', error);
        res.status(500).json({ error: 'Failed to update branch' });
    }
};

export const deleteBranch = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.branch.delete({ where: { id } });
        res.json({ message: 'Branch deleted successfully' });
    } catch (error: any) {
        console.error('Delete branch error:', error);
        res.status(500).json({ error: 'Failed to delete branch' });
    }
};
