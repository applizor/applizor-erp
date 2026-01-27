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
        const { projectId, title, description, status, priority, type, tags, assigneeId, dueDate, milestoneId } = req.body;

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
                dueDate: dueDate ? new Date(dueDate) : null,
                createdById: req.user!.id,
                assignedToId: assigneeId || null,
                milestoneId: milestoneId || null
            },
            include: { assignee: { select: { firstName: true, email: true } } }
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
            const { sendEmail } = await import('../services/email.service');
            const emailSubject = `[${project?.name}] New ${type}: ${title}`;
            const emailHtml = `
                <div style="font-family: Arial, sans-serif;">
                    <h2>New ${type} Created</h2>
                    <p><strong>Project:</strong> ${project?.name}</p>
                    <p><strong>Title:</strong> ${title}</p>
                    <p><strong>Priority:</strong> ${priority}</p>
                    <p><strong>Assigned To:</strong> ${task.assignee?.firstName || 'Unassigned'}</p>
                    <br/>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                        ${description || 'No description provided.'}
                    </div>
                </div>
            `;
            await sendEmail(settings.notificationEmail, emailSubject, emailHtml);
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
        const { title, description, status, priority, type, tags, assigneeId, dueDate, milestoneId } = req.body;

        const task = await prisma.task.update({
            where: { id },
            data: {
                title, description, status, priority, type,
                tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                assignedToId: assigneeId,
                milestoneId
            }
        });

        // Notify if status changed to 'review' or 'done'?
        // Skipped for brevity

        res.json(task);
    } catch (error) {
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
