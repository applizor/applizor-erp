import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';

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
            await notifyTeams(settings.teamsWebhookUrl,
                `New ${type} in ${project?.name}: **${title}** assigned to ${task.assignee?.firstName || 'Unassigned'}`
            );
        }

        // Internal Email Notification
        if (settings?.notificationEmail) {
            const { notifyNewTask } = await import('../services/email.service');
            await notifyNewTask(task, project, settings.notificationEmail);
        }

        // Assignee Notification (if assigned immediately)
        if (task.assignee?.email) {
            const { notifyTaskAssigned } = await import('../services/email.service');
            await notifyTaskAssigned(task, task.assignee, project);
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

        // Fetch old task to compare changes
        const oldTask = await prisma.task.findUnique({
            where: { id },
            select: { status: true, assignedToId: true }
        });

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
                            const { notifyTaskAssigned } = await import('../services/email.service');
                            await notifyTaskAssigned(task, task.assignee, project);
                        }
                    }

                    // 2. Status/Details Updated (Alert Assignee)
                    else if (task.assignedToId && task.assignee?.email) {
                        const changes = [];
                        if (oldTask.status !== task.status) changes.push(`Status changed from ${oldTask.status} to ${task.status}`);

                        if (changes.length > 0) {
                            const { notifyTaskUpdated } = await import('../services/email.service');
                            await notifyTaskUpdated(task, task.assignee, project, changes);
                        }
                    }
                }
            } catch (notifyError) {
                console.error("Notification Error (Non-fatal):", notifyError);
            }
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
        await prisma.task.delete({ where: { id } });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'Project ID required' });

        const tasks = await prisma.task.findMany({
            where: { projectId: String(projectId) },
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
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true } },
                documents: true,
                comments: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } },
                        client: { select: { name: true, email: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task details' });
    }
};

// --- Comments ---

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // taskId
        const { content } = req.body;

        const comment = await prisma.taskComment.create({
            data: {
                taskId: id,
                content,
                userId: req.user!.id
            },
            include: { user: { select: { firstName: true, lastName: true, email: true } } }
        });

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

export const getComments = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // taskId
        const comments = await prisma.taskComment.findMany({
            where: { taskId: id },
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { firstName: true, lastName: true } } }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};
