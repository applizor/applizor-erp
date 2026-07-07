
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/jwt';
import prisma from '../prisma/client'; // Fix: Import directly
import { companyContextStore } from '../utils/context';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
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

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Direct usage of imported prisma client
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        employee: {
          select: { id: true, companyId: true }
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = decoded.userId;
    req.user = user;

    const companyId = user.companyId;
    if (companyId) {
      companyContextStore.run({
        companyId,
        userId: decoded.userId,
        userAgent: req.headers['user-agent'] as string,
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string)
      }, () => next());
    } else {
      next();
    }
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const checkPermission = (module: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      // Map 'action' (create, read, update, delete) to the level field
      let levelField = '';
      if (action === 'create') levelField = 'createLevel';
      else if (action === 'read') levelField = 'readLevel';
      else if (action === 'update') levelField = 'updateLevel';
      else if (action === 'delete') levelField = 'deleteLevel';
      else {
        // Unknown action? Skip for now or allow.
        return next();
      }

      // Fallback hierarchy for submodules/template modules to parent modules
      const targetModules = [module];
      if (module === 'QuotationTemplate') {
        targetModules.push('Quotation');
      } else if (module === 'CertificateTemplate') {
        targetModules.push('Certificate');
      }
      // DocumentTemplate intentionally NOT falling back to Document - separate permission

      const hasPermission = user.roles.some((userRole: any) =>
        userRole.role.permissions.some((p: any) =>
          targetModules.includes(p.module) &&
          p[levelField] &&
          p[levelField] !== 'none'
        )
      );

      if (!hasPermission) {
        // Check for Super Admin
        const isSuperAdmin = user.roles.some((ur: any) => ur.role.name === 'Admin' || ur.role.name === 'Super Admin'); // Added 'Admin' check
        if (isSuperAdmin) {
          return next();
        }

        return res.status(403).json({ error: `Access denied. Requires permission: ${module}.${action}` });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Failed to check permissions' });
    }
  };
};

export const authorize = (roles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRoles = req.user.roles.map((r: any) => r.role.name);
    // Case insensitive comparison helpful? Schema usually strictly capitalized. 
    // Let's stick to exact match or simple includes.
    const hasRole = userRoles.some((role: string) => roles.includes(role));

    if (roles.length && !hasRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

export const combinedAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authentication required' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
    if (!token) return res.status(401).json({ error: 'Token not provided' });

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!decoded || !decoded.userId) return res.status(401).json({ error: 'Invalid token' });

    // 1. Try User (Staff)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        employee: { select: { id: true, companyId: true } },
        roles: { include: { role: { include: { permissions: true } } } }
      }
    });

    if (user) {
      (req as any).userId = decoded.userId;
      (req as any).user = user;
      (req as any).userType = 'employee';
      const companyId = user.companyId;
      if (companyId) {
        return companyContextStore.run({ companyId }, () => next());
      }
      return next();
    }

    // 2. Try Client
    const client = await prisma.client.findFirst({
      where: { id: decoded.userId, status: 'active', portalAccess: true },
      include: { company: true }
    });

    if (client) {
      (req as any).userId = decoded.userId;
      (req as any).user = {
        id: client.id,
        email: client.email,
        name: client.name,
        type: 'client',
        clientId: client.id,
        companyId: client.companyId,
        company: client.company,
        roles: [] // Add empty roles array for permission checks
      };
      (req as any).userType = 'client';
      const companyId = client.companyId;
      if (companyId) {
        return companyContextStore.run({ companyId }, () => next());
      }
      return next();
    }

    return res.status(401).json({ error: 'User or Client not found' });
  } catch (error) {
    console.error('Combined auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
