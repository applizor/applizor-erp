import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PDFService } from '../services/pdf.service';
import { ensureAccount, createJournalEntry } from '../services/accounting.service';
import { PermissionService } from '../services/permission.service';
import { PayrollService } from '../services/payroll.service';
import { ComplianceService } from '../services/compliance.service';
import { PayrollAccountingService } from '../services/payroll-accounting.service';
import { sendPayslipEmail } from '../services/email.service';
import { StatutoryRuleService } from '../services/statutory-rule.service';

// --- Salary Component Master ---

export const getMyPayrolls = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Find the employee record for this user
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.json([]);

        const payrolls = await prisma.payroll.findMany({
            where: { employeeId: employee.id },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: { year: 'desc', month: 'desc' }
        });

        res.json(payrolls);
    } catch (error) {
        console.error('Get my payrolls error:', error);
        res.status(500).json({ error: 'Failed to fetch payrolls' });
    }
};

export const getSalaryComponents = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Basic Read on Payroll (Components are metadata)
        if (!PermissionService.hasBasicPermission(req.user, 'Payroll', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = req.user?.companyId;
        const components = await prisma.salaryComponent.findMany({
            where: { companyId, isActive: true }
        });
        res.json(components);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch salary components' });
    }
};

export const createSalaryComponent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Components are Config. Require Create on SalaryComponent.
        if (!PermissionService.hasBasicPermission(req.user, 'SalaryComponent', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for SalaryComponent' });
        }

        const companyId = req.user?.companyId;
        const { name, type, calculationType, defaultValue } = req.body;

        const component = await prisma.salaryComponent.create({
            data: {
                companyId: companyId!,
                name,
                type,
                calculationType,
                defaultValue: defaultValue || 0
            }
        });
        res.json(component);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create component' });
    }
};

export const updateSalaryComponent = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'SalaryComponent', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const companyId = req.user!.companyId;

        const existing = await prisma.salaryComponent.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ error: 'Component not found' });

        const { name, type, calculationType, defaultValue, isActive } = req.body;
        const component = await prisma.salaryComponent.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(type !== undefined && { type }),
                ...(calculationType !== undefined && { calculationType }),
                ...(defaultValue !== undefined && { defaultValue }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json(component);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update component' });
    }
};

export const deleteSalaryComponent = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'SalaryComponent', 'delete')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const companyId = req.user!.companyId;

        const existing = await prisma.salaryComponent.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ error: 'Component not found' });

        await prisma.salaryComponent.delete({ where: { id } });

        res.json({ message: 'Component deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete component' });
    }
};

// --- Statutory Configuration ---

export const getStatutoryConfig = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Payroll', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const companyId = req.user!.companyId;
        const config = await PayrollService.getStatutoryConfig(companyId);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statutory config' });
    }
};

export const updateStatutoryConfig = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Payroll', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const companyId = req.user!.companyId;
        const config = await PayrollService.saveStatutoryConfig(companyId, req.body);
        res.json(config);
    } catch (error) {
        console.error('UpdateStatConfig Controller Error:', error);
        res.status(500).json({ error: 'Failed to update statutory config' });
    }
};

// --- Employee Salary Structure ---

export const getEmployeeSalaryStructure = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { employeeId } = req.params;

        // Check Scope: Can I view THIS employee's structure?
        // 1. Get My Emp ID
        const currentUserEmployee = await prisma.employee.findUnique({ where: { userId } });
        const currentEmpId = currentUserEmployee?.id;

        const scope = PermissionService.getPermissionScope(req.user, 'SalaryStructure', 'read');
        let hasAccess = false;

        if (scope.all) {
            hasAccess = true;
        } else if (scope.owned && currentEmpId === employeeId) {
            hasAccess = true;
        } else if (scope.added) {
            // Check if target employee was added by me?
            const targetEmp = await prisma.employee.findUnique({ where: { id: employeeId } });
            if (targetEmp && targetEmp.createdById === userId) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied: You cannot view this salary structure.' });
        }

        const structure = await prisma.employeeSalaryStructure.findUnique({
            where: { employeeId },
            include: {
                components: {
                    include: { component: true }
                }
            }
        });
        res.json(structure);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch structure' });
    }
};

