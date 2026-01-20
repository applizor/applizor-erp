"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBranch = exports.updateBranch = exports.getBranches = exports.createBranch = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const createBranch = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId)
            return res.status(404).json({ error: 'Company not found' });
        const { name, code, address, city, state, country, pincode, phone, email } = req.body;
        const branch = await client_1.default.branch.create({
            data: {
                companyId: user.companyId,
                name,
                code,
                address,
                city,
                state,
                country,
                pincode,
                phone,
                email
            }
        });
        res.status(201).json(branch);
    }
    catch (error) {
        console.error('Create branch error:', error);
        res.status(500).json({ error: 'Failed to create branch', details: error.message });
    }
};
exports.createBranch = createBranch;
const getBranches = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId)
            return res.status(404).json({ error: 'Company not found' });
        const branches = await client_1.default.branch.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(branches);
    }
    catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({ error: 'Failed to fetch branches' });
    }
};
exports.getBranches = getBranches;
const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, address, city, state, country, pincode, phone, email, isActive } = req.body;
        const branch = await client_1.default.branch.update({
            where: { id },
            data: {
                name,
                code,
                address,
                city,
                state,
                country,
                pincode,
                phone,
                email,
                isActive
            }
        });
        res.json(branch);
    }
    catch (error) {
        console.error('Update branch error:', error);
        res.status(500).json({ error: 'Failed to update branch' });
    }
};
exports.updateBranch = updateBranch;
const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        await client_1.default.branch.delete({ where: { id } });
        res.json({ message: 'Branch deleted successfully' });
    }
    catch (error) {
        console.error('Delete branch error:', error);
        res.status(500).json({ error: 'Failed to delete branch' });
    }
};
exports.deleteBranch = deleteBranch;
//# sourceMappingURL=branch.controller.js.map