import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PDFService } from '../services/pdf.service';
import { ensureAccount, createJournalEntry } from '../services/accounting.service';
import { PermissionService } from '../services/permission.service';
import { PayrollService } from '../services/payroll.service';
import { ComplianceService } from '../services/compliance.service';
import { sendPayslipEmail } from '../services/email.service';

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
        console.error('UpdateStatConfig Controller Error:', error);
        console.error('Context:', {
            companyId: req.user?.companyId,
            body: req.body
        });
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

        const company = await prisma.company.findUnique({
            where: { id: req.user!.companyId },
            select: { offDays: true } as any
        }) as any;
        const offDaysArr = company?.offDays ? (company.offDays as string).split(',').map((s: string) => s.trim()) : ['Saturday', 'Sunday'];

        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: new Date(year, month - 1, 1),
                    lte: new Date(year, month, 0)
                }
            },
            select: { date: true }
        });
        const holidayDates = holidays.map(h => new Date(h.date).toISOString().split('T')[0]);

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
            const startDate = new Date(year, month - 1, 1);

            // Calculate LOP (Reuse pre-fetched attendances)
            const attendanceMetrics = PayrollService.computeAttendanceStats(emp.attendances, totalDays, startDate, offDaysArr, holidayDates);
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
                    if (PayrollService.isPF(component.name)) {
                        // Will calculate later
                    } else if (PayrollService.isESI(component.name)) {
                        // Will check later
                    } else if (PayrollService.isPT(component.name)) {
                        // Auto-calculated later
                    } else {
                        totalDeductions += amount;
                        deductionsBreakdown[component.name] = amount;
                    }
                }
            }

            // --- Statutory Calculations ---
            const basicAmount = (Object.entries(earningsBreakdown).find(([name]) => PayrollService.isBasic(name))?.[1] as number) || 0;
            const statutory = await PayrollService.calculateStatutoryDeductions(req.user!.companyId, basicAmount, grossEarned, Number(month), Number(year));

            // Integrate PF
            const pfComp = structure.components.find(c => PayrollService.isPF(c.component.name));
            if (pfComp && statutory.pf.employee > 0) {
                deductionsBreakdown[pfComp.component.name] = statutory.pf.employee;
                totalDeductions += statutory.pf.employee;
            }

            // Integrate ESI
            const esiComp = structure.components.find(c => PayrollService.isESI(c.component.name));
            if (esiComp && statutory.esi.employee > 0) {
                deductionsBreakdown[esiComp.component.name] = statutory.esi.employee;
                totalDeductions += statutory.esi.employee;
            }

            // Integrate PT (Professional Tax)
            if (statutory.pt > 0) {
                const ptLabel = structure.components.find(c => PayrollService.isPT(c.component.name))?.component.name || 'Professional Tax';
                deductionsBreakdown[ptLabel] = statutory.pt;
                totalDeductions += statutory.pt;
            }

            // Integrate TDS (Advanced Tax)
            const tdsAmount = await PayrollService.calculateTDS(emp.id, req.user!.companyId, grossEarned, Number(month));
            if (tdsAmount > 0) {
                const tdsLabel = structure.components.find(c => PayrollService.isTDS(c.component.name))?.component.name || 'TDS';
                deductionsBreakdown[tdsLabel] = (deductionsBreakdown[tdsLabel] || 0) + tdsAmount;
                totalDeductions += tdsAmount;
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
            payrolls.push({ ...payroll, absentDays });
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
