import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';

export const createTimeEntry = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        const user = req.user;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // ✅ Check create permission
        if (!PermissionService.hasBasicPermission(user, 'Timesheet', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Timesheet' });
        }

        const { projectId, taskId, date, startTime, endTime, hours, description } = req.body;

        // Validation
        if (!projectId || !date || !hours) {
            return res.status(400).json({ error: 'Project, Date, and Hours are required' });
        }

        const timesheet = await prisma.timesheet.create({
            data: {
                companyId: user.companyId,
                employeeId: user.employee?.id!,
                projectId,
                taskId,
                date: new Date(date),
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                hours: Number(hours), // Prisma Decimal needs number or string
                description
            }
        });

        // Real-time Update (Refresh Task spent hours)
        if (taskId) {
            const { NotificationService } = await import('../services/notification.service');
            NotificationService.emitProjectUpdate(projectId, 'TASK_UPDATED', { id: taskId, projectId });
        }

        res.status(201).json(timesheet);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create time entry' });
    }
};

export const bulkCreateTimeEntries = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        const user = req.user;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // ✅ Check create permission
        if (!PermissionService.hasBasicPermission(user, 'Timesheet', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Timesheet' });
        }

        const { projectId, date, entries } = req.body;

        // Validation
        if (!projectId || !date || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'Project, Date, and at least one Entry are required' });
        }

        const employeeId = user.employee?.id;
        if (!employeeId) {
            return res.status(400).json({ error: 'User must be associated with an employee record to log time' });
        }

        // Use transaction to ensure all or nothing
        const results = await prisma.$transaction(
            entries.map((entry: any) =>
                prisma.timesheet.create({
                    data: {
                        companyId: user.companyId,
                        employeeId,
                        projectId,
                        taskId: entry.taskId || null,
                        date: new Date(date),
                        hours: Number(entry.hours),
                        description: entry.description || ''
                    }
                })
            )
        );

        // Real-time Update (Refresh Task spent hours)
        const taskIds = [...new Set(entries.map((e: any) => e.taskId).filter(Boolean))];
        if (taskIds.length > 0) {
            const { NotificationService } = await import('../services/notification.service');
            taskIds.forEach(id => {
                NotificationService.emitProjectUpdate(projectId, 'TASK_UPDATED', { id, projectId });
            });
        }

        res.status(201).json(results);

    } catch (error: any) {
        console.error('Bulk Create Error:', error);
        res.status(500).json({ error: 'Failed to create bulk time entries' });
    }
};

export const getTimesheets = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;

        // ✅ Check read permission
        if (!PermissionService.hasBasicPermission(user, 'Timesheet', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Timesheet' });
        }

        const scope = PermissionService.getPermissionScope(user, 'Timesheet', 'read');
        let where: any = { companyId: user.companyId };

        if (scope.all) {
            // view all
        } else if (scope.owned || scope.added) {
            // For Timesheet, 'owned' means match employeeId
            if (!user.employee) return res.json([]);
            where.employeeId = user.employee.id;
        } else {
            // none
            return res.json([]);
        }

        const { projectId, taskId, startDate, endDate } = req.query;

        if (projectId) where.projectId = String(projectId);
        if (taskId) where.taskId = String(taskId);
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(String(startDate));
            if (endDate) where.date.lte = new Date(String(endDate));
        }

        const timesheets = await prisma.timesheet.findMany({
            where,
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } },
                employee: { select: { id: true, firstName: true, lastName: true } }
            },
            orderBy: { date: 'desc' }
        });

        res.json(timesheets);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch timesheets' });
    }
};

