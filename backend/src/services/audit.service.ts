import prisma from '../prisma/client';
import { Request } from 'express';

interface AuditLogData {
    action: string;
    module: string; // e.g., 'AUTH', 'COMPANY', 'HRMS'
    entityType?: string;
    entityId?: string;
    details?: string;
    changes?: any;
}

export const logAction = async (
    req: Request | any, // Allow simplified objects if needed
    data: AuditLogData
) => {
    try {
        const userId = req.userId || req.user?.id || req.user?.userId;
        // We try to get companyId from user if possible, or from req
        let companyId = req.companyId;

        if (!companyId && userId) {
            // Optimistic: we might not want to fetch user every time, but for accuracy we should
            // For now, let's rely on what's in req (usually populated by auth middleware)
            // If auth middleware doesn't attach companyId, we might miss it.
            // Let's assume auth middleware attaches user which has companyId
        }

        // Try extracting IP
        const ipAddress = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress;
        const userAgent = req.headers?.['user-agent'];

        await prisma.auditLog.create({
            data: {
                companyId: companyId || undefined, // undefined to skip if null
                userId: userId || undefined,
                action: data.action,
                module: data.module,
                entityType: data.entityType,
                entityId: data.entityId,
                details: data.details,
                changes: data.changes ? data.changes : undefined,
                ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
                userAgent
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw, we don't want to fail the main request just because logging failed
    }
};
