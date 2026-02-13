import prisma from '../prisma/client';

export class ComplianceService {
    /**
     * Generate ECR (Electronic Challan-cum-Return) file for EPFO
     * Format: UAN#MemberName#Gross#EPF_Wages#EPS_Wages#EDLI_Wages#EPF_Contri_Remitted#EPS_Contri_Remitted#EPF_EPS_Diff_Remitted#NCP_Days#Refunds
     */
    static async generateEPFO_ECR(month: number, year: number, companyId: string) {
        const payrolls = await prisma.payroll.findMany({
            where: { month, year, employee: { companyId } },
            include: { employee: true }
        });

        const lines = payrolls.map(p => {
            const uan = (p.employee.skills as any)?.uan || 'NA'; // Assuming UAN is in skills/metadata
            const basic = Number(p.basicSalary);
            const pfWage = Math.min(basic, 15000);
            const epsWage = pfWage;
            const edliWage = pfWage;
            const pfContri = Math.floor(pfWage * 0.12);
            const epsContri = Math.floor(pfWage * 0.0833);
            const diff = pfContri - epsContri;
            const ncpDays = 0; // Needs integration with attendance/lop

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

        const lines = payrolls.map(p => {
            const esiNumber = (p.employee.skills as any)?.esiNumber || 'NA';
            const daysWorked = 30 - Number(p.month); // Simplified
            const wages = p.grossSalary;
            const reason = 0;

            return `${esiNumber},${p.employee.firstName} ${p.employee.lastName},${daysWorked},${wages},${reason}`;
        });

        return lines.join('\n');
    }
}
