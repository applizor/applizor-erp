import prisma from '../prisma/client';
import { FormulaEvaluator } from '../utils/formula-evaluator';
import { StatutoryRuleService } from './statutory-rule.service';

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
                    companyId: companyId,
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
     * Uses the Statutory Rule Engine for countries with configured rules,
     * falls back to legacy India-specific logic when no country is set.
     */
    static async calculateStatutoryDeductions(companyId: string, basic: number, gross: number, ptState: string = 'Maharashtra', month?: number, year?: number) {
        const result = await StatutoryRuleService.calculateAllDeductions(
            companyId,
            { basicSalary: basic, grossSalary: gross, ptState },
            month,
            year,
        );
        
        const findVal = (obj: Record<string, number>, key: string) => {
            const lowerKey = key.toLowerCase();
            const entry = Object.entries(obj).find(([k]) => k.toLowerCase() === lowerKey || k.toLowerCase().includes(lowerKey));
            return entry ? entry[1] : 0;
        };

        return {
            pf: { 
                employee: findVal(result.deductions, 'pf') || findVal(result.deductions, 'provident'), 
                employer: findVal(result.employerContributions, 'pf') || findVal(result.employerContributions, 'provident') 
            },
            esi: { 
                employee: findVal(result.deductions, 'esi') || findVal(result.deductions, 'state insurance'), 
                employer: findVal(result.employerContributions, 'esi') || findVal(result.employerContributions, 'state insurance') 
            },
            pt: findVal(result.deductions, 'pt') || findVal(result.deductions, 'professional'),
            breakdown: result.deductions,
            employerContributions: result.employerContributions
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
     * Format a date to local YYYY-MM-DD string (timezone-safe)
     */
    static formatLocalDate(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    /**
     * Compute stats from existing attendance records (Pure Function)
     * Now considers offDays and holidays if provided
     */
    static computeAttendanceStats(attendances: any[], totalDays: number, startDate: Date, offDays: string[] = [], holidayDates: string[] = [], approvedLeaveDates: Set<string> = new Set()) {
        let lopDays = 0;
        let presentDays = 0;

        const attMap = new Map();
        attendances.forEach(att => {
            const dateStr = this.formatLocalDate(new Date(att.date));
            attMap.set(dateStr, att);
        });

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatLocalDate(date);
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
                } else if (approvedLeaveDates.has(dateStr)) {
                    presentDays += 1; // Approved leave is paid (not LOP)
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
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0));
        const totalDays = endDate.getDate();

        const [attendances, company, holidays, leaveRequests] = await Promise.all([
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
                    date: { gte: startDate, lte: endDate },
                    OR: [
                        { companyId },
                        { companyId: null }
                    ]
                },
                select: { date: true }
            }),
            prisma.leaveRequest.findMany({
                where: {
                    employeeId,
                    status: 'approved',
                    startDate: { lte: endDate },
                    endDate: { gte: startDate }
                },
                select: { startDate: true, endDate: true }
            })
        ]);

        const offDays = company?.offDays ? (company.offDays as string).split(',').map((s: string) => s.trim()) : ['Saturday', 'Sunday'];
        const holidayDates = (holidays as any[]).map(h => this.formatLocalDate(new Date(h.date)));

        // Build approved leave dates set
        const approvedLeaveDates = new Set<string>();
        for (const lr of leaveRequests) {
            const lrStart = new Date(lr.startDate);
            const lrEnd = new Date(lr.endDate);
            for (let d = new Date(lrStart); d <= lrEnd; d.setDate(d.getDate() + 1)) {
                approvedLeaveDates.add(this.formatLocalDate(d));
            }
        }

        const stats = this.computeAttendanceStats(attendances, totalDays, startDate, offDays, holidayDates, approvedLeaveDates);

        return {
            totalDays,
            ...stats
        };
    }
    /**
     * Calculate monthly TDS based on annual projections and investment declarations
     */
    static async calculateTDS(employeeId: string, companyId: string, monthlyGross: number, month: number, year: number) {
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
            taxableIncome -= Math.min(annualInvestments, 200000);
        }

        // 3. Determine Financial Year
        const fyYear = month <= 3 ? year - 1 : year;
        const financialYear = `${fyYear}-${(fyYear + 1) % 100}`;

        // 4. Apply FY 2025-26 Slab Logic
        let annualTax = 0;
        if (regime === 'new') {
            // New Regime FY 2025-26 slabs
            if (taxableIncome > 2400000) annualTax = (taxableIncome - 2400000) * 0.30 + 300000;
            else if (taxableIncome > 2000000) annualTax = (taxableIncome - 2000000) * 0.25 + 200000;
            else if (taxableIncome > 1600000) annualTax = (taxableIncome - 1600000) * 0.20 + 120000;
            else if (taxableIncome > 1200000) annualTax = (taxableIncome - 1200000) * 0.15 + 60000;
            else if (taxableIncome > 800000) annualTax = (taxableIncome - 800000) * 0.10 + 20000;
            else if (taxableIncome > 400000) annualTax = (taxableIncome - 400000) * 0.05;
        } else {
            // Old Regime FY 2025-26 slabs
            if (taxableIncome > 1500000) annualTax = (taxableIncome - 1500000) * 0.30 + 187500;
            else if (taxableIncome > 1200000) annualTax = (taxableIncome - 1200000) * 0.20 + 97500;
            else if (taxableIncome > 900000) annualTax = (taxableIncome - 900000) * 0.15 + 37500;
            else if (taxableIncome > 600000) annualTax = (taxableIncome - 600000) * 0.10 + 15000;
            else if (taxableIncome > 300000) annualTax = (taxableIncome - 300000) * 0.05;
        }

        // 5. Section 87A Rebate
        if (regime === 'new' && taxableIncome <= 700000) {
            annualTax = Math.max(0, annualTax - 25000);
        } else if (regime === 'old' && taxableIncome <= 500000) {
            annualTax = Math.max(0, annualTax - 12500);
        }

        // 6. Health & Education Cess (4%)
        annualTax = Math.floor(annualTax * 1.04);

        // 7. Fetch YTD already deducted TDS
        const previousPayrolls = await prisma.payroll.findMany({
            where: {
                employeeId,
                year,
                month: { lt: month },
                status: { in: ['processed', 'paid'] }
            },
            select: { deductionsBreakdown: true }
        });

        let alreadyDeducted = 0;
        for (const pp of previousPayrolls) {
            const breakdown = pp.deductionsBreakdown as Record<string, number> || {};
            for (const [name, amt] of Object.entries(breakdown)) {
                if (name.toUpperCase() === 'TDS' || name.toUpperCase().includes('INCOME TAX')) {
                    alreadyDeducted += amt;
                }
            }
        }

        // 8. Calculate remaining months (inclusive)
        const remainingMonths = 12 - month + 1;
        if (remainingMonths <= 0) return 0;

        // 9. Monthly TDS = (TotalTax - AlreadyDeducted) / RemainingMonths
        const monthlyTDS = Math.max(0, Math.floor((annualTax - alreadyDeducted) / remainingMonths));

        return monthlyTDS;
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
        return n === 'PT' || n === 'PROFESSIONAL TAX';
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
                        return (ctc / 12) * (Number(comp.value) / 100);
                    } else if (comp.calculationType === 'formula' && comp.formula) {
                        try {
                            return FormulaEvaluator.evaluate(comp.formula, context);
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
