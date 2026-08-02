import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

export const SYSTEM_MODULES = [
    'Dashboard', 'Company', 'User', 'Role',
    'Client', 'Lead', 'LeadActivity', 'Quotation', 'QuotationTemplate', 'Invoice', 'Payment', 'Subscription', 'Service',
    'Department', 'Position', 'Employee', 'EmployeeTeam', 'Attendance', 'Leave', 'LeaveType', 'LeaveBalance', 'Shift', 'ShiftRoster', 'Payroll', 'Asset',
    'SalaryComponent', 'SalaryStructure', // New Payroll Modules
    'Recruitment', 'RecruitmentBoard',
    'Performance', 'OKR', // Phase B & C
    'Document', 'DocumentTemplate',
    'Project', 'ProjectTask', // Added Project modules
    'Timesheet', // Phase 9
    'Holiday', 'Contract', 'Accounting', 'NewsCMS', 'Policy',
    'Certificate', 'CertificateTemplate', // Certificate System
    'Student', 'Course', 'CourseEnrollment', 'OnlineClass', 'Lecture', 'Exam', // LMS Modules
];

const ACCESS_LEVELS = ['none', 'all', 'added', 'owned', 'added_owned']; // "added_owned" matches "Added & Owned"

// Sync System: Ensure every Role of THIS company has every Module entry.
export const syncPermissions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Role', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Role' });
        }

        const companyId = req.user!.companyId;

        // Only sync roles belonging to this company (or system roles)
        const roles = await prisma.role.findMany({
            where: {
                OR: [
                    { companyId },
                    { isSystem: true, companyId: null }
                ]
            }
        });
        let count = 0;

        for (const role of roles) {
            for (const module of SYSTEM_MODULES) {
                const existing = await prisma.rolePermission.findUnique({
                    where: { roleId_module: { roleId: role.id, module } }
                });

                if (!existing) {
                    await prisma.rolePermission.create({
                        data: {
                            roleId: role.id,
                            module,
                            createLevel: 'none',
                            readLevel: 'none',
                            updateLevel: 'none',
                            deleteLevel: 'none'
                        }
                    });
                    count++;
                }
            }
        }
        res.json({ message: 'Permissions synced successfully', count });
    } catch (error: any) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: 'Failed to sync permissions', details: error.message });
    }
};

// Return Metadata for Frontend Matrix
export const getPermissions = async (req: AuthRequest, res: Response) => {
    try {
        // Authenticated users should be able to get metadata for UI rendering?
        // Or restrict to those who can Read Roles?
        if (!PermissionService.hasBasicPermission(req.user, 'Role', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Instead of DB permissions, we return the Schema Definition
        res.json({
            modules: SYSTEM_MODULES,
            levels: ACCESS_LEVELS
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch permission metadata' });
    }
};

export const getRoles = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Role', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Role' });
        }

        const companyId = req.user!.companyId;

        // Return this company's custom roles + global system roles
        const roles = await prisma.role.findMany({
            where: {
                OR: [
                    { companyId },
                    { isSystem: true, companyId: null }
                ]
            },
            include: {
                _count: {
                    select: { userRoles: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(roles);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

export const createRole = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Role', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Role' });
        }

        const { name, description, permissions } = req.body;
        const companyId = req.user!.companyId;

        if (!name) return res.status(400).json({ error: 'Role name is required' });
        if (!companyId) return res.status(400).json({ error: 'Company ID missing' });

        // Create role scoped to this company
        const role = await prisma.role.create({
            data: {
                name,
                description,
                isSystem: false,
                companyId   // ← tenant-scoped
            }
        });

        // Seed provided permission levels
        if (permissions && Array.isArray(permissions)) {
            for (const p of permissions) {
                if (SYSTEM_MODULES.includes(p.module)) {
                    await prisma.rolePermission.create({
                        data: {
                            roleId: role.id,
                            module: p.module,
                            createLevel: p.createLevel || 'none',
                            readLevel: p.readLevel || 'none',
                            updateLevel: p.updateLevel || 'none',
                            deleteLevel: p.deleteLevel || 'none'
                        }
                    });
                }
            }
        }

        // Auto-fill all remaining modules with 'none'
        for (const module of SYSTEM_MODULES) {
            const exists = await prisma.rolePermission.findUnique({
                where: { roleId_module: { roleId: role.id, module } }
            });
            if (!exists) {
                await prisma.rolePermission.create({
                    data: { roleId: role.id, module, createLevel: 'none', readLevel: 'none', updateLevel: 'none', deleteLevel: 'none' }
                });
            }
        }

        res.json(role);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A role with this name already exists in your company' });
        }
        res.status(500).json({ error: 'Failed to create role', details: error.message });
    }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Role', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Role' });
        }

        const { id } = req.params;
        const { name, description, permissions } = req.body;
        const companyId = req.user!.companyId;

        // Guard: role must belong to this company OR be a system role
        const existingRole = await prisma.role.findFirst({
            where: { id, OR: [{ companyId }, { isSystem: true, companyId: null }] }
        });
        if (!existingRole) return res.status(404).json({ error: 'Role not found' });

        // Block modifying system roles unless admin
        if (existingRole.isSystem) {
            const isSuperAdmin = req.user.roles?.some((ur: any) => 
                ur.role.name === 'Admin' || 
                ur.role.name === 'Super Admin' || 
                ur.role.name === 'ChiefOfStaff'
            );
            if (!isSuperAdmin) {
                return res.status(400).json({ error: 'System roles cannot be modified except by administrators' });
            }
        }

        const role = await prisma.role.update({
            where: { id },
            data: { name, description }
        });

        if (permissions && Array.isArray(permissions)) {
            for (const p of permissions) {
                await prisma.rolePermission.upsert({
                    where: { roleId_module: { roleId: id, module: p.module } },
                    update: {
                        createLevel: p.createLevel,
                        readLevel: p.readLevel,
                        updateLevel: p.updateLevel,
                        deleteLevel: p.deleteLevel
                    },
                    create: {
                        roleId: id,
                        module: p.module,
                        createLevel: p.createLevel || 'none',
                        readLevel: p.readLevel || 'none',
                        updateLevel: p.updateLevel || 'none',
                        deleteLevel: p.deleteLevel || 'none'
                    }
                });
            }
        }

        res.json(role);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A role with this name already exists in your company' });
        }
        res.status(500).json({ error: 'Failed to update role' });
    }
};

export const getRoleDetails = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Role', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Role' });
        }

        const { id } = req.params;
        const companyId = req.user!.companyId;

        // Guard: role must belong to this company OR be a system role
        const role = await prisma.role.findFirst({
            where: {
                id,
                OR: [{ companyId }, { isSystem: true, companyId: null }]
            },
            include: { permissions: true }
        });
        if (!role) return res.status(404).json({ error: 'Role not found' });
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Role', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Role' });
        }

        const { id } = req.params;
        const companyId = req.user!.companyId;

        // Guard: must belong to THIS company AND not be a system role
        const existingRole = await prisma.role.findFirst({
            where: { id, companyId }
        });
        if (!existingRole) return res.status(404).json({ error: 'Role not found or access denied' });
        if (existingRole.isSystem) {
            return res.status(400).json({ error: 'System roles cannot be deleted' });
        }

        await prisma.role.delete({ where: { id } });

        res.json({ message: 'Role deleted successfully' });
    } catch (error: any) {
        console.error('Delete role error:', error);
        res.status(500).json({ error: 'Failed to delete role', details: error.message });
    }
};
