import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PayrollService {
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
        return await prisma.statutoryConfig.upsert({
            where: { companyId },
            update: {
                pfEmployeeRate: data.pfEmployeeRate,
                pfEmployerRate: data.pfEmployerRate,
                pfBasicLimit: data.pfBasicLimit,
                esiEmployeeRate: data.esiEmployeeRate,
                esiEmployerRate: data.esiEmployerRate,
                esiGrossLimit: data.esiGrossLimit,
                professionalTaxEnabled: data.professionalTaxEnabled,
                tdsEnabled: data.tdsEnabled,
            },
            create: {
                companyId,
                pfEmployeeRate: data.pfEmployeeRate,
                pfEmployerRate: data.pfEmployerRate,
                pfBasicLimit: data.pfBasicLimit,
                esiEmployeeRate: data.esiEmployeeRate,
                esiEmployerRate: data.esiEmployerRate,
                esiGrossLimit: data.esiGrossLimit,
                professionalTaxEnabled: data.professionalTaxEnabled,
                tdsEnabled: data.tdsEnabled,
            }
        });
    }

    /**
     * Calculate statutory deductions based on basic and gross salary
     */
    static async calculateStatutoryDeductions(companyId: string, basic: number, gross: number) {
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
            pt: config.professionalTaxEnabled ? this.calculateProfessionalTax(gross) : 0
        };
    }

    /**
     * Professional Tax logic (Placeholder for state-specific rules, defaulting to standard)
     */
    private static calculateProfessionalTax(gross: number): number {
        if (gross <= 7500) return 0;
        if (gross <= 10000) return 175;
        return 200; // Standard 200/month cap
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
}
