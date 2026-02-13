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
                    ptSlabs: Array.isArray(data.ptSlabs) ? data.ptSlabs : [],
                    tdsEnabled: data.tdsEnabled === true,
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
                    ptSlabs: Array.isArray(data.ptSlabs) ? data.ptSlabs : [],
                    tdsEnabled: data.tdsEnabled === true,
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
    static async calculateStatutoryDeductions(companyId: string, basic: number, gross: number, month?: number, year?: number) {
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
            pt: config.professionalTaxEnabled ? this.calculateProfessionalTax(gross, config.ptSlabs, month) : 0
        };
    }

    /**
     * Professional Tax logic using dynamic slabs
     */
    private static calculateProfessionalTax(gross: number, slabs: any, targetMonth?: number): number {
        if (!slabs || !Array.isArray(slabs) || slabs.length === 0) {
            return 0;
        }

        const currentMonth = targetMonth || (new Date().getMonth() + 1); // 1-12

        for (const slab of slabs) {
            if (gross >= slab.min && gross <= slab.max) {
                // Check for Exception Month (e.g., Feb is 2)
                if (slab.exceptionMonth && slab.exceptionAmount && slab.exceptionMonth === currentMonth) {
                    return Number(slab.exceptionAmount);
                }
                return Number(slab.amount);
            }
        }

        // Handle case where gross exceeds max defined slab (usually highest slab has max 9999999)
        // If not covered, return 0 or check last slab? Assuming slabs cover all ranges.
        return 0;
    }

    /**
     * Compute stats from existing attendance records (Pure Function)
     */
    static computeAttendanceStats(attendances: any[]) {
        let lopDays = 0;
        let presentDays = 0;

        attendances.forEach(att => {
            if (att.status === 'absent') lopDays += 1;
            else if (att.status === 'half-day') {
                lopDays += 0.5;
                presentDays += 0.5;
            }
            else if (att.status === 'present') presentDays += 1;
            else if (att.status === 'leave') {
                presentDays += 1;
            }
        });

        return { presentDays, lopDays, attendanceRecords: attendances.length };
    }

    /**
     * Calculate Attendance Metrics for Payroll (Fetches Data)
     */
    static async calculateAttendanceMetrics(employeeId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const totalDays = endDate.getDate();

        const attendances = await prisma.attendance.findMany({
            where: {
                employeeId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const stats = this.computeAttendanceStats(attendances);

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
}
