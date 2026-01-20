"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClient = exports.updateClient = exports.getClient = exports.getClients = exports.createClient = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const permission_service_1 = require("../services/permission.service");
const createClient = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Client', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Client' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { name, email, phone, address, city, state, country = 'India', pincode, gstin, pan, clientType = 'customer', } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Client name is required' });
        }
        const client = await client_1.default.client.create({
            data: {
                companyId: user.companyId,
                name,
                email,
                phone,
                address,
                city,
                state,
                country,
                pincode,
                gstin,
                pan,
                clientType,
                status: 'active',
            },
        });
        res.status(201).json({
            message: 'Client created successfully',
            client,
        });
    }
    catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Failed to create client', details: error.message });
    }
};
exports.createClient = createClient;
const getClients = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Client', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { status, clientType, search, page = 1, limit = 10 } = req.query;
        const where = {
            companyId: user.companyId,
        };
        if (status) {
            where.status = status;
        }
        if (clientType) {
            where.clientType = clientType;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [clients, total] = await Promise.all([
            client_1.default.client.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            client_1.default.client.count({ where }),
        ]);
        res.json({
            clients,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Failed to get clients', details: error.message });
    }
};
exports.getClients = getClients;
const getClient = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Client', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { id } = req.params;
        const client = await client_1.default.client.findUnique({
            where: { id },
            include: {
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                projects: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ client });
    }
    catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Failed to get client', details: error.message });
    }
};
exports.getClient = getClient;
const updateClient = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Client', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Client' });
        }
        const { id } = req.params;
        const { name, email, phone, address, city, state, country, pincode, gstin, pan, status, clientType, } = req.body;
        const client = await client_1.default.client.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address,
                city,
                state,
                country,
                pincode,
                gstin,
                pan,
                status,
                clientType,
            },
        });
        res.json({
            message: 'Client updated successfully',
            client,
        });
    }
    catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Failed to update client', details: error.message });
    }
};
exports.updateClient = updateClient;
const deleteClient = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Client', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Client' });
        }
        const { id } = req.params;
        await client_1.default.client.delete({
            where: { id },
        });
        res.json({ message: 'Client deleted successfully' });
    }
    catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ error: 'Failed to delete client', details: error.message });
    }
};
exports.deleteClient = deleteClient;
//# sourceMappingURL=client.controller.js.map