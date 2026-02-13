
import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

// Default Chart of Accounts (Updated for Indian Standards & GST)
export const DEFAULT_ACCOUNTS = [
    { code: '1000', name: 'Cash', type: 'asset' },
    { code: '1001', name: 'Bank Account', type: 'asset' },
    { code: '1200', name: 'Sundry Debtors (Accounts Receivable)', type: 'asset' },
    { code: '1300', name: 'Input CGST', type: 'asset' },
    { code: '1301', name: 'Input SGST', type: 'asset' },
    { code: '1302', name: 'Input IGST', type: 'asset' },

    { code: '2000', name: 'Sundry Creditors (Accounts Payable)', type: 'liability' },
    { code: '2100', name: 'Salaries Payable', type: 'liability' },
    { code: '2200', name: 'Output CGST', type: 'liability' },
    { code: '2201', name: 'Output SGST', type: 'liability' },
    { code: '2202', name: 'Output IGST', type: 'liability' },
    { code: '2203', name: 'TDS Payable', type: 'liability' },

    { code: '3000', name: 'Capital Account', type: 'equity' },
    { code: '3100', name: 'Retained Earnings', type: 'equity' },

    { code: '4000', name: 'Sales Revenue', type: 'income' },
    { code: '4100', name: 'Service Income', type: 'income' },
    { code: '4200', name: 'Other Income', type: 'income' },

    { code: '5000', name: 'Salary Expense', type: 'expense' },
    { code: '5100', name: 'Rent Expense', type: 'expense' },
    { code: '5200', name: 'General & Admin Expense', type: 'expense' },
    { code: '5300', name: 'Marketing Expense', type: 'expense' },
    { code: '5400', name: 'Bank Charges', type: 'expense' },
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

export const getGeneralLedger = async (companyId: string, accountId: string, startDate: Date, endDate: Date) => {
    return await prisma.journalEntryLine.findMany({
        where: {
            account: { companyId, id: accountId },
            journalEntry: {
                date: { gte: startDate, lte: endDate },
                status: 'posted'
            }
        },
        include: { journalEntry: true },
        orderBy: { journalEntry: { date: 'asc' } }
    });
};

export const getGstSummary = async (companyId: string, startDate: Date, endDate: Date) => {
    // Fetch all journal lines for GST accounts in the period
    const gstAccounts = await prisma.ledgerAccount.findMany({
        where: {
            companyId,
            code: { in: ['1300', '1301', '1302', '2200', '2201', '2202'] }
        }
    });

    const accountIds = gstAccounts.map(a => a.id);

    const lines = await prisma.journalEntryLine.findMany({
        where: {
            accountId: { in: accountIds },
            journalEntry: {
                companyId,
                date: { gte: startDate, lte: endDate },
                status: 'posted'
            }
        },
        include: { account: true, journalEntry: true }
    });

    // Group by Account Type (CGST, SGST, IGST) and direction (Input vs Output)
    const summary: Record<string, { input: number, output: number }> = {
        CGST: { input: 0, output: 0 },
        SGST: { input: 0, output: 0 },
        IGST: { input: 0, output: 0 }
    };

    lines.forEach(line => {
        const type = line.account.name.includes('CGST') ? 'CGST' :
            line.account.name.includes('SGST') ? 'SGST' : 'IGST';

        const isOutput = line.account.type === 'liability';
        const amount = isOutput ? (Number(line.credit) - Number(line.debit)) : (Number(line.debit) - Number(line.credit));

        if (isOutput) summary[type].output += amount;
        else summary[type].input += amount;
    });

    return summary;
};

export const getBalanceSheet = async (companyId: string) => {
    // Balance Sheet is "As of Now" (using running balances)
    const accounts = await prisma.ledgerAccount.findMany({
        where: {
            companyId,
            type: { in: ['asset', 'liability', 'equity'] }
        },
        orderBy: { code: 'asc' }
    });
    return accounts;
};

export const getProfitAndLoss = async (companyId: string, startDate?: Date, endDate?: Date) => {
    let accounts = [];
    if (startDate && endDate) {
        // Periodic P&L: Sum of transactions in the period
        const aggs = await prisma.journalEntryLine.groupBy({
            by: ['accountId'],
            where: {
                account: { companyId, type: { in: ['income', 'expense'] } },
                journalEntry: {
                    companyId,
                    date: { gte: startDate, lte: endDate },
                    status: 'posted'
                }
            },
            _sum: { debit: true, credit: true }
        });

        const allPnlAccounts = await prisma.ledgerAccount.findMany({
            where: { companyId, type: { in: ['income', 'expense'] } },
            orderBy: { code: 'asc' }
        });

        accounts = allPnlAccounts.map(acc => {
            const match = aggs.find(a => a.accountId === acc.id);
            const debit = Number(match?._sum.debit || 0);
            const credit = Number(match?._sum.credit || 0);
            // Income: Credit +, Expense: Debit +
            const netChange = acc.type === 'expense' ? (debit - credit) : (credit - debit);

            return {
                ...acc,
                balance: netChange // Override running balance with period balance
            };
        });
    } else {
        // Life-to-Date P&L (Running Balances)
        accounts = await prisma.ledgerAccount.findMany({
            where: {
                companyId,
                type: { in: ['income', 'expense'] }
            },
            orderBy: { code: 'asc' }
        });
    }

    // Indian Categorization Logic (Gross Profit vs Net Profit)
    // Direct Income: 4000-4099
    // Direct Expense: 5000-5099 (Wages, Factory Rent etc)
    // Indirect Income: 4100+
    // Indirect Expense: 5100+

    return {
        revenue: accounts.filter(a => a.type === 'income' && (a.code.startsWith('40') || a.code.startsWith('41'))),
        costOfGoodsSold: accounts.filter(a => a.type === 'expense' && a.code.startsWith('50')),
        otherIncome: accounts.filter(a => a.type === 'income' && !a.code.startsWith('40') && !a.code.startsWith('41')),
        operatingExpenses: accounts.filter(a => a.type === 'expense' && !a.code.startsWith('50'))
    };
};

/**
 * Deletes all journal entries and lines for a specific reference
 */
export const deleteLedgerPostings = async (reference: string) => {
    // Note: JournalEntry has onDelete: Cascade for lines in many setups, 
    // but Prisma relation needs explicit or db-level cascade.
    // Based on our schema, we should find and delete.
    return await prisma.journalEntry.deleteMany({
        where: { reference }
    });
};

/**
 * Automates GST-compliant Ledger posting for Invoices
 */
export const postInvoiceToLedger = async (invoiceId: string) => {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            client: true,
            items: { include: { appliedTaxes: true } }
        }
    });

    if (!invoice) throw new Error('Invoice not found');

    const reference = `INV-${invoice.invoiceNumber}`;

    // Integrity: Delete any previous postings for this invoice to handle UPDATES
    // If it transitions to 'draft', 'canceled', or 'voided', this cleans up any old postings.
    await deleteLedgerPostings(reference);

    // Sync Logic: Only 'sent', 'paid', or 'partial' invoices should have ledger entries.
    if (!['sent', 'paid', 'partial'].includes(invoice.status)) return;

    const companyId = invoice.companyId;

    // Resolve IDs for common accounts
    const debtorsAcc = await ensureAccount(companyId, '1200', 'Sundry Debtors', 'asset');
    const salesAcc = await ensureAccount(companyId, '4000', 'Sales Revenue', 'income');
    const cgstAcc = await ensureAccount(companyId, '2200', 'Output CGST', 'liability');
    const sgstAcc = await ensureAccount(companyId, '2201', 'Output SGST', 'liability');
    const igstAcc = await ensureAccount(companyId, '2202', 'Output IGST', 'liability');

    const lines: JournalLineInput[] = [];

    // 1. Debit Total to Sundry Debtors
    lines.push({
        accountId: debtorsAcc.id,
        debit: Number(invoice.total)
    });

    // 2. Credit Subtotal to Sales Revenue
    lines.push({
        accountId: salesAcc.id,
        credit: Number(invoice.subtotal)
    });

    // 3. Credit Tax Components
    const taxMap: Record<string, number> = {};
    invoice.items.forEach(item => {
        item.appliedTaxes.forEach(t => {
            const name = t.name.toUpperCase();
            if (!taxMap[name]) taxMap[name] = 0;
            taxMap[name] += Number(t.amount);
        });
    });

    for (const [taxName, amount] of Object.entries(taxMap)) {
        if (amount <= 0) continue;

        let accId = cgstAcc.id; // Default
        if (taxName.includes('SGST')) accId = sgstAcc.id;
        else if (taxName.includes('IGST')) accId = igstAcc.id;
        else if (taxName.includes('CGST')) accId = cgstAcc.id;

        lines.push({
            accountId: accId,
            credit: amount
        });
    }

    return await createJournalEntry(
        companyId,
        new Date(invoice.invoiceDate),
        `Invoice ${invoice.invoiceNumber} to ${invoice.client?.name || 'Client'}`,
        reference,
        lines,
        true // Auto Post
    );
};

