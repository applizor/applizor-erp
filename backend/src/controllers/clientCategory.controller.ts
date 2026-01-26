import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) return res.status(400).json({ error: 'User must belong to a company' });

        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Category name is required' });

        const category = await prisma.clientCategory.create({
            data: {
                companyId: user.companyId,
                name,
            },
        });

        res.status(201).json({ category });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create category', details: error.message });
    }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) return res.status(400).json({ error: 'User must belong to a company' });

        const categories = await prisma.clientCategory.findMany({
            where: { companyId: user.companyId },
            include: { subCategories: true },
            orderBy: { name: 'asc' },
        });

        res.json({ categories });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to get categories', details: error.message });
    }
};

export const createSubCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { categoryId, name } = req.body;
        if (!categoryId || !name) return res.status(400).json({ error: 'Category ID and name are required' });

        const subCategory = await prisma.clientSubCategory.create({
            data: {
                categoryId,
                name,
            },
        });

        res.status(201).json({ subCategory });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create sub-category', details: error.message });
    }
};

export const getSubCategories = async (req: AuthRequest, res: Response) => {
    try {
        const { categoryId } = req.params;
        const subCategories = await prisma.clientSubCategory.findMany({
            where: { categoryId },
            orderBy: { name: 'asc' },
        });

        res.json({ subCategories });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to get sub-categories', details: error.message });
    }
};
