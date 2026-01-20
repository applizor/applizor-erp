import prisma from '../prisma/client';

export class LeaveAccrualService {
    /**
     * Run monthly accrual for all employees and relevant leave types
     * This adds leave days based on the monthly rate (e.g., 1.5 days/month)
     */
    async processMonthlyAccruals() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-indexed

        console.log(`[LeaveAccrual] Starting monthly accrual for ${month}/${year}`);

        // Get all leave types that support monthly accrual
        const accrualLeaveTypes = await prisma.leaveType.findMany({
            where: {
                accrualType: 'monthly'
            }
        });

        for (const leaveType of accrualLeaveTypes) {
            console.log(`[LeaveAccrual] Processing leave type: ${leaveType.name} (Rate: ${leaveType.accrualRate})`);

            // Get all active employees
            const employees = await prisma.employee.findMany({
                where: {
                    status: 'active',
                    // Filter by department if specified
                    ...(leaveType.departmentIds.length > 0 ? { departmentId: { in: leaveType.departmentIds } } : {}),
                    // Filter by position if specified
                    ...(leaveType.positionIds.length > 0 ? { positionId: { in: leaveType.positionIds } } : {}),
                }
            });

            for (const employee of employees) {
                try {
                    // Check if already accrued for this month
                    const existingAccrual = await prisma.leaveAccrual.findUnique({
                        where: {
                            employeeId_leaveTypeId_year_month: {
                                employeeId: employee.id,
                                leaveTypeId: leaveType.id,
                                year,
                                month
                            }
                        }
                    });

                    if (existingAccrual) {
                        continue;
                    }

                    // Calculate total accrued so far this year to check against maxAccrual
                    const stats = await prisma.leaveAccrual.aggregate({
                        where: {
                            employeeId: employee.id,
                            leaveTypeId: leaveType.id,
                            year
                        },
                        _sum: {
                            accruedDays: true
                        }
                    });

                    const accruedSoFar = stats._sum.accruedDays || 0;

                    // If maxAccrual is set ( > 0) and we already reached it, skip
                    if (leaveType.maxAccrual > 0 && accruedSoFar >= leaveType.maxAccrual) {
                        console.log(`[LeaveAccrual] Max accrual reached for ${employee.email} (${accruedSoFar}/${leaveType.maxAccrual})`);
                        continue;
                    }

                    // Adjust rate if it would exceed maxAccrual
                    let daysToAccrue = leaveType.accrualRate;
                    if (leaveType.maxAccrual > 0 && accruedSoFar + daysToAccrue > leaveType.maxAccrual) {
                        daysToAccrue = leaveType.maxAccrual - accruedSoFar;
                    }

                    if (daysToAccrue <= 0) continue;

                    // Create accrual record
                    await prisma.leaveAccrual.create({
                        data: {
                            employeeId: employee.id,
                            leaveTypeId: leaveType.id,
                            year,
                            month,
                            accruedDays: daysToAccrue,
                            totalAccrued: accruedSoFar + daysToAccrue
                        }
                    });

                    // Update EmployeeLeaveBalance
                    const balance = await prisma.employeeLeaveBalance.findUnique({
                        where: {
                            employeeId_leaveTypeId_year: {
                                employeeId: employee.id,
                                leaveTypeId: leaveType.id,
                                year
                            }
                        }
                    });

                    if (balance) {
                        await prisma.employeeLeaveBalance.update({
                            where: { id: balance.id },
                            data: {
                                allocated: balance.allocated + daysToAccrue
                            }
                        });
                    } else {
                        // If no balance record exists for this year, create one
                        await prisma.employeeLeaveBalance.create({
                            data: {
                                employeeId: employee.id,
                                leaveTypeId: leaveType.id,
                                year,
                                allocated: daysToAccrue,
                                used: 0,
                                carriedOver: 0
                            }
                        });
                    }

                    console.log(`[LeaveAccrual] Accrued ${daysToAccrue} days for ${employee.email} (${leaveType.name})`);
                } catch (err) {
                    console.error(`[LeaveAccrual] Error for employee ${employee.email}:`, err);
                }
            }
        }

        console.log(`[LeaveAccrual] Monthly accrual finished`);
    }
}

export const leaveAccrualService = new LeaveAccrualService();
