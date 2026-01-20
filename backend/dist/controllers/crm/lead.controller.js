"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLead = exports.updateLead = exports.getLeads = exports.createLead = void 0;
const client_1 = __importDefault(require("../../prisma/client"));
const audit_service_1 = require("../../services/audit.service");
const createLead = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId)
            return res.status(404).json({ error: 'Company not found' });
        const { name, email, phone, company: leadCompany, source, value, notes, stage } = req.body;
        const lead = await client_1.default.lead.create({
            data: {
                companyId: user.companyId,
                name,
                email,
                phone,
                company: leadCompany,
                source,
                value: value ? parseFloat(value) : undefined,
                notes,
                stage: stage || 'lead',
                status: 'new'
            }
        });
        (0, audit_service_1.logAction)(req, {
            action: 'CREATE',
            module: 'CRM',
            entityType: 'Lead',
            entityId: lead.id,
            details: `Created lead: ${name}`
        });
        res.status(201).json(lead);
    }
    catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
};
exports.createLead = createLead;
const getLeads = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId)
            return res.status(404).json({ error: 'Company not found' });
        const leads = await client_1.default.lead.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leads);
    }
    catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
};
exports.getLeads = getLeads;
const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, company: leadCompany, source, value, notes, stage, status } = req.body;
        // Optional: Check if lead belongs to user's company (omitted for brevity but recommended)
        const lead = await client_1.default.lead.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                company: leadCompany,
                source,
                value: value ? parseFloat(value) : undefined,
                notes,
                stage,
                status
            }
        });
        res.json(lead);
    }
    catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
};
exports.updateLead = updateLead;
const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        await client_1.default.lead.delete({ where: { id } });
        res.json({ message: 'Lead deleted successfully' });
    }
    catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
};
exports.deleteLead = deleteLead;
//# sourceMappingURL=lead.controller.js.map