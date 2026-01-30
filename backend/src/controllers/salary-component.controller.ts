
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const createComponent = async (req: AuthRequest, res: Response) => {
    try {
        const { name, type, calculationType, defaultValue, isTaxable } = req.body;
        const component = await prisma.salaryComponent.create({
            data: {
                name,
                type,
                calculationType,
                defaultValue,
                isTaxable,
                companyId: req.user!.companyId
            }
        });
        res.status(201).json(component);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create salary component' });
    }
};

export const getComponents = async (req: AuthRequest, res: Response) => {
    try {
        const components = await prisma.salaryComponent.findMany({
            where: { companyId: req.user!.companyId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(components);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch components' });
    }
};

export const updateComponent = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const component = await prisma.salaryComponent.update({
            where: { id },
            data: req.body
        });
        res.json(component);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update component' });
    }
};

export const deleteComponent = async (req: AuthRequest, res: Response) => {
    try {
        await prisma.salaryComponent.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ message: 'Component deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete component' });
    }
};
