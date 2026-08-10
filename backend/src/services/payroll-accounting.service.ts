import prisma from '../prisma/client';
import { createJournalEntry, ensureAccount } from './accounting.service';

export class PayrollAccountingService {
    /**
     * Post Payroll to Accounting (Journal Entry)
     */
    static async postPayrollToAccounting(companyId: string, month: number, year: number, userId?: string) {
        // 1. Fetch Payroll Records for the month/year
        const payrolls = await prisma.payroll.findMany({
            where: {
                employee: { companyId },
                month: Number(month),
                year: Number(year),
                status: 'processed' // Only post processed payrolls
            },
            include: {
                employee: true
            }
        });

        if (payrolls.length === 0) {
            throw new Error('No processed payroll records found for the selected period.');
        }

        // Check for existing posting to prevent duplicates
        const reference = `PAYROLL-${year}-${month.toString().padStart(2, '0')}`;
        const existingEntry = await prisma.journalEntry.findFirst({
            where: {
                companyId,
                reference,
                status: 'posted'
            }
        });
        if (existingEntry) {
            throw new Error(`Payroll for ${month}/${year} has already been posted to accounting (Journal: ${existingEntry.id}).`);
        }

        // 2. Fetch Mappings & Ensure Accounts (with robust fallback)
        const [components, statutoryConfig] = await Promise.all([
            prisma.salaryComponent.findMany({
                where: { companyId, isActive: true },
                select: { id: true, name: true, type: true, ledgerAccountId: true } as any
            }),
            prisma.statutoryConfig.findUnique({
                where: { companyId }
            })
        ]);

        const salaryPayableAcct = statutoryConfig?.salaryPayableAccountId
            ? await prisma.ledgerAccount.findUnique({ where: { id: statutoryConfig.salaryPayableAccountId } })
            || await ensureAccount(companyId, '2100', 'Salaries Payable', 'liability')
            : await ensureAccount(companyId, '2100', 'Salaries Payable', 'liability');

        const pfPayableAcct = statutoryConfig?.pfPayableAccountId
            ? await prisma.ledgerAccount.findUnique({ where: { id: statutoryConfig.pfPayableAccountId } })
            || await ensureAccount(companyId, '2400', 'PF Payable', 'liability')
            : await ensureAccount(companyId, '2400', 'PF Payable', 'liability');

        const esiPayableAcct = await ensureAccount(companyId, '2410', 'ESI Payable', 'liability');

        const ptPayableAcct = statutoryConfig?.ptPayableAccountId
            ? await prisma.ledgerAccount.findUnique({ where: { id: statutoryConfig.ptPayableAccountId } })
            || await ensureAccount(companyId, '2420', 'Professional Tax Payable', 'liability')
            : await ensureAccount(companyId, '2420', 'Professional Tax Payable', 'liability');

        const tdsPayableAcct = statutoryConfig?.tdsPayableAccountId
            ? await prisma.ledgerAccount.findUnique({ where: { id: statutoryConfig.tdsPayableAccountId } })
            || await ensureAccount(companyId, '2300', 'TDS Payable', 'liability')
            : await ensureAccount(companyId, '2300', 'TDS Payable', 'liability');

        // 3. Aggregate Amounts
        const accountAmounts: Record<string, { debit: number; credit: number }> = {};

        const addAmount = (accountId: string, amount: number, isDebit: boolean) => {
            if (!accountAmounts[accountId]) {
                accountAmounts[accountId] = { debit: 0, credit: 0 };
            }
            if (isDebit) accountAmounts[accountId].debit += amount;
            else accountAmounts[accountId].credit += amount;
        };

        let totalNet = 0;
        let totalPF = 0;
        let totalESI = 0;
        let totalPT = 0;
        let totalTDS = 0;
        let totalOtherDeductions = 0;

        for (const p of payrolls) {
            const earnings = p.earningsBreakdown as Record<string, number> || {};
            const deductions = p.deductionsBreakdown as Record<string, number> || {};

            // Earnings -> Debit Expense
            for (const [name, amount] of Object.entries(earnings)) {
                if (amount <= 0) continue;
                const comp = (components as any[]).find((c: any) => c.name === name || c.name.toUpperCase() === name.toUpperCase());
                if (comp && (comp as any).ledgerAccountId) {
                    addAmount((comp as any).ledgerAccountId, amount, true);
                } else {
                    const salaryExpenseAcc = await ensureAccount(companyId, '5000', 'Salary Expense', 'expense');
                    addAmount(salaryExpenseAcc.id, amount, true);
                }
            }

            // Deductions -> Credit Liability accounts (Supports Global Statutory Rules & Custom Mappings)
            for (const [name, amount] of Object.entries(deductions)) {
                if (amount <= 0) continue;
                const comp = (components as any[]).find((c: any) => c.name === name || c.name.toUpperCase() === name.toUpperCase());
                if (comp && (comp as any).ledgerAccountId) {
                    addAmount((comp as any).ledgerAccountId, amount, false);
                } else {
                    const n = name.toUpperCase();
                    if (n.includes('PF') || n.includes('PROVIDENT') || n.includes('PENSION') || n.includes('401K') || n.includes('CPF') || n.includes('SUPERANNUATION')) {
                        addAmount(pfPayableAcct.id, amount, false);
                    } else if (n.includes('ESI') || n.includes('ESIC') || n.includes('MEDICARE') || n.includes('HEALTH') || n.includes('EI')) {
                        addAmount(esiPayableAcct.id, amount, false);
                    } else if (n.includes('PT') || n.includes('PROFESSIONAL TAX') || n.includes('LOCAL TAX') || n.includes('STATE TAX')) {
                        addAmount(ptPayableAcct.id, amount, false);
                    } else if (n === 'TDS' || n.includes('INCOME TAX') || n.includes('PAYE') || n.includes('WITHHOLDING') || n.includes('PAYG')) {
                        addAmount(tdsPayableAcct.id, amount, false);
                    } else {
                        addAmount(salaryPayableAcct.id, amount, false);
                    }
                }
            }

            totalNet += Number(p.netSalary);
        }

        // Net Pay -> Credit Salary Payable
        addAmount(salaryPayableAcct.id, totalNet, false);

        // 4. Create Journal Entry (Posted on month-end date for accurate P&L and Balance Sheet)
        const lines = Object.entries(accountAmounts).map(([accountId, amounts]) => ({
            accountId,
            debit: amounts.debit > 0 ? Math.round(amounts.debit * 100) / 100 : 0,
            credit: amounts.credit > 0 ? Math.round(amounts.credit * 100) / 100 : 0
        })).filter(l => l.debit > 0 || l.credit > 0);

        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        const postingDate = new Date(year, month, 0); // Last day of payroll month
        const description = `Salary Posting for ${monthName} ${year}`;

        const entry = await createJournalEntry(
            companyId,
            postingDate,
            description,
            reference,
            lines,
            true, // Auto Post
            userId
        );

        // Update status of all processed payrolls to 'paid' (approved/posted)
        await prisma.payroll.updateMany({
            where: { id: { in: payrolls.map(p => p.id) } },
            data: { status: 'paid', processedAt: new Date() }
        });

        return entry;
    }
}

