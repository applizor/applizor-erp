
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';

export const createProject = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Project', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Project' });
        }

        const { companyId, id: userId } = req.user!;
        const {
            name, description, clientId, status,
            startDate, endDate, budget, isBillable,
            tags, priority
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
            isBillable: isBillable ?? true,
            tags: tags || [],
            priority: priority || 'medium',
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

        const { status, clientId } = req.query;

        // Scope filter not fully implemented in PermissionService for 'Project' yet, 
        // usually needs 'createdBy' or 'members' logic. 
        // For now, let's assume 'all' or company-wide.
        // const scopeFilter = await PermissionService.getScopedWhereClause(...)

        const where: any = { companyId };
        if (status) where.status = status;
        if (clientId) where.clientId = clientId;

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

// Enterprise Upgrade: Detailed Project Stats
export const getProjectById = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Project', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Project' });
        }
        const { id } = req.params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                members: {
                    include: {
                        employee: {
                            select: {
                                id: true, firstName: true, lastName: true,
                                position: { select: { title: true } },
                                // profilePicture: true // Removed: Field does not exist on Employee
                            }
                        }
                    }
                },
                milestones: {
                    include: {
                        tasks: true
                    },
                    orderBy: { dueDate: 'asc' } // Critical Path: Sort by Date
                },
                tasks: {
                    select: { status: true }
                },
                // Include Timesheets for efficiency calculation
                timesheets: {
                    select: { hours: true }
                }
            }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // --- 1. Financial Calculations ---
        const budget = Number(project.budget) || 0;
        const revenue = Number(project.actualRevenue) || 0;
        const expenses = Number(project.actualExpenses) || 0;
        const netProfit = revenue - expenses;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        // --- 2. Efficiency Index & Task Velocity ---
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate total logged hours
        const totalLoggedHours = project.timesheets.reduce((acc, t) => acc + Number(t.hours), 0);

        // Simple Efficiency Score (Example Logic: High completion + Low hours = High Efficiency)
        // Ideally compare vs Estimated Hours. For now, we return raw metrics.
        let efficiencyStatus = 'optimal';
        if (taskCompletionRate < 50 && totalLoggedHours > (budget / 100)) efficiencyStatus = 'at-risk'; // Arbitrary threshold

        // --- 3. Critical Path (Next Milestone) ---
        const futureMilestones = project.milestones.filter(m => m.status !== 'completed' && m.dueDate && new Date(m.dueDate) >= new Date());
        const nextMilestone = futureMilestones.length > 0 ? futureMilestones[0] : null;

        res.json({
            ...project,
            stats: {
                financials: {
                    budget,
                    revenue,
                    expenses,
                    netProfit,
                    margin: Math.round(margin * 100) / 100
                },
                efficiency: {
                    totalTasks,
                    completedTasks,
                    completionRate: Math.round(taskCompletionRate),
                    totalLoggedHours: Math.round(totalLoggedHours * 100) / 100,
                    status: efficiencyStatus
                },
                criticalPath: {
                    nextMilestone
                }
            }
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
        const data = req.body;
        // Prevent companyId update
        delete data.companyId;

        const project = await prisma.project.update({
            where: { id },
            data
        });
        res.json(project);
    } catch (error: any) {
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
        const { title, date, amount } = req.body;
        const milestone = await prisma.milestone.create({
            data: {
                projectId: id,
                title,
                dueDate: date ? new Date(date) : undefined,
                amount
            }
        });
        res.status(201).json(milestone);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create milestone' });
    }
};
