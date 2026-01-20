
import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

// Default Chart of Accounts
export const DEFAULT_ACCOUNTS = [
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

export const seedAccounts = async (companyId: string) => {
    const existing = await prisma.ledgerAccount.count({ where: { companyId } });
    if (existing === 0) {
        await prisma.ledgerAccount.createMany({
            data: DEFAULT_ACCOUNTS.map(acc => ({
                companyId,
                code: acc.code,
                name: acc.name,
                type: acc.type,
                balance: 0
            }))
        });
    }
};

interface JournalLineInput {
    accountId: string; // ID, not code
    debit?: number;
    credit?: number;
}

export const createJournalEntry = async (
    companyId: string,
    date: Date,
    description: string,
    reference: string,
    lines: JournalLineInput[],
    autoPost: boolean = false
) => {
    // Validate Total Debit == Total Credit
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    // Float precision check
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Unbalanced Journal Entry: Debit ${totalDebit} != Credit ${totalCredit}`);
    }

    return await prisma.$transaction(async (tx) => {
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
                } else {
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

export const getTrialBalance = async (companyId: string) => {
    return await prisma.ledgerAccount.findMany({
        where: { companyId },
        orderBy: { code: 'asc' }
    });
};


export const getAccountByCode = async (companyId: string, code: string) => {
    return await prisma.ledgerAccount.findUnique({
        where: { companyId_code: { companyId, code } }
    });
};

export const ensureAccount = async (companyId: string, code: string, name: string, type: string) => {
    return await prisma.ledgerAccount.upsert({
        where: { companyId_code: { companyId, code } },
        update: {},
        create: { companyId, code, name, type }
    });
};

const accountingService = {
    seedAccounts,
    createJournalEntry,
    getTrialBalance,
    getAccountByCode,
    ensureAccount,
    DEFAULT_ACCOUNTS // Export constant for reference
};

export default accountingService;
