import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

export const getServices = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        const services = await prisma.service.findMany({
            where: {
                companyId,
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
};

export const createService = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const user = req.user;

        if (!user || !companyId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, code, category, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const serviceCode = code || name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

        const service = await prisma.service.create({
            data: {
                companyId,
                name,
                code: serviceCode,
                category: category || 'SaaS',
                description: description || null
            }
        });

        res.status(201).json(service);
    } catch (error: any) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: error.message || 'Failed to create service' });
    }
};

export const updateService = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        const { name, code, category, description, isActive } = req.body;

        const service = await prisma.service.update({
            where: {
                id,
                companyId
            },
            data: {
                name,
                code,
                category,
                description,
                isActive
            }
        });

        res.json(service);
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        // Soft delete/deactivate so we don't break linked plans
        const service = await prisma.service.update({
            where: {
                id,
                companyId
            },
            data: {
                isActive: false
            }
        });

        res.json({ message: 'Service deactivated successfully', service });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
};