export const updateTimeEntry = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!PermissionService.hasBasicPermission(user, 'Timesheet', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights' });
        }

        const entry = await prisma.timesheet.findUnique({ where: { id } });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        // Scoping
        const scope = PermissionService.getPermissionScope(user, 'Timesheet', 'update');

        // Block if not all and not owned
        if (!scope.all) {
            if (scope.owned || scope.added) {
                if (entry.employeeId !== user.employee?.id) {
                    return res.status(403).json({ error: 'Access denied: You can only update your own timesheets' });
                }
            } else {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const { hours, description, date, startTime, endTime, taskId, projectId } = req.body;

        const updated = await prisma.timesheet.update({
            where: { id },
            data: {
                hours: hours ? Number(hours) : undefined,
                description,
                date: date ? new Date(date) : undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                taskId,
                projectId
            }
        });

        // Real-time Update (Refresh Task spent hours)
        if (updated.taskId && updated.projectId) {
            const { NotificationService } = await import('../services/notification.service');
            NotificationService.emitProjectUpdate(updated.projectId, 'TASK_UPDATED', { id: updated.taskId, projectId: updated.projectId });
        }

        res.json(updated);

    } catch (error) {
        res.status(500).json({ error: 'Failed to update timesheet' });
    }
};

export const deleteTimeEntry = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!PermissionService.hasBasicPermission(user, 'Timesheet', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights' });
        }

        const entry = await prisma.timesheet.findUnique({ where: { id } });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });

        const scope = PermissionService.getPermissionScope(user, 'Timesheet', 'delete');

        if (!scope.all) {
            if (scope.owned || scope.added) {
                if (entry.employeeId !== user.employee?.id) {
                    return res.status(403).json({ error: 'Access denied: You can only delete your own timesheets' });
                }
            } else {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        await prisma.timesheet.delete({ where: { id } });

        // Real-time Update (Refresh Task spent hours)
        if (entry.taskId && entry.projectId) {
            const { NotificationService } = await import('../services/notification.service');
            NotificationService.emitProjectUpdate(entry.projectId, 'TASK_UPDATED', { id: entry.taskId, projectId: entry.projectId });
        }

        res.json({ message: 'Deleted successfully' });

    } catch (error) {
        res.status(500).json({ error: 'Failed to delete timesheet' });
    }
};

export const startTimer = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const employeeId = user.employee?.id;
        if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });

        const { projectId, taskId } = req.body;
        if (!projectId) return res.status(400).json({ error: 'ProjectId is required' });

        // Upsert active timer (user can only have one)
        const activeTimer = await prisma.activeTimer.upsert({
            where: { employeeId },
            update: {
                projectId,
                taskId: taskId || null,
                startTime: new Date()
            },
            create: {
                companyId: user.companyId,
                employeeId,
                projectId,
                taskId: taskId || null,
                startTime: new Date()
            }
        });

        res.status(200).json(activeTimer);
    } catch (error) {
        console.error('Start Timer Error:', error);
        res.status(500).json({ error: 'Failed to start timer' });
    }
};

export const getActiveTimer = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const employeeId = user.employee?.id;
        if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });

        const activeTimer = await prisma.activeTimer.findUnique({
            where: { employeeId },
            include: {
                project: { select: { name: true } },
                task: { select: { title: true } }
            }
        });

        res.status(200).json(activeTimer || null);
    } catch (error) {
        console.error('Get Active Timer Error:', error);
        res.status(500).json({ error: 'Failed to fetch active timer' });
    }
};

export const stopTimer = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const employeeId = user.employee?.id;
        if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });

        const activeTimer = await prisma.activeTimer.findUnique({
            where: { employeeId }
        });

        if (!activeTimer) {
            return res.status(404).json({ error: 'No active timer found' });
        }

        // Calculate duration in hours
        const endTime = new Date();
        const durationMs = endTime.getTime() - activeTimer.startTime.getTime();
        const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

        // Delete active timer
        await prisma.activeTimer.delete({
            where: { employeeId }
        });

        res.status(200).json({
            ...activeTimer,
            endTime,
            durationHours: Number(durationHours)
        });
    } catch (error) {
        console.error('Stop Timer Error:', error);
        res.status(500).json({ error: 'Failed to stop timer' });
    }
};
