
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';
import fs from 'fs';
import path from 'path';

export const createProject = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Project', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Project' });
        }

        const { companyId, id: userId } = req.user!;
        const {
            name, description, clientId, status,
            startDate, endDate, budget, isBillable,
            tags, priority, currency,
            type, portalConfig // New fields
        } = req.body;

        // Check if creator has an employee record
        const employee = await prisma.employee.findUnique({ where: { userId } });

        const projectData: any = {
            companyId,
            name,
            description,
            clientId,
            status: status || 'planning',
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            budget,
            currency: currency || 'INR',
            isBillable: isBillable ?? true,
            tags: tags || [],
            priority: priority || 'medium',
            settings: type === 'news_cms' ? { type: 'news_cms' } : undefined
        };

        // Only add as member if employee record exists
        if (employee) {
            projectData.members = {
                create: {
                    employeeId: employee.id,
                    role: 'manager'
                }
            };
        }

        const project = await prisma.project.create({
            data: projectData
        });

        // --- Subscription & Billing Logic for News Projects ---
        if (type === 'news_cms' && portalConfig) {
            if (clientId) {
                const { InvoiceService } = await import('../services/invoice.service');
                const planCode = portalConfig.plan || 'basic_monthly';

                const subscriptionPlan = await prisma.subscriptionPlan.findFirst({
                    where: {
                        companyId,
                        code: planCode
                    }
                });

                if (subscriptionPlan && Number(subscriptionPlan.price) > 0) {
                    await InvoiceService.createInvoice({
                        companyId,
                        clientId,
                        invoiceDate: new Date(),
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        items: [{
                            description: `Subscription - ${subscriptionPlan.name} Plan`,
                            quantity: 1,
                            rate: Number(subscriptionPlan.price),
                            taxRateIds: [],
                            discount: 0
                        }],
                        currency: currency || subscriptionPlan.currency || 'USD',
                        type: 'invoice',
                        isRecurring: true,
                        recurringInterval: subscriptionPlan.interval,
                        recurringStartDate: new Date(),
                        notes: 'Subscription for project.',
                        subscriptionDetails: {
                            planId: subscriptionPlan.id,
                            name: `Subscription - ${subscriptionPlan.name}`
                        }
                    });
                }
            }
        }

        res.status(201).json(project);
    } catch (error: any) {
        console.error('Create Project Error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;

        if (!PermissionService.hasBasicPermission(req.user, 'Project', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Project' });
        }

        const { status, clientId, q } = req.query;

        // 1. Determine Scope
        const scope = PermissionService.getPermissionScope(req.user, 'Project', 'read');

        const where: any = { companyId };

        // 2. Apply Scope Filter
        if (!scope.all) {
            // "Owned" and "Added" in Project context means "Is a Member"
            // We need the Employee ID for this check
            const employee = await prisma.employee.findUnique({
                where: { userId: req.user!.id }
            });

            if (employee) {
                // If user is an employee, show projects where they are a member
                where.members = {
                    some: {
                        employeeId: employee.id
                    }
                };
            } else {
                // If user is NOT an employee (and doesn't have 'all' access), they see nothing
                return res.json([]);
            }
        }

        if (status && status !== 'null' && status !== 'undefined') where.status = status;
        if (clientId) where.clientId = clientId;

        // Search Filter (if 'q' is provided)
        if (q) {
            where.OR = [
                { name: { contains: String(q), mode: 'insensitive' } },
                { description: { contains: String(q), mode: 'insensitive' } }
            ];
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                client: { select: { name: true, companyName: true } },
                _count: {
                    select: { tasks: true, members: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(projects);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// --- 2. Get Project by ID (Standard Detail View) ---
export const getProjectById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;

        // 1. Fetch Project with Members & Stats relations
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                client: { select: { companyName: true, name: true } }, // Use name instead of contactPerson
                members: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                userId: true,
                                // designation removed
                                position: { select: { title: true } }
                            }
                        }
                    }
                },
                milestones: {
                    include: { tasks: true },
                    orderBy: { dueDate: 'asc' }
                },
                tasks: { select: { status: true } },
                invoices: { select: { id: true, invoiceNumber: true, invoiceDate: true, total: true, paidAmount: true, status: true, subtotal: true, tax: true } },
                timesheets: { select: { hours: true } },
                _count: { select: { tasks: true } }
            }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // 2. Permission Check (Granular)
        const isSuperAdmin = user.roles.some((r: any) => r.role.name === 'Admin' || r.role.name === 'Super Admin');

        // Default: Hidden
        let canViewBudget = isSuperAdmin;
        let canManageTasks = isSuperAdmin;
        let canManageTeam = isSuperAdmin;

        if (!isSuperAdmin) {
            // Find if this User is linked to any Employee in the project
            // We need to match User -> Employee.id against Member.employeeId
            const userEmployee = await prisma.employee.findFirst({ where: { userId: user.id } });

            let isMember = false;
            // Explicit cast to access relations safely
            const projectAny = project as any;

            if (userEmployee) {
                const memberRecord = projectAny.members.find((m: any) => m.employeeId === userEmployee.id);
                if (memberRecord) {
                    isMember = true;
                    canViewBudget = memberRecord.canViewBudget;
                    canManageTasks = memberRecord.canManageTasks;
                    canManageTeam = memberRecord.canManageTeam;
                }
            }

            if (!isMember) {
                if (!PermissionService.hasBasicPermission(user, 'Project', 'read')) {
                    return res.status(403).json({ error: 'Access denied' });
                }
                // Generic read access (e.g. auditor/observer)
                canViewBudget = false;
                canManageTasks = false;
                canManageTeam = false;
            }
        }

        // 3. Financial Calculations (Masked if needed)
        // Explicit cast for TS to recognize included relations
        const p = project as any;

        let financials: any = {};

        if (canViewBudget) {
            const budget = Number(p.budget) || 0;

            // Calculate revenue from project-linked invoices
            const projectInvoices = p.invoices || [];
            const revenue = projectInvoices.reduce((acc: number, inv: any) => acc + Number(inv.total), 0);
            const baseAmount = projectInvoices.reduce((acc: number, inv: any) => acc + Number(inv.subtotal), 0);
            const taxAmount = projectInvoices.reduce((acc: number, inv: any) => acc + Number(inv.tax), 0);

            const paidAmount = projectInvoices.reduce((acc: number, inv: any) => acc + Number(inv.paidAmount), 0);
            const outstanding = revenue - paidAmount;

            const expenses = Number(p.actualExpenses) || 0;
            const netProfit = baseAmount - expenses; // Profit is usually calculated on base amount
            const margin = baseAmount > 0 ? (netProfit / baseAmount) * 100 : 0;

            // Remaining Budget = Total Budget - Invoiced Base Amount
            const remainingBudget = budget - baseAmount;

            // Get recent transactions (last 5 invoices)
            const recentTransactions = projectInvoices
                .sort((a: any, b: any) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
                .slice(0, 5)
                .map((inv: any) => ({
                    id: inv.id,
                    type: 'invoice',
                    number: inv.invoiceNumber,
                    date: inv.invoiceDate,
                    amount: Number(inv.total),
                    status: inv.status
                }));

            financials = {
                budget,
                revenue,
                baseAmount,
                taxAmount,
                paidAmount,
                outstanding,
                expenses,
                netProfit,
                margin: Math.round(margin * 100) / 100,
                remainingBudget,
                recentTransactions
            };
        } else {
            financials = {
                budget: 0,
                revenue: 0,
                baseAmount: 0,
                taxAmount: 0,
                expenses: 0,
                netProfit: 0,
                margin: 0,
                remainingBudget: 0,
                masked: true // Frontend can show "Restricted"
            };
        }

        // 4. Advanced Analytics (Task Distribution)
        const totalTasks = p.tasks.length;
        const statusDistribution = p.tasks.reduce((acc: any, t: any) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {});

        // Fetch tasks with more detail for priority/assignee distribution
        const detailedTasks = await prisma.task.findMany({
            where: { projectId: id },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                _count: { select: { comments: true } }
            }
        });

        const priorityDistribution = detailedTasks.reduce((acc: any, t: any) => {
            acc[t.priority] = (acc[t.priority] || 0) + 1;
            return acc;
        }, {});

        const assigneeDistribution = detailedTasks.reduce((acc: any, t: any) => {
            const name = t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});

        // 5. Recent Activity Feed (Compiled from History, Comments, Milestones)
        const [history, comments, recentMilestones] = await Promise.all([
            prisma.taskHistory.findMany({
                where: { task: { projectId: id } },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { user: { select: { firstName: true, lastName: true } }, task: { select: { title: true } } }
            }),
            prisma.taskComment.findMany({
                where: { task: { projectId: id } },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { user: { select: { firstName: true, lastName: true } }, task: { select: { title: true } } }
            }),
            prisma.milestone.findMany({
                where: { projectId: id },
                orderBy: { updatedAt: 'desc' },
                take: 5
            })
        ]);

        const activityFeed = [
            ...history.map(h => ({
                id: h.id,
                type: 'history',
                user: h.user ? `${h.user.firstName} ${h.user.lastName}` : 'System',
                action: `updated ${h.field}`,
                taskTitle: h.task.title,
                taskId: h.taskId,
                oldValue: h.oldValue,
                newValue: h.newValue,
                createdAt: h.createdAt
            })),
            ...comments.map(c => ({
                id: c.id,
                type: 'comment',
                user: c.user ? `${c.user.firstName} ${c.user.lastName}` : 'External',
                action: 'commented on',
                taskTitle: c.task.title,
                taskId: c.taskId,
                createdAt: c.createdAt
            })),
            ...recentMilestones.map(m => ({
                id: m.id,
                type: 'milestone',
                user: 'System',
                action: `milestone ${m.status}`,
                milestoneTitle: m.title,
                createdAt: m.updatedAt
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);

        // 6. Efficiency Metrics & Health
        const completedTasks = p.tasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const totalLoggedHours = p.timesheets.reduce((acc: number, t: any) => acc + Number(t.hours), 0);

        let efficiencyStatus = 'optimal';
        const safeBudget = Number(p.budget) || 10000;
        if (taskCompletionRate < 50 && totalLoggedHours > (safeBudget / 100)) efficiencyStatus = 'at-risk';

        // 7. Critical Path
        const futureMilestones = p.milestones.filter((m: any) => m.status !== 'completed' && m.dueDate && new Date(m.dueDate) >= new Date());
        const nextMilestone = futureMilestones.length > 0 ? futureMilestones[0] : null;

        res.json({
            ...p,
            budget: canViewBudget ? p.budget : 0,
            actualRevenue: canViewBudget ? p.actualRevenue : 0,
            actualExpenses: canViewBudget ? p.actualExpenses : 0,
            stats: {
                financials,
                efficiency: {
                    totalTasks,
                    completedTasks,
                    completionRate: Math.round(taskCompletionRate),
                    totalLoggedHours: Math.round(totalLoggedHours * 100) / 100,
                    status: efficiencyStatus,
                    statusDistribution,
                    priorityDistribution,
                    assigneeDistribution
                },
                criticalPath: {
                    nextMilestone
                }
            },
            activityFeed,
            permissions: { canViewBudget, canManageTasks, canManageTeam }
        });

    } catch (error: any) {
        console.error("Get Project Details Error:", error);
        res.status(500).json({ error: 'Failed to fetch project details' });
    }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Project', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Project' });
        }
        const { id } = req.params;
        const {
            name, description, status,
            startDate, endDate, budget, isBillable,
            tags, priority, currency
        } = req.body;

        const data: any = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (status !== undefined) data.status = status;
        if (budget !== undefined) data.budget = Number(budget);
        if (isBillable !== undefined) data.isBillable = isBillable;
        if (tags !== undefined) data.tags = tags;
        if (priority !== undefined) data.priority = priority;
        if (currency !== undefined) data.currency = currency;

        // Correctly parse dates to Avoid Prisma 'premature end of input' or validation errors
        if (startDate !== undefined) {
            data.startDate = (startDate && startDate.trim() !== "") ? new Date(startDate) : null;
        }
        if (endDate !== undefined) {
            data.endDate = (endDate && endDate.trim() !== "") ? new Date(endDate) : null;
        }

        const project = await prisma.project.update({
            where: { id },
            data
        });
        res.json(project);
    } catch (error: any) {
        console.error("Update Project Error:", error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Project', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Project' });
        }
        const { id } = req.params;
        await prisma.project.delete({ where: { id } });
        res.json({ message: 'Project deleted' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

// --- Sub-Resources ---

export const addProjectMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { employeeId, role } = req.body;

        const member = await prisma.projectMember.create({
            data: {
                projectId: id,
                employeeId,
                role
            }
        });
        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add member' });
    }
};

