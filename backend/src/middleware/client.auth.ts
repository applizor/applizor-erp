import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

export interface ClientAuthRequest extends Request {
    clientId?: string;
    client?: any;
}

export const authenticateClient = async (
    req: ClientAuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.replace('Bearer ', '')
            : authHeader;

        if (!token) {
            return res.status(401).json({ error: 'Token not provided' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured');
        }

        const decoded = jwt.verify(token, jwtSecret) as { userId: string };

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }

        // Check Client Table
        const client = await prisma.client.findUnique({
            where: { id: decoded.userId, status: 'active', portalAccess: true },
            include: { company: true }
        });

        if (!client) {
            return res.status(401).json({ error: 'Client not found or access revoked' });
        }

        req.clientId = decoded.userId;
        req.client = client;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