export const upsertEmployeeSalaryStructure = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Updating Structure requires Update permission on SalaryStructure
        if (!PermissionService.hasBasicPermission(req.user, 'SalaryStructure', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for SalaryStructure' });
        }

        const { employeeId } = req.params;
        const { ctc, netSalary, components, templateId, effectiveDate } = req.body; 

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Upsert Structure Header
            const structure = await tx.employeeSalaryStructure.upsert({
                where: { employeeId },
                update: { 
                    ctc, 
                    netSalary,
                    templateId: templateId || null,
                    effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined
                },
                create: { 
                    employeeId, 
                    ctc, 
                    netSalary,
                    templateId: templateId || null,
                    effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
                }
            });

            // 2. Delete existing component mappings for this structure
            await tx.employeeSalaryComponent.deleteMany({
                where: { structureId: structure.id }
            });

            // 3. Create new mappings
            if (components && components.length > 0) {
                await tx.employeeSalaryComponent.createMany({
                    data: components.map((c: any) => ({
                        structureId: structure.id,
                        // Fix for field mismatch: support both componentId and salaryComponentId
                        componentId: c.componentId || c.salaryComponentId,
                        // Fix for field mismatch: support both monthlyAmount and amount
                        monthlyAmount: c.monthlyAmount !== undefined ? c.monthlyAmount : c.amount
                    }))
                });
            }

            // 4. Also update the salary field in Employee model for quick access listing
            await tx.employee.update({
                where: { id: employeeId },
                data: { salary: ctc }
            });

            return structure;
        });

        res.json(result);
    } catch (error) {
        console.error('Update structure error:', error);
        res.status(500).json({ error: 'Failed to update salary structure' });
    }
};