export const removeProjectMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id, memberId } = req.params;
        // memberId is actually the ProjectMember ID? Or EmployeeID? 
        // Let's assume the router passes the ProjectMember ID or we find by EmployeeID.
        // For simplicity, let's assume `memberId` param is the ProjectMember.id
        await prisma.projectMember.delete({ where: { id: memberId } });
        res.json({ message: 'Member removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

export const createMilestone = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // projectId
        const { title, date, amount, currency } = req.body;
        const milestone = await prisma.milestone.create({
            data: {
                projectId: id,
                title,
                dueDate: date ? new Date(date) : undefined,
                amount,
                currency: currency || 'INR'
            }
        });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(id, 'MILESTONE_CREATED', milestone);

        res.status(201).json(milestone);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create milestone' });
    }
};

// --- Project Notes (Wiki) ---

export const getProjectNotes = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const notes = await prisma.projectNote.findMany({
            where: { projectId: id },
            orderBy: { updatedAt: 'desc' },
            include: { creator: { select: { firstName: true, lastName: true } } }
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
};

export const createProjectNote = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, content, isPinned } = req.body;
        const note = await prisma.projectNote.create({
            data: {
                projectId: id,
                title,
                content,
                isPinned: isPinned || false,
                createdBy: req.user!.id
            }
        });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(id, 'NOTE_CREATED', note);

        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create note' });
    }
};

