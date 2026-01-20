import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

// Create Department
export const createDepartment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Department', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Department' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }

        const department = await prisma.department.create({
            data: {
                companyId: user.companyId,
                name,
                description,
            },
        });

        res.status(201).json(department);
    } catch (error: any) {
        console.error('Create department error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Department with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create department', details: error.message });
    }
};

// Get All Departments
export const getDepartments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        // Check Read Permission
        // For Department (Global Master), "Owned" or "Added" doesn't make much sense unless we track creator.
        // Assuming 'All' is required to view masters, OR we allow all employees to view departments?
        // Let's stick to the Plan: Check Read permission.
        const scope = PermissionService.getPermissionScope(req.user, 'Department', 'read');

        if (!scope.all && !scope.owned && !scope.added) {
            return res.status(403).json({ error: 'Access denied: No read rights for Department' });
        }

        // If scope is NOT 'all', strictly for Department we might still return all 
        // because it's a dropdown master data. But let's enforce "All" for management views.
        // However, usually everyone needs to see departments.
        // Let's implement Strict Check?
        // If user has "Owned" only, they can't see "All" departments? That breaks the App.
        // COMPROMISE: If they have ANY read permission, show All Departments.
        // Rationale: Departments are public company info.

        // For now, let's just use the basic check to ensure they have AT LEAST some read access.
        if (!PermissionService.hasBasicPermission(req.user, 'Department', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const departments = await prisma.department.findMany({
            where: { companyId: user.companyId },
            include: {
                _count: {
                    select: { employees: true, positions: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(departments);
    } catch (error: any) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to fetch departments', details: error.message });
    }
};

// Update Department
export const updateDepartment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Department', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Department' });
        }

        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const department = await prisma.department.update({
            where: { id },
            data: { name, description, isActive },
        });

        res.json(department);
    } catch (error: any) {
        console.error('Update department error:', error);
        res.status(500).json({ error: 'Failed to update department', details: error.message });
    }
};

// Delete Department
export const deleteDepartment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Department', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Department' });
        }

        const { id } = req.params;

        await prisma.department.delete({
            where: { id },
        });

        res.json({ message: 'Department deleted successfully' });
    } catch (error: any) {
        console.error('Delete department error:', error);
        res.status(500).json({ error: 'Failed to delete department', details: error.message });
    }
};
