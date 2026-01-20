import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth'; // Ensure this middleware supports Client logic or we create a new one

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const clientId = req.userId; // Assuming middleware sets this from token

        const [invoices, projects] = await Promise.all([
            prisma.invoice.findMany({
                where: { clientId },
                select: { total: true, status: true, currency: true }
            }),
            prisma.project.count({
                where: { clientId, status: 'active' } // Assuming active status string
            })
        ]);

        // Calculate totals
        const totalDue = invoices
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + Number(inv.total), 0);

        // Simple currency assumption for MVP (taking first found or default)
        const currency = invoices[0]?.currency || 'USD';

        res.json({
            activeProjects: projects,
            pendingInvoicesCount: invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').length,
            totalDue,
            currency
        });

    } catch (error) {
        console.error('Portal stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

export const getMyInvoices = async (req: AuthRequest, res: Response) => {
    try {
        const clientId = req.userId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where: { clientId },
                orderBy: { invoiceDate: 'desc' },
                skip,
                take: limit,
                include: { items: true }
            }),
            prisma.invoice.count({ where: { clientId } })
        ]);

        res.json({ invoices, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

export const getMyProjects = async (req: AuthRequest, res: Response) => {
    try {
        const clientId = req.userId;
        const projects = await prisma.project.findMany({
            where: { clientId },
            orderBy: { updatedAt: 'desc' },
            include: { tasks: false } // Avoid leaking internal task details if sensitive
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};
