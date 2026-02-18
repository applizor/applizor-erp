import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Roster for a Date Range
export const getRoster = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, departmentId } = req.query;
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        const where: any = {
            date: { gte: start, lte: end }
        };

        if (departmentId && departmentId !== 'all') {
            where.employee = { departmentId: departmentId as string };
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
                    const existingShift = roster.find(
                        r => r.employeeId === leave.employeeId &&
                            r.date.toDateString() === curr.toDateString()
                    );

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
                    } else {
                        // Mark existing shift as "On Leave" override?
                        (existingShift as any).isLeave = true;
                        (existingShift as any).leaveType = leave.leaveType.name;
                    }
                }
                curr.setDate(curr.getDate() + 1);
            }
        }

        // Combine
        res.json([...roster, ...leaveEntries]);
    } catch (error) {
        console.error('Get roster error:', error);
        res.status(500).json({ error: 'Failed to fetch roster' });
    }
};

// Create or Update Roster entries
export const updateRoster = async (req: AuthRequest, res: Response) => {
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
            const conflict = approvedLeaves.find(leave =>
                leave.employeeId === assignment.employeeId &&
                assignDate >= leave.startDate && assignDate <= leave.endDate
            );

            if (conflict) {
                return res.status(409).json({
                    error: `Cannot assign shift to employee ${assignment.employeeId} on ${assignDate.toDateString()} because they are on Approved Leave.`
                });
            }
        }

        const operations = assignments.map(ass =>
            prisma.shiftRoster.upsert({
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
            })
        );

        const results = await prisma.$transaction(operations);

        res.json(results);
    } catch (error: any) {
        console.error('Update roster error:', error);
        res.status(500).json({
            error: 'Failed to update roster',
            details: error.message,
            code: error.code // Prisma error code
        });
    }
};
// Sync Previous Week Roster
export const syncPreviousWeek = async (req: AuthRequest, res: Response) => {
    try {
        const { currentStartDate, currentEndDate } = req.body;
        const currentStart = new Date(currentStartDate);
        const currentEnd = new Date(currentEndDate);

        // Previous week dates
        const prevStart = new Date(currentStart);
        prevStart.setDate(prevStart.getDate() - 7);
        const prevEnd = new Date(currentEnd);
        prevEnd.setDate(prevEnd.getDate() - 7);

        // 1. Fetch Previous Week Assignments
        const prevAssignments = await prisma.shiftRoster.findMany({
            where: {
                date: { gte: prevStart, lte: prevEnd }
            }
        });

        if (prevAssignments.length === 0) {
            return res.json({ message: 'No assignments found in previous week to sync.' });
        }

        // 2. Fetch Approved Leaves for CURRENT week to prevent conflicts
        const employeesToCheck = Array.from(new Set(prevAssignments.map(a => a.employeeId)));
        const approvedLeaves = await prisma.leaveRequest.findMany({
            where: {
                employeeId: { in: employeesToCheck },
                status: 'approved',
                OR: [
                    { startDate: { gte: currentStart, lte: currentEnd } },
                    { endDate: { gte: currentStart, lte: currentEnd } },
                    { startDate: { lte: currentStart }, endDate: { gte: currentEnd } }
                ]
            }
        });

        // 3. Prepare Upsert Operations
        const operations: any[] = [];
        const conflicts: string[] = [];

        for (const ass of prevAssignments) {
            const newDate = new Date(ass.date);
            newDate.setDate(newDate.getDate() + 7);

            // Check conflict
            const conflict = approvedLeaves.find(leave =>
                leave.employeeId === ass.employeeId &&
                newDate >= leave.startDate && newDate <= leave.endDate
            );

            if (conflict) {
                conflicts.push(`Employee ${ass.employeeId} on ${newDate.toDateString()}`);
                continue;
            }

            operations.push(
                prisma.shiftRoster.upsert({
                    where: {
                        employeeId_date: {
                            employeeId: ass.employeeId,
                            date: newDate
                        }
                    },
                    update: { shiftId: ass.shiftId },
                    create: {
                        employeeId: ass.employeeId,
                        shiftId: ass.shiftId,
                        date: newDate
                    }
                })
            );
        }

        if (operations.length > 0) {
            await prisma.$transaction(operations);
        }

        res.json({
            success: true,
            syncedCount: operations.length,
            conflicts
        });
    } catch (error: any) {
        console.error('Sync roster error:', error);
        res.status(500).json({ error: 'Failed to sync roster', details: error.message });
    }
};
