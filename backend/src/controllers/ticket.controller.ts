
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const createTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { subject, description, category, priority } = req.body;
        const ticket = await prisma.ticket.create({
            data: {
                subject,
                description,
                category,
                priority,
                companyId: req.user!.companyId,
                createdBy: req.userId!
            }
        });
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create ticket' });
    }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;
        const where: any = { companyId: req.user!.companyId };

        // If not admin/HR, only show own tickets or assigned tickets
        const isAdmin = req.user!.roles.includes('Admin') || req.user!.roles.includes('HR');
        if (!isAdmin) {
            where.OR = [
                { createdBy: req.userId },
                { assignedTo: req.userId }
            ];
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                creator: { select: { firstName: true, lastName: true } },
                assignee: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, priority, assignedTo } = req.body;

        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status, priority, assignedTo }
        });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update ticket' });
    }
};
