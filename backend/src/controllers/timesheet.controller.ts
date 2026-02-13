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

        const employeeId = user.employee?.id;
        if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });

        // Validation
        if (!projectId || !date || !hours) {
            return res.status(400).json({ error: 'Project, Date, and Hours are required' });
        }

        const timesheet = await prisma.timesheet.create({
            data: {
                companyId: user.companyId,
                employeeId,
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
        if (req.query.status) where.status = String(req.query.status);

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

        // 1. Auto-pause any currently running (not paused) timers for this employee
        const runningTimers = await prisma.activeTimer.findMany({
            where: { employeeId, isPaused: false }
        });

        for (const timer of runningTimers) {
            // If it's the exact same task already running, just return it
            if (timer.taskId === taskId && timer.projectId === projectId) {
                return res.status(200).json(timer);
            }

            // Calculate additional accumulated time
            const now = new Date();
            const additionalSecs = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);

            await prisma.activeTimer.update({
                where: { id: timer.id },
                data: {
                    isPaused: true,
                    accumulatedTime: timer.accumulatedTime + additionalSecs
                }
            });
        }

        // 2. Start or Resume the requested timer
        // Check if a paused timer already exists for this task
        const existingTimer = await prisma.activeTimer.findFirst({
            where: { employeeId, projectId, taskId: taskId || null }
        });

        let timer;
        if (existingTimer) {
            // Resume it
            timer = await prisma.activeTimer.update({
                where: { id: existingTimer.id },
                data: {
                    isPaused: false,
                    startTime: new Date()
                }
            });
        } else {
            // Create new
            timer = await prisma.activeTimer.create({
                data: {
                    companyId: user.companyId,
                    employeeId,
                    projectId,
                    taskId: taskId || null,
                    startTime: new Date(),
                    isPaused: false,
                    accumulatedTime: 0
                }
            });
        }

        // Real-time Update for both project and tasks
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(projectId, 'TIMER_UPDATED', { employeeId, timer });
        if (taskId) {
            NotificationService.emitProjectUpdate(projectId, 'TASK_UPDATED', { id: taskId, projectId });
        }

        res.status(200).json(timer);
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

        const activeTimer = await prisma.activeTimer.findFirst({
            where: { employeeId, isPaused: false }, // Only get the currently running one
            include: {
                project: { select: { name: true } },
                task: { select: { title: true } }
            }
        });

        // Also return all timers (including paused ones) for the task view if needed
        // But for the global bar, we just want the active one
        res.status(200).json(activeTimer || null);
    } catch (error) {
        console.error('Get Active Timer Error:', error);
        res.status(500).json({ error: 'Failed to fetch active timer' });
    }
};

export const getTaskTimers = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const employeeId = user.employee?.id;
        if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });

        const { taskId } = req.params;

        const timer = await prisma.activeTimer.findFirst({
            where: { employeeId, taskId }
        });

        res.json(timer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task timers' });
    }
};

export const pauseTimer = async (req: AuthRequest, res: Response) => {
    try {
        const { id: timerId } = req.params;
        const timer = await prisma.activeTimer.findUnique({ where: { id: timerId } });
        if (!timer) return res.status(404).json({ error: 'Timer not found' });

        if (timer.isPaused) return res.json(timer);

        const now = new Date();
        const additionalSecs = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);

        const updated = await prisma.activeTimer.update({
            where: { id: timerId },
            data: {
                isPaused: true,
                accumulatedTime: timer.accumulatedTime + additionalSecs
            }
        });

        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(timer.projectId, 'TIMER_UPDATED', { employeeId: timer.employeeId, timer: updated });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to pause timer' });
    }
};

export const resumeTimer = async (req: AuthRequest, res: Response) => {
    try {
        const { id: timerId } = req.params;
        const timer = await prisma.activeTimer.findUnique({ where: { id: timerId } });
        if (!timer) return res.status(404).json({ error: 'Timer not found' });

        if (!timer.isPaused) return res.json(timer);

        // Auto-pause others
        await prisma.activeTimer.updateMany({
            where: { employeeId: timer.employeeId, isPaused: false },
            data: { isPaused: true } // Note: simplified, ideally calculates accumulated time for those too
        });

        const updated = await prisma.activeTimer.update({
            where: { id: timerId },
            data: {
                isPaused: false,
                startTime: new Date()
            }
        });

        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(timer.projectId, 'TIMER_UPDATED', { employeeId: timer.employeeId, timer: updated });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to resume timer' });
    }
};

