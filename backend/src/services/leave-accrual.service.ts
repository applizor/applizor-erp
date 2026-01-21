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

    /**
     * Finds employees whose probation has ended and applies confirmation bonuses
     */
    async processProbationConfirmations() {
        const now = new Date();
        const year = now.getFullYear();

        console.log(`[LeaveAccrual] Checking for probation completions...`);

        // Find employees whose probation has ended but not yet processed
        const completedProbations = await prisma.employee.findMany({
            where: {
                status: 'active',
                probationProcessed: false,
                probationEndDate: {
                    lte: now
                }
            }
        });

        console.log(`[LeaveAccrual] Found ${completedProbations.length} employees completing probation.`);

        for (const employee of completedProbations) {
            try {
                // Find all leave types that have a confirmation bonus
                const bonusLeaveTypes = await prisma.leaveType.findMany({
                    where: {
                        confirmationBonus: {
                            gt: 0
                        }
                    }
                });

                for (const leaveType of bonusLeaveTypes) {
                    // Check if applicable to this employee (dept/pos)
                    const deptMatch = leaveType.departmentIds.length === 0 ||
                        (employee.departmentId && leaveType.departmentIds.includes(employee.departmentId));
                    const posMatch = leaveType.positionIds.length === 0 ||
                        (employee.positionId && leaveType.positionIds.includes(employee.positionId));

                    if (deptMatch && posMatch) {
                        const bonus = leaveType.confirmationBonus;
                        console.log(`[LeaveAccrual] Applying ${bonus} days bonus (${leaveType.name}) to ${employee.email}`);

                        // Find or create balance
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
                                    allocated: balance.allocated + bonus
                                }
                            });
                        } else {
                            await prisma.employeeLeaveBalance.create({
                                data: {
                                    employeeId: employee.id,
                                    leaveTypeId: leaveType.id,
                                    year,
                                    allocated: bonus,
                                    used: 0,
                                    carriedOver: 0
                                }
                            });
                        }
                    }
                }

                // Mark as processed
                await prisma.employee.update({
                    where: { id: employee.id },
                    data: { probationProcessed: true }
                });

                console.log(`[LeaveAccrual] Confirmation processed for ${employee.email}`);
            } catch (err) {
                console.error(`[LeaveAccrual] Error processing confirmation for ${employee.email}:`, err);
            }
        }
    }
}

export const leaveAccrualService = new LeaveAccrualService();
