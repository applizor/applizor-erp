"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.getDepartments = exports.createDepartment = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const permission_service_1 = require("../services/permission.service");
// Create Department
const createDepartment = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Department', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Department' });
        }
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User does not belong to a company' });
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }
        const department = await client_1.default.department.create({
            data: {
                companyId: user.companyId,
                name,
                description,
            },
        });
        res.status(201).json(department);
    }
    catch (error) {
        console.error('Create department error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Department with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create department', details: error.message });
    }
};
exports.createDepartment = createDepartment;
// Get All Departments
const getDepartments = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User does not belong to a company' });
        // Check Read Permission
        // For Department (Global Master), "Owned" or "Added" doesn't make much sense unless we track creator.
        // Assuming 'All' is required to view masters, OR we allow all employees to view departments?
        // Let's stick to the Plan: Check Read permission.
        const scope = permission_service_1.PermissionService.getPermissionScope(req.user, 'Department', 'read');
        if (!scope.all && !scope.owned && !scope.added) {
            return res.status(403).json({ error: 'Access denied: No read rights for Department' });
        }
        // If scope is NOT 'all', strictly for Department we might still return all 
        // because it's a dropdown master data. But let's enforce "All" for management views.
        // However, usually everyone needs to see departments.
        // Let's implement Strict Check?
        // If user has "Owned" only, they can't see "All" departments? That breaks the App.
        // COMPROMISE: If they have ANY read permission, show All Departments.
        // Rationale: Departments are public company info.
        // For now, let's just use the basic check to ensure they have AT LEAST some read access.
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Department', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const departments = await client_1.default.department.findMany({
            where: { companyId: user.companyId },
            include: {
                _count: {
                    select: { employees: true, positions: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    }
    catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to fetch departments', details: error.message });
    }
};
exports.getDepartments = getDepartments;
// Update Department
const updateDepartment = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Department', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Department' });
        }
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const department = await client_1.default.department.update({
            where: { id },
            data: { name, description, isActive },
        });
        res.json(department);
    }
    catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({ error: 'Failed to update department', details: error.message });
    }
};
exports.updateDepartment = updateDepartment;
// Delete Department
const deleteDepartment = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Department', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Department' });
        }
        const { id } = req.params;
        await client_1.default.department.delete({
            where: { id },
        });
        res.json({ message: 'Department deleted successfully' });
    }
    catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ error: 'Failed to delete department', details: error.message });
    }
};
exports.deleteDepartment = deleteDepartment;
//# sourceMappingURL=department.controller.js.map