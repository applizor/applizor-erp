import prisma from '../prisma/client';

export interface RosterAssignmentInput {
  employeeId: string;
  shiftId: string | null; // null represents clearing/deleting the shift
  date: string; // YYYY-MM-DD
}

export interface ValidationWarning {
  employeeId: string;
  date: string;
  error: string;
}

export class RosterValidatorService {
  /**
   * Helper to parse shift start and end times into absolute Date objects,
   * handles night shifts crossing midnight correctly.
   */
  static getShiftDateRange(baseDateStr: string, startTime: string, endTime: string) {
    const baseDate = new Date(`${baseDateStr}T00:00:00`);
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const start = new Date(baseDate);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(baseDate);
    end.setHours(endH, endM, 0, 0);

    // If night shift crosses midnight
    if (endTime < startTime) {
      end.setDate(end.getDate() + 1);
    }

    return { start, end };
  }

  /**
   * Validates a batch of shift assignments for compliance and conflicts.
   */
  static async validateAssignments(
    companyId: string,
    assignments: RosterAssignmentInput[]
  ): Promise<{ validAssignments: RosterAssignmentInput[]; warnings: ValidationWarning[] }> {
    const warnings: ValidationWarning[] = [];
    const validAssignments: RosterAssignmentInput[] = [];

    if (assignments.length === 0) {
      return { validAssignments, warnings };
    }

    // 1. Fetch Company Configs & Off-Days
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { offDays: true }
    });
    const offDays = company?.offDays
      ? company.offDays.split(',').map((s: string) => s.trim().toLowerCase())
      : [];

    // 2. Fetch all shifts for reference
    const shifts = await prisma.shift.findMany({
      where: { companyId }
    });
    const shiftMap = new Map(shifts.map(s => [s.id, s]));

    // 3. Resolve time boundaries to query existing database rosters
    const employeeIds = Array.from(new Set(assignments.map(a => a.employeeId)));
    const assignmentDates = assignments.map(a => new Date(`${a.date}T00:00:00`));
    const minDate = new Date(Math.min(...assignmentDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...assignmentDates.map(d => d.getTime())));

    // Buffer range by 1 day on both sides to check rest violations with preceding/succeeding days
    const queryMinDate = new Date(minDate);
    queryMinDate.setDate(queryMinDate.getDate() - 1);
    const queryMaxDate = new Date(maxDate);
    queryMaxDate.setDate(queryMaxDate.getDate() + 1);

    // Fetch existing rosters in buffered date range
    const existingRosters = await prisma.shiftRoster.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: queryMinDate, lte: queryMaxDate }
      },
      include: { shift: true }
    });

    // Fetch approved leaves
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: 'approved',
        OR: [
          { startDate: { gte: queryMinDate, lte: queryMaxDate } },
          { endDate: { gte: queryMinDate, lte: queryMaxDate } },
          { startDate: { lte: queryMinDate }, endDate: { gte: queryMaxDate } }
        ]
      }
    });

    // 4. Validate each assignment
    for (const item of assignments) {
      const { employeeId, shiftId, date } = item;
      
      // If deleting the assignment, no conflict checks are needed
      if (!shiftId) {
        validAssignments.push(item);
        continue;
      }

      const shift = shiftMap.get(shiftId);
      if (!shift) {
        warnings.push({ employeeId, date, error: `Shift with ID ${shiftId} not found.` });
        continue;
      }

      // Check A: Company Off-Day
      const assignDate = new Date(`${date}T00:00:00`);
      const dayName = assignDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (offDays.includes(dayName)) {
        warnings.push({ employeeId, date, error: `Cannot assign shift on ${date} (${dayName}) — it is a company off-day.` });
        continue;
      }

      // Check B: Approved Leave
      const onLeave = approvedLeaves.find(leave =>
        leave.employeeId === employeeId &&
        assignDate >= leave.startDate && assignDate <= leave.endDate
      );
      if (onLeave) {
        warnings.push({ employeeId, date, error: `Employee is on approved leave from ${onLeave.startDate.toISOString().split('T')[0]} to ${onLeave.endDate.toISOString().split('T')[0]}.` });
        continue;
      }

      // Check C: Double Booking / Overlap & 11-Hour Rest Violations
      // Construct absolute time for candidate shift
      const candidateTimes = this.getShiftDateRange(date, shift.startTime, shift.endTime);

      // Collect all comparison shifts (batch updates + database shifts not overwritten in this batch)
      const comparisonShifts: Array<{ start: Date; end: Date; name: string }> = [];

      // Add other assignments from this batch for the same employee
      for (const other of assignments) {
        if (other.employeeId === employeeId && other.date !== date && other.shiftId) {
          const s = shiftMap.get(other.shiftId);
          if (s) {
            comparisonShifts.push({
              ...this.getShiftDateRange(other.date, s.startTime, s.endTime),
              name: s.name
            });
          }
        }
      }

      // Add existing assignments in DB that are NOT overwritten by this batch
      const overwrittenDates = new Set(assignments.filter(a => a.employeeId === employeeId).map(a => a.date));
      for (const exist of existingRosters) {
        const existDateStr = exist.date.toISOString().split('T')[0];
        if (exist.employeeId === employeeId && !overwrittenDates.has(existDateStr)) {
          comparisonShifts.push({
            ...this.getShiftDateRange(existDateStr, exist.shift.startTime, exist.shift.endTime),
            name: exist.shift.name
          });
        }
      }

      // Add candidate shift
      comparisonShifts.push({ ...candidateTimes, name: shift.name });

      // Sort by start time
      comparisonShifts.sort((a, b) => a.start.getTime() - b.start.getTime());

      let conflictFound = false;
      for (let i = 0; i < comparisonShifts.length - 1; i++) {
        const current = comparisonShifts[i];
        const next = comparisonShifts[i + 1];

        // Overlap Check (Double Booking)
        if (next.start < current.end) {
          warnings.push({
            employeeId,
            date,
            error: `Double Booking conflict: Shift "${current.name}" overlaps with "${next.name}".`
          });
          conflictFound = true;
          break;
        }

        // Rest Period Check (11-Hour Rule)
        const restMs = next.start.getTime() - current.end.getTime();
        const restHours = restMs / (1000 * 60 * 60);
        if (restHours < 11) {
          warnings.push({
            employeeId,
            date,
            error: `Rest Time Violation: Less than 11 hours of rest (${restHours.toFixed(1)} hrs) between "${current.name}" and "${next.name}".`
          });
          conflictFound = true;
          break;
        }
      }

      if (!conflictFound) {
        validAssignments.push(item);
      }
    }

    return { validAssignments, warnings };
  }
}
