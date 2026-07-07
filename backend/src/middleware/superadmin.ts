import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const isSuperAdmin = req.user.roles?.some((ur: any) =>
        ur.role?.name === 'Super Admin' || ur.role?.name === 'Platform Admin'
    );

    if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
    }

    next();
};
