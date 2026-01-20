import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) return res.status(404).json({ error: 'Company not found' });

        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const logs = await prisma.auditLog.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } }
            }
        });

        const total = await prisma.auditLog.count({ where: { companyId: user.companyId } });

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Fetch audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
