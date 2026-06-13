import prisma from '../prisma/client';

export class WorkloadService {
    // Priority weights for workload calculation
    private static readonly PRIORITY_WEIGHTS: Record<string, number> = {
        'high': 3,
        'medium': 2,
        'low': 1
    };

    // Max capacity points per employee (normalization factor)
    private static readonly MAX_CAPACITY = 20;

    /**
     * Calculate the workload score for a specific employee.
     * Formula: (Sum of open task weights / MAX_CAPACITY) * 100
     */
    static async calculateEmployeeWorkload(employeeId: string): Promise<{
        score: number,
        details: {
            openTasksCount: number,
            totalWeight: number,
            isOnLeave: boolean,
            status: 'available' | 'overloaded' | 'unavailable'
        }
    }> {
        try {
            // 1. Check if employee is currently on approved leave
            const today = new Date();
            const activeLeave = await prisma.leaveRequest.findFirst({
                where: {
                    employeeId,
                    status: 'approved',
                    startDate: { lte: today },
                    endDate: { gte: today }
                }
            });

            if (activeLeave) {
                return {
                    score: 100,
                    details: {
                        openTasksCount: 0,
                        totalWeight: 0,
                        isOnLeave: true,
                        status: 'unavailable'
                    }
                };
            }

            // 2. Fetch all open tasks assigned to this employee
            // Open tasks are anything NOT 'completed'
            const openTasks = await prisma.task.findMany({
                where: {
                    assignedToId: employeeId,
                    status: { not: 'completed' }
                },
                select: { priority: true }
            });

            // 3. Calculate total weight
            let totalWeight = 0;
            openTasks.forEach(task => {
                totalWeight += this.PRIORITY_WEIGHTS[task.priority] || 2; // Default to medium (2)
            });

            // 4. Calculate percentage score
            const score = Math.min(Math.round((totalWeight / this.MAX_CAPACITY) * 100), 100);
            
            let status: 'available' | 'overloaded' | 'unavailable' = 'available';
            if (score >= 80) status = 'overloaded';
            if (activeLeave) status = 'unavailable';

            return {
                score,
                details: {
                    openTasksCount: openTasks.length,
                    totalWeight,
                    isOnLeave: false,
                    status
                }
            };
        } catch (error) {
            console.error(`Workload Calculation Error: ${error}`);
            throw new Error('Failed to calculate employee workload');
        }
    }

    /**
     * Get workload scores for all employees in a company.
     */
    static async getAllEmployeeWorkloads(companyId: string) {
        try {
            const employees = await prisma.employee.findMany({
                where: { companyId, status: 'active' },
                select: { id: true, firstName: true, lastName: true, positionId: true }
            });

            const workloadList = await Promise.all(employees.map(async (emp) => {
                const workload = await this.calculateEmployeeWorkload(emp.id);
                return {
                    employeeId: emp.id,
                    name: `${emp.firstName} ${emp.lastName}`,
                    score: workload.score,
                    status: workload.details.status,
                    details: workload.details
                };
            }));

            // Sort by highest workload first
            return workloadList.sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error(`Bulk Workload Error: ${error}`);
            throw new Error('Failed to fetch company workload scores');
        }
    }
}
