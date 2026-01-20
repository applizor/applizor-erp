"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAccount = exports.getAccountByCode = exports.getTrialBalance = exports.createJournalEntry = exports.seedAccounts = exports.DEFAULT_ACCOUNTS = void 0;
const client_1 = __importDefault(require("../prisma/client"));
// Default Chart of Accounts
exports.DEFAULT_ACCOUNTS = [
    { code: '1000', name: 'Cash', type: 'asset' },
    { code: '1001', name: 'Bank', type: 'asset' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset' },
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '2100', name: 'Salaries Payable', type: 'liability' },
    { code: '2200', name: 'Tax Payable', type: 'liability' },
    { code: '3000', name: 'Capital', type: 'equity' },
    { code: '4000', name: 'Sales Revenue', type: 'income' },
    { code: '4100', name: 'Service Income', type: 'income' },
    { code: '5000', name: 'Salary Expense', type: 'expense' },
    { code: '5100', name: 'Rent Expense', type: 'expense' },
    { code: '5200', name: 'General Expense', type: 'expense' },
];
const seedAccounts = async (companyId) => {
    const existing = await client_1.default.ledgerAccount.count({ where: { companyId } });
    if (existing === 0) {
        await client_1.default.ledgerAccount.createMany({
            data: exports.DEFAULT_ACCOUNTS.map(acc => ({
                companyId,
                code: acc.code,
                name: acc.name,
                type: acc.type,
                balance: 0
            }))
        });
    }
};
exports.seedAccounts = seedAccounts;
const createJournalEntry = async (companyId, date, description, reference, lines, autoPost = false) => {
    // Validate Total Debit == Total Credit
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    // Float precision check
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Unbalanced Journal Entry: Debit ${totalDebit} != Credit ${totalCredit}`);
    }
    return await client_1.default.$transaction(async (tx) => {
        // 1. Create Header
        const entry = await tx.journalEntry.create({
            data: {
                companyId,
                date,
                description,
                reference,
                status: autoPost ? 'posted' : 'draft',
                lines: {
                    create: lines.map(line => ({
                        accountId: line.accountId,
                        debit: line.debit || 0,
                        credit: line.credit || 0
                    }))
                }
            },
            include: { lines: { include: { account: true } } }
        });
        // 2. Update Balances if autoPost
        if (autoPost) {
            for (const line of entry.lines) {
                const account = line.account;
                let balanceChange = 0;
                const debit = Number(line.debit);
                const credit = Number(line.credit);
                // Accounting Equation Logic
                if (['asset', 'expense'].includes(account.type)) {
                    balanceChange = debit - credit;
                }
                else {
                    balanceChange = credit - debit;
                }
                await tx.ledgerAccount.update({
                    where: { id: account.id },
                    data: {
                        balance: { increment: balanceChange }
                    }
                });
            }
        }
        return entry;
    });
};
exports.createJournalEntry = createJournalEntry;
const getTrialBalance = async (companyId) => {
    return await client_1.default.ledgerAccount.findMany({
        where: { companyId },
        orderBy: { code: 'asc' }
    });
};
exports.getTrialBalance = getTrialBalance;
const getAccountByCode = async (companyId, code) => {
    return await client_1.default.ledgerAccount.findUnique({
        where: { companyId_code: { companyId, code } }
    });
};
exports.getAccountByCode = getAccountByCode;
const ensureAccount = async (companyId, code, name, type) => {
    return await client_1.default.ledgerAccount.upsert({
        where: { companyId_code: { companyId, code } },
        update: {},
        create: { companyId, code, name, type }
    });
};
exports.ensureAccount = ensureAccount;
const accountingService = {
    seedAccounts: exports.seedAccounts,
    createJournalEntry: exports.createJournalEntry,
    getTrialBalance: exports.getTrialBalance,
    getAccountByCode: exports.getAccountByCode,
    ensureAccount: exports.ensureAccount,
    DEFAULT_ACCOUNTS: exports.DEFAULT_ACCOUNTS // Export constant for reference
};
exports.default = accountingService;
//# sourceMappingURL=accounting.service.js.map