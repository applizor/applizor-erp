import prisma from '../prisma/client';
import { FormulaEvaluator } from '../utils/formula-evaluator';

export class PayrollService {
    /**
     * Calculate Salary Structure dynamically from a Template
     */
    static async calculateStructureFromTemplate(companyId: string, templateId: string, ctc: number) {
        const template = await prisma.salaryTemplate.findUnique({
            where: { id: templateId },
            include: {
                components: {
                    include: { component: true }
                }
            }
        });

        if (!template) throw new Error('Template not found');

        const monthlyGross = Math.floor(ctc / 12);
        const breakdown: Record<string, number> = {};
        const context: Record<string, number> = { CTC: ctc, GROSS: monthlyGross };

        // 1. Calculate Core Components (Fixed or percentage of Gross)
        for (const tc of template.components) {
            if (tc.calculationType === 'flat') {
                breakdown[tc.componentId] = Number(tc.value);
            } else if (tc.calculationType === 'percentage') {
                breakdown[tc.componentId] = Math.floor(monthlyGross * (Number(tc.value) / 100));
            }
            // Populate context for names
            context[tc.component.name.toUpperCase().replace(/\s/g, '_')] = breakdown[tc.componentId] || 0;
            if (this.isBasic(tc.component.name)) context['BASIC'] = breakdown[tc.componentId];
        }

        // 2. Calculate Formula-based Components
        for (const tc of template.components) {
            if (tc.calculationType === 'formula' && tc.formula) {
                breakdown[tc.componentId] = FormulaEvaluator.evaluate(tc.formula, context);
                // Update context
                context[tc.component.name.toUpperCase().replace(/\s/g, '_')] = breakdown[tc.componentId];
            }
        }

        return breakdown;
    }
    /**
     * Get statutory configuration for a specific company
     */
    static async getStatutoryConfig(companyId: string) {
        let config = await prisma.statutoryConfig.findUnique({
            where: { companyId }
        });

        // Return default config if not found
        if (!config) {
            config = await prisma.statutoryConfig.create({
                data: {
                    companyId,
                    pfEmployeeRate: 12,
                    pfEmployerRate: 12,
                    pfBasicLimit: 15000,
                    esiEmployeeRate: 0.75,
                    esiEmployerRate: 3.25,
                    esiGrossLimit: 21000,
                }
            });
        }

        return config;
    }

    /**
     * Save statutory configuration
     */
    static async saveStatutoryConfig(companyId: string, data: any) {
        const clean = (v: any, def: number) => {
            const n = parseFloat(v);
            return isNaN(n) ? def : n;
        };

        try {
            return await prisma.statutoryConfig.upsert({
                where: { companyId },
                update: {
                    pfEmployeeRate: clean(data.pfEmployeeRate, 12),
                    pfEmployerRate: clean(data.pfEmployerRate, 12),
                    pfBasicLimit: clean(data.pfBasicLimit, 15000),
                    esiEmployeeRate: clean(data.esiEmployeeRate, 0.75),
                    esiEmployerRate: clean(data.esiEmployerRate, 3.25),
                    esiGrossLimit: clean(data.esiGrossLimit, 21000),
                    professionalTaxEnabled: data.professionalTaxEnabled === true,
                    ptSlabs: (Array.isArray(data.ptSlabs) || typeof data.ptSlabs === 'object') ? data.ptSlabs : [],
                    tdsEnabled: data.tdsEnabled === true,
                    salaryPayableAccountId: data.salaryPayableAccountId || undefined,
                    pfPayableAccountId: data.pfPayableAccountId || undefined,
                    ptPayableAccountId: data.ptPayableAccountId || undefined,
                    tdsPayableAccountId: data.tdsPayableAccountId || undefined,
                },
                create: {
                    company: { connect: { id: companyId } },
                    pfEmployeeRate: clean(data.pfEmployeeRate, 12),
                    pfEmployerRate: clean(data.pfEmployerRate, 12),
                    pfBasicLimit: clean(data.pfBasicLimit, 15000),
                    esiEmployeeRate: clean(data.esiEmployeeRate, 0.75),
                    esiEmployerRate: clean(data.esiEmployerRate, 3.25),
                    esiGrossLimit: clean(data.esiGrossLimit, 21000),
                    professionalTaxEnabled: data.professionalTaxEnabled === true,
                    ptSlabs: (Array.isArray(data.ptSlabs) || typeof data.ptSlabs === 'object') ? data.ptSlabs : [],
                    tdsEnabled: data.tdsEnabled === true,
                    salaryPayableAccountId: data.salaryPayableAccountId || undefined,
                    pfPayableAccountId: data.pfPayableAccountId || undefined,
                    ptPayableAccountId: data.ptPayableAccountId || undefined,
                    tdsPayableAccountId: data.tdsPayableAccountId || undefined,
                }
            });
        } catch (error) {
            console.error('CRITICAL: saveStatutoryConfig failed', error);
            throw error;
        }
    }

