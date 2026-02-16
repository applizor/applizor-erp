import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const createSalesTarget = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { employeeId, period, startDate, endDate, targetAmount } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }

        const target = await prisma.salesTarget.create({
            data: {
                companyId: user.companyId,
                employeeId,
                period,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                targetAmount: parseFloat(targetAmount),
                status: 'active'
            },
            include: {
                employee: {
                    include: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        });

        res.status(201).json(target);
    } catch (error: any) {
        console.error('Create sales target error:', error);
        res.status(500).json({ error: 'Failed to create sales target', details: error.message });
    }
};

export const getSalesTargets = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }

        const { employeeId, period } = req.query;
        const where: any = { companyId: user.companyId };

        if (employeeId) where.employeeId = employeeId;
        if (period) where.period = period;

        const targets = await prisma.salesTarget.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } }
                    }
                }
            },
            orderBy: { startDate: 'desc' }
        });

        res.json(targets);
    } catch (error: any) {
        console.error('Get sales targets error:', error);
        res.status(500).json({ error: 'Failed to get sales targets' });
    }
};

export const updateProgress = async (req: AuthRequest, res: Response) => {
    // This function can be called periodically or triggered by invoice payments
    // to update the 'achievedAmount' for targets.
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) return res.status(400).json({ error: 'Company not found' });

        const activeTargets = await prisma.salesTarget.findMany({
            where: {
                companyId: user.companyId,
                status: 'active'
            }
        });

        // Simple logic: Sum paid invoices created by the employee within target period
        // Note: Real-world logic might differ (based on invoice date vs payment date)

        const updates = [];

        for (const target of activeTargets) {
            // Find paid invoices for this employee in this period
            // Need to link Employee to User to check 'createdBy' or specific 'salesRepId' on Invoice
            // For simplicity, assuming Employee.userId is linked to Invoice.createdBy (implicit)
            // OR Invoice has a 'salesRepId' field? Currently it doesn't. 
            // We can use 'assignedTo' logic if we add it, or just manual update for now.

            // Skipping automated calculation for this MVP step until Invoice has 'salesRepId'
            // Allowing manual update for now.
        }

        res.json({ message: 'Progress calculation logic to be implemented fully once Sales Rep assignment to Invoice is finalized.' });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Update progress failed' });
    }
}
