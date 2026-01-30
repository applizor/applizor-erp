"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.getTemplates = exports.createTemplate = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const createTemplate = async (req, res) => {
    try {
        const { name, type, content, variables } = req.body;
        const template = await client_1.default.documentTemplate.create({
            data: {
                name,
                type,
                content,
                variables,
                companyId: req.user.companyId
            }
        });
        res.status(201).json(template);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create template' });
    }
};
exports.createTemplate = createTemplate;
const getTemplates = async (req, res) => {
    try {
        const templates = await client_1.default.documentTemplate.findMany({
            where: { companyId: req.user.companyId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(templates);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};
exports.getTemplates = getTemplates;
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, content, variables } = req.body;
        // Initial check to ensure it belongs to company
        const existing = await client_1.default.documentTemplate.findFirst({
            where: { id, companyId: req.user.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Template not found' });
        }
        const template = await client_1.default.documentTemplate.update({
            where: { id },
            data: {
                name,
                type,
                content,
                variables
            }
        });
        res.json(template);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update template' });
    }
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res) => {
    try {
        await client_1.default.documentTemplate.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ message: 'Template deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
};
exports.deleteTemplate = deleteTemplate;
//# sourceMappingURL=document-template.controller.js.map