    /**
     * Calculate statutory deductions based on basic and gross salary
     */
    /**
     * Calculate statutory deductions based on basic and gross salary
     */
    static async calculateStatutoryDeductions(companyId: string, basic: number, gross: number, ptState: string = 'Maharashtra', month?: number, year?: number) {
        const config = await this.getStatutoryConfig(companyId);

        // PF Calculation
        const pfWage = Math.min(basic, Number(config.pfBasicLimit));
        const pfEmployee = Math.floor(pfWage * (Number(config.pfEmployeeRate) / 100));
        const pfEmployer = Math.floor(pfWage * (Number(config.pfEmployerRate) / 100));

        // ESI Calculation
        let esiEmployee = 0;
        let esiEmployer = 0;
        if (gross <= Number(config.esiGrossLimit)) {
            esiEmployee = Math.ceil(gross * (Number(config.esiEmployeeRate) / 100));
            esiEmployer = Math.ceil(gross * (Number(config.esiEmployerRate) / 100));
        }

        return {
            pf: { employee: pfEmployee, employer: pfEmployer },
            esi: { employee: esiEmployee, employer: esiEmployer },
            pt: config.professionalTaxEnabled ? this.calculateProfessionalTax(gross, config.ptSlabs, ptState, month) : 0
        };
    }

    /**
     * Professional Tax logic using dynamic slabs (State-wise)
     */
    private static calculateProfessionalTax(gross: number, slabs: any, ptState: string, targetMonth?: number): number {
        if (!slabs) return 0;

        // Determine which set of slabs to use
        let targetSlabs = [];

        // precise match
        if (Array.isArray(slabs[ptState])) {
            targetSlabs = slabs[ptState];
        }
        // fallback to 'default' key if exists
        else if (Array.isArray(slabs['default'])) {
            targetSlabs = slabs['default'];
        }
        // legacy support: if slabs is just an array (old format)
        else if (Array.isArray(slabs)) {
            targetSlabs = slabs;
        } else {
            return 0;
        }

        if (targetSlabs.length === 0) return 0;

        const currentMonth = targetMonth || (new Date().getMonth() + 1); // 1-12

        for (const slab of targetSlabs) {
            if (gross >= slab.min && gross <= slab.max) {
                // Check for Exception Month (e.g., Feb is 2)
                if (slab.exceptionMonth && slab.exceptionAmount && slab.exceptionMonth === currentMonth) {
                    return Number(slab.exceptionAmount);
                }
                return Number(slab.amount);
            }
        }

        return 0;
    }

    /**
     * Compute stats from existing attendance records (Pure Function)
     * Now considers offDays and holidays if provided
     */
    static computeAttendanceStats(attendances: any[], totalDays: number, startDate: Date, offDays: string[] = [], holidayDates: string[] = []) {
        let lopDays = 0;
        let presentDays = 0;

        const attMap = new Map();
        attendances.forEach(att => {
            const dateStr = new Date(att.date).toISOString().split('T')[0];
            attMap.set(dateStr, att);
        });

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const att = attMap.get(dateStr);

            if (att) {
                if (att.status === 'absent') lopDays += 1;
                else if (att.status === 'half-day') {
                    lopDays += 0.5;
                    presentDays += 0.5;
                } else {
                    // present, late, leave, holiday, etc.
                    presentDays += 1;
                }
            } else {
                // No record
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                if (offDays.includes(dayName) || holidayDates.includes(dateStr)) {
                    presentDays += 1; // Off day or Holiday is paid
                } else {
                    // Missing record on working day = LOP
                    lopDays += 1;
                }
            }
        }

