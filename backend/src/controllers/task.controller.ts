import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';
import { AutomationService } from '../services/automation.service';
import { HistoryService } from '../services/history.service';
import { NotificationService } from '../services/notification.service';
import { StorageService } from '../services/storage.service';
import { TeamsService } from '../services/teams.service';

// Basic Teams Webhook Stub
// In a real app, this would be a proper service capable of sending rich cards
const notifyTeams = async (webhookUrl: string, message: string) => {
    // console.log(`[Teams Notification] To: ${webhookUrl} | Msg: ${message}`);
    // Implementation would use axios.post(webhookUrl, { text: message });
};

export const uploadTaskDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        const task = await prisma.task.findFirst({
            where: {
                id,
                OR: [
                    { project: { companyId: req.user!.companyId } },
                    { projectId: null, creator: { companyId: req.user!.companyId } }
                ]
            },
            select: { id: true, projectId: true }
        });

        if (!task) return res.status(404).json({ error: 'Task not found' });

        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'update');
        if (!scope.all && !scope.owned && !scope.added) {
             return res.status(403).json({ error: 'Access denied: You do not have permission to update this task' });
        }

        const files = req.files as Express.Multer.File[];
        const uploadedDocuments = await Promise.all(files.map(async (file) => {
            const fileName = `tasks/${task.id}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
            const fileUrl = await StorageService.uploadFile(file.buffer, fileName, file.mimetype);

            const employeeId = req.user?.employee?.id;

            const documentData: any = {
                taskId: task.id,
                name: file.originalname,
                type: 'task_attachment',
                filePath: fileUrl,
                fileSize: file.size,
                mimeType: file.mimetype,
                companyId: req.user!.companyId,
                employeeId: employeeId || undefined,
                uploadedById: req.user!.id
            };
            if (task.projectId) {
                documentData.projectId = task.projectId;
            }

            return prisma.document.create({ data: documentData });
        }));

        if (task.projectId) {
            NotificationService.emitProjectUpdate(task.projectId, 'TASK_UPDATED', task, req.user!.companyId);
        }

        res.status(201).json(uploadedDocuments);
    } catch (error) {
        console.error("Upload Task Document Error:", error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const {
            projectId, title, description, status, priority, type, tags,
            assigneeId, assigneeIds, dueDate, milestoneId,
            storyPoints, parentId, epicId, sprintId, startDate, position
        } = req.body;

        const parsedAssigneeIds = typeof assigneeIds === 'string'
            ? (() => { try { return JSON.parse(assigneeIds); } catch { return assigneeIds ? [assigneeIds] : []; } })()
            : (Array.isArray(assigneeIds) ? assigneeIds : []);
        const assigneeList = parsedAssigneeIds.length > 0
            ? parsedAssigneeIds.filter(Boolean)
            : (assigneeId ? [assigneeId] : []);
        const primaryAssigneeId = assigneeList[0] || null;

        // Verify Project Access - allow if user has ProjectTask create permission OR project access
        const taskCreateScope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'create');
        if (projectId) {
            const hasProjectAccess = await PermissionService.checkProjectAccess(req.user!.id, projectId, 'edit');
            if (!taskCreateScope.all && !taskCreateScope.owned && !taskCreateScope.added && !hasProjectAccess) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
        } else if (!taskCreateScope.all && !taskCreateScope.owned && !taskCreateScope.added) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const task = await prisma.task.create({
            data: {
                projectId: projectId || null,
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
                assignedToId: primaryAssigneeId,
                assignees: assigneeList.length > 0 ? {
                    createMany: { data: assigneeList.map((uid: string) => ({ userId: uid })) }
                } : undefined,
                milestoneId: milestoneId || null,
                sprintId: sprintId || null,
                parentId: parentId || null,
                epicId: epicId || null
            },
            include: {
                assignee: { select: { firstName: true, lastName: true, email: true } },
                assignees: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
                epic: { select: { title: true } },
                parent: { select: { title: true } }
            }
        });

        // Handle Attachments if any (middleware puts them in req.files)
        if (req.files && Array.isArray(req.files)) {
            const files = req.files as Express.Multer.File[];
            await Promise.all(files.map(async (file) => {
                const fileName = `tasks/${task.id}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
                const fileUrl = await StorageService.uploadFile(file.buffer, fileName, file.mimetype);

                const documentData: any = {
                    taskId: task.id,
                    name: file.originalname,
                    type: 'task_attachment',
                    filePath: fileUrl,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    companyId: req.user!.companyId,
                    employeeId: req.user?.employee?.id || undefined
                };
                if (task.projectId) {
                    documentData.projectId = task.projectId;
                }

                return prisma.document.create({
                    data: documentData
                });
            }));
        }

        // Evaluate Automation Rules
        if (task.projectId) {
            AutomationService.evaluateRules(task.projectId, 'TASK_CREATED', {
                taskId: task.id,
                projectId: task.projectId,
                taskTitle: title,
                assigneeId: assigneeId || undefined,
                assigneeEmail: task.assignee?.email || undefined,
                assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : undefined,
                companyId: req.user!.companyId,
                newStatus: status || 'todo',
                description: description || undefined,
                creatorName: `${req.user!.firstName} ${req.user!.lastName}`,
                priority: task.priority || undefined,
                type: task.type || undefined
            }).catch(err => console.error('Automation error:', err));



            // Trigger TASK_ASSIGNED if assignee was set during creation
            if (primaryAssigneeId) {
                AutomationService.evaluateRules(task.projectId, 'TASK_ASSIGNED', {
                    taskId: task.id,
                    projectId: task.projectId,
                    taskTitle: title,
                    assigneeId: primaryAssigneeId,
                    assigneeEmail: task.assignee?.email || undefined,
                    assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : undefined,
                    companyId: req.user!.companyId,
                    description: description || undefined,
                    creatorName: `${req.user!.firstName} ${req.user!.lastName}`,
                    priority: task.priority || undefined,
                    type: task.type || undefined
                }).catch(err => console.error('Assign automation error:', err));
            }

            // Real-time Update
            NotificationService.emitProjectUpdate(task.projectId, 'TASK_CREATED', task, req.user!.companyId);
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

        const taskExists = await prisma.task.findFirst({
            where: { id, OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }] },
            select: { id: true }
        });
        if (!taskExists) return res.status(404).json({ error: 'Task not found' });

        const {
            title, description, status, priority, type, tags,
            assigneeId, assigneeIds, dueDate, milestoneId,
            storyPoints, parentId, epicId, sprintId, startDate, position
        } = req.body;

        const parsedAssigneeIds = typeof assigneeIds === 'string'
            ? (() => { try { return JSON.parse(assigneeIds); } catch { return assigneeIds ? [assigneeIds] : []; } })()
            : (Array.isArray(assigneeIds) ? assigneeIds : undefined);
        const hasAssigneeIds = parsedAssigneeIds !== undefined;
        const assigneeList = hasAssigneeIds
            ? parsedAssigneeIds.filter(Boolean)
            : (assigneeId !== undefined ? (assigneeId ? [assigneeId] : []) : undefined);
        const primaryAssigneeId = assigneeList ? (assigneeList[0] || null) : undefined;

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
        const isPM = oldTask.projectId ? await PermissionService.isProjectManager(userId, oldTask.projectId) : false;

        if (!scope.all && !isPM) {
            const isAssigned = oldTask.assignedToId === userId;
            const isCreator = oldTask.createdById === userId;

            const canEditOwned = scope.owned && (isAssigned || !oldTask.projectId);
            const canEditAdded = scope.added && (isCreator || !oldTask.projectId);

            if (!canEditOwned && !canEditAdded) {
                return res.status(403).json({ error: 'Access denied: You do not have permission to update this task' });
            }
        }

        const [task] = await prisma.$transaction(async (tx) => {
            if (hasAssigneeIds) {
                await tx.taskAssignee.deleteMany({ where: { taskId: id } });
                if (assigneeList.length > 0) {
                    await tx.taskAssignee.createMany({
                        data: assigneeList.map((uid: string) => ({ taskId: id, userId: uid }))
                    });
                }
            }

            const updated = await tx.task.update({
                where: { id },
                data: {
                    title, description, status, priority, type,
                    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
                    storyPoints: storyPoints !== undefined ? parseInt(storyPoints) : undefined,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    startDate: startDate ? new Date(startDate) : undefined,
                    position: position !== undefined ? parseFloat(position) : undefined,
                    assignedToId: primaryAssigneeId,
                    milestoneId: milestoneId !== undefined ? (milestoneId || null) : undefined,
                    sprintId: sprintId !== undefined ? (sprintId || null) : undefined,
                    parentId: parentId !== undefined ? (parentId || null) : undefined,
                    epicId: epicId !== undefined ? (epicId || null) : undefined
                },
                include: {
                    assignee: { select: { firstName: true, lastName: true, email: true } },
                    assignees: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
                    epic: { select: { title: true } },
                    parent: { select: { title: true } },
                    creator: { select: { firstName: true, lastName: true } }
                }
            });

            return [updated];
        });



        // Trigger Automation (Status Change)
        if (oldTask && oldTask.status !== task.status) {
            if (task.projectId) {
                AutomationService.evaluateRules(task.projectId, 'TASK_STATUS_CHANGE', {
                    taskId: task.id,
                    projectId: task.projectId,
                    oldStatus: oldTask.status,
                    newStatus: task.status,
                    taskTitle: task.title,
                    assigneeEmail: task.assignee?.email || undefined,
                    assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : undefined,
                    companyId: req.user!.companyId,
                    description: task.description || undefined,
                    creatorName: task.creator ? `${task.creator.firstName} ${task.creator.lastName}` : undefined,
                    priority: task.priority || undefined,
                    type: task.type || undefined
                }).catch(err => console.error('Status change automation error:', err));
            }
        }

        // Trigger Automation (Assignee Change)
        if (oldTask && oldTask.assignedToId !== task.assignedToId) {
            if (task.projectId) {
                AutomationService.evaluateRules(task.projectId, 'TASK_ASSIGNED', {
                    taskId: task.id,
                    projectId: task.projectId,
                    taskTitle: task.title,
                    assigneeId: task.assignedToId || undefined,
                    oldAssigneeId: oldTask.assignedToId || undefined,
                    assigneeEmail: task.assignee?.email || undefined,
                    assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : undefined,
                    companyId: req.user!.companyId,
                    description: task.description || undefined,
                    creatorName: task.creator ? `${task.creator.firstName} ${task.creator.lastName}` : undefined,
                    priority: task.priority || undefined,
                    type: task.type || undefined
                }).catch(err => console.error('Assignee change automation error:', err));
            }
        }

        // Real-time Update
        if (task.projectId) {
            NotificationService.emitProjectUpdate(task.projectId, 'TASK_UPDATED', task, req.user!.companyId);
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

        const taskExists = await prisma.task.findFirst({
            where: { id, OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }] },
            select: { id: true }
        });
        if (!taskExists) return res.status(404).json({ error: 'Task not found' });

        const task = await prisma.task.findUnique({
            where: { id },
            select: { id: true, projectId: true, assignedToId: true, createdById: true }
        });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const isAssignee = task.assignedToId === req.user!.id
            || !!(await prisma.taskAssignee.findFirst({ where: { taskId: id, userId: req.user!.id } }));

        // Permission Scoping
        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'delete');
        const userId = req.user!.id;
        const isPM = task.projectId ? await PermissionService.isProjectManager(userId, task.projectId) : false;

        if (!scope.all && !isPM) {
            const isAssigned = isAssignee;
            const isCreator = task.createdById === userId;

            const canDeleteOwned = scope.owned && (isAssigned || !task.projectId);
            const canDeleteAdded = scope.added && (isCreator || !task.projectId);

            if (!canDeleteOwned && !canDeleteAdded) {
                return res.status(403).json({ error: 'Access denied: You do not have permission to delete this task' });
            }
        }

        await prisma.task.delete({ where: { id } });

        // Real-time Update
        if (task.projectId) {
            NotificationService.emitProjectUpdate(task.projectId, 'TASK_DELETED', { id, projectId: task.projectId }, req.user!.companyId);
        }

        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

