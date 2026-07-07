import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { RosterValidatorService, RosterAssignmentInput } from '../services/roster-validator.service';

// ─────────────────────────────────────────────────────────────
// Helper: Parse uploaded CSV file into an array of row objects
// Supports both comma and semicolon delimiters.
// Expected columns (case-insensitive, order-independent):
//   employeeId OR email, shiftId OR shiftName OR shiftCode, date (YYYY-MM-DD)
// ─────────────────────────────────────────────────────────────
function parseCSV(filePath: string): Record<string, string>[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));

    return lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
            row[header] = values[i] ?? '';
        });
        return row;
    }).filter(row => Object.values(row).some(v => v !== ''));
}

// ─────────────────────────────────────────────────────────────
// GET /api/shift-rosters  – Fetch roster for a date range
// ─────────────────────────────────────────────────────────────
export const getRoster = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, departmentId } = req.query;
        const start = new Date(`${startDate}T00:00:00`);
        const end   = new Date(`${endDate}T00:00:00`);

        const where: any = {
            date: { gte: start, lte: end },
            employee: { companyId: req.user.companyId }
        };

        if (departmentId && departmentId !== 'all') {
            where.employee = { ...where.employee, departmentId: departmentId as string };
        }

        // 1. Assigned Shifts
        const roster = await prisma.shiftRoster.findMany({
            where,
            include: {
                employee: { select: { firstName: true, lastName: true, employeeId: true } },
                shift: true
            }
        });

        // 2. Approved Leaves overlapping the range
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                status: 'approved',
                OR: [
                    { startDate: { gte: start, lte: end } },
                    { endDate:   { gte: start, lte: end } },
                    { startDate: { lte: start }, endDate: { gte: end } }
                ]
            },
            include: {
                employee:  { select: { firstName: true, lastName: true, employeeId: true } },
                leaveType: true
            }
        });

        // 3. Build virtual "leave" entries for cells with no shift assigned
        const leaveEntries: any[] = [];
        for (const leave of leaves) {
            let curr = new Date(leave.startDate);
            const lEnd = new Date(leave.endDate);

            while (curr <= lEnd) {
                if (curr >= start && curr <= end) {
                    const existingShift = roster.find(
                        r => r.employeeId === leave.employeeId &&
                             r.date.toDateString() === curr.toDateString()
                    );
                    if (!existingShift) {
                        leaveEntries.push({
                            id: `leave-${leave.id}-${curr.getTime()}`,
                            employeeId: leave.employeeId,
                            date: new Date(curr),
                            shift: {
                                name: `Leave: ${leave.leaveType.name}`,
                                startTime: '-',
                                endTime: '-',
                                color: 'red'
                            },
                            employee: leave.employee,
                            isLeave: true,
                            durationType: leave.durationType
                        });
                    } else {
                        (existingShift as any).isLeave    = true;
                        (existingShift as any).leaveType  = leave.leaveType.name;
                        (existingShift as any).durationType = leave.durationType;
                    }
                }
                curr.setDate(curr.getDate() + 1);
            }
        }

        res.json([...roster, ...leaveEntries]);
    } catch (error) {
        console.error('Get roster error:', error);
        res.status(500).json({ error: 'Failed to fetch roster' });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/shift-rosters/batch  – Batch assign shifts
// Now uses RosterValidatorService for partial processing:
//   Valid rows → upserted into DB.
//   Invalid rows → returned as warnings (not a hard failure).
// ─────────────────────────────────────────────────────────────
export const updateRoster = async (req: AuthRequest, res: Response) => {
    try {
        const { assignments } = req.body; // [{ employeeId, shiftId, date }]

        if (!Array.isArray(assignments)) {
            return res.status(400).json({ error: 'Assignments must be an array' });
        }

        const companyId = req.user.companyId;

        // Multitenancy: verify all employees belong to this company
        const employeeIds = Array.from(new Set(assignments.map((a: any) => a.employeeId)));
        const validEmpCount = await prisma.employee.count({
            where: { id: { in: employeeIds as string[] }, companyId }
        });
        if (validEmpCount !== employeeIds.length) {
            return res.status(403).json({ error: 'One or more employees do not belong to your organisation.' });
        }

        // Multitenancy: verify all shifts belong to this company
        const shiftIds = Array.from(new Set(
            assignments.filter((a: any) => a.shiftId).map((a: any) => a.shiftId)
        ));
        if (shiftIds.length > 0) {
            const validShiftCount = await prisma.shift.count({
                where: { id: { in: shiftIds as string[] }, companyId }
            });
            if (validShiftCount !== shiftIds.length) {
                return res.status(403).json({ error: 'One or more shifts do not belong to your organisation.' });
            }
        }

        // Run Conflict Engine (partial processing: valid rows only)
        const { validAssignments, warnings } = await RosterValidatorService.validateAssignments(
            companyId,
            assignments as RosterAssignmentInput[]
        );

        // Persist valid assignments
        const operations = validAssignments.map((ass) => {
            const date = new Date(ass.date);
            if (!ass.shiftId) {
                return prisma.shiftRoster.deleteMany({ where: { employeeId: ass.employeeId, date } });
            }
            return prisma.shiftRoster.upsert({
                where:  { employeeId_date: { employeeId: ass.employeeId, date } },
                update: { shiftId: ass.shiftId },
                create: { employeeId: ass.employeeId, shiftId: ass.shiftId, date }
            });
        });

        if (operations.length > 0) {
            await prisma.$transaction(operations);
        }

        res.json({
            success:   true,
            saved:     validAssignments.length,
            skipped:   warnings.length,
            warnings
        });
    } catch (error: any) {
        console.error('Update roster error:', error);
        res.status(500).json({ error: 'Failed to update roster', details: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/shift-rosters/upload  – Bulk CSV Roster Upload
//
// CSV format (headers are case-insensitive):
//   employeeid OR email | shiftid OR shiftname OR shiftcode | date
//
// Example CSV:
//   employeeId,shiftName,date
//   EMP-0001,Morning Shift,2026-07-07
//   hr@company.com,Night Shift,2026-07-08
//
// Returns a detailed execution report.
// ─────────────────────────────────────────────────────────────
export const uploadRosterCSV = async (req: AuthRequest, res: Response) => {
    const filePath = (req as any).file?.path;

    try {
        if (!filePath) {
            return res.status(400).json({ error: 'No CSV file uploaded. Use field name "file".' });
        }

        const companyId = req.user.companyId;
        const rows = parseCSV(filePath);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty or has no valid data rows.' });
        }

        // ── Resolve employees (by employeeId code or email) ──────────────────
        const employees = await prisma.employee.findMany({
            where: { companyId },
            select: { id: true, employeeId: true, user: { select: { email: true } } }
        });
        const empByCode  = new Map(employees.map(e => [e.employeeId?.toLowerCase(), e.id]));
        const empByEmail = new Map(employees.map(e => [e.user?.email?.toLowerCase(), e.id]));

        // ── Resolve shifts (by id, name, or code) ────────────────────────────
        const shifts = await prisma.shift.findMany({
            where: { companyId },
            select: { id: true, name: true }
        });
        const shiftById   = new Map(shifts.map(s => [s.id.toLowerCase(), s.id]));
        const shiftByName = new Map(shifts.map(s => [s.name.toLowerCase(), s.id]));

        // ── Parse and resolve each CSV row ───────────────────────────────────
        const parseWarnings: Array<{ row: number; error: string }> = [];
        const resolved: RosterAssignmentInput[] = [];

        rows.forEach((row, i) => {
            const rowNum = i + 2; // +2 because row 1 is header

            // Resolve Employee ID
            const rawEmp = (row['employeeid'] || row['email'] || '').toLowerCase().trim();
            let employeeId = empByCode.get(rawEmp) ?? empByEmail.get(rawEmp);
            if (!employeeId) {
                parseWarnings.push({ row: rowNum, error: `Employee not found: "${rawEmp}"` });
                return;
            }

            // Resolve Shift ID
            const rawShift = (row['shiftid'] || row['shiftname'] || row['shiftcode'] || '').toLowerCase().trim();
            let shiftId: string | null = null;
            if (rawShift && rawShift !== 'off' && rawShift !== '-') {
                shiftId = shiftById.get(rawShift) ?? shiftByName.get(rawShift) ?? null;
                if (!shiftId) {
                    parseWarnings.push({ row: rowNum, error: `Shift not found: "${rawShift}"` });
                    return;
                }
            }

            // Validate Date format
            const date = (row['date'] || '').trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                parseWarnings.push({ row: rowNum, error: `Invalid date format "${date}". Expected YYYY-MM-DD.` });
                return;
            }

            resolved.push({ employeeId, shiftId, date });
        });

        // ── Run Conflict Engine ───────────────────────────────────────────────
        const { validAssignments, warnings: conflictWarnings } = await RosterValidatorService.validateAssignments(
            companyId,
            resolved
        );

        // ── Persist valid rows ────────────────────────────────────────────────
        const operations = validAssignments.map((ass) => {
            const date = new Date(ass.date);
            if (!ass.shiftId) {
                return prisma.shiftRoster.deleteMany({ where: { employeeId: ass.employeeId, date } });
            }
            return prisma.shiftRoster.upsert({
                where:  { employeeId_date: { employeeId: ass.employeeId, date } },
                update: { shiftId: ass.shiftId },
                create: { employeeId: ass.employeeId, shiftId: ass.shiftId, date }
            });
        });

        if (operations.length > 0) {
            await prisma.$transaction(operations);
        }

        // ── Cleanup temp file ─────────────────────────────────────────────────
        fs.unlinkSync(filePath);

        // ── Return execution report ───────────────────────────────────────────
        const allWarnings = [
            ...parseWarnings.map(w => ({ row: w.row, error: w.error })),
            ...conflictWarnings.map(w => ({ employeeId: w.employeeId, date: w.date, error: w.error }))
        ];

        res.json({
            success:    true,
            totalRows:  rows.length,
            imported:   validAssignments.length,
            skipped:    rows.length - validAssignments.length,
            warnings:   allWarnings
        });
    } catch (error: any) {
        // Ensure temp file is cleaned up even on error
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error('Upload roster CSV error:', error);
        res.status(500).json({ error: 'Failed to process CSV upload', details: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/shift-rosters/sync-prev  – Copy previous week's roster
// ─────────────────────────────────────────────────────────────
export const syncPreviousWeek = async (req: AuthRequest, res: Response) => {
    try {
        const { currentStartDate, currentEndDate } = req.body;
        const currentStart = new Date(`${currentStartDate}T00:00:00`);
        const currentEnd   = new Date(`${currentEndDate}T00:00:00`);

        const prevStart = new Date(currentStart);
        prevStart.setDate(prevStart.getDate() - 7);
        const prevEnd = new Date(currentEnd);
        prevEnd.setDate(prevEnd.getDate() - 7);

        // Fetch previous week assignments
        const prevAssignments = await prisma.shiftRoster.findMany({
            where: {
                date: { gte: prevStart, lte: prevEnd },
                employee: { companyId: req.user.companyId }
            }
        });

        if (prevAssignments.length === 0) {
            return res.json({ message: 'No assignments found in previous week to sync.' });
        }

        // Build RosterAssignmentInput for the current week
        const candidates: RosterAssignmentInput[] = prevAssignments.map(a => {
            const newDate = new Date(a.date);
            newDate.setDate(newDate.getDate() + 7);
            return {
                employeeId: a.employeeId,
                shiftId:    a.shiftId,
                date:       newDate.toISOString().split('T')[0]
            };
        });

        // Run Conflict Engine
        const { validAssignments, warnings } = await RosterValidatorService.validateAssignments(
            req.user.companyId,
            candidates
        );

        const operations = validAssignments.map(ass => {
            const date = new Date(ass.date);
            return prisma.shiftRoster.upsert({
                where:  { employeeId_date: { employeeId: ass.employeeId, date } },
                update: { shiftId: ass.shiftId! },
                create: { employeeId: ass.employeeId, shiftId: ass.shiftId!, date }
            });
        });

        if (operations.length > 0) {
            await prisma.$transaction(operations);
        }

        res.json({
            success:    true,
            syncedCount: validAssignments.length,
            skipped:    warnings.length,
            warnings
        });
    } catch (error: any) {
        console.error('Sync roster error:', error);
        res.status(500).json({ error: 'Failed to sync roster', details: error.message });
    }
};
