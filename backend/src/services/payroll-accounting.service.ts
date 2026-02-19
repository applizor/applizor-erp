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

        // 2. Fetch Mappings (Salary Components & Statutory Config)
        const [components, statutoryConfig] = await Promise.all([
            prisma.salaryComponent.findMany({
                where: { companyId, isActive: true },
                select: { id: true, name: true, type: true, ledgerAccountId: true } as any
            }),
            prisma.statutoryConfig.findUnique({
                where: { companyId }
            })
        ]);

        if (!statutoryConfig) {
            throw new Error('Statutory configuration not found.');
        }

        // Validate mandatory account mappings
        if (!(statutoryConfig as any).salaryPayableAccountId) {
            throw new Error('Salary Payable account mapping is missing in Statutory Config.');
        }

        // 3. Aggregate Amounts
        const accountAmounts: Record<string, { debit: number; credit: number }> = {};

        const addAmount = (accountId: string, amount: number, isDebit: boolean) => {
            if (!accountAmounts[accountId]) {
                accountAmounts[accountId] = { debit: 0, credit: 0 };
            }
            if (isDebit) accountAmounts[accountId].debit += amount;
            else accountAmounts[accountId].credit += amount;
        };

        let totalGross = 0;
        let totalNet = 0;
        let totalPF = 0;
        let totalPT = 0;
        let totalTDS = 0;

        for (const p of payrolls) {
            const earnings = p.earningsBreakdown as Record<string, number> || {};
            const deductions = p.deductionsBreakdown as Record<string, number> || {};

            // Earnings -> Debit Expense
            for (const [name, amount] of Object.entries(earnings)) {
                const comp = (components as any[]).find((c: any) => c.name === name);
                if (comp && (comp as any).ledgerAccountId) {
                    addAmount((comp as any).ledgerAccountId, amount, true);
                } else {
                    // Fallback to general Salary Expense if not mapped? 
                    // Better to require mapping or use a default.
                    // For now, let's find the default Salary Expense account (5000)
                    const salaryExpenseAcc = await ensureAccount(companyId, '5000', 'Salary Expense', 'expense');
                    addAmount(salaryExpenseAcc.id, amount, true);
                }
            }

            // Statutory Deductions -> Credit Liability
            for (const [name, amount] of Object.entries(deductions)) {
                // Determine if it's PF, PT, or TDS based on helpers (imported or inline)
                const n = name.toUpperCase();
                if (n.includes('PF') || n.includes('PROVIDENT FUND')) {
                    totalPF += amount;
                } else if (n.includes('PT') || n.includes('PROFESSIONAL TAX')) {
                    totalPT += amount;
                } else if (n === 'TDS' || n.includes('INCOME TAX')) {
                    totalTDS += amount;
                } else {
                    // Other deductions (e.g. advance recovery)
                    // We might need a general "Other Deductions" mapping later
                }
            }

            totalNet += Number(p.netSalary);
        }

        // Add Statutory Credits if mapped
        if (totalPF > 0 && (statutoryConfig as any).pfPayableAccountId) {
            addAmount((statutoryConfig as any).pfPayableAccountId, totalPF, false);
        }
        if (totalPT > 0 && (statutoryConfig as any).ptPayableAccountId) {
            addAmount((statutoryConfig as any).ptPayableAccountId, totalPT, false);
        }
        if (totalTDS > 0 && (statutoryConfig as any).tdsPayableAccountId) {
            addAmount((statutoryConfig as any).tdsPayableAccountId, totalTDS, false);
        }

        // Net Pay -> Credit Salary Payable
        addAmount((statutoryConfig as any).salaryPayableAccountId, totalNet, false);

        // 4. Create Journal Entry
        const lines = Object.entries(accountAmounts).map(([accountId, amounts]) => ({
            accountId,
            debit: amounts.debit > 0 ? Math.round(amounts.debit * 100) / 100 : 0,
            credit: amounts.credit > 0 ? Math.round(amounts.credit * 100) / 100 : 0
        })).filter(l => l.debit > 0 || l.credit > 0);

        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        const reference = `PAYROLL-${year}-${month.toString().padStart(2, '0')}`;
        const description = `Salary Posting for ${monthName} ${year}`;

        return await createJournalEntry(
            companyId,
            new Date(), // Posting date
            description,
            reference,
            lines,
            true, // Auto Post
            userId
        );
    }
}