export const updateProjectNote = async (req: AuthRequest, res: Response) => {
    try {
        const { noteId } = req.params;
        const { title, content, isPinned } = req.body;
        const note = await prisma.projectNote.update({
            where: { id: noteId },
            data: { title, content, isPinned }
        });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update note' });
    }
};

// --- Project Documents (Files) ---

export const getProjectDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const documents = await prisma.document.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' },
            include: { employee: { select: { firstName: true, lastName: true } } }
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

export const uploadProjectDocument = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { id } = req.params; // projectId
        const { category, tags } = req.body;

        const document = await prisma.document.create({
            data: {
                project: { connect: { id } },
                name: req.file.originalname,
                type: 'project_file', // Generic type
                category: category || 'General',
                filePath: req.file.path,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                company: { connect: { id: req.user!.companyId } },
                employee: { connect: { id: req.user!.employeeId! } }, // Assuming linked employee
                tags: tags ? JSON.parse(tags) : []
            }
        });

        res.status(201).json(document);
    } catch (error: any) {
        console.error("Upload Error", error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

export const deleteProjectDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { docId } = req.params;
        const document = await prisma.document.findUnique({ where: { id: docId } });

        if (!document) return res.status(404).json({ error: 'Document not found' });

        // Delete file from filesystem
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        await prisma.document.delete({ where: { id: docId } });
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

// --- Sprints ---

export const getSprints = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sprints = await prisma.sprint.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { tasks: true } }
            }
        });
        res.json(sprints);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sprints' });
    }
};

