"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProgress = exports.getSalesTargets = exports.createSalesTarget = void 0;
const client_1 = __importDefault(require("../../prisma/client"));
const createSalesTarget = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { employeeId, period, startDate, endDate, targetAmount } = req.body;
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const target = await client_1.default.salesTarget.create({
            data: {
                companyId: user.companyId,
                employeeId,
                period,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                targetAmount: parseFloat(targetAmount),
                status: 'active'
            },
            include: {
                employee: {
                    include: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        });
        res.status(201).json(target);
    }
    catch (error) {
        console.error('Create sales target error:', error);
        res.status(500).json({ error: 'Failed to create sales target', details: error.message });
    }
};
exports.createSalesTarget = createSalesTarget;
const getSalesTargets = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { employeeId, period } = req.query;
        const where = { companyId: user.companyId };
        if (employeeId)
            where.employeeId = employeeId;
        if (period)
            where.period = period;
        const targets = await client_1.default.salesTarget.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } }
                    }
                }
            },
            orderBy: { startDate: 'desc' }
        });
        res.json(targets);
    }
    catch (error) {
        console.error('Get sales targets error:', error);
        res.status(500).json({ error: 'Failed to get sales targets' });
    }
};
exports.getSalesTargets = getSalesTargets;
const updateProgress = async (req, res) => {
    // This function can be called periodically or triggered by invoice payments
    // to update the 'achievedAmount' for targets.
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId)
            return res.status(400).json({ error: 'Company not found' });
        const activeTargets = await client_1.default.salesTarget.findMany({
            where: {
                companyId: user.companyId,
                status: 'active'
            }
        });
        // Simple logic: Sum paid invoices created by the employee within target period
        // Note: Real-world logic might differ (based on invoice date vs payment date)
        const updates = [];
        for (const target of activeTargets) {
            // Find paid invoices for this employee in this period
            // Need to link Employee to User to check 'createdBy' or specific 'salesRepId' on Invoice
            // For simplicity, assuming Employee.userId is linked to Invoice.createdBy (implicit)
            // OR Invoice has a 'salesRepId' field? Currently it doesn't. 
            // We can use 'assignedTo' logic if we add it, or just manual update for now.
            // Skipping automated calculation for this MVP step until Invoice has 'salesRepId'
            // Allowing manual update for now.
        }
        res.json({ message: 'Progress calculation logic to be implemented fully once Sales Rep assignment to Invoice is finalized.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Update progress failed' });
    }
};
exports.updateProgress = updateProgress;
//# sourceMappingURL=sales.controller.js.map