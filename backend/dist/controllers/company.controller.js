"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLogo = exports.uploadLetterhead = exports.updateCompany = exports.getCompany = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const getCompany = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
            include: { company: true },
        });
        if (!user || !user.companyId) {
            return res.status(404).json({ error: 'Company not found' });
        }
        const company = await client_1.default.company.findUnique({
            where: { id: user.companyId },
        });
        res.json({ company });
    }
    catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Failed to get company', details: error.message });
    }
};
exports.getCompany = getCompany;
// Re-defining updateCompany properly
const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        let companyId = id;
        // If id is 'profile', we are updating the current user's company
        if (id === 'profile') {
            const userId = req.user?.userId || req.userId; // Handle both auth middlewares if slightly different
            if (!userId)
                return res.status(401).json({ error: 'Unauthorized' });
            const user = await client_1.default.user.findUnique({ where: { id: userId } });
            if (!user?.companyId)
                return res.status(404).json({ error: 'Company not found' });
            companyId = user.companyId;
        }
        const { name, email, phone, address, city, state, country, pincode, allowedIPs, latitude, longitude, radius, legalName, gstin, pan } = req.body;
        const company = await client_1.default.company.update({
            where: { id: companyId },
            data: {
                name, email, phone, address, city, state, country, pincode,
                allowedIPs, latitude: latitude ? parseFloat(latitude) : undefined, longitude: longitude ? parseFloat(longitude) : undefined, radius: radius ? parseInt(radius) : undefined,
                legalName, gstin, pan,
                enabledModules
            }
        });
        res.json(company);
    }
    catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ error: 'Failed to update company', details: error.message });
    }
};
exports.updateCompany = updateCompany;
const uploadLetterhead = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(404).json({ error: 'Company not found' });
        }
        // TODO: Handle file upload (multer)
        // For now, just accept file path
        const { letterheadDoc } = req.body;
        const company = await client_1.default.company.update({
            where: { id: user.companyId },
            data: {
                letterheadDoc,
            },
        });
        res.json({ message: 'Letterhead uploaded successfully', company });
    }
    catch (error) {
        console.error('Upload letterhead error:', error);
        res.status(500).json({ error: 'Failed to upload letterhead', details: error.message });
    }
};
exports.uploadLetterhead = uploadLetterhead;
const updateLogo = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId)
            return res.status(404).json({ error: 'Company not found' });
        // Construct public URL
        // Assumption: Server serves /uploads route mapped to uploads folder
        const logoUrl = `/uploads/logos/${req.file.filename}`;
        const company = await client_1.default.company.update({
            where: { id: user.companyId },
            data: { logo: logoUrl }
        });
        res.json({ message: 'Logo updated successfully', company });
    }
    catch (error) {
        console.error('Upload logo error:', error);
        res.status(500).json({ error: 'Failed to update logo' });
    }
};
exports.updateLogo = updateLogo;
//# sourceMappingURL=company.controller.js.map