"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAsset = exports.updateAsset = exports.createAsset = exports.getAssets = void 0;
const client_1 = require("@prisma/client");
const permission_service_1 = require("../services/permission.service");
const prisma = new client_1.PrismaClient();
// Get All Assets
const getAssets = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User/Company not found' });
        // --- SCOPE CHECK ---
        const scope = permission_service_1.PermissionService.getPermissionScope(req.user, 'Asset', 'read');
        if (!scope.all && !scope.owned && !scope.added) {
            return res.status(403).json({ error: 'Access denied: No read rights for Asset' });
        }
        const where = { companyId: user.companyId };
        if (!scope.all) {
            const orConditions = [];
            // Owned: Assets assigned TO me? 
            // Asset model has `employeeId`. We need to map UserId -> EmployeeId first.
            const currentUserEmployee = await prisma.employee.findUnique({ where: { userId } });
            const currentEmpId = currentUserEmployee?.id;
            if (scope.owned && currentEmpId) {
                // Assets assigned to me
                orConditions.push({ employeeId: currentEmpId });
            }
            // Added? Assets I created? Asset model doesn't explicitly track 'createdById' in schema provided in previous context.
            // If it doesn't exist, we skip 'Added' scope or fallback to something else.
            // Let's assume Asset is primarily managed by IT/Admin (All) or Assigned to Employee (Owned).
            if (orConditions.length > 0) {
                where.OR = orConditions;
            }
            else {
                return res.json([]); // Block if no access
            }
        }
        const assets = await prisma.asset.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assets);
    }
    catch (error) {
        console.error('Get assets error:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
};
exports.getAssets = getAssets;
// Create Asset
const createAsset = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Asset', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Asset' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User/Company not found' });
        const { name, type, serialNumber, status, purchaseDate, price, currency, employeeId, assignedDate } = req.body;
        // Check for duplicate serial number if provided
        if (serialNumber) {
            const existing = await prisma.asset.findFirst({
                where: {
                    companyId: user.companyId,
                    serialNumber
                }
            });
            if (existing)
                return res.status(400).json({ error: 'Asset with this Serial Number already exists' });
        }
        const asset = await prisma.asset.create({
            data: {
                companyId: user.companyId,
                name,
                type,
                serialNumber,
                status: employeeId ? 'Assigned' : (status || 'Available'),
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
                price: price ? parseFloat(price) : undefined,
                currency: currency || 'INR',
                employeeId: employeeId || null,
                assignedDate: employeeId ? (assignedDate ? new Date(assignedDate) : new Date()) : null
            }
        });
        res.status(201).json(asset);
    }
    catch (error) {
        console.error('Create asset error:', error);
        res.status(500).json({ error: 'Failed to create asset' });
    }
};
exports.createAsset = createAsset;
// Update Asset
const updateAsset = async (req, res) => {
    try {
        const userId = req.user?.userId; // Verify Auth
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Asset', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Asset' });
        }
        const { id } = req.params;
        const { name, type, serialNumber, status, purchaseDate, price, currency, employeeId, assignedDate } = req.body;
        // Separate assignment logic
        let updateData = {
            name,
            type,
            serialNumber,
            status,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
            price: price ? parseFloat(price) : undefined,
            currency: currency || 'INR',
        };
        // If employee assignment is changing
        if (employeeId !== undefined) {
            updateData.employeeId = employeeId || null;
            if (employeeId) {
                updateData.status = 'Assigned';
                updateData.assignedDate = assignedDate ? new Date(assignedDate) : new Date();
            }
            else {
                updateData.assignedDate = null;
                if (status === 'Assigned')
                    updateData.status = 'Available'; // Revert to available if unassigning and status was assigned
            }
        }
        const asset = await prisma.asset.update({
            where: { id },
            data: updateData
        });
        res.json(asset);
    }
    catch (error) {
        console.error('Update asset error:', error);
        res.status(500).json({ error: 'Failed to update asset' });
    }
};
exports.updateAsset = updateAsset;
// Delete Asset
const deleteAsset = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Asset', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Asset' });
        }
        const { id } = req.params;
        await prisma.asset.delete({ where: { id } });
        res.json({ message: 'Asset deleted successfully' });
    }
    catch (error) {
        console.error('Delete asset error:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
};
exports.deleteAsset = deleteAsset;
//# sourceMappingURL=asset.controller.js.map