export const getTaskCounts = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, sprintId } = req.query;
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'read');

        // Build base where — same logic as getTasks
        let where: any = {
            OR: [
                { project: { companyId } },
                { projectId: null, creator: { companyId } }
            ]
        };

        if (projectId && projectId !== 'all') {
            where = { projectId: String(projectId) };
        } else if (!scope.all) {
            // Non-admin: only tasks from projects they are a member of
            const employee = await prisma.employee.findUnique({ where: { userId } });
            if (!employee) {
                where = { createdById: userId, projectId: null };
            } else {
                const memberProjects = await prisma.projectMember.findMany({
                    where: { employeeId: employee.id },
                    select: { projectId: true }
                });
                const accessibleProjectIds = memberProjects.map(m => m.projectId);
                where = {
                    OR: [
                        { projectId: { in: accessibleProjectIds } },
                        { projectId: null, createdById: userId }
                    ]
                };
            }
        }

        if (sprintId && sprintId !== 'all') where.sprintId = String(sprintId);

        // Apply same filters as getTasks for accurate counts
        const { type, priority, assigneeId, search } = req.query;
        if (type && type !== 'all') where.type = String(type);
        if (priority && priority !== 'all') where.priority = String(priority);
        if (search) where.title = { contains: String(search), mode: 'insensitive' };
        if (assigneeId && assigneeId !== 'all') {
            const assigneeFilter = assigneeId === 'unassigned'
                ? { assignedToId: null, assignees: { none: {} } }
                : { OR: [{ assignedToId: String(assigneeId) }, { assignees: { some: { userId: String(assigneeId) } } }] };
            where.AND = [where.AND || {}, assigneeFilter];
        }

        const counts = await prisma.task.groupBy({
            by: ['status'],
            where,
            _count: { id: true }
        });

        const result: Record<string, number> = {};
        counts.forEach(c => { result[c.status] = c._count.id; });
        res.json(result);
    } catch (error) {
        console.error('Task counts error:', error);
        res.status(500).json({ error: 'Failed to fetch task counts' });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        console.log('GET /tasks query:', req.query);
        const { projectId, sprintId, assigneeId, type, priority, status, page, limit, search } = req.query;

        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'read');
        const userId = req.user!.id;
        const companyId = req.user!.companyId;

        const effectivePage = parseInt(page as string) || 1;
        const effectiveLimit = parseInt(limit as string) || 50;
        const skip = (effectivePage - 1) * effectiveLimit;

        let where: any = {
            OR: [
                { project: { companyId } }, // Tasks belonging to projects within the user's company
                { projectId: null, creator: { companyId } } // Tasks not tied to a project, but created by someone in the company
            ]
        };

        // Apply global filters
        if (sprintId && sprintId !== 'all') where.sprintId = String(sprintId);
        if (type && type !== 'all') where.type = String(type);
        if (priority && priority !== 'all') where.priority = String(priority);
        if (search) {
            where.title = { contains: String(search), mode: 'insensitive' };
        }

        const assigneeFilter = assigneeId && assigneeId !== 'all' ? (
            assigneeId === 'unassigned'
                ? { assignedToId: null, assignees: { none: {} } }
                : { OR: [{ assignedToId: String(assigneeId) }, { assignees: { some: { userId: String(assigneeId) } } }] }
        ) : null;
        if (assigneeFilter) {
            where.AND = [where.AND || {}, assigneeFilter];
        }

        // Apply status filter if provided
        if (status && status !== 'all') {
            where.status = String(status);
        }

        // --- Permission-based project filtering ---
        // If projectId is specifically requested and not 'all', filter by that project
        if (projectId && projectId !== 'all') {
            where.projectId = String(projectId);
            // Additionally, ensure this specific project is accessible based on scope
            if (!scope.all) {
                const employee = await prisma.employee.findUnique({ where: { userId } });
                if (!employee) return res.json({ tasks: [], pagination: { totalPages: 0, totalTasks: 0 } });

                const memberProject = await prisma.projectMember.findFirst({
                    where: { employeeId: employee.id, projectId: String(projectId) },
                    select: { projectId: true, role: true }
                });

                if (!memberProject) {
                    // Not a member of this specific project, so no access
                    return res.json({ tasks: [], pagination: { totalPages: 0, totalTasks: 0 } });
                }
                // If a member, further task-level permissions (owned/added) will be applied below
            }
        } else if (!scope.all) {
            // For non-admin/non-superadmin users, if 'all projects' or no project specified,
            // filter tasks by projects they are a member of.
            const employee = await prisma.employee.findUnique({ where: { userId } });
            if (!employee) {
                // If user is not an employee, they can only see tasks they created
                where.createdById = userId;
                where.projectId = null; // And only if task is not part of any project
            } else {
                const memberProjects = await prisma.projectMember.findMany({
                    where: { employeeId: employee.id },
                    select: { projectId: true }
                });
                const accessibleProjectIds = memberProjects.map(m => m.projectId);

                // Allow tasks from accessible projects OR tasks not in a project created by the user
                where.OR = [
                    { projectId: { in: accessibleProjectIds } },
                    { projectId: null, createdById: userId }
                ];
            }
        }
        // If scope.all is true, no project-level filtering needed beyond initial companyId

        // Apply task-level permissions (owned/added) if not 'all' access and not filtering by a specific project they manage
        if (!scope.all && (!projectId || projectId === 'all')) {
            const orConditions: any[] = [];
            if (scope.owned) {
                orConditions.push({ assignedToId: userId });
                orConditions.push({ assignees: { some: { userId } } });
                orConditions.push({ assignedToId: null });
            }
            if (scope.added) {
                orConditions.push({ createdById: userId });
            }
            if (orConditions.length > 0) {
                where.AND = [where.AND || {}, { OR: orConditions }];
            } else if (!scope.all) {
                // If no conditions match and not all scope, return empty result
                return res.json({ tasks: [], pagination: { totalPages: 0, totalTasks: 0 } });
            }
        }

        // Count total tasks for pagination
        const totalTasks = await prisma.task.count({ where });
        const totalPages = Math.ceil(totalTasks / effectiveLimit);

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { position: 'asc' },
            skip,
            take: effectiveLimit,
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, firstName: true, lastName: true } },
                assignees: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
                epic: { select: { id: true, title: true } },
                _count: { select: { comments: true, documents: true, subtasks: true } },
                comments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { clientId: true, userId: true }
                }
            }
        });

        const tasksWithUnansweredComments = tasks.map(task => {
            const lastComment = task.comments[0];
            const hasUnansweredComment = lastComment ? lastComment.clientId !== null && lastComment.userId === null : false;
            const { comments, ...rest } = task as any;
            return { ...rest, hasUnansweredComment };
        });

        res.json({
            tasks: tasksWithUnansweredComments,
            pagination: {
                totalTasks,
                totalPages,
                currentPage: effectivePage,
                hasNextPage: effectivePage < totalPages,
                hasPrevPage: effectivePage > 1
            }
        });

    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'read');
        const userId = req.user!.id;

        const task = await prisma.task.findFirst({
            where: { id, OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }] },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true } },
                assignees: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
                epic: true,
                subtasks: {
                    include: {
                        assignee: { select: { id: true, firstName: true, lastName: true } },
                        assignees: { include: { user: { select: { id: true, firstName: true, lastName: true } } } }
                    },
                    orderBy: { position: 'asc' }
                },
                parent: { select: { id: true, title: true } },
                creator: { select: { id: true, firstName: true, lastName: true } },
                clientCreator: { select: { id: true, name: true } },
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

        // Enforce same scope visibility check for individual task access (Admin or PM bypass)
        if (!scope.all) {
            const isPM = task.projectId ? await PermissionService.isProjectManager(userId, task.projectId) : false;
            if (!isPM) {
                const isAssigned = task.assignedToId === userId;
                const isUnassigned = task.assignedToId === null;
                const isCreator = task.createdById === userId;
                const isInAssignees = task.assignees?.some((a: any) => a.user?.id === userId);

                const canSeeByOwned = scope.owned && (isAssigned || isUnassigned || isInAssignees);
                const canSeeByAdded = scope.added && isCreator;

                if (!canSeeByOwned && !canSeeByAdded) {
                    return res.status(403).json({ error: 'Access denied: You do not have permission to view this task' });
                }
            }
        }

        // Resolve URLs for task attachments (handles S3/local paths dynamically)
        if (task.documents && Array.isArray(task.documents)) {
            for (const doc of task.documents) {
                if (doc.filePath) {
                    doc.filePath = await StorageService.getFileUrl(doc.filePath, req.user!.companyId);
                }
            }
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task details' });
    }
};

