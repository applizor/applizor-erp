import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';
import { AutomationService } from '../services/automation.service';
import { HistoryService } from '../services/history.service';
import { NotificationService } from '../services/notification.service';

// Basic Teams Webhook Stub
// In a real app, this would be a proper service capable of sending rich cards
const notifyTeams = async (webhookUrl: string, message: string) => {
    // console.log(`[Teams Notification] To: ${webhookUrl} | Msg: ${message}`);
    // Implementation would use axios.post(webhookUrl, { text: message });
};

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const {
            projectId, title, description, status, priority, type, tags,
            assigneeId, dueDate, milestoneId,
            storyPoints, parentId, epicId, sprintId, startDate, position
        } = req.body;

        // Verify Project Access
        const hasAccess = await PermissionService.checkProjectAccess(req.user!.id, projectId, 'edit');
        if (!hasAccess) return res.status(403).json({ error: 'Insufficient permissions' });

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                status: status || 'todo',
                priority: priority || 'medium',
                type: type || 'task',
                tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
                storyPoints: storyPoints ? parseInt(storyPoints) : 0,
                dueDate: dueDate ? new Date(dueDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                position: position ? parseFloat(position) : 0,
                createdById: req.user!.id,
                assignedToId: assigneeId || null,
                milestoneId: milestoneId || null,
                sprintId: sprintId || null,
                parentId: parentId || null,
                epicId: epicId || null
            },
            include: {
                assignee: { select: { firstName: true, email: true } },
                epic: { select: { title: true } },
                parent: { select: { title: true } }
            }
        });

        // Handle Attachments if any (middleware puts them in req.files)
        if (req.files && Array.isArray(req.files)) {
            const files = req.files as Express.Multer.File[];
            // Parallel upload not recommended for large files but fine for MVP
            await Promise.all(files.map(file =>
                prisma.document.create({
                    data: {
                        projectId,
                        taskId: task.id,
                        name: file.originalname,
                        type: 'task_attachment',
                        filePath: file.path,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                        companyId: req.user!.companyId,
                        employeeId: req.user!.employeeId
                    }
                })
            ));
        }

        // Teams Notification & Email Notification
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true, settings: true } });
        const settings = project?.settings as any;

        if (settings?.teamsWebhookUrl) {
            notifyTeams(settings.teamsWebhookUrl,
                `New ${type} in ${project?.name}: **${title}** assigned to ${task.assignee?.firstName || 'Unassigned'}`
            ).catch(err => console.error('Teams notification error:', err));
        }

        // Internal Email Notification
        if (settings?.notificationEmail) {
            import('../services/email.service').then(({ notifyNewTask }) => {
                notifyNewTask(task, project, settings.notificationEmail)
                    .catch(err => console.error('Email notification error:', err));
            });
        }

        // Assignee Notification (if assigned immediately)
        if (task.assignee?.email) {
            import('../services/email.service').then(({ notifyTaskAssigned }) => {
                notifyTaskAssigned(task, task.assignee, project)
                    .catch(err => console.error('Assignee notification error:', err));
            });
        }

        AutomationService.evaluateRules(projectId, 'TASK_CREATED', {
            taskId: task.id,
            projectId,
            taskTitle: title,
            assigneeEmail: task.assignee?.email || undefined
        }).catch(err => console.error('Automation error:', err));

        // Real-time Update
        NotificationService.emitProjectUpdate(projectId, 'TASK_CREATED', task);

        // In-App Notification for Assignee
        if (assigneeId && assigneeId !== req.user!.id) {
            await NotificationService.createNotification({
                companyId: req.user!.companyId,
                userId: assigneeId,
                title: 'New Task Assigned',
                message: `Task: ${title}`,
                type: 'task_assigned',
                link: `/projects/${projectId}/tasks`
            });
        }

        res.status(201).json(task);
    } catch (error) {
        console.error("Create Task Error", error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const {
            title, description, status, priority, type, tags,
            assigneeId, dueDate, milestoneId,
            storyPoints, parentId, epicId, sprintId, startDate, position
        } = req.body;

        // Fetch old task to compare changes and check permissions
        const oldTask = await prisma.task.findUnique({
            where: { id },
            select: {
                status: true,
                assignedToId: true,
                createdById: true,
                projectId: true,
                assignee: { select: { email: true } }
            }
        });

        if (!oldTask) return res.status(404).json({ error: 'Task not found' });

        // Permission Scoping
        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'update');
        const userId = req.user!.id;

        if (!scope.all) {
            const isAssigned = oldTask.assignedToId === userId;
            const isCreator = oldTask.createdById === userId;

            const canEditOwned = scope.owned && isAssigned;
            const canEditAdded = scope.added && isCreator;

            if (!canEditOwned && !canEditAdded) {
                return res.status(403).json({ error: 'Access denied: You do not have permission to update this task' });
            }
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                title, description, status, priority, type,
                tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
                storyPoints: storyPoints !== undefined ? parseInt(storyPoints) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                position: position !== undefined ? parseFloat(position) : undefined,
                assignedToId: assigneeId !== undefined ? (assigneeId || null) : undefined,
                milestoneId: milestoneId !== undefined ? (milestoneId || null) : undefined,
                sprintId: sprintId !== undefined ? (sprintId || null) : undefined,
                parentId: parentId !== undefined ? (parentId || null) : undefined,
                epicId: epicId !== undefined ? (epicId || null) : undefined
            },
            include: {
                assignee: { select: { firstName: true, email: true } },
                epic: { select: { title: true } },
                parent: { select: { title: true } }
            }
        });

        // Notifications
        // Notifications (Non-blocking)
        if (oldTask) {
            try {
                const project = await prisma.project.findUnique({ where: { id: task.projectId }, select: { id: true, name: true, settings: true } });

                if (project) {
                    // 1. Assignee Changed
                    if ((!oldTask.assignedToId && task.assignedToId) || (oldTask.assignedToId && task.assignedToId && oldTask.assignedToId !== task.assignedToId)) {
                        if (task.assignee?.email) {
                            import('../services/email.service').then(({ notifyTaskAssigned }) => {
                                notifyTaskAssigned(task, task.assignee, project)
                                    .catch(err => console.error('Assignee notify error:', err));
                            });
                        }
                    }

                    // 2. Status/Details Updated (Alert Assignee)
                    else if (task.assignedToId && task.assignee?.email) {
                        const changes: string[] = [];
                        if (oldTask.status !== task.status) changes.push(`Status changed from ${oldTask.status} to ${task.status}`);

                        if (changes.length > 0) {
                            import('../services/email.service').then(({ notifyTaskUpdated }) => {
                                notifyTaskUpdated(task, task.assignee, project, changes)
                                    .catch(err => console.error('Task update notify error:', err));
                            });
                        }
                    }
                }
            } catch (notifyError) {
                console.error("Notification Error (Non-fatal):", notifyError);
            }
        }

        // Trigger Automation (Status Change)
        if (oldTask && oldTask.status !== task.status) {
            AutomationService.evaluateRules(task.projectId, 'TASK_STATUS_CHANGE', {
                taskId: task.id,
                projectId: task.projectId,
                oldStatus: oldTask.status,
                newStatus: task.status,
                taskTitle: task.title,
                assigneeEmail: task.assignee?.email || undefined
            }).catch(err => console.error('Status change automation error:', err));
        }

        // Real-time Update
        NotificationService.emitProjectUpdate(task.projectId, 'TASK_UPDATED', task);

        // Notify Assignee if changed
        if (oldTask && oldTask.assignedToId !== task.assignedToId && task.assignedToId && task.assignedToId !== req.user!.id) {
            await NotificationService.createNotification({
                companyId: req.user!.companyId,
                userId: task.assignedToId,
                title: 'Task Assigned',
                message: `You are now assigned to: ${task.title}`,
                type: 'task_assigned',
                link: `/projects/${task.projectId}/tasks`
            });
        }

        res.json(task);
    } catch (error) {
        console.error("Update Task Error:", error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, projectId: true, assignedToId: true, createdById: true }
        });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Permission Scoping
        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'delete');
        const userId = req.user!.id;

        if (!scope.all) {
            const isAssigned = task.assignedToId === userId;
            const isCreator = task.createdById === userId;

            const canDeleteOwned = scope.owned && isAssigned;
            const canDeleteAdded = scope.added && isCreator;

            if (!canDeleteOwned && !canDeleteAdded) {
                return res.status(403).json({ error: 'Access denied: You do not have permission to delete this task' });
            }
        }

        await prisma.task.delete({ where: { id } });

        // Real-time Update
        NotificationService.emitProjectUpdate(task.projectId, 'TASK_DELETED', { id, projectId: task.projectId });

        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'Project ID required' });

        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'read');
        const userId = req.user!.id;

        const where: any = { projectId: String(projectId) };

        // Apply Scope Filtering (if not 'all' access)
        if (!scope.all) {
            const orConditions: any[] = [];

            if (scope.owned) {
                // Show items assigned to user OR unassigned (as per client request for visibility)
                orConditions.push({ assignedToId: userId });
                orConditions.push({ assignedToId: null });
            }

            if (scope.added) {
                orConditions.push({ createdById: userId });
            }

            // If no OR conditions, it means they shouldn't see anything or we default to none
            if (orConditions.length > 0) {
                where.AND = [
                    { projectId: String(projectId) },
                    { OR: orConditions }
                ];
                // We overwrite our simple 'where' with this complex one
                // But wait, the complex one already includes projectId.
                // It's cleaner to just build the whole where object.
            } else {
                // Fallback: strictly show nothing if they have no scope but passed checkPermission
                // This happens if level is 'none' but somehow middleware allowed it? 
                //Middleware shouldn't allow 'none', but safety first.
                return res.json([]);
            }
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                creator: { select: { firstName: true, lastName: true } },
                _count: { select: { comments: true, documents: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'read');
        const userId = req.user!.id;

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true } },
                documents: true,
                activeTimers: {
                    include: {
                        employee: { select: { firstName: true, lastName: true } }
                    }
                },
                comments: {
                    where: { parentId: null }, // Only get top-level comments
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } },
                        client: { select: { name: true, email: true } },
                        replies: {
                            include: {
                                user: { select: { firstName: true, lastName: true, email: true } },
                                client: { select: { name: true, email: true } },
                                replies: true
                            },
                            orderBy: { createdAt: 'asc' }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Enforce same scope visibility check for individual task access
        if (!scope.all) {
            const isAssigned = task.assignedToId === userId;
            const isUnassigned = task.assignedToId === null;
            const isCreator = task.createdById === userId;

            const canSeeByOwned = scope.owned && (isAssigned || isUnassigned);
            const canSeeByAdded = scope.added && isCreator;

            if (!canSeeByOwned && !canSeeByAdded) {
                return res.status(403).json({ error: 'Access denied: You do not have permission to view this task' });
            }
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task details' });
    }
};

// --- Comments ---

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // taskId
        const { content, parentId } = req.body;

        const comment = await prisma.taskComment.create({
            data: {
                taskId: id,
                content,
                parentId: parentId || null,
                userId: req.user!.id
            },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                client: { select: { name: true, email: true } }
            }
        });

        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (task) {
            NotificationService.emitProjectUpdate(task.projectId, 'COMMENT_ADDED', { taskId: id, comment });

            // Handle Mentions
            const commenterName = `${req.user!.firstName} ${req.user!.lastName}`;
            NotificationService.handleMentions(content, commenterName, task, task.project, req.user!.companyId);
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

export const getComments = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // taskId
        const comments = await prisma.taskComment.findMany({
            where: {
                taskId: id,
                parentId: null // Top-level only
            },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { firstName: true, lastName: true } },
                client: { select: { name: true } },
                replies: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        client: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

export const getTaskHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const history = await prisma.taskHistory.findMany({
            where: { taskId: id },
            include: {
                user: { select: { firstName: true, lastName: true } },
                client: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