export const stopTimer = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const employeeId = user.employee?.id;
        if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });

        const { id: timerId } = req.params;
        const activeTimer = await prisma.activeTimer.findUnique({
            where: { id: timerId }
        });

        if (!activeTimer) {
            return res.status(404).json({ error: 'No active timer found' });
        }

        // Calculate total duration in hours
        const now = new Date();
        let totalSeconds = activeTimer.accumulatedTime;
        if (!activeTimer.isPaused) {
            totalSeconds += Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);
        }

        const durationHours = parseFloat((totalSeconds / 3600).toFixed(2));

        // Create Timesheet entry automatically
        let timesheetEntry = null;
        if (durationHours > 0) {
            timesheetEntry = await prisma.timesheet.create({
                data: {
                    companyId: user.companyId,
                    employeeId,
                    projectId: activeTimer.projectId,
                    taskId: activeTimer.taskId,
                    date: new Date(),
                    startTime: activeTimer.startTime, // This might be slightly inaccurate for merged sessions, but fine for logs
                    endTime: now,
                    hours: durationHours,
                    description: 'Timer Session',
                    status: 'draft' // Default to draft
                }
            });
        }

        // Delete active timer
        await prisma.activeTimer.delete({
            where: { id: timerId }
        });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(activeTimer.projectId, 'TIMER_UPDATED', { employeeId, timer: null });
        if (activeTimer.taskId) {
            NotificationService.emitProjectUpdate(activeTimer.projectId, 'TASK_UPDATED', { id: activeTimer.taskId, projectId: activeTimer.projectId });
        }

        res.status(200).json({
            ...activeTimer,
            endTime: now,
            durationHours: Number(durationHours),
            loggedEntry: timesheetEntry
        });
    } catch (error) {
        console.error('Stop Timer Error:', error);
        res.status(500).json({ error: 'Failed to stop timer' });
    }
};

// --- Approval Workflow ---

export const submitTimesheets = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const { ids } = req.body; // Array of timesheet IDs

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No timesheets selected for submission' });
        }

        // Update status to 'submitted'
        const result = await prisma.timesheet.updateMany({
            where: {
                id: { in: ids },
                employeeId: user.employee?.id, // Can only submit own
                status: 'draft' // Can only submit drafts
            },
            data: {
                status: 'submitted',
                submittedAt: new Date()
            }
        });

        res.json({ message: 'Timesheets submitted successfully', count: result.count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit timesheets' });
    }
};

export const approveTimesheets = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const { ids } = req.body;

        // Manager Check
        if (!PermissionService.hasBasicPermission(user, 'Timesheet', 'update')) {
            return res.status(403).json({ error: 'Access denied: No approve rights' });
        }

        const result = await prisma.timesheet.updateMany({
            where: {
                id: { in: ids },
                status: 'submitted'
            },
            data: {
                status: 'approved',
                approvedBy: user.id,
                approvedAt: new Date()
            }
        });

        res.json({ message: 'Timesheets approved', count: result.count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve timesheets' });
    }
};

export const rejectTimesheets = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const { ids, reason } = req.body;

        if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });

        // Manager Check
        if (!PermissionService.hasBasicPermission(user, 'Timesheet', 'update')) {
            return res.status(403).json({ error: 'Access denied: No reject rights' });
        }

        const result = await prisma.timesheet.updateMany({
            where: {
                id: { in: ids },
                status: 'submitted'
            },
            data: {
                status: 'rejected',
                rejectionReason: reason,
                approvedBy: user.id, // Track who rejected
                approvedAt: new Date()
            }
        });

        res.json({ message: 'Timesheets rejected', count: result.count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject timesheets' });
    }
};