export const bulkUpdateTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { taskIds, status } = req.body;
        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ error: 'Invalid task IDs' });
        }
        if (!status) return res.status(400).json({ error: 'Status required' });

        const userId = req.user!.id;

        // Verify permissions for each task
        const tasks = await prisma.task.findMany({
            where: {
                id: { in: taskIds },
                OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }]
            },
            select: { id: true, projectId: true, assignedToId: true, createdById: true }
        });

        for (const task of tasks) {
            const isPM = task.projectId ? await PermissionService.isProjectManager(userId, task.projectId) : false;
            const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'update');
            if (!scope.all && !isPM) {
                const isAssigned = task.assignedToId === userId;
                const isCreator = task.createdById === userId;
                if (!((scope.owned && (isAssigned || !task.projectId)) || (scope.added && (isCreator || !task.projectId)))) {
                    return res.status(403).json({ error: `Permission denied for task ${task.id}` });
                }
            }
        }

        await prisma.task.updateMany({
            where: {
                id: { in: taskIds },
                OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }]
            },
            data: { status }
        });

        res.json({ message: 'Bulk update successful' });
    } catch (error) {
        console.error("Bulk Update Error:", error);
        res.status(500).json({ error: 'Failed to bulk update tasks' });
    }
};

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // taskId

        const taskExists = await prisma.task.findFirst({
            where: { id, OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }] },
            select: { id: true }
        });
        if (!taskExists) return res.status(404).json({ error: 'Task not found' });

        const { content, parentId, isInternal } = req.body;

        // Flatten logic: If parentId is provided, ensure it's the absolute root parent
        let finalParentId = parentId || null;
        if (finalParentId) {
            const parentComment = await prisma.taskComment.findUnique({
                where: { id: finalParentId },
                select: { parentId: true }
            });
            // If the parent already has a parent, use that grandparent (or higher)
            if (parentComment && parentComment.parentId) {
                finalParentId = parentComment.parentId;
            }
        }

        const comment = await prisma.taskComment.create({
            data: {
                taskId: id,
                content,
                parentId: finalParentId,
                isInternal: isInternal === undefined ? true : !!isInternal, // Default to internal for admin-side
                userId: req.user!.id
            },
            include: {
                user: { select: { firstName: true, lastName: true } },
                client: { select: { name: true, email: true } }
            }
        });

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                project: true,
                assignee: { select: { id: true, email: true, firstName: true } },
                assignees: { include: { user: { select: { id: true, email: true, firstName: true } } } },
                creator: { select: { firstName: true, lastName: true } }
            }
        });

        if (task) {
            if (task.projectId) {
                NotificationService.emitProjectUpdate(task.projectId, 'COMMENT_ADDED', { taskId: id, comment }, req.user!.companyId);

                // Trigger COMMENT_ADDED automation rules
                const { AutomationService } = await import('../services/automation.service');
                const allAssigneeEmails = [
                    ...(task.assignee?.email ? [task.assignee.email] : []),
                    ...(task.assignees?.map((a: any) => a.user?.email).filter(Boolean) || [])
                ].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
                AutomationService.evaluateRules(task.projectId, 'COMMENT_ADDED', {
                    taskId: id,
                    projectId: task.projectId,
                    taskTitle: task.title,
                    commenterName: `${(req.user as any).firstName} ${(req.user as any).lastName}`,
                    commentContent: content,
                    assigneeEmail: allAssigneeEmails[0] || task.assignee?.email || undefined,
                    assigneeId: task.assignedToId || undefined,
                    companyId: (req.user as any).companyId,
                    description: task.description || undefined,
                    creatorName: task.creator ? `${task.creator.firstName} ${task.creator.lastName}` : undefined,
                    priority: task.priority || undefined,
                    type: task.type || undefined
                }).catch(err => console.error('Comment automation error:', err));
            }

            // Handle Mentions
            const commenterName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;
            NotificationService.handleMentions(content, commenterName, task, task.project ?? undefined, (req.user as any).companyId);
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

export const getComments = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // taskId

        const taskExists = await prisma.task.findFirst({
            where: { id, OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }] },
            select: { id: true }
        });
        if (!taskExists) return res.status(404).json({ error: 'Task not found' });

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

        const taskExists = await prisma.task.findFirst({
            where: { id, OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }] },
            select: { id: true }
        });
        if (!taskExists) return res.status(404).json({ error: 'Task not found' });

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

