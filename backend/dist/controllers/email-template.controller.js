"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMockEmail = exports.deleteTemplate = exports.updateTemplate = exports.getTemplates = exports.createTemplate = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create Email Template
const createTemplate = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User/Company not found' });
        const { name, subject, body, type } = req.body;
        const template = await prisma.emailTemplate.create({
            data: {
                companyId: user.companyId,
                name,
                subject,
                body,
                type // 'offer', 'rejection', 'interview_invite'
            }
        });
        res.status(201).json(template);
    }
    catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
};
exports.createTemplate = createTemplate;
// Get All Templates
const getTemplates = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const templates = await prisma.emailTemplate.findMany({
            where: { companyId: user?.companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(templates);
    }
    catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};
exports.getTemplates = getTemplates;
// Update Template
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, body, isActive } = req.body;
        const template = await prisma.emailTemplate.update({
            where: { id },
            data: { name, subject, body, isActive }
        });
        res.json(template);
    }
    catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
};
exports.updateTemplate = updateTemplate;
// Delete Template
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.emailTemplate.delete({ where: { id } });
        res.json({ message: 'Template deleted' });
    }
    catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
};
exports.deleteTemplate = deleteTemplate;
// Mock Send Email (for testing)
const sendMockEmail = async (req, res) => {
    try {
        const { candidateId, templateId } = req.body;
        const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
        const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
        if (!candidate || !template) {
            return res.status(404).json({ error: 'Candidate or Template not found' });
        }
        // Simple placeholder replacement
        let content = template.body
            .replace('{{firstName}}', candidate.firstName)
            .replace('{{lastName}}', candidate.lastName)
            .replace('{{jobTitle}}', 'Software Engineer'); // Mock job title for now
        console.log(`[MOCK EMAIL] To: ${candidate.email} | Subject: ${template.subject} \n ${content}`);
        res.json({ message: 'Email sent successfully (Mock)', content });
    }
    catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
};
exports.sendMockEmail = sendMockEmail;
//# sourceMappingURL=email-template.controller.js.map