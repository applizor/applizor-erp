import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PDFService } from './pdf.service';

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
    { code: '5201', name: 'Discount Allowed', type: 'expense' },
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

const checkLedgerLock = async (companyId: string, date: Date) => {
    // Check for lock date
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { accountingLockDate: true }
    });

    if (company?.accountingLockDate && date <= company.accountingLockDate) {
        throw new Error(`Ledger is locked until ${company.accountingLockDate.toDateString()}. Cannot post entries before this date.`);
    }
};

export const createJournalEntry = async (
    companyId: string,
    date: Date,
    description: string,
    reference: string,
    lines: JournalLineInput[],
    autoPost: boolean = false,
    userId?: string // Added for Audit Trail
) => {
    // 0. Check Ledger Lock
    await checkLedgerLock(companyId, date);

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

        // 3. Audit Log
        await tx.auditLog.create({
            data: {
                companyId,
                userId,
                action: 'CREATE',
                module: 'ACCOUNTING',
                entityType: 'JournalEntry',
                entityId: entry.id,
                details: `Created Journal Entry ${reference}: ${description}`,
                changes: { lines: lines, total: totalDebit } as any
            }
        });

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
    // Normalize dates to cover full day range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Fetch all journal lines for GST accounts in the period
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
                date: { gte: start, lte: end },
                status: 'posted'
            }
        },
        include: { account: true, journalEntry: true }
    });

    // 2. Group by Account Type for High-Level Summary
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

    // 3. Prepare Detailed Transaction List (Sales / Output Focus) with B2B/B2C Split
    const invoiceRefs = [...new Set(
        lines
            .filter(l => l.journalEntry.reference && l.journalEntry.reference.startsWith('INV-'))
            .map(l => l.journalEntry.reference!)
    )];

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId,
            invoiceNumber: { in: invoiceRefs }
        },
        include: { client: true }
    });

    const b2bTransactions: any[] = [];
    const b2cTransactions: any[] = [];

    invoices.forEach(inv => {
        // Find all GST lines associated with this invoice's journal entry
        const invLines = lines.filter(l => l.journalEntry.reference === inv.invoiceNumber);

        let cgst = 0, sgst = 0, igst = 0;

        // Sum up tax components from the ledger lines
        invLines.forEach(l => {
            const isOutput = ['2200', '2201', '2202'].includes(l.account.code); // Liability codes
            if (isOutput) {
                const val = Number(l.credit) - Number(l.debit);
                if (l.account.code === '2200') cgst += val;      // Output CGST
                else if (l.account.code === '2201') sgst += val; // Output SGST
                else if (l.account.code === '2202') igst += val; // Output IGST
            }
        });

        // Skip if no tax output (might be exempt or input only)
        if (cgst + sgst + igst <= 0) return;

        const taxableValue = Number(inv.subtotal);
        const txData = {
            date: inv.invoiceDate,
            invoiceNumber: inv.invoiceNumber,
            clientName: inv.client.name,
            clientGstin: inv.client.gstin || 'N/A',
            taxableValue,
            cgst,
            sgst,
            igst,
            totalTax: cgst + sgst + igst,
            totalAmount: Number(inv.total)
        };

        if (inv.client.gstin && inv.client.gstin.length > 5) {
            b2bTransactions.push(txData);
        } else {
            b2cTransactions.push(txData);
        }
    });

    // Sort by date desc
    const sortFn = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();
    b2bTransactions.sort(sortFn);
    b2cTransactions.sort(sortFn);

    return { summary, b2bTransactions, b2cTransactions };
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
export const deleteLedgerPostings = async (reference: string, prismaTx?: any) => {
    const execute = async (tx: any) => {
        // 1. Find all entries for this reference
        const entries = await tx.journalEntry.findMany({
            where: { reference },
            include: { lines: { include: { account: true } } }
        });

        // 1.5 Check Ledger Lock for all entries to be deleted
        for (const entry of entries) {
            await checkLedgerLock(entry.companyId, entry.date);
        }

        // 2. Revert balances for all lines
        for (const entry of entries) {
            for (const line of entry.lines) {
                const account = line.account;
                let balanceChange = 0;
                const debit = Number(line.debit);
                const credit = Number(line.credit);

                // Reversal logic: opposite of createJournalEntry
                if (['asset', 'expense'].includes(account.type)) {
                    balanceChange = credit - debit; // To revert a debit (+), we subtract it
                } else {
                    balanceChange = debit - credit; // To revert a credit (+), we subtract it
                }

                await tx.ledgerAccount.update({
                    where: { id: account.id },
                    data: {
                        balance: { increment: balanceChange }
                    }
                });
            }
        }

        if (entries.length === 0) {
            return { count: 0 };
        }

        // 3. Audit Log (Bulk Deletion)
        await tx.auditLog.create({
            data: {
                companyId: entries[0].companyId,
                action: 'DELETE',
                module: 'ACCOUNTING',
                entityType: 'JournalEntry', // Representing multiple
                entityId: reference, // Using reference as ID
                details: `Deleted ${entries.length} ledger postings for reference ${reference}`,
                changes: { count: entries.length, reference } as any
            }
        });

        // 4. Delete headers (lines will cascade if setup, or we delete explicitly)
        return await tx.journalEntry.deleteMany({
            where: { reference }
        });
    };

    if (prismaTx) {
        return execute(prismaTx);
    } else {
        return await prisma.$transaction(execute);
    }
};

