"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManualEntry = exports.getChartOfAccounts = void 0;
const accounting_service_1 = __importDefault(require("../services/accounting.service"));
const getChartOfAccounts = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        // Lazy seed
        await accounting_service_1.default.seedAccounts(companyId);
        const accounts = await accounting_service_1.default.getTrialBalance(companyId);
        res.json(accounts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
};
exports.getChartOfAccounts = getChartOfAccounts;
const createManualEntry = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { date, description, reference, lines } = req.body;
        const entry = await accounting_service_1.default.createJournalEntry(companyId, new Date(date), description, reference, lines, true // Auto-post manual entries for now
        );
        res.json(entry);
    }
    catch (error) {
        res.status(400).json({ error: error.message || 'Failed to create entry' });
    }
};
exports.createManualEntry = createManualEntry;
//# sourceMappingURL=accounting.controller.js.map