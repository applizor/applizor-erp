import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PDFService } from '../services/pdf.service';
import { ensureAccount, createJournalEntry } from '../services/accounting.service';
import { PermissionService } from '../services/permission.service';
import { PayrollService } from '../services/payroll.service';

// --- Salary Component Master ---

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
        const { ctc, netSalary, components } = req.body; // components: [{ componentId, amount }]

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Upsert Structure Header
            const structure = await tx.employeeSalaryStructure.upsert({
                where: { employeeId },
                update: { ctc, netSalary },
                create: { employeeId, ctc, netSalary }
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
                        componentId: c.componentId,
                        monthlyAmount: c.amount
                    }))
                });
            }

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
            status: 'active'
        };

        if (departmentId) {
            where.departmentId = departmentId;
        }

        const employees = await prisma.employee.findMany({
            where,
            include: {
                attendances: {
                    where: {
                        date: {
                            gte: new Date(year, month - 1, 1),
                            lte: new Date(year, month, 0)
                        }
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

        const payrolls = [];

        for (const emp of employees) {
            // Skip if no structure defined
            if (!emp.salaryStructureDetails) continue;

            const totalDays = new Date(year, month, 0).getDate();

            // Calculate LOP (Reuse pre-fetched attendances)
            const attendanceMetrics = PayrollService.computeAttendanceStats(emp.attendances);
            const absentDays = attendanceMetrics.lopDays;

            const structure = emp.salaryStructureDetails;
            let grossEarned = 0;
            let totalDeductions = 0;

            const earningsBreakdown: any = {};
            const deductionsBreakdown: any = {};

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
                    if (component.name.toUpperCase().includes('PF')) {
                        // We will calculate later based on basic
                    } else if (component.name.toUpperCase().includes('ESI')) {
                        // We will calculate later based on gross
                    } else {
                        totalDeductions += amount;
                        deductionsBreakdown[component.name] = amount;
                    }
                }
            }

            // --- Statutory Calculations ---
            const basicAmount = earningsBreakdown['Basic'] || 0;
            const statutory = await PayrollService.calculateStatutoryDeductions(req.user!.companyId, basicAmount, grossEarned);

            // Integrate PF
            const pfComp = structure.components.find(c => c.component.name.toUpperCase().includes('PF'));
            if (pfComp) {
                deductionsBreakdown[pfComp.component.name] = statutory.pf.employee;
                totalDeductions += statutory.pf.employee;
            }

            // Integrate ESI
            const esiComp = structure.components.find(c => c.component.name.toUpperCase().includes('ESI'));
            if (esiComp && statutory.esi.employee > 0) {
                deductionsBreakdown[esiComp.component.name] = statutory.esi.employee;
                totalDeductions += statutory.esi.employee;
            }

            // Integrate PT (Professional Tax)
            if (statutory.pt > 0) {
                deductionsBreakdown['Professional Tax'] = statutory.pt;
                totalDeductions += statutory.pt;
            }

            const netSalary = grossEarned - totalDeductions;

            // Calculate totalAllowances
            const basicComponent = structure.components.find(c => c.component.name === 'Basic');
            const basicSalaryAmount = Number(basicComponent?.monthlyAmount || 0);

            // Adjust basic for LOP if needed (assuming basic is part of grossEarned logic above)
            // But strict 'Basic' field in Payroll model might expect the actual paid Basic?
            // Let's use the calculated Basic from earningsBreakdown if available, else 0
            const processedBasic = earningsBreakdown['Basic'] || 0;
            const totalAllowances = grossEarned - processedBasic;

            // Check if payroll exists
            const existingPayroll = await prisma.payroll.findFirst({
                where: {
                    employeeId: emp.id,
                    month: Number(month),
                    year: Number(year)
                }
            });

            let payroll;

            if (existingPayroll) {
                payroll = await prisma.payroll.update({
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
                payroll = await prisma.payroll.create({
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
            payrolls.push(payroll);
        }

        res.json({ message: `Processed payroll for ${payrolls.length} employees`, payrolls });

    } catch (error: any) {
        console.error('Process payroll error:', error);
        res.status(500).json({ error: 'Failed to process payroll' });
    }
};

export const getPayrollList = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { month, year } = req.query;
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
            year: Number(year)
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

        const payrolls = await prisma.payroll.findMany({
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
            }
        });
        res.json(payrolls);
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
        if (payroll.status !== 'draft') return res.status(400).json({ error: 'Payroll already processed' });

        // 2. Ensure Accounts exist (for robustness)
        const salaryExpenseAcct = await ensureAccount(companyId, '5000', 'Salary Expense', 'expense');
        const salaryPayableAcct = await ensureAccount(companyId, '2100', 'Salaries Payable', 'liability');
        const taxPayableAcct = await ensureAccount(companyId, '2200', 'Tax/PF Payable', 'liability');

        // 3. Create Journal Entry
        // Debit Expense = Gross
        // Credit Payable = Net
        // Credit Tax/PF = Deductions

        await createJournalEntry(
            companyId,
            new Date(),
            `Payroll for ${payroll.employee.firstName} ${payroll.employee.lastName} - ${payroll.month}/${payroll.year}`,
            `PAYROLL-${payroll.month}-${payroll.year}-${payroll.employee.employeeId}`,
            [
                { accountId: salaryExpenseAcct.id, debit: Number(payroll.grossSalary) },
                { accountId: salaryPayableAcct.id, credit: Number(payroll.netSalary) },
                { accountId: taxPayableAcct.id, credit: Number(payroll.deductions) }
            ],
            true // Auto-post
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