/**
 * Automates Ledger posting for Payments
 */
export const postPaymentToLedger = async (paymentId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { invoice: { include: { client: true } } }
    });

    if (!payment || !payment.invoice) throw new Error('Payment/Invoice not found');
    if (payment.status !== 'success') return;

    const reference = `PAY-${payment.id.slice(-6).toUpperCase()}`;

    // Integrity: Delete any previous postings for this payment
    await deleteLedgerPostings(reference);

    // Resolve accounts
    const companyId = payment.invoice.companyId;
    const bankAcc = await ensureAccount(companyId, '1001', 'Bank Account', 'asset');
    const cashAcc = await ensureAccount(companyId, '1000', 'Cash', 'asset');
    const debtorsAcc = await ensureAccount(companyId, '1200', 'Sundry Debtors', 'asset');

    const method = payment.paymentMethod?.toLowerCase() || 'bank';
    const receivingAcc = (method === 'cash') ? cashAcc : bankAcc;

    const lines: JournalLineInput[] = [
        { accountId: receivingAcc.id, debit: Number(payment.amount) },
        { accountId: debtorsAcc.id, credit: Number(payment.amount) }
    ];

    return await createJournalEntry(
        companyId,
        new Date(payment.paymentDate),
        `Payment received for Invoice ${payment.invoice.invoiceNumber}`,
        reference,
        lines,
        true
    );
};

export const getJournalEntries = async (companyId: string, limit = 50) => {
    return await prisma.journalEntry.findMany({
        where: { companyId },
        include: {
            lines: {
                include: { account: true }
            }
        },
        orderBy: { date: 'desc' },
        take: limit
    });
};

const accountingService = {
    seedAccounts,
    createJournalEntry,
    getTrialBalance,
    getGeneralLedger,
    getBalanceSheet,
    getProfitAndLoss,
    getGstSummary,
    getAccountByCode,
    ensureAccount,
    postInvoiceToLedger,
    postPaymentToLedger,
    getJournalEntries,
    deleteLedgerPostings, // Added
    DEFAULT_ACCOUNTS
};

export default accountingService;
