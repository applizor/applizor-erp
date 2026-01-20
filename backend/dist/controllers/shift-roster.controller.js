"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoster = exports.getRoster = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get Roster for a Date Range
const getRoster = async (req, res) => {
    try {
        const { startDate, endDate, departmentId } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const where = {
            date: { gte: start, lte: end }
        };
        if (departmentId && departmentId !== 'all') {
            where.employee = { departmentId: departmentId };
        }
        // 1. Fetch Assigned Shifts
        const roster = await prisma.shiftRoster.findMany({
            where,
            include: {
                employee: { select: { firstName: true, lastName: true, employeeId: true } },
                shift: true
            }
        });
        // 2. Fetch Approved Leaves for this period
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                status: 'approved',
                // Filter by department if needed? 
                // For now fetch all overlapping leaves to ensure accuracy
                OR: [
                    { startDate: { gte: start, lte: end } },
                    { endDate: { gte: start, lte: end } },
                    { startDate: { lte: start }, endDate: { gte: end } }
                ]
            },
            include: {
                employee: { select: { firstName: true, lastName: true, employeeId: true } },
                leaveType: true
            }
        });
        // 3. Merge Leaves into Roster Structure
        // For the frontend, we might want to return standard Roster entries 
        // AND a list of "Leave Entries" formatted like roster entries?
        // Let's create "Virtual" roster entries for leaves
        const leaveEntries = [];
        for (const leave of leaves) {
            let curr = new Date(leave.startDate);
            const lEnd = new Date(leave.endDate);
            while (curr <= lEnd) {
                if (curr >= start && curr <= end) {
                    // Check if this employee already has a shift assigned this day
                    const existingShift = roster.find(r => r.employeeId === leave.employeeId &&
                        r.date.toDateString() === curr.toDateString());
                    // If NO shift assigned, OR we want to show Leave prominently
                    // We'll add a special entry.
                    // Actually, if we want to show "On Leave" INSTEAD of Shift, we should mark it.
                    // But if we want to show "On Leave" on an Empty cell, we add it.
                    if (!existingShift) {
                        leaveEntries.push({
                            id: `leave-${leave.id}-${curr.getTime()}`,
                            employeeId: leave.employeeId,
                            date: new Date(curr),
                            shift: {
                                name: `Leave: ${leave.leaveType.name}`,
                                startTime: '-',
                                endTime: '-',
                                color: 'red' // proprietary flag for UI
                            },
                            employee: leave.employee,
                            isLeave: true
                        });
                    }
                    else {
                        // Mark existing shift as "On Leave" override?
                        existingShift.isLeave = true;
                        existingShift.leaveType = leave.leaveType.name;
                    }
                }
                curr.setDate(curr.getDate() + 1);
            }
        }
        // Combine
        res.json([...roster, ...leaveEntries]);
    }
    catch (error) {
        console.error('Get roster error:', error);
        res.status(500).json({ error: 'Failed to fetch roster' });
    }
};
exports.getRoster = getRoster;
// Create or Update Roster entries
const updateRoster = async (req, res) => {
    try {
        const { assignments } = req.body; // Array of { employeeId, shiftId, date }
        if (!Array.isArray(assignments)) {
            return res.status(400).json({ error: 'Assignments must be an array' });
        }
        console.log('Received assignments:', JSON.stringify(assignments, null, 2));
        // 1. Validate Conflicts with Approved Leaves
        const employeesToCheck = assignments.map(a => a.employeeId);
        const datesToCheck = assignments.map(a => new Date(a.date));
        // Find min and max date to reduce query scope
        const minDate = new Date(Math.min(...datesToCheck.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...datesToCheck.map(d => d.getTime())));
        const approvedLeaves = await prisma.leaveRequest.findMany({
            where: {
                employeeId: { in: employeesToCheck },
                status: 'approved',
                OR: [
                    { startDate: { gte: minDate, lte: maxDate } },
                    { endDate: { gte: minDate, lte: maxDate } },
                    { startDate: { lte: minDate }, endDate: { gte: maxDate } }
                ]
            }
        });
        // Check each assignment
        for (const assignment of assignments) {
            const assignDate = new Date(assignment.date);
            const conflict = approvedLeaves.find(leave => leave.employeeId === assignment.employeeId &&
                assignDate >= leave.startDate && assignDate <= leave.endDate);
            if (conflict) {
                return res.status(409).json({
                    error: `Cannot assign shift to employee ${assignment.employeeId} on ${assignDate.toDateString()} because they are on Approved Leave.`
                });
            }
        }
        const operations = assignments.map(ass => prisma.shiftRoster.upsert({
            where: {
                employeeId_date: {
                    employeeId: ass.employeeId,
                    date: new Date(ass.date)
                }
            },
            update: { shiftId: ass.shiftId },
            create: {
                employeeId: ass.employeeId,
                shiftId: ass.shiftId,
                date: new Date(ass.date)
            }
        }));
        const results = await prisma.$transaction(operations);
        res.json(results);
    }
    catch (error) {
        console.error('Update roster error:', error);
        res.status(500).json({
            error: 'Failed to update roster',
            details: error.message,
            code: error.code // Prisma error code
        });
    }
};
exports.updateRoster = updateRoster;
//# sourceMappingURL=shift-roster.controller.js.map