export const createSprint = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, goal, startDate, endDate } = req.body;
        const sprint = await prisma.sprint.create({
            data: {
                projectId: id,
                name,
                goal,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: 'future'
            }
        });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(id, 'SPRINT_CREATED', sprint);

        res.status(201).json(sprint);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create sprint' });
    }
};

export const updateSprint = async (req: AuthRequest, res: Response) => {
    try {
        const { sprintId } = req.params;
        const { name, goal, startDate, endDate, status } = req.body;
        const sprint = await prisma.sprint.update({
            where: { id: sprintId },
            data: {
                name,
                goal,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                status
            }
        });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(sprint.projectId, 'SPRINT_UPDATED', sprint);

        res.json(sprint);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update sprint' });
    }
};

export const deleteSprint = async (req: AuthRequest, res: Response) => {
    try {
        const { sprintId } = req.params;

        const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
        if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

        // Unassign all tasks from this sprint before deleting
        await prisma.task.updateMany({
            where: { sprintId },
            data: { sprintId: null }
        });

        await prisma.sprint.delete({ where: { id: sprintId } });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(sprint.projectId, 'SPRINT_DELETED', { id: sprintId, projectId: sprint.projectId });

        res.json({ message: 'Sprint deleted' });
    } catch (error) {
        console.error('Delete Sprint Error:', error);
        res.status(500).json({ error: 'Failed to delete sprint' });
    }
};

