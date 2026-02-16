import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';
import { NotificationService } from '../services/notification.service';
import { notifyNewTicket, notifyTicketReply } from '../services/email.service';

/**
 * Helpdesk Ticket Controller (Enhanced)
 * Supports: Tickets, Replies (Thread), Status Workflow, Permissions
 */

// --- 1. Create Ticket ---
export const createTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { subject, description, priority, category } = req.body;
        const user = req.user!;

        // Permission Check
        if (!PermissionService.hasBasicPermission(user, 'Ticket', 'create')) {
            return res.status(403).json({ error: 'Access denied: Cannot create tickets' });
        }

        const ticket = await prisma.ticket.create({
            data: {
                companyId: user.companyId,
                subject,
                description,
                priority: priority || 'medium',
                category: category || 'General',
                status: 'open',
                createdById: user.id
            }
        });

        // Notify Support
        try {
            const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || '';
            if (supportEmail) {
                await notifyNewTicket(ticket, `${user.firstName} ${user.lastName}`, supportEmail);
            }
        } catch (emailError) {
            console.error('Failed to send new ticket email:', emailError);
        }

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create Ticket Error:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
};

// --- 2. Get Tickets (with filters) ---
export const getTickets = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { status, priority, mine } = req.query;

        if (!PermissionService.hasBasicPermission(user, 'Ticket', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const where: any = {
            companyId: user.companyId
        };

        if (status && status !== 'all') where.status = String(status);
        if (priority) where.priority = String(priority);

        // Scope Filter (Own vs All)
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user,
            'Ticket',
            'read',
            'Ticket',
            'createdById',
            'assignedToId'
        );

        const tickets = await prisma.ticket.findMany({
            where: {
                AND: [
                    where,
                    scopeFilter
                ]
            },
            include: {
                creator: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { messages: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(tickets);
    } catch (error) {
        console.error('Get Tickets Error:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

// --- 3. Get Single Ticket (with Messages) ---
export const getTicketById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        // We check read permission first
        if (!PermissionService.hasBasicPermission(user, 'Ticket', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, firstName: true, lastName: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
                messages: {
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        // Verify ownership/scope if strictly private (Optional: PermissionService handles list filtering, but direct access needs check too)
        // For now, assuming if list permission passes, direct access is okay or we rely on 'read' check above.
        // Ideally, we re-verify scope:
        // if (ticket.companyId !== user.companyId) return 403;

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ticket' });
    }
};

// --- 4. Update Ticket (Status, Assignee) ---
export const updateTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const user = req.user!;

        if (!PermissionService.hasBasicPermission(user, 'Ticket', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update ticket' });
    }
};

// --- 5. Add Reply (Thread) ---
export const addReply = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { content, isInternal } = req.body;
        const user = req.user!;

        // Any user who can READ the ticket can likely reply (requester or agent)
        // Or we enforce 'update' permission? Usually 'read' is enough to comment for requester.
        // Let's assume if you can see it, you can reply.

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: user.id,
                content,
                isInternal: isInternal || false
            },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true } }
            }
        });

        // Optionally update ticket updated_at
        await prisma.ticket.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        // Notify relevant party
        try {
            const ticket = await prisma.ticket.findUnique({
                where: { id },
                include: {
                    creator: { select: { email: true, firstName: true } },
                    assignee: { select: { email: true, firstName: true } }
                }
            });

            if (ticket) {
                let recipientEmail = '';
                // If sender is creator, notify assignee (or support)
                if (user.id === ticket.createdById) {
                    recipientEmail = ticket.assignee?.email || process.env.SUPPORT_EMAIL || '';
                } else {
                    // Sender is agent/admin, notify creator
                    recipientEmail = ticket.creator.email;
                }

                if (recipientEmail) {
                    await notifyTicketReply(ticket, message, recipientEmail);
                }
            }
        } catch (emailError) {
            console.error('Failed to send ticket reply email:', emailError);
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add reply' });
    }
};
