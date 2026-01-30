"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleDetails = exports.updateRole = exports.createRole = exports.getRoles = exports.getPermissions = exports.syncPermissions = exports.SYSTEM_MODULES = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const permission_service_1 = require("../services/permission.service");
exports.SYSTEM_MODULES = [
    'Dashboard', 'Company', 'User', 'Role',
    'Client', 'Lead', 'LeadActivity', 'Quotation', 'QuotationTemplate', 'Invoice', 'Payment', 'Subscription',
    'Department', 'Position', 'Employee', 'Attendance', 'Leave', 'LeaveType', 'LeaveBalance', 'Shift', 'ShiftRoster', 'Payroll', 'Asset',
    'Recruitment', 'Document',
    'Project', 'ProjectTask', // Added Project modules
    'Timesheet', // Phase 9
    'Holiday', 'Contract'
];
const ACCESS_LEVELS = ['none', 'all', 'added', 'owned', 'added_owned']; // "added_owned" matches "Added & Owned"
// Sync System: Truncate? No. Ensure every Role has every Module entry.
const syncPermissions = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // Syncing permissions is a sensitive system operation. 
        // Require 'Role' create/update or purely Admin?
        // Let's use Role.update as a proxy for managing system config logic here.
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Role', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Role' });
        }
        const roles = await client_1.default.role.findMany();
        let count = 0;
        for (const role of roles) {
            for (const module of exports.SYSTEM_MODULES) {
                // Check if exists
                const existing = await client_1.default.rolePermission.findUnique({
                    where: {
                        roleId_module: {
                            roleId: role.id,
                            module: module
                        }
                    }
                });
                if (!existing) {
                    await client_1.default.rolePermission.create({
                        data: {
                            roleId: role.id,
                            module: module,
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
    }
    catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: 'Failed to sync permissions', details: error.message });
    }
};
exports.syncPermissions = syncPermissions;
// Return Metadata for Frontend Matrix
const getPermissions = async (req, res) => {
    try {
        // Authenticated users should be able to get metadata for UI rendering?
        // Or restrict to those who can Read Roles?
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Role', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Instead of DB permissions, we return the Schema Definition
        res.json({
            modules: exports.SYSTEM_MODULES,
            levels: ACCESS_LEVELS
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch permission metadata' });
    }
};
exports.getPermissions = getPermissions;
const getRoles = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Role', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Role' });
        }
        const roles = await client_1.default.role.findMany({
            include: {
                _count: {
                    select: { userRoles: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(roles);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};
exports.getRoles = getRoles;
const createRole = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Role', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Role' });
        }
        // permissions is an array of { module, createLevel, readLevel... }
        const { name, description, permissions } = req.body;
        if (!name)
            return res.status(400).json({ error: 'Role name is required' });
        const role = await client_1.default.role.create({
            data: {
                name,
                description,
                isSystem: false
            }
        });
        if (permissions && Array.isArray(permissions)) {
            for (const p of permissions) {
                if (exports.SYSTEM_MODULES.includes(p.module)) {
                    await client_1.default.rolePermission.create({
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
            // Auto-fill missing modules with 'none' using sync logic logic or just leave them?
            // Better to be explicit or trust Sync to fill gaps later?
            // For now, let's trust Frontend sends all or we just have gaps (which implies None).
        }
        // Run a quick sync to fill gaps for this role immediately?
        // Reuse sync logic for single role
        for (const module of exports.SYSTEM_MODULES) {
            const exists = await client_1.default.rolePermission.findUnique({
                where: { roleId_module: { roleId: role.id, module } }
            });
            if (!exists) {
                await client_1.default.rolePermission.create({
                    data: { roleId: role.id, module, createLevel: 'none', readLevel: 'none', updateLevel: 'none', deleteLevel: 'none' }
                });
            }
        }
        res.json(role);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Role name already exists' });
        }
        res.status(500).json({ error: 'Failed to create role', details: error.message });
    }
};
exports.createRole = createRole;
const updateRole = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Role', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Role' });
        }
        const { id } = req.params;
        const { name, description, permissions } = req.body;
        const role = await client_1.default.role.update({
            where: { id },
            data: {
                name,
                description
            }
        });
        if (permissions && Array.isArray(permissions)) {
            for (const p of permissions) {
                // Upsert permission for this module
                await client_1.default.rolePermission.upsert({
                    where: {
                        roleId_module: {
                            roleId: id,
                            module: p.module
                        }
                    },
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update role' });
    }
};
exports.updateRole = updateRole;
const getRoleDetails = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Role', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Role' });
        }
        const { id } = req.params;
        const role = await client_1.default.role.findUnique({
            where: { id },
            include: {
                permissions: true
            }
        });
        if (!role)
            return res.status(404).json({ error: 'Role not found' });
        res.json(role);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};
exports.getRoleDetails = getRoleDetails;
//# sourceMappingURL=role.controller.js.map