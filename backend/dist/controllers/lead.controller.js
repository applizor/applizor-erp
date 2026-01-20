"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLead = exports.convertLeadToClient = exports.updateLead = exports.getLead = exports.getLeads = exports.createLead = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const createLead = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { name, email, phone, company, source, status = 'new', stage = 'lead', value, notes, assignedTo, } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Lead name is required' });
        }
        const lead = await client_1.default.lead.create({
            data: {
                companyId: user.companyId,
                name,
                email,
                phone,
                company,
                source,
                status,
                stage,
                value: value ? parseFloat(value) : null,
                notes,
                assignedTo,
            },
        });
        res.status(201).json({
            message: 'Lead created successfully',
            lead,
        });
    }
    catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ error: 'Failed to create lead', details: error.message });
    }
};
exports.createLead = createLead;
const getLeads = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { status, stage, assignedTo, search, page = 1, limit = 10 } = req.query;
        const where = {
            companyId: user.companyId,
        };
        if (status) {
            where.status = status;
        }
        if (stage) {
            where.stage = stage;
        }
        if (assignedTo) {
            where.assignedTo = assignedTo;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [leads, total] = await Promise.all([
            client_1.default.lead.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            client_1.default.lead.count({ where }),
        ]);
        res.json({
            leads,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to get leads', details: error.message });
    }
};
exports.getLeads = getLeads;
const getLead = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const lead = await client_1.default.lead.findUnique({
            where: { id },
        });
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        res.json({ lead });
    }
    catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ error: 'Failed to get lead', details: error.message });
    }
};
exports.getLead = getLead;
const updateLead = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const { name, email, phone, company, source, status, stage, value, notes, assignedTo, } = req.body;
        const lead = await client_1.default.lead.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                company,
                source,
                status,
                stage,
                value: value ? parseFloat(value) : null,
                notes,
                assignedTo,
            },
        });
        res.json({
            message: 'Lead updated successfully',
            lead,
        });
    }
    catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ error: 'Failed to update lead', details: error.message });
    }
};
exports.updateLead = updateLead;
const convertLeadToClient = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { id } = req.params;
        const lead = await client_1.default.lead.findUnique({
            where: { id },
        });
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        // Create client from lead
        const client = await client_1.default.client.create({
            data: {
                companyId: user.companyId,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                clientType: 'customer',
                status: 'active',
            },
        });
        // Update lead status
        await client_1.default.lead.update({
            where: { id },
            data: {
                status: 'converted',
                stage: 'closed',
            },
        });
        res.json({
            message: 'Lead converted to client successfully',
            client,
        });
    }
    catch (error) {
        console.error('Convert lead error:', error);
        res.status(500).json({ error: 'Failed to convert lead', details: error.message });
    }
};
exports.convertLeadToClient = convertLeadToClient;
const deleteLead = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        await client_1.default.lead.delete({
            where: { id },
        });
        res.json({ message: 'Lead deleted successfully' });
    }
    catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: 'Failed to delete lead', details: error.message });
    }
};
exports.deleteLead = deleteLead;
//# sourceMappingURL=lead.controller.js.map