export const processPayroll = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Processing Payroll is a CREATE action (creating Payroll records)
        if (!PermissionService.hasBasicPermission(req.user, 'Payroll', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Payroll' });
        }

        const { month, year, departmentId } = req.body;
        // month is 1-indexed (1 = January)

        if (!month || !year) {
            return res.status(400).json({ error: 'Month and Year are required' });
        }

        const where: any = {
            status: 'active',
            companyId: req.user!.companyId
        };

        if (departmentId) {
            where.departmentId = departmentId;
        }

        const company = await prisma.company.findUnique({
            where: { id: req.user!.companyId },
            select: { offDays: true } as any
        }) as any;
        const offDaysArr = company?.offDays ? (company.offDays as string).split(',').map((s: string) => s.trim()) : ['Saturday', 'Sunday'];

        // Use UTC-based month boundaries to avoid timezone shifts
        const monthStartUTC = new Date(Date.UTC(year, month - 1, 1));
        const monthEndUTC = new Date(Date.UTC(year, month, 0));

        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: monthStartUTC,
                    lte: monthEndUTC
                },
                OR: [
                    { companyId: req.user!.companyId },
                    { companyId: null }
                ]
            },
            select: { date: true }
        });
        const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const holidayDates = holidays.map(h => formatDate(new Date(h.date)));

        const employees = await prisma.employee.findMany({
            where,
            include: {
                attendances: {
                    where: {
                        date: {
                            gte: monthStartUTC,
                            lte: monthEndUTC
                        }
                    }
                },
                leaveRequests: {
                    where: {
                        status: 'approved',
                        startDate: { lte: monthEndUTC },
                        endDate: { gte: monthStartUTC }
                    },
                    select: {
                        startDate: true,
                        endDate: true,
                        durationType: true
                    }
                },
                salaryStructureDetails: {
                    include: {
                        components: {
                            include: { component: true }
                        }
                    }
                }
            }
        });

        const payrolls = await prisma.$transaction(async (tx) => {
            const results = [];

            for (const emp of employees) {
            // Skip if no structure defined
            if (!emp.salaryStructureDetails) continue;

            const totalDays = monthEndUTC.getDate();
            const startDate = new Date(monthStartUTC);

            // Calculate LOP (Reuse pre-fetched attendances)
            // Build set of approved leave dates to exclude from LOP
            const approvedLeaveDates = new Set<string>();
            for (const lr of emp.leaveRequests) {
                const lrStart = new Date(lr.startDate);
                const lrEnd = new Date(lr.endDate);
                for (let d = new Date(lrStart); d <= lrEnd; d.setDate(d.getDate() + 1)) {
                    approvedLeaveDates.add(formatDate(d));
                }
            }

            const attendanceMetrics = PayrollService.computeAttendanceStats(emp.attendances, totalDays, startDate, offDaysArr, holidayDates, approvedLeaveDates);
            const absentDays = attendanceMetrics.lopDays;

            const structure = emp.salaryStructureDetails;
            let grossEarned = 0;
            let totalDeductions = 0;

            const earningsBreakdown: any = {};
            const deductionsBreakdown: any = {};

            // Fetch active statutory rules for this country/company to dynamically identify statutory components
            const countryId = await StatutoryRuleService.getCountryForCompany(req.user!.companyId);
            const activeRules = countryId ? await StatutoryRuleService.getActiveRules(countryId, req.user!.companyId) : [];
            const activeRuleCodes = new Set(activeRules.map(r => r.code.toUpperCase()));

            // Calculate each component
            for (const item of structure.components) {
                const component = item.component;
                let amount = Number(item.monthlyAmount);

                // Apply LOP if it's an earning
                if (component.type === 'earning') {
                    if (absentDays > 0) {
                        amount = amount - (amount / totalDays * absentDays);
                    }
                    grossEarned += amount;
                    earningsBreakdown[component.name] = amount;
                } else if (component.type === 'deduction') {
                    // Check if it's a statutory deduction that should be auto-calculated
                    const isStatutory = activeRuleCodes.has(component.name.toUpperCase()) || 
                                       PayrollService.isPF(component.name) || 
                                       PayrollService.isESI(component.name) || 
                                       PayrollService.isPT(component.name);
                    
                    if (isStatutory) {
                        // Will calculate dynamically below
                    } else {
                        totalDeductions += amount;
                        deductionsBreakdown[component.name] = amount;
                    }
                }
            }

            // --- Statutory Calculations ---
            const basicAmount = (Object.entries(earningsBreakdown).find(([name]) => PayrollService.isBasic(name))?.[1] as number) || 0;
            const statutory = await PayrollService.calculateStatutoryDeductions(req.user!.companyId, basicAmount, grossEarned, emp.ptState || 'Maharashtra', Number(month), Number(year));

            // Integrate dynamic statutory rules from rule engine (PF, ESI, PT, Social Security, Medicare, FICA, CPF, etc.)
            if (statutory.breakdown) {
                for (const [code, amount] of Object.entries(statutory.breakdown)) {
                    if (amount > 0) {
                        const compName = structure.components.find(c => 
                            c.component.name.toUpperCase() === code.toUpperCase() || 
                            c.component.name.toUpperCase().includes(code.toUpperCase())
                        )?.component.name || code.toUpperCase();
                        
                        deductionsBreakdown[compName] = amount;
                        totalDeductions += amount;
                    }
                }
            }

            // Integrate TDS (Advanced Tax)
            const tdsAmount = await PayrollService.calculateTDS(emp.id, req.user!.companyId, grossEarned, Number(month), Number(year));
            if (tdsAmount > 0) {
                const tdsLabel = structure.components.find(c => PayrollService.isTDS(c.component.name))?.component.name || 'TDS';
                deductionsBreakdown[tdsLabel] = tdsAmount;
                totalDeductions += tdsAmount;
            }

            const netSalary = grossEarned - totalDeductions;

            const processedBasic = (Object.entries(earningsBreakdown).find(([name]) => PayrollService.isBasic(name))?.[1] as number) || 0;
            const totalAllowances = grossEarned - processedBasic;

            // Check if payroll exists
            const existingPayroll = await tx.payroll.findFirst({
                where: {
                    employeeId: emp.id,
                    month: Number(month),
                    year: Number(year)
                }
            });

            let payroll;

            if (existingPayroll) {
                payroll = await tx.payroll.update({
                    where: { id: existingPayroll.id },
                    data: {
                        basicSalary: processedBasic,
                        allowances: totalAllowances,
                        deductions: totalDeductions,
                        earningsBreakdown,
                        deductionsBreakdown,
                        grossSalary: grossEarned,
                        netSalary,
                        status: 'processed',
                        processedAt: new Date()
                    }
                });
            } else {
                payroll = await tx.payroll.create({
                    data: {
                        employeeId: emp.id,
                        month: Number(month),
                        year: Number(year),
                        basicSalary: processedBasic,
                        allowances: totalAllowances,
                        deductions: totalDeductions,
                        earningsBreakdown,
                        deductionsBreakdown,
                        grossSalary: grossEarned,
                        netSalary,
                        status: 'processed',
                        processedAt: new Date()
                    }
                });
            }
                results.push({ ...payroll, absentDays });
            }

            return results;
        });

        res.json({ message: `Processed payroll for ${payrolls.length} employees`, payrolls });

    } catch (error: any) {
        console.error('Process payroll error:', error);
        res.status(500).json({ error: 'Failed to process payroll' });
    }
};

