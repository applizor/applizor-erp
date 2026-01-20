import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';

// Get All Shifts
export const getShifts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Shift', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User/Company not found' });

        const shifts = await prisma.shift.findMany({
            where: { companyId: user.companyId },
            include: {
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(shifts);
    } catch (error) {
        console.error('Get shifts error:', error);
        res.status(500).json({ error: 'Failed to fetch shifts' });
    }
};

// Create Shift
export const createShift = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Shift', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Shift' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User/Company not found' });

        const { name, startTime, endTime, breakDuration, workDays } = req.body;

        const shift = await prisma.shift.create({
            data: {
                companyId: user.companyId,
                name,
                startTime,
                endTime,
                breakDuration: breakDuration ? parseInt(breakDuration) : 60,
                workDays: workDays || ["monday", "tuesday", "wednesday", "thursday", "friday"]
            }
        });

        res.status(201).json(shift);
    } catch (error) {
        console.error('Create shift error:', error);
        res.status(500).json({ error: 'Failed to create shift' });
    }
};

// Update Shift
export const updateShift = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Shift', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Shift' });
        }

        const { id } = req.params;
        const { name, startTime, endTime, breakDuration, isActive, workDays } = req.body;

        const shift = await prisma.shift.update({
            where: { id },
            data: {
                name,
                startTime,
                endTime,
                breakDuration: breakDuration ? parseInt(breakDuration) : undefined,
                isActive,
                workDays
            }
        });

        res.json(shift);
    } catch (error) {
        console.error('Update shift error:', error);
        res.status(500).json({ error: 'Failed to update shift' });
    }
};

// Delete Shift
export const deleteShift = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Shift', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Shift' });
        }

        const { id } = req.params;
        await prisma.shift.delete({ where: { id } });
        res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Delete shift error:', error);
        res.status(500).json({ error: 'Failed to delete shift' });
    }
};

// Assign Shift to Employee
export const assignShift = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // This modifies an Employee record but is conceptually "Shift Management".
        // Use 'ShiftRoster' module for granular control.
        if (!PermissionService.hasBasicPermission(req.user, 'ShiftRoster', 'update')) {
            return res.status(403).json({ error: 'Access denied: No rights to assign shifts (ShiftRoster)' });
        }

        const { employeeId, shiftId } = req.body;

        // Verify Scope? Can I update THIS employee?
        // Let's do a quick Scope Check for 'Employee' 'update'.
        // 1. Get Target Employee
        const targetEmployee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!targetEmployee) return res.status(404).json({ error: 'Employee not found' });

        const scope = PermissionService.getPermissionScope(req.user, 'Employee', 'update');
        let hasAccess = false;

        // My Employee ID
        const currentUserEmployee = await prisma.employee.findUnique({ where: { userId } });
        const currentEmpId = currentUserEmployee?.id;

        if (scope.all) hasAccess = true;
        else if (scope.owned && targetEmployee.id === currentEmpId) hasAccess = true; // Can I change my own shift? Usually No. But if 'Owned' allows update...
        else if (scope.added && targetEmployee.createdById === userId) hasAccess = true;

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied: You cannot update this employee.' });
        }

        const employee = await prisma.employee.update({
            where: { id: employeeId },
            data: { shiftId }
        });

        res.json(employee);
    } catch (error) {
        console.error('Assign shift error:', error);
        res.status(500).json({ error: 'Failed to assign shift' });
    }
};