        return { presentDays, lopDays, attendanceRecords: attendances.length };
    }

    /**
     * Calculate Attendance Metrics for Payroll (Fetches Data)
     */
    static async calculateAttendanceMetrics(employeeId: string, companyId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const totalDays = endDate.getDate();

        const [attendances, company, holidays] = await Promise.all([
            prisma.attendance.findMany({
                where: {
                    employeeId,
                    date: { gte: startDate, lte: endDate }
                }
            }),
            prisma.company.findUnique({
                where: { id: companyId },
                select: { offDays: true } as any
            }) as any,
            prisma.holiday.findMany({
                where: {
                    date: { gte: startDate, lte: endDate }
                },
                select: { date: true }
            })
        ]);

        const offDays = company?.offDays ? (company.offDays as string).split(',').map((s: string) => s.trim()) : ['Saturday', 'Sunday'];
        const holidayDates = (holidays as any[]).map(h => new Date(h.date).toISOString().split('T')[0]);

        const stats = this.computeAttendanceStats(attendances, totalDays, startDate, offDays, holidayDates);

        return {
            totalDays,
            ...stats
        };
    }
    /**
     * Calculate monthly TDS based on annual projections and investment declarations
     */
    static async calculateTDS(employeeId: string, companyId: string, monthlyGross: number, month: number) {
        // 1. Get Approved Tax Declaration
        const declaration = await prisma.taxDeclaration.findFirst({
            where: { employeeId, status: 'approved' },
            orderBy: { createdAt: 'desc' }
        });

        const regime = declaration?.regime || 'new';
        const annualInvestments = Number(declaration?.totalAmount || 0);

        // 2. Project Annual Income
        const annualGross = monthlyGross * 12;
        const standardDeduction = 50000;

        let taxableIncome = annualGross - standardDeduction;

        if (regime === 'old') {
            // Subtract approved investments up to limit (approx 1.5L for 80C + others)
            taxableIncome -= Math.min(annualInvestments, 200000);
        }

        // 3. Apply Slab Logic (Simplified Indian Slab for demonstration)
        let annualTax = 0;
        if (regime === 'new') {
            if (taxableIncome > 1500000) annualTax += (taxableIncome - 1500000) * 0.30 + 150000;
            else if (taxableIncome > 1200000) annualTax += (taxableIncome - 1200000) * 0.20 + 90000;
            else if (taxableIncome > 900000) annualTax += (taxableIncome - 900000) * 0.15 + 45000;
            else if (taxableIncome > 600000) annualTax += (taxableIncome - 600000) * 0.10 + 15000;
            else if (taxableIncome > 300000) annualTax += (taxableIncome - 300000) * 0.05;
        } else {
            if (taxableIncome > 1000000) annualTax += (taxableIncome - 1000000) * 0.30 + 112500;
            else if (taxableIncome > 500000) annualTax += (taxableIncome - 500000) * 0.20 + 12500;
            else if (taxableIncome > 250000) annualTax += (taxableIncome - 250000) * 0.05;
        }

        // 4. Divide by 12 for monthly TDS
        return Math.floor(annualTax / 12);
    }

    /**
     * Helper to find standard component types by name (Fuzzy Match)
     */
    static isBasic(name: string): boolean {
        const n = name.toUpperCase();
        return n === 'BASIC' || n === 'BASIC SALARY' || n === 'BASE SALARY' || n === 'BASIC PAY';
    }

    static isPF(name: string): boolean {
        const n = name.toUpperCase();
        return n.includes('PF') || n.includes('PROVIDENT FUND') || n.includes('EPF');
    }

    static isESI(name: string): boolean {
        const n = name.toUpperCase();
        return n.includes('ESI') || n.includes('ESIC');
    }

    static isPT(name: string): boolean {
        const n = name.toUpperCase();
        return n.includes('PT') || n.includes('PROFESSIONAL TAX');
    }

    static isTDS(name: string): boolean {
        const n = name.toUpperCase();
        return n === 'TDS' || n === 'INCOME TAX' || n.includes('TAX DEDUCTED');
    }

    /**
     * Bulk Assign Salary Template
     */
    static async bulkAssignTemplate(companyId: string, templateId: string, employeeIds: string[]) {
        // 1. Get Template with components
        const template = await prisma.salaryTemplate.findUnique({
            where: { id: templateId, companyId },
            include: {
                components: {
                    include: { component: true }
                }
            }
        });

        if (!template) throw new Error('Template not found');

        const results = {
            success: 0,
            failed: 0,
            errors: [] as any[]
        };

        // 2. Process each employee
        for (const empId of employeeIds) {
            try {
                // Get Employee's current Structure (for CTC)
                const empStructure = await prisma.employeeSalaryStructure.findUnique({
                    where: { employeeId: empId }
                });

                if (!empStructure || !empStructure.ctc || Number(empStructure.ctc) === 0) {
                    throw new Error(`Employee ${empId} has no CTC defined`);
                }

                const ctc = Number(empStructure.ctc);
                const monthlyComponents: { componentId: string; amount: number; type: string }[] = [];
                let totalEarnings = 0;
                let totalDeductions = 0;

                // 3. Calculate Components
                // Sort checks: Dependents need Base first.
                // For MVP: We assume formulas are simple (CTC or Basic based)
                // We'll calculate Basic first if present, then others.

                // Map to store calculated values for formula reference
                const context: Record<string, number> = {
                    CTC: ctc,
                    GROSS: ctc / 12 // Approx, or sum of monthly earnings
                };

                // Helper to evaluate formula/value
                const calculateValue = (comp: any) => {
                    if (comp.calculationType === 'flat') {
                        return Number(comp.value);
                    } else if (comp.calculationType === 'percentage') {
                        // Default % of CTC if not specified in formula? 
                        // Or usually schema implies 'percentage' of value against a base. 
                        // For now, let's assume value is % of CTC if formula is empty
                        return (ctc / 12) * (Number(comp.value) / 100);
                    } else if (comp.calculationType === 'formula' && comp.formula) {
                        try {
                            // Simple parser: Replace variables
                            // Supported: CTC, BASIC
                            let expression = comp.formula.toUpperCase();
                            expression = expression.replace(/CTC/g, String(ctc / 12)); // Monthly CTC approach? Or Annual?
                            // Usually formulas are on monthly basis in this system

                            // If Basic is calculated, use it
                            if (context['BASIC']) {
                                expression = expression.replace(/BASIC/g, String(context['BASIC']));
                            }

                            // Safe Eval using function constructor (restricted scope)
                            // Warning: usage of eval/Function. Ideally use a library.
                            // For MVP valid inputs:
                            return Function('"use strict";return (' + expression + ')')();
                        } catch (e) {
                            console.error('Formula Error', e);
                            return 0;
                        }
                    }
                    return 0;
                };

                // Order components: Put 'Basic' first
                const sortedComponents = [...template.components].sort((a, b) => {
                    if (a.component.name.toUpperCase().includes('BASIC')) return -1;
                    if (b.component.name.toUpperCase().includes('BASIC')) return 1;
                    return 0;
                });

                for (const tc of sortedComponents) {
                    const amount = calculateValue(tc);
                    const monthlyAmount = Math.round(amount * 100) / 100;

                    monthlyComponents.push({
                        componentId: tc.componentId,
                        amount: monthlyAmount,
                        type: tc.component.type
                    });

                    // Update context for next components
                    const key = tc.component.name.toUpperCase().replace(/\s+/g, '_');
                    context[key] = monthlyAmount;
                    if (key.includes('BASIC')) context['BASIC'] = monthlyAmount; // Alias

                    if (tc.component.type === 'earning') totalEarnings += monthlyAmount;
                    else if (tc.component.type === 'deduction') totalDeductions += monthlyAmount;
                }

                // 4. Verification: Does Total Earnings match Monthly CTC?
                // If not, add 'Special Allowance' or 'Balancing Component' if configured?
                // For now, we skip balancing and just save.

                const netSalary = totalEarnings - totalDeductions;

                // 5. Save to DB (Transaction)
                await prisma.$transaction(async (tx) => {
                    // Update Structure Header
                    await tx.employeeSalaryStructure.update({
                        where: { id: empStructure.id },
                        data: {
                            templateId: template.id,
                            netSalary: netSalary,
                            // effectiveDate: new Date() // Keep original or update?
                        }
                    });

                    // Clear old components
                    await tx.employeeSalaryComponent.deleteMany({
                        where: { structureId: empStructure.id }
                    });

                    // Insert new components
                    await tx.employeeSalaryComponent.createMany({
                        data: monthlyComponents.map(c => ({
                            structureId: empStructure.id,
                            componentId: c.componentId,
                            monthlyAmount: c.amount
                        }))
                    });
                });

                results.success++;
            } catch (error: any) {
                console.error(`Bulk Assign Error for ${empId}:`, error);
                results.failed++;
                results.errors.push({ id: empId, error: error.message });
            }
        }

        return { success: true, results };
    }
}