export const postPayrollToAccounting = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Accounting', 'update')) {
            return res.status(403).json({ error: 'Access denied: Accounting update permission required' });
        }

        const { month, year } = req.body;
        const companyId = req.user!.companyId;

        const result = await PayrollAccountingService.postPayrollToAccounting(
            companyId,
            Number(month),
            Number(year),
            req.userId
        );

        res.json({ message: 'Payroll posted to accounting successfully', entry: result });
    } catch (error: any) {
        console.error('Post to accounting error:', error);
        res.status(500).json({ error: error.message || 'Failed to post payroll to accounting' });
    }
};

export const getPayrollList = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { month, year, page, limit } = req.query;
        if (!month || !year) return res.status(400).json({ error: 'Month and Year required' });

        // --- SCOPED ACCESS ---
        const currentUserEmployee = await prisma.employee.findUnique({ where: { userId } });
        const currentEmpId = currentUserEmployee?.id;

        const scope = PermissionService.getPermissionScope(req.user, 'Payroll', 'read');

        if (!scope.all && !scope.owned && !scope.added) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const where: any = {
            month: Number(month),
            year: Number(year),
            employee: { companyId: req.user!.companyId }
        };

        if (!scope.all) {
            const orConditions: any[] = [];
            if (scope.owned && currentEmpId) {
                orConditions.push({ employeeId: currentEmpId });
            }
            if (scope.added) {
                orConditions.push({ employee: { createdById: userId } });
            }

            if (orConditions.length > 0) {
                where.OR = orConditions;
            } else {
                return res.json([]);
            }
        }

        const pageNum = page ? Math.max(1, Number(page)) : 1;
        const limitNum = limit ? Math.max(1, Math.min(100, Number(limit))) : 0;

        const [payrolls, total] = await Promise.all([
            prisma.payroll.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            firstName: true,
                            lastName: true,
                            employeeId: true,
                            department: { select: { name: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                ...(limitNum > 0 ? { skip: (pageNum - 1) * limitNum, take: limitNum } : {})
            }),
            limitNum > 0 ? prisma.payroll.count({ where }) : Promise.resolve(0)
        ]);

        if (limitNum > 0) {
            res.json({
                data: payrolls,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            });
        } else {
            res.json(payrolls);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payroll list' });
    }
};

