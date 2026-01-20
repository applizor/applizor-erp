"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveAccrualService = exports.LeaveAccrualService = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class LeaveAccrualService {
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
        const accrualLeaveTypes = await client_1.default.leaveType.findMany({
            where: {
                accrualType: 'monthly'
            }
        });
        for (const leaveType of accrualLeaveTypes) {
            console.log(`[LeaveAccrual] Processing leave type: ${leaveType.name} (Rate: ${leaveType.accrualRate})`);
            // Get all active employees
            const employees = await client_1.default.employee.findMany({
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
                    const existingAccrual = await client_1.default.leaveAccrual.findUnique({
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
                    const stats = await client_1.default.leaveAccrual.aggregate({
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
                    if (daysToAccrue <= 0)
                        continue;
                    // Create accrual record
                    await client_1.default.leaveAccrual.create({
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
                    const balance = await client_1.default.employeeLeaveBalance.findUnique({
                        where: {
                            employeeId_leaveTypeId_year: {
                                employeeId: employee.id,
                                leaveTypeId: leaveType.id,
                                year
                            }
                        }
                    });
                    if (balance) {
                        await client_1.default.employeeLeaveBalance.update({
                            where: { id: balance.id },
                            data: {
                                allocated: balance.allocated + daysToAccrue
                            }
                        });
                    }
                    else {
                        // If no balance record exists for this year, create one
                        await client_1.default.employeeLeaveBalance.create({
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
                }
                catch (err) {
                    console.error(`[LeaveAccrual] Error for employee ${employee.email}:`, err);
                }
            }
        }
        console.log(`[LeaveAccrual] Monthly accrual finished`);
    }
}
exports.LeaveAccrualService = LeaveAccrualService;
exports.leaveAccrualService = new LeaveAccrualService();
//# sourceMappingURL=leave-accrual.service.js.map