export const deleteTaskComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id, commentId } = req.params;
        const userId = req.user!.id;

        const comment = await prisma.taskComment.findFirst({
            where: { id: commentId, task: { OR: [{ project: { companyId: req.user!.companyId } }, { projectId: null, creator: { companyId: req.user!.companyId } }] } },
        });

        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        // Permission Check: Owner OR 'delete: all'
        const isOwner = comment.userId === userId;
        const scope = PermissionService.getPermissionScope(req.user, 'ProjectTask', 'delete');

        if (!isOwner && !scope.all) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.taskComment.delete({ where: { id: commentId } });

        // Emit Real-time Event
        const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
        if (task && task.projectId) {
            NotificationService.emitProjectUpdate(task.projectId, 'COMMENT_DELETED', { taskId: id, commentId }, req.user!.companyId);
        }

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};

export const getMyTaskAnalysis = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { assignedToId: userId },
                    { assignees: { some: { userId } } }
                ],
                project: { companyId: req.user!.companyId }
            },
            include: { project: { select: { name: true } } }
        });

        const now = new Date();
        const stats = {
            total: tasks.length,
            todo: tasks.filter(t => t.status === 'todo').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            overdue: tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now).length,
            highPriority: tasks.filter(t => t.priority === 'high').length,
            lowPriority: tasks.filter(t => t.priority === 'low').length,
            mediumPriority: tasks.filter(t => t.priority === 'medium').length,
        };

        // Project Distribution
        const projectMap: Record<string, number> = {};
        tasks.forEach(t => {
            if (t.project?.name) {
                projectMap[t.project.name] = (projectMap[t.project.name] || 0) + 1;
            }
        });

        const projectData = Object.entries(projectMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Recent Updates
        const recentTasks = tasks
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 5)
            .map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                updatedAt: t.updatedAt,
                projectName: t.project?.name,
                projectId: t.projectId
            }));

        res.json({ stats, projectData, recentTasks });
    } catch (error) {
        console.error("Task Analysis Error:", error);
        res.status(500).json({ error: 'Failed to fetch task analysis' });
    }
};
