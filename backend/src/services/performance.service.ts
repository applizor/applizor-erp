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
    static async calculateFnF(employeeId: string) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { exitDetail: true, payrolls: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });

        if (!employee || !employee.exitDetail) throw new Error('Exit details not found');

        const lastSalary = employee.payrolls[0]?.netSalary || 0;
        const gratuity = 0; // Simplified
        const leaveEncashment = 0; // Simplified

        const totalDues = Number(lastSalary) + gratuity + leaveEncashment;

        return {
            lastMonthlySalary: lastSalary,
            gratuity,
            leaveEncashment,
            totalSettlement: totalDues
        };
    }
}
