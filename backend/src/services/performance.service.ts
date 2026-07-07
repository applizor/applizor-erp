import prisma from '../prisma/client';

export class PerformanceService {
    /**
     * OKR Progress Aggregator
     * Calculates the overall progress of an OKR based on its Key Results.
     */
    static async updateOKRProgress(okrId: string) {
        const okr = await prisma.oKR.findUnique({
            where: { id: okrId },
            include: { keyResults: true }
        });

        if (!okr || okr.keyResults.length === 0) return 0;

        let totalProgress = 0;
        okr.keyResults.forEach((kr: any) => {
            const range = kr.targetValue - kr.startValue;
            if (range === 0) {
                totalProgress += 100;
            } else {
                const progress = ((kr.currentValue - kr.startValue) / range) * 100;
                totalProgress += Math.min(Math.max(progress, 0), 100);
            }
        });

        const overallProgress = totalProgress / okr.keyResults.length;

        await prisma.oKR.update({
            where: { id: okrId },
            data: { progress: overallProgress }
        });

        return overallProgress;
    }

    /**
     * FnF Logic (Full & Final Settlement)
     * Calculates the pending dues for an exiting employee.
     */
    static async calculateFnF(employeeId: string, companyId: string) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { payrolls: { orderBy: { year: 'desc', month: 'desc' }, take: 3 } }
        });
        if (!employee) throw new Error('Employee not found');

        const doj = employee.dateOfJoining ? new Date(employee.dateOfJoining) : new Date();
        const exitDate = employee.exitDate ? new Date(employee.exitDate) : new Date();
        const tenureMs = exitDate.getTime() - doj.getTime();
        const tenureYears = tenureMs / (365.25 * 24 * 60 * 60 * 1000);

        // Last drawn monthly gross (from most recent payroll)
        const lastPayroll = employee.payrolls[0];
        const lastGross = lastPayroll ? Number(lastPayroll.grossSalary) : Number(employee.salary) || 0;

        // Gratuity: (Last drawn salary × 15/26 × years of service)
        // Eligible after 5 years of continuous service
        let gratuity = 0;
        if (tenureYears >= 5) {
            gratuity = Math.floor(lastGross * (15 / 26) * Math.floor(tenureYears));
        }

        // Leave encashment: Unused encashable leave days × daily wage
        // Daily wage = monthly gross / 30
        const dailyWage = lastGross / 30;
        const leaveBalances = await prisma.employeeLeaveBalance.findMany({
            where: {
                employeeId,
                leaveType: { encashable: true }
            }
        });
        const encashableBalance = leaveBalances.reduce((sum: number, lb: any) => {
            const bal = Number(lb.allocated) + Number(lb.carriedOver) - Number(lb.used);
            return sum + Math.floor(bal);
        }, 0);

        // Max encashment = 30 days (standard policy)
        const encashableLeaves = Math.min(encashableBalance, 30);
        const leaveEncashment = Math.floor(encashableLeaves * dailyWage);

        // Notice period recovery
        // Default notice period is 30 days. Short notice = recovery
        // Actual logic depends on company policy
        const noticePeriodDays = 30;
        const noticeRecovery = 0; // Simplified: calculated during separation approval

        return {
            gratuity,
            leaveEncashment,
            noticeRecovery,
            total: gratuity + leaveEncashment - noticeRecovery,
            tenureYears: Math.round(tenureYears * 100) / 100,
            earnedLeaveBalance: encashableBalance
        };
    }
}
