import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

// Create Team
export const createTeam = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'EmployeeTeam', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for EmployeeTeam' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Team name is required' });

        const team = await prisma.employeeTeam.create({
            data: {
                companyId: user.companyId,
                name,
                description,
            },
        });

        res.status(201).json(team);
    } catch (error: any) {
        console.error('Create team error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Team with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create team', details: error.message });
    }
};

// Get All Teams
export const getTeams = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        const scope = PermissionService.getPermissionScope(req.user, 'EmployeeTeam', 'read');
        if (!scope.all && !scope.owned && !scope.added) {
            return res.status(403).json({ error: 'Access denied: No read rights for EmployeeTeam' });
        }

        const teams = await prisma.employeeTeam.findMany({
            where: { companyId: user.companyId },
            include: {
                _count: { select: { members: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(teams);
    } catch (error: any) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
};

// Get Single Team with Members
export const getTeamWithMembers = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        const team = await prisma.employeeTeam.findFirst({
            where: {
                id,
                companyId: req.user!.companyId
            },
            include: {
                members: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                position: { select: { title: true } },
                                department: { select: { name: true } }
                            }
                        }
                    },
                    orderBy: { joinedAt: 'desc' }
                }
            }
        });

        if (!team) return res.status(404).json({ error: 'Team not found' });
        res.json(team);
    } catch (error: any) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
};

// Update Team
export const updateTeam = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'EmployeeTeam', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for EmployeeTeam' });
        }

        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const existing = await prisma.employeeTeam.findFirst({
            where: { id, companyId: req.user!.companyId }
        });
        if (!existing) return res.status(404).json({ error: 'Team not found' });

        const team = await prisma.employeeTeam.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(isActive !== undefined ? { isActive } : {}),
            },
        });

        res.json(team);
    } catch (error: any) {
        console.error('Update team error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Team with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to update team' });
    }
};

// Delete Team
export const deleteTeam = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'EmployeeTeam', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for EmployeeTeam' });
        }

        const { id } = req.params;
        const existing = await prisma.employeeTeam.findFirst({
            where: { id, companyId: req.user!.companyId }
        });
        if (!existing) return res.status(404).json({ error: 'Team not found' });

        await prisma.employeeTeam.delete({ where: { id } });
        res.json({ message: 'Team deleted' });
    } catch (error: any) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
};

// Add Member to Team
export const addTeamMember = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'EmployeeTeam', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for EmployeeTeam' });
        }

        const { id: teamId } = req.params;
        const { employeeId } = req.body;
        if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });

        const team = await prisma.employeeTeam.findFirst({
            where: { id: teamId, companyId: req.user!.companyId }
        });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const member = await prisma.employeeTeamMember.create({
            data: { teamId, employeeId },
            include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } }
        });

        res.status(201).json(member);
    } catch (error: any) {
        console.error('Add team member error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Employee is already in this team' });
        }
        res.status(500).json({ error: 'Failed to add team member' });
    }
};

// Remove Member from Team
export const removeTeamMember = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'EmployeeTeam', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for EmployeeTeam' });
        }

        const { memberId } = req.params;
        await prisma.employeeTeamMember.delete({ where: { id: memberId } });
        res.json({ message: 'Member removed from team' });
    } catch (error: any) {
        console.error('Remove team member error:', error);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
};
