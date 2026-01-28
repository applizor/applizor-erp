import { Response, Request } from 'express';
// import { ClientAuthRequest } from '../middleware/client.auth'; // Need to import this type or redefine
import prisma from '../prisma/client';
import { NotificationService } from '../services/notification.service';

// Reusing interface normally, but here define locally to avoid circular deps if needed
interface ClientAuthRequest extends Request {
    clientId?: string;
    client?: any;
    files?: any; // for multer
}

export const createPortalTask = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { projectId, title, description, priority, type, tags } = req.body;
        const clientId = req.clientId!;

        // 1. Verify Project Access: Project must belong to this client
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { clientId: true, name: true, settings: true }
        });

        if (!project || project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }

        // 2. Create Task
        // Clients typically create "Issues" or "Bugs", rarely "Tasks"
        const taskType = type || 'issue';

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                status: 'todo', // Always start as todo
                priority: priority || 'medium',
                type: taskType,
                tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
                createdClientId: clientId, // Use the new field
                // createdById is optional now
            }
        });

        // Real-time Update
        NotificationService.emitProjectUpdate(projectId, 'TASK_CREATED', task);

        // 3. Handle Attachments
        if (req.files && Array.isArray(req.files)) {
            const files = req.files as Express.Multer.File[];
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
                        companyId: req.client.companyId,
                        clientId: clientId
                    }
                })
            ));
        }

        // 4. Teams Notification (Reuse logic?) & Internal Email
        const settings = project?.settings as any;
        if (settings?.teamsWebhookUrl) {
            // Need to import/define notifyTeams or just stub it here for now
            // console.log("Notify Teams from Portal");
        }

        // Internal Email Notification for Client-Created Task
        if (settings?.notificationEmail) {
            const { sendEmail } = await import('../services/email.service');
            const emailSubject = `[${project?.name}] New Client Issue: ${title}`;
            const emailHtml = `
                <div style="font-family: Arial, sans-serif;">
                    <h2>New Issue Reported by Client</h2>
                    <p><strong>Project:</strong> ${project?.name}</p>
                    <p><strong>Title:</strong> ${title}</p>
                    <p><strong>Priority:</strong> ${priority}</p>
                    <p><strong>Reported By:</strong> Client via Portal</p>
                    <br/>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                        ${description || 'No description provided.'}
                    </div>
                    <p><em>Please review this issue in the task board.</em></p>
                </div>
            `;
            await sendEmail(settings.notificationEmail, emailSubject, emailHtml);
        }

        res.status(201).json(task);

    } catch (error) {
        console.error("Portal: Create Task Error", error);
        res.status(500).json({ error: 'Failed to create issue' });
    }
};

export const getPortalTasks = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { projectId } = req.query;
        const clientId = req.clientId!;

        if (!projectId) return res.status(400).json({ error: 'Project ID required' });

        // Verify Access
        const project = await prisma.project.findUnique({ where: { id: String(projectId) } });
        if (!project || project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const tasks = await prisma.task.findMany({
            where: { projectId: String(projectId) },
            include: {
                assignee: { select: { firstName: true } },
                _count: { select: { comments: true, documents: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

// ... (existing code)

export const getPortalTaskDetails = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId!;

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                project: true,
                assignee: { select: { firstName: true, lastName: true } },
                documents: {
                    where: { type: 'task_attachment' }
                },
                _count: {
                    select: { comments: true }
                }
            }
        });

        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Security Check: Task must belong to a project assigned to this client
        if (task.project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(task);
    } catch (error) {
        console.error("Portal: Get Task Details Error", error);
        res.status(500).json({ error: 'Failed to fetch task details' });
    }
};

export const addPortalComment = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params; // taskId
        const { content } = req.body;
        const clientId = req.clientId!;

        // Verify Task Access via Project
        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!task || task.project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const comment = await prisma.taskComment.create({
            data: {
                taskId: id,
                content,
                clientId: clientId // Use new field
            },
            include: { client: { select: { name: true } } }
        });

        // Notify Team (Optional - could be enhanced)
        NotificationService.emitProjectUpdate(task.projectId, 'COMMENT_ADDED', { taskId: id, comment });

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

export const getPortalComments = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params; // taskId
        const clientId = req.clientId!;

        // Verify Task Access
        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!task || task.project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const comments = await prisma.taskComment.findMany({
            where: { taskId: id },
            include: {
                user: { select: { firstName: true, lastName: true } },
                client: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

import { AutomationService } from '../services/automation.service';
import { HistoryService } from '../services/history.service';

// ... (existing code)

export const updatePortalTaskStatus = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // action: 'approve' | 'reject'
        const clientId = req.clientId!;

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                project: true,
                assignee: { select: { email: true } }
            }
        });

        if (!task || task.project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (action === 'approve') {
            await prisma.task.update({
                where: { id },
                data: { status: 'done' }
            });
            // Optional: Notify team
        } else if (action === 'reject') {
            if (!reason) return res.status(400).json({ error: 'Rejection reason required' });

            // 1. Add comment explaining rejection
            await prisma.taskComment.create({
                data: {
                    taskId: id,
                    content: `<strong>Changes Requested:</strong> ${reason}`,
                    clientId: clientId
                }
            });

            // 2. Set status back to in-progress
            await prisma.task.update({
                where: { id },
                data: { status: 'in-progress' }
            });
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        // Real-time Update
        NotificationService.emitProjectUpdate(task.projectId, 'TASK_UPDATED', { ...task, status: newStatus });

        // Trigger Automation
        const newStatus = action === 'approve' ? 'done' : 'in-progress';
        if (task.status !== newStatus) {
            await AutomationService.evaluateRules(task.projectId, 'TASK_STATUS_CHANGE', {
                taskId: id,
                projectId: task.projectId,
                oldStatus: task.status,
                newStatus: newStatus,
                taskTitle: task.title,
                assigneeEmail: task.assignee?.email || undefined
            });

            // Record History
            await HistoryService.recordTaskChanges(
                id,
                task,
                { ...task, status: newStatus },
                req.clientId!,
                'client'
            );
        }

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

export const getPortalTaskHistory = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId!;

        // Verify Access
        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!task || task.project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const history = await prisma.taskHistory.findMany({
            where: { taskId: id },
            include: {
                user: { select: { firstName: true } },
                client: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
