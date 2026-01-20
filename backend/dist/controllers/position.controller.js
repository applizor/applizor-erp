"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePosition = exports.updatePosition = exports.getPositions = exports.createPosition = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const permission_service_1 = require("../services/permission.service");
// Create Position
const createPosition = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Position', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Position' });
        }
        const { departmentId, title, description } = req.body;
        if (!departmentId || !title) {
            return res.status(400).json({ error: 'Department and Title are required' });
        }
        const position = await client_1.default.position.create({
            data: {
                departmentId,
                title,
                description,
            },
        });
        res.status(201).json(position);
    }
    catch (error) {
        console.error('Create position error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Position with this title already exists in the department' });
        }
        res.status(500).json({ error: 'Failed to create position', details: error.message });
    }
};
exports.createPosition = createPosition;
// Get All Positions
const getPositions = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User does not belong to a company' });
        // Check Read Permission
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Position', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights' });
        }
        const { departmentId } = req.query;
        const whereClause = {
            department: {
                companyId: user.companyId
            }
        };
        if (departmentId) {
            whereClause.departmentId = departmentId;
        }
        const positions = await client_1.default.position.findMany({
            where: whereClause,
            include: {
                department: true,
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { title: 'asc' }
        });
        res.json(positions);
    }
    catch (error) {
        console.error('Get positions error:', error);
        res.status(500).json({ error: 'Failed to fetch positions', details: error.message });
    }
};
exports.getPositions = getPositions;
// Update Position
const updatePosition = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Position', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Position' });
        }
        const { id } = req.params;
        const { title, description, isActive, departmentId } = req.body;
        const position = await client_1.default.position.update({
            where: { id },
            data: {
                title,
                description,
                isActive,
                departmentId
            },
            include: {
                department: true
            }
        });
        res.json(position);
    }
    catch (error) {
        console.error('Update position error:', error);
        res.status(500).json({ error: 'Failed to update position', details: error.message });
    }
};
exports.updatePosition = updatePosition;
// Delete Position
const deletePosition = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Position', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Position' });
        }
        const { id } = req.params;
        await client_1.default.position.delete({
            where: { id },
        });
        res.json({ message: 'Position deleted successfully' });
    }
    catch (error) {
        console.error('Delete position error:', error);
        res.status(500).json({ error: 'Failed to delete position', details: error.message });
    }
};
exports.deletePosition = deletePosition;
//# sourceMappingURL=position.controller.js.map