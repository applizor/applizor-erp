"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const getAuditLogs = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.companyId)
            return res.status(404).json({ error: 'Company not found' });
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const logs = await client_1.default.auditLog.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } }
            }
        });
        const total = await client_1.default.auditLog.count({ where: { companyId: user.companyId } });
        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Fetch audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
exports.getAuditLogs = getAuditLogs;
//# sourceMappingURL=audit.controller.js.map