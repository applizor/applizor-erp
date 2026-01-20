"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCarryForward = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const processCarryForward = async (req, res) => {
    try {
        const { year } = req.body;
        const currentYear = year || new Date().getFullYear();
        const previousYear = currentYear - 1;
        console.log(`Processing carry forward for ${previousYear} -> ${currentYear}`);
        // 1. Get all employees
        const employees = await prisma.employee.findMany({
            where: { status: 'active' }
        });
        // 2. Get all leave types with carry forward enabled
        const leaveTypes = await prisma.leaveType.findMany({
            where: { carryForward: true }
        });
        const results = [];
        for (const emp of employees) {
            for (const type of leaveTypes) {
                // Get usage for previous year
                // Since we didn't have balances before, we calculate usage from LeaveRequest
                const used = await prisma.leaveRequest.aggregate({
                    where: {
                        employeeId: emp.id,
                        leaveTypeId: type.id,
                        status: 'approved',
                        startDate: {
                            gte: new Date(`${previousYear}-01-01`),
                            lte: new Date(`${previousYear}-12-31`)
                        }
                    },
                    _sum: { days: true }
                });
                const usedDays = used._sum.days || 0;
                const allocated = type.days; // Assuming flat allocation for now
                const remaining = Math.max(0, allocated - usedDays);
                // Calculate carry forward amount
                let carryOver = remaining;
                if (type.maxCarryForward > 0) {
                    carryOver = Math.min(remaining, type.maxCarryForward);
                }
                // Initial allocation for new year (default days)
                const newAllocation = type.days;
                // Update/Create Balance for Current Year
                const balance = await prisma.employeeLeaveBalance.upsert({
                    where: {
                        employeeId_leaveTypeId_year: {
                            employeeId: emp.id,
                            leaveTypeId: type.id,
                            year: currentYear
                        }
                    },
                    update: {
                        allocated: newAllocation,
                        carriedOver: carryOver
                    },
                    create: {
                        employeeId: emp.id,
                        leaveTypeId: type.id,
                        year: currentYear,
                        allocated: newAllocation,
                        carriedOver: carryOver,
                        used: 0
                    }
                });
                results.push({
                    employee: emp.firstName,
                    leaveType: type.name,
                    previousYearUsage: usedDays,
                    carriedOver: carryOver,
                    newTotal: newAllocation + carryOver
                });
            }
        }
        res.json({
            message: 'Carry forward processing complete',
            results
        });
    }
    catch (error) {
        console.error('Carry forward error:', error);
        res.status(500).json({ error: 'Failed to process carry forward' });
    }
};
exports.processCarryForward = processCarryForward;
//# sourceMappingURL=leave-carry-forward.controller.js.map