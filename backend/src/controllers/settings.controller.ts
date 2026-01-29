import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

// =====================
// Tax Rates
// =====================

export const getTaxRates = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const rates = await prisma.taxRate.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(rates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tax rates' });
    }
};

export const createTaxRate = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { name, percentage, description } = req.body;

        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const rate = await prisma.taxRate.create({
            data: {
                companyId,
                name,
                percentage,
                description
            }
        });
        res.json(rate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create tax rate' });
    }
};

export const updateTaxRate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, percentage, description, isActive } = req.body;

        const rate = await prisma.taxRate.update({
            where: { id },
            data: { name, percentage, description, isActive }
        });
        res.json(rate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update tax rate' });
    }
};

export const deleteTaxRate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.taxRate.delete({ where: { id } });
        res.json({ message: 'Tax rate deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete tax rate' });
    }
};

// =====================
// Unit Types
// =====================

export const getUnitTypes = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const units = await prisma.unitType.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unit types' });
    }
};

export const createUnitType = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { name, symbol } = req.body;

        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const unit = await prisma.unitType.create({
            data: {
                companyId,
                name,
                symbol
            }
        });
        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create unit type' });
    }
};

export const updateUnitType = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, symbol, isActive } = req.body;

        const unit = await prisma.unitType.update({
            where: { id },
            data: { name, symbol, isActive }
        });
        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update unit type' });
    }
};

export const deleteUnitType = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.unitType.delete({ where: { id } });
        res.json({ message: 'Unit type deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete unit type' });
    }
};