// --- Epics ---

export const getEpics = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const epics = await prisma.epic.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { tasks: true } }
            }
        });
        res.json(epics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch epics' });
    }
};

export const createEpic = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, color } = req.body;
        const epic = await prisma.epic.create({
            data: {
                projectId: id,
                title,
                description,
                color: color || '#64748b'
            }
        });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(id, 'EPIC_CREATED', epic);

        res.status(201).json(epic);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create epic' });
    }
};

export const updateEpic = async (req: AuthRequest, res: Response) => {
    try {
        const { epicId } = req.params;
        const { title, description, color, status } = req.body;
        const epic = await prisma.epic.update({
            where: { id: epicId },
            data: { title, description, color, status }
        });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(epic.projectId, 'EPIC_UPDATED', epic);

        res.json(epic);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update epic' });
    }
};

export const deleteEpic = async (req: AuthRequest, res: Response) => {
    try {
        const { epicId } = req.params;
        const epic = await prisma.epic.findUnique({ where: { id: epicId } });
        if (!epic) return res.status(404).json({ error: 'Epic not found' });

        // Unassign all tasks from this epic
        await prisma.task.updateMany({
            where: { epicId },
            data: { epicId: null }
        });

        await prisma.epic.delete({ where: { id: epicId } });

        // Real-time Update
        const { NotificationService } = await import('../services/notification.service');
        NotificationService.emitProjectUpdate(epic.projectId, 'EPIC_DELETED', { id: epicId, projectId: epic.projectId });

        res.json({ message: 'Epic deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete epic' });
    }
};

// --- SOW Generation (Global Letterhead Standard) ---

export const generateSOW = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user!;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                company: true
            }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // 1. Fetch SOW Template (or fallback)
        let htmlContent = '';
        const template = await prisma.documentTemplate.findFirst({
            where: {
                companyId: user.companyId,
                type: 'sow',
                isActive: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (template) {
            htmlContent = template.content || '';
        } else {
            htmlContent = `
                <div style="font-family: 'Inter', sans-serif; padding: 40px; color: #333;">
                    <h1 style="text-align: center; color: #1e40af; margin-bottom: 20px;">STATEMENT OF WORK</h1>
                    <h3 style="text-align: center; color: #64748b; margin-bottom: 40px;">${project.name}</h3>
                    
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Client:</strong> ${project.client?.companyName || 'N/A'}</p>
                    <p><strong>Project ID:</strong> ${project.id.slice(0, 8).toUpperCase()}</p>
                    
                    <h4 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px;">1. SCOPE OF SERVICES</h4>
                    <p>${project.description || 'As discussed and agreed upon.'}</p>
                    
                    <h4 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px;">2. TIMELINE</h4>
                    <p>Start Date: <strong>${project.startDate ? project.startDate.toLocaleDateString() : 'TBD'}</strong></p>
                    <p>End Date: <strong>${project.endDate ? project.endDate.toLocaleDateString() : 'TBD'}</strong></p>
                    
                    <h4 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px;">3. INVESTMENT</h4>
                    <p>Total Budget: <strong>${project.budget ? project.currency + ' ' + project.budget : 'Time & Materials'}</strong></p>
                    
                    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                        <div>
                            <p>__________________________</p>
                            <p><strong>${project.company.name}</strong></p>
                        </div>
                        <div>
                            <p>__________________________</p>
                            <p><strong>${project.client?.companyName || 'Client Representative'}</strong></p>
                        </div>
                    </div>
                </div>
            `;
        }

        if (!project.client) {
            console.warn('SOW Generation Warning: Project has no client');
        }

        // 2. Data Preparation
        const data = {
            company: project.company,
            useLetterhead: true, // MANDATORY RULE
            project: {
                ...project,
                clientName: project.client?.companyName || ''
            },
            client: project.client || {}
        };

        // 3. Generate PDF
        const { PDFService } = await import('../services/pdf.service');
        const pdfBuffer = await PDFService.generateGenericPDF(htmlContent, data);

        // 4. Return
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=SOW_${project.name}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate SOW Error:', error);
        res.status(500).json({ error: 'Failed to generate SOW' });
    }
};
