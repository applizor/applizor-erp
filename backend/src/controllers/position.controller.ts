import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

// Create Position
export const createPosition = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Position', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Position' });
        }

        const { departmentId, title, description } = req.body;

        if (!departmentId || !title) {
            return res.status(400).json({ error: 'Department and Title are required' });
        }

        const position = await prisma.position.create({
            data: {
                departmentId,
                title,
                description,
            },
        });

        res.status(201).json(position);
    } catch (error: any) {
        console.error('Create position error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Position with this title already exists in the department' });
        }
        res.status(500).json({ error: 'Failed to create position', details: error.message });
    }
};

// Get All Positions
export const getPositions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        // Check Read Permission
        if (!PermissionService.hasBasicPermission(req.user, 'Position', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights' });
        }

        const { departmentId } = req.query;

        const whereClause: any = {
            department: {
                companyId: user.companyId
            }
        };

        if (departmentId) {
            whereClause.departmentId = departmentId as string;
        }

        const positions = await prisma.position.findMany({
            where: whereClause,
            include: {
                department: true,
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { title: 'asc' }
        });

        res.json(positions);
    } catch (error: any) {
        console.error('Get positions error:', error);
        res.status(500).json({ error: 'Failed to fetch positions', details: error.message });
    }
};

// Update Position
export const updatePosition = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Position', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Position' });
        }

        const { id } = req.params;
        const { title, description, isActive, departmentId } = req.body;

        const position = await prisma.position.update({
            where: { id },
            data: {
                title,
                description,
                isActive,
                departmentId
            },
            include: {
                department: true
            }
        });

        res.json(position);
    } catch (error: any) {
        console.error('Update position error:', error);
        res.status(500).json({ error: 'Failed to update position', details: error.message });
    }
};

// Delete Position
export const deletePosition = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Position', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Position' });
        }

        const { id } = req.params;

        await prisma.position.delete({
            where: { id },
        });

        res.json({ message: 'Position deleted successfully' });
    } catch (error: any) {
        console.error('Delete position error:', error);
        res.status(500).json({ error: 'Failed to delete position', details: error.message });
    }
};