export const approvePayroll = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Approval is an Update action logic?
        if (!PermissionService.hasBasicPermission(req.user, 'Payroll', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Payroll' });
        }

        const { id } = req.params;
        const companyId = req.user!.companyId;

        // 1. Fetch Payroll
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: { employee: true }
        });

        if (!payroll) return res.status(404).json({ error: 'Payroll not found' });
        if (payroll.status !== 'processed') return res.status(400).json({ error: 'Payroll must be in processed status to approve' });

        // 2. Fetch StatutoryConfig for dynamic account mappings
        const statutoryConfig = await prisma.statutoryConfig.findUnique({ where: { companyId } });
        const salaryExpenseAcct = await ensureAccount(companyId, '5000', 'Salary Expense', 'expense');
        const salaryPayableAcct = statutoryConfig?.salaryPayableAccountId
            ? await prisma.ledgerAccount.findUnique({ where: { id: statutoryConfig.salaryPayableAccountId } })
            || await ensureAccount(companyId, '2100', 'Salaries Payable', 'liability')
            : await ensureAccount(companyId, '2100', 'Salaries Payable', 'liability');
        const pfPayableAcct = statutoryConfig?.pfPayableAccountId
            ? await prisma.ledgerAccount.findUnique({ where: { id: statutoryConfig.pfPayableAccountId } })
            || await ensureAccount(companyId, '2205', 'PF Payable', 'liability')
            : null;
        const ptPayableAcct = statutoryConfig?.ptPayableAccountId
            ? await prisma.ledgerAccount.findUnique({ where: { id: statutoryConfig.ptPayableAccountId } })
            || await ensureAccount(companyId, '2210', 'PT Payable', 'liability')
            : null;
        const tdsPayableAcct = statutoryConfig?.tdsPayableAccountId
            ? await prisma.ledgerAccount.findUnique({ where: { id: statutoryConfig.tdsPayableAccountId } })
            || await ensureAccount(companyId, '2220', 'TDS Payable', 'liability')
            : null;

        // 3. Create Journal Entry
        // Build journal entry lines
        const journalLines: Array<{ accountId: string; debit: number; credit: number }> = [
            { accountId: salaryExpenseAcct.id, debit: Number(payroll.grossSalary), credit: 0 },
            { accountId: salaryPayableAcct.id, debit: 0, credit: Number(payroll.netSalary) },
        ];

        // Parse deductions breakdown to allocate to correct payable accounts
        const deductionsBreakdown = (payroll.deductionsBreakdown as Record<string, number>) || {};
        const pfAmount = Object.entries(deductionsBreakdown).reduce((sum, [name, amt]) =>
            name.toUpperCase().includes('PF') || name.toUpperCase().includes('PROVIDENT FUND') ? sum + amt : sum, 0);
        const ptAmount = Object.entries(deductionsBreakdown).reduce((sum, [name, amt]) =>
            name.toUpperCase().includes('PT') || name.toUpperCase().includes('PROFESSIONAL TAX') ? sum + amt : sum, 0);
        const tdsAmount = Object.entries(deductionsBreakdown).reduce((sum, [name, amt]) =>
            name.toUpperCase() === 'TDS' || name.toUpperCase().includes('INCOME TAX') ? sum + amt : sum, 0);
        const otherDeductions = Number(payroll.deductions) - pfAmount - ptAmount - tdsAmount;

        if (pfAmount > 0 && pfPayableAcct) {
            journalLines.push({ accountId: pfPayableAcct.id, debit: 0, credit: pfAmount });
        }
        if (ptAmount > 0 && ptPayableAcct) {
            journalLines.push({ accountId: ptPayableAcct.id, debit: 0, credit: ptAmount });
        }
        if (tdsAmount > 0 && tdsPayableAcct) {
            journalLines.push({ accountId: tdsPayableAcct.id, debit: 0, credit: tdsAmount });
        }
        if (otherDeductions > 0) {
            // Fallback: other deductions go to salary payable contra
            journalLines.push({ accountId: salaryPayableAcct.id, debit: otherDeductions, credit: 0 });
        }

        await createJournalEntry(
            companyId,
            new Date(),
            `Payroll for ${payroll.employee.firstName} ${payroll.employee.lastName} - ${payroll.month}/${payroll.year}`,
            `PAYROLL-${payroll.month}-${payroll.year}-${payroll.employee.employeeId}`,
            journalLines,
            true,
            req.userId
        );

        // 4. Update Payroll Status
        const updated = await prisma.payroll.update({
            where: { id },
            data: {
                status: 'paid', // or 'approved', assume paid/liability booked
                processedAt: new Date()
            }
        });

        res.json({ message: 'Payroll approved and accounting entry posted', payroll: updated });
    } catch (error) {
        console.error('Approve payroll error:', error);
        res.status(500).json({ error: 'Failed to approve payroll' });
    }
};




