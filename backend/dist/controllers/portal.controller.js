"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProjects = exports.getMyInvoices = exports.getDashboardStats = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const getDashboardStats = async (req, res) => {
    try {
        const clientId = req.userId; // Assuming middleware sets this from token
        const [invoices, projects] = await Promise.all([
            client_1.default.invoice.findMany({
                where: { clientId },
                select: { total: true, status: true, currency: true }
            }),
            client_1.default.project.count({
                where: { clientId, status: 'active' } // Assuming active status string
            })
        ]);
        // Calculate totals
        const totalDue = invoices
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + Number(inv.total), 0);
        // Simple currency assumption for MVP (taking first found or default)
        const currency = invoices[0]?.currency || 'USD';
        res.json({
            activeProjects: projects,
            pendingInvoicesCount: invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').length,
            totalDue,
            currency
        });
    }
    catch (error) {
        console.error('Portal stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getMyInvoices = async (req, res) => {
    try {
        const clientId = req.userId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [invoices, total] = await Promise.all([
            client_1.default.invoice.findMany({
                where: { clientId },
                orderBy: { invoiceDate: 'desc' },
                skip,
                take: limit,
                include: { items: true }
            }),
            client_1.default.invoice.count({ where: { clientId } })
        ]);
        res.json({ invoices, total, pages: Math.ceil(total / limit) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};
exports.getMyInvoices = getMyInvoices;
const getMyProjects = async (req, res) => {
    try {
        const clientId = req.userId;
        const projects = await client_1.default.project.findMany({
            where: { clientId },
            orderBy: { updatedAt: 'desc' },
            include: { tasks: false } // Avoid leaking internal task details if sensitive
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};
exports.getMyProjects = getMyProjects;
//# sourceMappingURL=portal.controller.js.map