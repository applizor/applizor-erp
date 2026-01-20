import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { PermissionService } from '../services/permission.service';

const prisma = new PrismaClient();

// Get Holidays
export const getHolidays = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Basic read permission. Usually all employees have this.
        if (!PermissionService.hasBasicPermission(req.user, 'Holiday', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { year } = req.query;
        const where: any = {};

        if (year) {
            const start = new Date(`${year}-01-01`);
            const end = new Date(`${year}-12-31`);
            where.date = { gte: start, lte: end };
        }

        const holidays = await prisma.holiday.findMany({
            where,
            orderBy: { date: 'asc' }
        });

        res.json(holidays);
    } catch (error) {
        console.error('Get holidays error:', error);
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
};

// Create Holiday
export const createHoliday = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Holiday', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Holiday' });
        }

        const { name, date, type } = req.body;

        const holiday = await prisma.holiday.create({
            data: {
                name,
                date: new Date(date),
                type: type || 'national',
                isActive: true
            }
        });

        res.status(201).json(holiday);
    } catch (error) {
        console.error('Create holiday error:', error);
        res.status(500).json({ error: 'Failed to create holiday' });
    }
};

// Update Holiday
export const updateHoliday = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Holiday', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Holiday' });
        }

        const { id } = req.params;
        const { name, date, type, isActive } = req.body;

        const holiday = await prisma.holiday.update({
            where: { id },
            data: {
                name,
                date: new Date(date),
                type,
                isActive
            }
        });

        res.json(holiday);
    } catch (error) {
        console.error('Update holiday error:', error);
        res.status(500).json({ error: 'Failed to update holiday' });
    }
};

// Delete Holiday
export const deleteHoliday = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Holiday', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Holiday' });
        }

        const { id } = req.params;
        await prisma.holiday.delete({ where: { id } });
        res.json({ message: 'Holiday deleted' });
    } catch (error) {
        console.error('Delete holiday error:', error);
        res.status(500).json({ error: 'Failed to delete holiday' });
    }
};