export const downloadPayslip = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        // --- CHECK ACCESS ---
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        department: true,
                        position: true
                    }
                }
            }
        });

        if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });

        // Verify Scope
        const currentUserEmployee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
        const currentEmpId = currentUserEmployee?.id;

        const scope = PermissionService.getPermissionScope(req.user, 'Payroll', 'read');
        let hasAccess = false;

        if (scope.all) hasAccess = true;
        else if (scope.owned && payroll.employeeId === currentEmpId) hasAccess = true;
        else if (scope.added && payroll.employee.createdById === userId) hasAccess = true;

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied: You cannot allow this payslip.' });
        }

        const company = await prisma.company.findUnique({
            where: { id: payroll.employee.companyId }
        });

        if (!company) return res.status(404).json({ error: 'Company not found' });

        const buffer = await PDFService.generatePayslip(payroll, company);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Payslip_${payroll.month}_${payroll.year}_${payroll.employee.firstName}.pdf`);
        res.send(buffer);

    } catch (error) {
        console.error('Download payslip error:', error);
        res.status(500).json({ error: 'Failed to generate payslip' });
    }
};

export const emailPayslip = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        // Fetch Payroll with Employee Details
        const payroll = await prisma.payroll.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        department: true,
                        position: true
                    }
                }
            }
        });

        if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
        if (!payroll.employee.email) return res.status(400).json({ error: 'Employee email not found' });

        // --- CHECK ACCESS ---
        const currentUserEmployee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
        const currentEmpId = currentUserEmployee?.id;

        const scope = PermissionService.getPermissionScope(req.user, 'Payroll', 'read');
        let hasAccess = false;

        if (scope.all) hasAccess = true;
        else if (scope.owned && payroll.employeeId === currentEmpId) hasAccess = true;
        else if (scope.added && payroll.employee.createdById === userId) hasAccess = true;

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied: You cannot email this payslip.' });
        }

        const company = await prisma.company.findUnique({
            where: { id: payroll.employee.companyId }
        });

        if (!company) return res.status(404).json({ error: 'Company not found' });

        // Generate PDF
        const buffer = await PDFService.generatePayslip(payroll, company);

        // Send Email
        const monthName = new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long' });

        await sendPayslipEmail(
            payroll.employee.email,
            {
                employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
                monthName,
                year: payroll.year,
                netSalary: Number(payroll.netSalary),
                currency: company.currency || 'INR'
            },
            buffer
        );

        res.json({ message: `Payslip emailed to ${payroll.employee.email}` });

    } catch (error) {
        console.error('Email payslip error:', error);
        res.status(500).json({ error: 'Failed to email payslip' });
    }
};

export const bulkEmailPayslips = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year, employeeIds } = req.body;
        const companyId = req.user!.companyId;

        if (!month || !year) {
            return res.status(400).json({ error: 'Month and year are required' });
        }

        const where: any = { month: Number(month), year: Number(year), employee: { companyId } };
        if (Array.isArray(employeeIds) && employeeIds.length > 0) {
            where.employeeId = { in: employeeIds };
        }

        const payrolls = await prisma.payroll.findMany({
            where,
            include: { employee: true }
        });

        if (payrolls.length === 0) {
            return res.status(404).json({ error: 'No payrolls found for the given period' });
        }

        let sent = 0;
        let failed = 0;

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return res.status(404).json({ error: 'Company not found' });

        for (const payroll of payrolls) {
            try {
                const pdfBuffer = await PDFService.generatePayslip(payroll, company);
                const monthName = new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long' });

                await sendPayslipEmail(
                    payroll.employee.email,
                    {
                        employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
                        monthName,
                        year: payroll.year,
                        netSalary: Number(payroll.netSalary),
                        currency: company?.currency || 'INR',
                        companyId
                    },
                    pdfBuffer
                );
                sent++;
            } catch (err) {
                console.error(`Failed to email payslip for ${payroll.employee.firstName}:`, err);
                failed++;
            }
        }

        res.json({ message: `Sent ${sent} payslips${failed > 0 ? `, ${failed} failed` : ''}`, sent, failed });
    } catch (error) {
        console.error('Bulk email payroll error:', error);
        res.status(500).json({ error: 'Failed to send bulk payslips' });
    }
};

// --- Salary Template Master ---

export const getSalaryTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const templates = await prisma.salaryTemplate.findMany({
            where: { companyId },
            include: {
                components: {
                    include: { component: true }
                }
            }
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

export const createSalaryTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { name, description, components } = req.body;

        const template = await prisma.salaryTemplate.create({
            data: {
                companyId,
                name,
                description,
                components: {
                    create: components.map((c: any) => ({
                        componentId: c.componentId,
                        calculationType: c.calculationType,
                        value: c.value,
                        formula: c.formula
                    }))
                }
            }
        });
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create template' });
    }
};

export const getSalaryTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;

        const template = await prisma.salaryTemplate.findFirst({
            where: { id, companyId },
            include: {
                components: {
                    include: { component: true }
                }
            }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json(template);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch template' });
    }
};

export const updateSalaryTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;
        const { name, description, components } = req.body;

        const template = await prisma.salaryTemplate.findFirst({ where: { id, companyId } });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        // Update with transaction to replace components
        const updated = await prisma.$transaction(async (tx) => {
            // 1. Update details
            await tx.salaryTemplate.update({
                where: { id },
                data: { name, description }
            });

            // 2. Delete existing components
            await tx.salaryTemplateComponent.deleteMany({
                where: { templateId: id }
            });

            // 3. Create new components
            return await tx.salaryTemplate.update({
                where: { id },
                data: {
                    components: {
                        create: components.map((c: any) => ({
                            componentId: c.componentId,
                            calculationType: c.calculationType,
                            value: c.value,
                            formula: c.formula
                        }))
                    }
                },
                include: {
                    components: {
                        include: { component: true }
                    }
                }
            });
        });

        res.json(updated);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
};

export const deleteSalaryTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;

        // Verify ownership
        const template = await prisma.salaryTemplate.findFirst({
            where: { id, companyId }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Delete (Cascade verify? Prisma usually handles cascade if defined, 
        // but SalaryTemplateComponent typically cascades on delete of SalaryTemplate)
        await prisma.salaryTemplate.delete({
            where: { id }
        });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
};


export const bulkAssignTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { templateId, employeeIds } = req.body;

        if (!templateId || !employeeIds || !Array.isArray(employeeIds)) {
            return res.status(400).json({ error: 'Invalid request data' });
            return; // Explicit return to satisfy TS
        }

        const result = await PayrollService.bulkAssignTemplate(companyId, templateId, employeeIds);
        res.json(result);
    } catch (error) {
        console.error('Bulk assign error:', error);
        res.status(500).json({ error: 'Bulk assignment failed' });
    }
};

export const previewTemplateStructure = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { templateId, ctc } = req.body;
        const breakdown = await PayrollService.calculateStructureFromTemplate(companyId, templateId, Number(ctc));
        res.json(breakdown);
    } catch (error) {
        res.status(500).json({ error: 'Calculation failed' });
    }
};

export const exportCompliance = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year, type } = req.query;
        const companyId = req.user!.companyId;

        if (type === 'epfo') {
            const data = await ComplianceService.generateEPFO_ECR(Number(month), Number(year), companyId);
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename=EPF_ECR_${month}_${year}.txt`);
            return res.send(data);
        } else if (type === 'esic') {
            const data = await ComplianceService.generateESIC_Return(Number(month), Number(year), companyId);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=ESI_Return_${month}_${year}.csv`);
            return res.send(data);
        }

        res.status(400).json({ error: 'Invalid compliance type' });
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
};
