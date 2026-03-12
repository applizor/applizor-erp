import { Response, Request } from 'express';
import { ClientAuthRequest } from '../middleware/client.auth';
import prisma from '../prisma/client';
import { NotificationService } from '../services/notification.service';
import { AutomationService } from '../services/automation.service';
import { StorageService } from '../services/storage.service';

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
            await Promise.all(files.map(async (file) => {
                const fileName = `tasks/${task.id}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
                const fileUrl = await StorageService.uploadFile(file.buffer, fileName, file.mimetype);

                return prisma.document.create({
                    data: {
                        project: { connect: { id: projectId } },
                        task: { connect: { id: task.id } },
                        name: file.originalname,
                        type: 'task_attachment',
                        filePath: fileUrl,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                        company: { connect: { id: req.client.companyId } },
                        client: { connect: { id: clientId } }
                    }
                });
            }));
        }

        // 4. Trigger Automation (Task Created)
        // Replaces legacy hardcoded email/teams notifications
        AutomationService.evaluateRules(projectId, 'TASK_CREATED', {
            taskId: task.id,
            projectId: projectId,
            taskTitle: task.title,
            companyId: req.client.companyId,
            // Additional context for client created tasks
            description: `Client Report: ${type || 'Issue'}`,
            creatorName: req.client.name
        }).catch(err => console.error('Portal automation error:', err));

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

export const updatePortalTask = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id: taskId } = req.params;
        const clientId = req.clientId!;
        const { title, description } = req.body;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: true }
        });

        if (!task || task.project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (task.status !== 'todo') {
            return res.status(400).json({ error: 'Tasks can only be modified when in to do status' });
        }

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: title !== undefined ? title : task.title,
                description: description !== undefined ? description : task.description
            }
        });

        try {
            const { NotificationService } = await import('../services/notification.service');
            NotificationService.emitProjectUpdate(task.projectId, 'TASK_UPDATED', updated);
        } catch(e) {}

        res.json(updated);
    } catch (error) {
        console.error("Portal: Update Task Error", error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export const getPortalProjectMembers = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const clientId = req.clientId!;

        // Verify Access
        const project = await prisma.project.findFirst({
            where: { id: projectId, clientId }
        });

        if (!project) return res.status(403).json({ error: 'Access denied' });

        const members = await prisma.projectMember.findMany({
            where: { projectId },
            include: {
                employee: {
                    select: { id: true, userId: true, firstName: true, lastName: true, email: true }
                }
            }
        });

        // Map to flat user-like objects for the mention system
        const users = members.map(m => ({
            id: m.employee.userId || m.employee.id, // Fallback to employeeId if no user linked
            firstName: m.employee.firstName,
            lastName: m.employee.lastName,
            email: m.employee.email
        }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch members' });
    }
};

export const uploadPortalTaskDocument = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId!;

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!task || task.project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const files = req.files as Express.Multer.File[];
        const uploadedDocuments = await Promise.all(files.map(async (file) => {
            const fileName = `tasks/${task.id}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
            const fileUrl = await StorageService.uploadFile(file.buffer, fileName, file.mimetype);

            return prisma.document.create({
                data: {
                    project: { connect: { id: task.projectId } },
                    task: { connect: { id: task.id } },
                    name: file.originalname,
                    type: 'task_attachment',
                    filePath: fileUrl,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    company: { connect: { id: req.client.companyId } },
                    client: { connect: { id: clientId } }
                }
            });
        }));

        NotificationService.emitProjectUpdate(task.projectId, 'TASK_UPDATED', task);

        res.status(201).json(uploadedDocuments);

    } catch (error) {
        console.error("Portal: Upload Task Document Error:", error);
        res.status(500).json({ error: 'Failed to upload document' });
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
                    select: { 
                        comments: {
                            where: { isInternal: false }
                        } 
                    }
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
        const { content, parentId } = req.body;
        const clientId = req.clientId!;

        // Verify Task Access via Project
        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!task || task.project.clientId !== clientId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Flatten logic: If parentId is provided, ensure it's the absolute root parent
        let finalParentId = parentId || null;
        if (finalParentId) {
            const parentComment = await prisma.taskComment.findUnique({
                where: { id: finalParentId },
                select: { parentId: true }
            });
            if (parentComment && parentComment.parentId) {
                finalParentId = parentComment.parentId;
            }
        }

        const comment = await prisma.taskComment.create({
            data: {
                taskId: id,
                content,
                parentId: finalParentId,
                clientId: clientId,
                isInternal: false // Client comments are never internal
            },
            include: {
                client: { select: { name: true } },
                user: { select: { firstName: true, lastName: true } }
            }
        });

        // Notify Team
        NotificationService.emitProjectUpdate(task.projectId, 'COMMENT_ADDED', { taskId: id, comment });

        // Handle Mentions (Client mentioning Team)
        const commenterName = `${req.client!.name} (Client)`;
        NotificationService.handleMentions(content, commenterName, task, task.project, task.project.companyId);

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
            where: {
                taskId: id,
                parentId: null, // Only get top-level
                isInternal: false // Hide internal comments from clients
            },
            include: {
                user: { select: { firstName: true, lastName: true } },
                client: { select: { name: true } },
                replies: {
                    where: { isInternal: false }, // Also filter internal replies
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        client: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

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
                    clientId: clientId,
                    isInternal: false
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

        const newStatus = action === 'approve' ? 'done' : 'in-progress';

        // Real-time Update
        NotificationService.emitProjectUpdate(task.projectId, 'TASK_UPDATED', { ...task, status: newStatus });

        // Trigger Automation
        if (task.status !== newStatus) {
            AutomationService.evaluateRules(task.projectId, 'TASK_STATUS_CHANGE', {
                taskId: id,
                projectId: task.projectId,
                oldStatus: task.status,
                newStatus: newStatus,
                taskTitle: task.title,
                assigneeEmail: task.assignee?.email || undefined,
                companyId: clientId // Using client's ID/context or derive company from project
            }).catch(err => console.error('Portal status change automation error:', err));

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
