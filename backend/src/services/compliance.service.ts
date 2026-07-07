import prisma from '../prisma/client';
import { PayrollService } from './payroll.service';

export class ComplianceService {
    /**
     * Generate ECR (Electronic Challan-cum-Return) file for EPFO
     * Format: UAN#MemberName#Gross#EPF_Wages#EPS_Wages#EDLI_Wages#EPF_Contri_Remitted#EPS_Contri_Remitted#EPF_EPS_Diff_Remitted#NCP_Days#Refunds
     */
    static async generateEPFO_ECR(month: number, year: number, companyId: string) {
        const config = await PayrollService.getStatutoryConfig(companyId);
        const pfWageCeiling = Number(config.pfBasicLimit);
        const pfEmployeeRate = Number(config.pfEmployeeRate);
        const pfEmployerRate = Number(config.pfEmployerRate);

        const payrolls = await prisma.payroll.findMany({
            where: { month, year, employee: { companyId } },
            include: { employee: true }
        });

        const lines = payrolls.map(p => {
            const uan = (p.employee.skills as any)?.uan || 'NA';
            const basic = Number(p.basicSalary);
            const pfWage = Math.min(basic, pfWageCeiling);
            const epsWage = pfWage;
            const edliWage = pfWage;
            const pfContri = Math.floor(pfWage * pfEmployeeRate / 100);
            const epsContri = Math.floor(pfWage * Math.min(pfEmployerRate, 8.33) / 100);
            const diff = pfContri - epsContri;
            const ncpDays = 0;

            return `${uan}#~#${p.employee.firstName} ${p.employee.lastName}#~#${p.grossSalary}#~#${pfWage}#~#${epsWage}#~#${edliWage}#~#${pfContri}#~#${epsContri}#~#${diff}#~#${ncpDays}#~#0`;
        });

        return lines.join('\n');
    }

    /**
     * Generate ESI Monthly Return File
     * Format: IP_Number#IP_Name#No_of_Days_for_which_wages_paid/payable#Total_Monthly_Wages#Reason_Code_for_Zero_Working_Days
     */
    static async generateESIC_Return(month: number, year: number, companyId: string) {
        const payrolls = await prisma.payroll.findMany({
            where: { month, year, employee: { companyId } },
            include: { employee: true }
        });

        const lines = await Promise.all(payrolls.map(async (p) => {
            const esiNumber = (p.employee.skills as any)?.esiNumber || 'NA';
            // Compute actual working days from attendance
            const startDate = new Date(p.year, p.month - 1, 1);
            const endDate = new Date(p.year, p.month, 0);
            const attendances = await prisma.attendance.findMany({
                where: {
                    employeeId: p.employeeId,
                    date: { gte: startDate, lte: endDate }
                }
            });
            const daysWorked = attendances.reduce((sum, a) => {
                if (a.status === 'present') return sum + 1;
                if (a.status === 'half-day') return sum + 0.5;
                return sum;
            }, 0);
            const wages = p.grossSalary;
            const reason = 0;

            return `${esiNumber},${p.employee.firstName} ${p.employee.lastName},${daysWorked},${wages},${reason}`;
        }));

        return lines.join('\n');
    }
}
