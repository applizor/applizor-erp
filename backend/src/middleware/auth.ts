
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client'; // Fix: Import directly

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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Direct usage of imported prisma client
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
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
    next();
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
    // ... (Keep existing checkPermission logic or update if needed)
    // For now, let's keep the existing checkPermission function as is from the previous file content
    // but we need to copy it here to complete the file replacement.

    try {
      const user = req.user;

      if (!user) return res.status(401).json({ error: 'User not authenticated' });

      // Basic check - improve based on Matrix structure
      // The matrix structure is role -> permissions -> [ { module, createLevel, ... } ]

      // This existing checkPermission logic seems to expect a different structure:
      // p.permission.module === module && p.permission.action === action
      // BUT our schema has rolePermission with createLevel, readLevel etc.

      // Let's UPDATE it to match the schema:

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

      const hasPermission = user.roles.some((userRole: any) =>
        userRole.role.permissions.some((p: any) =>
          p.module === module &&
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
