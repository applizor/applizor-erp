"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.listTemplates = exports.uploadTemplate = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const fs_1 = __importDefault(require("fs"));
// Upload handling usually via Middleware (Multer), saving to disk or S3.
// For MVP, we save to 'uploads/templates' directory.
const uploadTemplate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { name, type, letterheadMode } = req.body;
        const companyId = req.user?.companyId; // From Auth Middleware
        if (!name || !type) {
            return res.status(400).json({ error: 'Name and Type are required' });
        }
        // Save to DB
        const template = await client_1.default.documentTemplate.create({
            data: {
                companyId,
                name,
                type,
                letterheadMode: letterheadMode || 'NONE',
                filePath: req.file.path, // Multer saves it and gives path
            }
        });
        res.json(template);
    }
    catch (error) {
        console.error('Template upload error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.uploadTemplate = uploadTemplate;
const listTemplates = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const templates = await client_1.default.documentTemplate.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(templates);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.listTemplates = listTemplates;
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await client_1.default.documentTemplate.findUnique({ where: { id } });
        if (!template)
            return res.status(404).json({ error: 'Template not found' });
        // Delete File
        if (fs_1.default.existsSync(template.filePath)) {
            fs_1.default.unlinkSync(template.filePath);
        }
        // Delete record
        await client_1.default.documentTemplate.delete({ where: { id } });
        res.json({ message: 'Template deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteTemplate = deleteTemplate;
//# sourceMappingURL=document-template.controller.js.map