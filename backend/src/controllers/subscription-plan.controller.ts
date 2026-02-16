
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

export const getPlans = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        const plans = await prisma.subscriptionPlan.findMany({
            where: {
                companyId,
                isActive: true
            },
            orderBy: {
                price: 'asc'
            }
        });

        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Failed to fetch subscription plans' });
    }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const user = req.user;

        // Basic Admin Check (Should be more robust with permissions)
        if (!user || !companyId) { // Add role check if needed
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, code, price, currency, interval, features } = req.body;

        const plan = await prisma.subscriptionPlan.create({
            data: {
                companyId,
                name,
                code,
                price,
                currency: currency || 'INR', // Default to INR based on user request
                interval: interval || 'monthly',
                features: features || []
            }
        });

        res.status(201).json(plan);
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Failed to create subscription plan' });
    }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;

        const { name, code, price, currency, interval, features, isActive } = req.body;

        const plan = await prisma.subscriptionPlan.update({
            where: {
                id,
                companyId // Ensure ownership
            },
            data: {
                name,
                code,
                price,
                currency,
                interval,
                features,
                isActive
            }
        });

        res.json(plan);
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Failed to update subscription plan' });
    }
};

export const deletePlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;

        // Soft delete or Hard delete? Hard delete for now if no subscriptions
        // But better to just deactivate if used.
        // For now, let's just delete. Prisma might throw if relations exist (CMSPortal).

        await prisma.subscriptionPlan.delete({
            where: {
                id,
                companyId
            }
        });

        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Failed to delete plan. It might be in use.' });
    }
};