/**
 * Deletes a single journal entry and reverts balances
 */
export const deleteJournalEntry = async (id: string, userId?: string) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Find the entry
        const entry = await tx.journalEntry.findUnique({
            where: { id },
            include: { lines: { include: { account: true } } }
        });

        if (!entry) throw new Error('Journal Entry not found');

        // 0. Check Ledger Lock (using entry date)
        await checkLedgerLock(entry.companyId, new Date(entry.date));

        // 2. Revert balances if it was posted
        if (entry.status === 'posted') {
            for (const line of entry.lines) {
                const account = line.account;
                let balanceChange = 0;
                const debit = Number(line.debit);
                const credit = Number(line.credit);

                if (['asset', 'expense'].includes(account.type)) {
                    balanceChange = credit - debit;
                } else {
                    balanceChange = debit - credit;
                }

                await tx.ledgerAccount.update({
                    where: { id: account.id },
                    data: {
                        balance: { increment: balanceChange }
                    }
                });
            }
        }

        // 3. Delete the entry
        await tx.journalEntry.delete({
            where: { id }
        });

        // 4. Audit Log
        await tx.auditLog.create({
            data: {
                companyId: entry.companyId,
                userId,
                action: 'DELETE',
                module: 'ACCOUNTING',
                entityType: 'JournalEntry',
                entityId: id,
                details: `Deleted Journal Entry ${entry.reference}`,
                changes: { originalEntry: entry }
            }
        });

        return entry;
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

    // Standardize reference: invoice.invoiceNumber already includes 'INV-' or 'QTN-'
    const reference = invoice.invoiceNumber;

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
    const discountAcc = await ensureAccount(companyId, '5201', 'Discount Allowed', 'expense');

    const lines: JournalLineInput[] = [];

    // 1. Debit Total to Sundry Debtors (Net Receivable)
    lines.push({
        accountId: debtorsAcc.id,
        debit: Number(invoice.total)
    });

    // 2. Credit Subtotal to Sales Revenue (Gross Amount)
    lines.push({
        accountId: salesAcc.id,
        credit: Number(invoice.subtotal)
    });

    // 3. Credit Tax Components
    let totalTaxRecorded = 0;
    const taxMap: Record<string, number> = {};
    invoice.items.forEach(item => {
        item.appliedTaxes.forEach(t => {
            const name = t.name.toUpperCase();
            if (!taxMap[name]) taxMap[name] = 0;
            taxMap[name] += Number(t.amount);
            totalTaxRecorded += Number(t.amount);
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

    // 4. Debit Discount Allowed if applicable (To Balance: Total + Discount = Subtotal + Tax)
    // We calculate it dynamically to handle rounding and item-level vs global discounts
    const discountAmount = Math.max(0, (Number(invoice.subtotal) + totalTaxRecorded) - Number(invoice.total));
    if (discountAmount > 0.009) { // Using slightly lower threshold for float precision
        lines.push({
            accountId: discountAcc.id,
            debit: discountAmount
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

export const reconcileCompanyLedger = async (companyId: string) => {
    // 0. BACKFILL: Find sent/paid invoices missing from ledger and create entries
    const invoices = await prisma.invoice.findMany({
        where: {
            companyId,
            status: { in: ['sent', 'paid', 'partial'] }
        }
    });

    let backfilledCount = 0;
    for (const inv of invoices) {
        // Check if journal entry exists (Reference matches Invoice Number)
        const exists = await prisma.journalEntry.count({
            where: {
                companyId,
                reference: inv.invoiceNumber
            }
        });

        if (exists === 0) {
            try {
                // Determine user ID if possible (system action)
                // We use a try-catch to avoid breaking the whole sync process for one bad invoice
                await postInvoiceToLedger(inv.id);
                backfilledCount++;
                console.log(`[Reconcile] Backfilled ledger for invoice: ${inv.invoiceNumber}`);
            } catch (err) {
                console.error(`[Reconcile] Failed to backfill invoice ${inv.invoiceNumber}:`, err);
            }
        }
    }

    return await prisma.$transaction(async (tx) => {
        // 1. Reset all balances to 0
        await tx.ledgerAccount.updateMany({
            where: { companyId },
            data: { balance: new Decimal(0) }
        });

        // 2. Fetch all posted journal lines for the company
        const lines = await tx.journalEntryLine.findMany({
            where: {
                journalEntry: {
                    companyId,
                    status: 'posted'
                }
            },
            include: { account: true }
        });

        // 3. Group by accountId and calculate new balances
        const accountTotals: Record<string, number> = {};
        for (const line of lines) {
            if (!accountTotals[line.accountId]) accountTotals[line.accountId] = 0;

            const debit = Number(line.debit);
            const credit = Number(line.credit);

            if (['asset', 'expense'].includes(line.account.type)) {
                accountTotals[line.accountId] += (debit - credit);
            } else {
                accountTotals[line.accountId] += (credit - debit);
            }
        }

        // 4. Update ledger accounts with correct balances
        for (const [accountId, balance] of Object.entries(accountTotals)) {
            await tx.ledgerAccount.update({
                where: { id: accountId },
                data: { balance: new Decimal(balance) }
            });
        }

        return {
            success: true,
            accountsReconciled: Object.keys(accountTotals).length,
            backfilledInvoices: backfilledCount
        };
    });
};


export const generateReportPDF = async (
    companyId: string,
    type: 'TRIAL_BALANCE' | 'PROFIT_LOSS' | 'BALANCE_SHEET' | 'GST_SUMMARY',
    startDate?: Date,
    endDate?: Date
) => {
    // 1. Fetch Company Info
    const company = await prisma.company.findUnique({
        where: { id: companyId }
    });

    if (!company) throw new Error('Company not found');

    // 2. Fetch Data & Build HTML Content
    let title = '';
    let contentHtml = '';
    const period = startDate && endDate
        ? `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`
        : `As of ${new Date().toLocaleDateString('en-IN')}`;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (type === 'TRIAL_BALANCE') {
        title = 'Trial Balance';
        const data = await getTrialBalance(companyId);
        const totalDebit = data.reduce((sum, acc) => {
            const val = Number(acc.balance);
            return sum + (['asset', 'expense'].includes(acc.type) ? val : 0);
        }, 0);
        const totalCredit = data.reduce((sum, acc) => {
            const val = Number(acc.balance);
            return sum + (['liability', 'equity', 'income'].includes(acc.type) ? val : 0);
        }, 0);

        contentHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Account Code</th>
                        <th>Account Name</th>
                        <th style="text-align:right">Debit</th>
                        <th style="text-align:right">Credit</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(acc => {
            const bal = Number(acc.balance);
            const isDebit = ['asset', 'expense'].includes(acc.type);
            return `
                        <tr>
                            <td>${acc.code}</td>
                            <td>${acc.name}</td>
                            <td class="amount">${isDebit ? formatCurrency(bal) : ''}</td>
                            <td class="amount">${!isDebit ? formatCurrency(bal) : ''}</td>
                        </tr>
                        `;
        }).join('')}
                    <tr class="total-row">
                        <td colspan="2">Total</td>
                        <td class="amount">${formatCurrency(totalDebit)}</td>
                        <td class="amount">${formatCurrency(totalCredit)}</td>
                    </tr>
                </tbody>
            </table>
        `;
    } else if (type === 'PROFIT_LOSS') {
        title = 'Profit & Loss Statement';
        const data = await getProfitAndLoss(companyId, startDate, endDate);

        const renderSection = (items: any[], sectionTitle: string) => {
            if (items.length === 0) return '';
            const total = items.reduce((sum, item) => sum + Number(item.balance), 0);
            return `
                <tr class="section-header"><td colspan="2">${sectionTitle}</td></tr>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td class="amount">${formatCurrency(Number(item.balance))}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td>Total ${sectionTitle}</td>
                    <td class="amount">${formatCurrency(total)}</td>
                </tr>
            `;
        };

        const totalRevenue = data.revenue.reduce((s, i) => s + Number(i.balance), 0);
        const totalCOGS = data.costOfGoodsSold.reduce((s, i) => s + Number(i.balance), 0);
        const grossProfit = totalRevenue - totalCOGS;
        const totalOpex = data.operatingExpenses.reduce((s, i) => s + Number(i.balance), 0);
        const totalOtherIncome = data.otherIncome.reduce((s, i) => s + Number(i.balance), 0);
        const netProfit = grossProfit - totalOpex + totalOtherIncome;

        contentHtml = `
            <table>
                <tbody>
                    ${renderSection(data.revenue, 'Revenue')}
                    ${renderSection(data.costOfGoodsSold, 'Cost of Goods Sold')}
                    <tr class="total-row" style="background-color: #e0f2f1;">
                        <td>Gross Profit</td>
                        <td class="amount">${formatCurrency(grossProfit)}</td>
                    </tr>
                    ${renderSection(data.operatingExpenses, 'Operating Expenses')}
                    ${renderSection(data.otherIncome, 'Other Income')}
                    <tr class="total-row" style="background-color: #d1fae5; font-size: 14px;">
                        <td>Net Profit</td>
                        <td class="amount">${formatCurrency(netProfit)}</td>
                    </tr>
                </tbody>
            </table>
        `;

    } else if (type === 'BALANCE_SHEET') {
        title = 'Balance Sheet';
        const accounts = await getBalanceSheet(companyId);

        const assets = accounts.filter(a => a.type === 'asset');
        const liabilities = accounts.filter(a => a.type === 'liability');
        const equity = accounts.filter(a => a.type === 'equity');

        const totalAssets = assets.reduce((s, a) => s + Number(a.balance), 0);
        const totalLiabilities = liabilities.reduce((s, a) => s + Number(a.balance), 0);
        const totalEquity = equity.reduce((s, a) => s + Number(a.balance), 0);

        const renderGroup = (items: any[], name: string) => {
            if (items.length === 0) return '';
            return `
                <tr class="section-header"><td colspan="2">${name}</td></tr>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td class="amount">${formatCurrency(Number(item.balance))}</td>
                    </tr>
                `).join('')}
            `;
        };

        contentHtml = `
            <table>
                <tbody>
                    ${renderGroup(assets, 'Assets')}
                    <tr class="total-row"><td>Total Assets</td><td class="amount">${formatCurrency(totalAssets)}</td></tr>
                    
                    ${renderGroup(liabilities, 'Liabilities')}
                    <tr class="total-row"><td>Total Liabilities</td><td class="amount">${formatCurrency(totalLiabilities)}</td></tr>

                    ${renderGroup(equity, 'Equity')}
                    <tr class="total-row"><td>Total Equity</td><td class="amount">${formatCurrency(totalEquity)}</td></tr>

                    <tr class="total-row" style="background-color: #eef2f5;">
                        <td>Total Liabilities & Equity</td>
                        <td class="amount">${formatCurrency(totalLiabilities + totalEquity)}</td>
                    </tr>
                </tbody>
            </table>
        `;

    } else if (type === 'GST_SUMMARY') {
        title = 'GST Summary Report';
        if (!startDate || !endDate) throw new Error('Date range required for GST Report');
        const gstData = await getGstSummary(companyId, startDate, endDate);

        contentHtml = `
            <h3>Input vs Output Tax</h3>
            <table>
                <thead>
                    <tr><th>Component</th><th style="text-align:right">Amount</th></tr>
                </thead>
                <tbody>
                    <tr><td>CGST Input</td><td class="amount">${formatCurrency(gstData.summary.CGST.input)}</td></tr>
                    <tr><td>SGST Input</td><td class="amount">${formatCurrency(gstData.summary.SGST.input)}</td></tr>
                    <tr><td>IGST Input</td><td class="amount">${formatCurrency(gstData.summary.IGST.input)}</td></tr>
                    <tr class="total-row"><td>Total Input</td><td class="amount">${formatCurrency(gstData.summary.CGST.input + gstData.summary.SGST.input + gstData.summary.IGST.input)}</td></tr>
                    <tr><td colspan="2" style="height: 10px;"></td></tr>
                    <tr><td>CGST Output</td><td class="amount">${formatCurrency(gstData.summary.CGST.output)}</td></tr>
                    <tr><td>SGST Output</td><td class="amount">${formatCurrency(gstData.summary.SGST.output)}</td></tr>
                    <tr><td>IGST Output</td><td class="amount">${formatCurrency(gstData.summary.IGST.output)}</td></tr>
                    <tr class="total-row"><td>Total Output</td><td class="amount">${formatCurrency(gstData.summary.CGST.output + gstData.summary.SGST.output + gstData.summary.IGST.output)}</td></tr>
                    <tr class="total-row" style="background-color: #e0f2fe;"><td>Net Payable</td><td class="amount">${formatCurrency((gstData.summary.CGST.output + gstData.summary.SGST.output + gstData.summary.IGST.output) - (gstData.summary.CGST.input + gstData.summary.SGST.input + gstData.summary.IGST.input))}</td></tr>
                </tbody>
            </table>

            <h3>B2B Transactions (Registered Clients)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Inv #</th>
                        <th>Client</th>
                        <th>GSTIN</th>
                        <th style="text-align:right">Taxable</th>
                        <th style="text-align:right">Tax</th>
                        <th style="text-align:right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${gstData.b2bTransactions.length > 0 ? gstData.b2bTransactions.map((tx: any) => `
                        <tr>
                            <td>${new Date(tx.date).toLocaleDateString()}</td>
                            <td>${tx.invoiceNumber}</td>
                            <td>${tx.clientName}</td>
                            <td>${tx.clientGstin}</td>
                            <td class="amount">${formatCurrency(tx.taxableValue)}</td>
                            <td class="amount">${formatCurrency(tx.totalTax)}</td>
                            <td class="amount">${formatCurrency(tx.totalAmount)}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="7" style="text-align:center">No B2B Transactions</td></tr>'}
                </tbody>
            </table>

            <h3>B2C Transactions (Unregistered)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Inv #</th>
                        <th>Client</th>
                        <th style="text-align:right">Taxable</th>
                        <th style="text-align:right">Tax</th>
                        <th style="text-align:right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${gstData.b2cTransactions.length > 0 ? gstData.b2cTransactions.map((tx: any) => `
                        <tr>
                            <td>${new Date(tx.date).toLocaleDateString()}</td>
                            <td>${tx.invoiceNumber}</td>
                            <td>${tx.clientName}</td>
                            <td class="amount">${formatCurrency(tx.taxableValue)}</td>
                            <td class="amount">${formatCurrency(tx.totalTax)}</td>
                            <td class="amount">${formatCurrency(tx.totalAmount)}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="6" style="text-align:center">No B2C Transactions</td></tr>'}
                </tbody>
            </table>
        `;
    }

    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
                .report-title { font-size: 18px; color: #555; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
                .period { font-size: 12px; color: #888; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
                th, td { border-bottom: 1px solid #eee; padding: 10px; font-size: 11px; }
                th { text-align: left; background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; color: #555; }
                .amount { text-align: right; font-family: 'Courier New', monospace; font-weight: bold; }
                .total-row td { border-top: 2px solid #333; font-weight: bold; background-color: #f9fafb; }
                .section-header td { font-weight: bold; background-color: #eef2f5; color: #1e293b; padding-top: 15px; }
                h3 { font-size: 14px; text-transform: uppercase; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${company.name}</div>
                <div class="report-title">${title}</div>
                <div class="period">${startDate ? startDate.toLocaleDateString() : ''} - ${endDate ? endDate.toLocaleDateString() : ''}</div>
            </div>
            ${contentHtml}
            <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #888;">
                Generated by Applizor ERP on ${new Date().toLocaleString()}
            </div>
        </body>
        </html>
    `;

    return await PDFService.generateGenericPDF(fullHtml, {});
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
    reconcileCompanyLedger,
    deleteLedgerPostings,
    deleteJournalEntry,
    generateReportPDF,
    DEFAULT_ACCOUNTS
};

export default accountingService;
