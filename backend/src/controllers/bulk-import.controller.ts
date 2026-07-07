import { Response } from 'express';
import Papa from 'papaparse';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Utility to parse date cleanly
function parseCsvDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

// ==========================================
// 1. EMPLOYEE IMPORT
// ==========================================
export const importEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(401).json({ error: 'Unauthorized: User context missing' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as any[];
    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Validate headers
    const requiredHeaders = ['employeeId', 'firstName', 'lastName', 'email', 'dateOfJoining'];
    const headers = parsed.meta.fields || [];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({ error: `Missing required CSV columns: ${missingHeaders.join(', ')}` });
    }

    // 1. Gather distinct values for bulk caching
    const csvEmails = rows.map(r => r.email?.trim().toLowerCase()).filter(Boolean);
    const csvEmpIds = rows.map(r => r.employeeId?.trim()).filter(Boolean);
    const csvDeptNames = Array.from(new Set(rows.map(r => r.departmentName?.trim()).filter(Boolean)));
    const csvPosNames = Array.from(new Set(rows.map(r => r.positionName?.trim()).filter(Boolean)));

    // 2. Perform bulk DB queries
    const existingEmailsInDb = await prisma.employee.findMany({
      where: { email: { in: csvEmails } },
      select: { email: true }
    });
    const dbEmailSet = new Set(existingEmailsInDb.map(e => e.email.toLowerCase()));

    const existingEmpIdsInDb = await prisma.employee.findMany({
      where: { companyId: user.companyId, employeeId: { in: csvEmpIds } },
      select: { employeeId: true }
    });
    const dbEmpIdSet = new Set(existingEmpIdsInDb.map(e => e.employeeId));

    const existingDepts = await prisma.department.findMany({
      where: { companyId: user.companyId, name: { in: csvDeptNames } }
    });
    const deptMap = new Map<string, string>();
    existingDepts.forEach(d => deptMap.set(d.name.toLowerCase(), d.id));

    const existingPositions = await prisma.position.findMany({
      where: {
        department: {
          companyId: user.companyId
        },
        title: { in: csvPosNames }
      }
    });
    const posMap = new Map<string, string>();
    existingPositions.forEach(p => posMap.set(`${p.departmentId}_${p.title.toLowerCase()}`, p.id));

    const successes: any[] = [];
    const failures: any[] = [];

    // Process rows sequentially to maintain accuracy of created categories
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Row number in Excel (header is row 1, 0-based index)
      
      const employeeId = row.employeeId?.trim();
      const firstName = row.firstName?.trim();
      const lastName = row.lastName?.trim();
      const email = row.email?.trim().toLowerCase();
      const phone = row.phone?.trim() || undefined; // Use undefined instead of null to match Prisma
      const dateOfJoiningStr = row.dateOfJoining?.trim();
      const departmentName = row.departmentName?.trim();
      const positionName = row.positionName?.trim();
      const salaryStr = row.salary?.trim() || row.baseSalary?.trim();

      // Validations
      if (!employeeId || !firstName || !lastName || !email || !dateOfJoiningStr) {
        failures.push({ row: rowNum, employeeId, error: 'Required fields cannot be empty' });
        continue;
      }

      if (!emailRegex.test(email)) {
        failures.push({ row: rowNum, employeeId, error: 'Invalid email address format' });
        continue;
      }

      const dateOfJoining = parseCsvDate(dateOfJoiningStr);
      if (!dateOfJoining) {
        failures.push({ row: rowNum, employeeId, error: `Invalid date format for dateOfJoining: ${dateOfJoiningStr}` });
        continue;
      }

      if (dbEmpIdSet.has(employeeId)) {
        failures.push({ row: rowNum, employeeId, error: `Employee ID ${employeeId} already exists in this company` });
        continue;
      }

      if (dbEmailSet.has(email)) {
        failures.push({ row: rowNum, employeeId, error: `Email ${email} is already registered in the system` });
        continue;
      }

      try {
        // Resolve Department & Position
        let departmentId: string | undefined = undefined;
        let positionId: string | undefined = undefined;

        if (departmentName || positionName) {
          const resolvedDeptName = departmentName || 'General';
          const keyDept = resolvedDeptName.toLowerCase();
          let deptId = deptMap.get(keyDept);
          if (!deptId) {
            const newDept = await prisma.department.create({
              data: { companyId: user.companyId, name: resolvedDeptName }
            });
            deptId = newDept.id;
            deptMap.set(keyDept, deptId);
          }
          departmentId = deptId;

          if (positionName) {
            const keyPos = `${departmentId}_${positionName.toLowerCase()}`;
            let posId = posMap.get(keyPos);
            if (!posId) {
              const newPos = await prisma.position.create({
                data: { title: positionName, departmentId }
              });
              posId = newPos.id;
              posMap.set(keyPos, posId);
            }
            positionId = posId;
          }
        }

        const salaryVal = salaryStr ? new Decimal(Number(salaryStr)) : undefined;

        // Insert employee
        const employee = await prisma.employee.create({
          data: {
            companyId: user.companyId,
            employeeId,
            firstName,
            lastName,
            email,
            phone,
            dateOfJoining,
            departmentId,
            positionId,
            salary: salaryVal,
            status: 'active'
          }
        });

        // Add to processed caches to prevent duplicates within the same file import
        dbEmpIdSet.add(employeeId);
        dbEmailSet.add(email);

        successes.push({ row: rowNum, employeeId, id: employee.id });
      } catch (err: any) {
        failures.push({ row: rowNum, employeeId, error: err.message || 'Database error occurred' });
      }
    }


    return res.json({
      success: true,
      totalRows: rows.length,
      successCount: successes.length,
      failureCount: failures.length,
      successes,
      failures
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to import employees' });
  }
};

// ==========================================
// 2. ATTENDANCE IMPORT
// ==========================================
export const importAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(401).json({ error: 'Unauthorized: User context missing' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as any[];
    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    const requiredHeaders = ['employeeId', 'date', 'checkIn', 'checkOut'];
    const headers = parsed.meta.fields || [];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({ error: `Missing required CSV columns: ${missingHeaders.join(', ')}` });
    }

    // 1. Gather all unique employeeIds from CSV for bulk lookup
    const csvEmpIds = Array.from(new Set(rows.map(r => r.employeeId?.trim()).filter(Boolean)));
    const employees = await prisma.employee.findMany({
      where: { companyId: user.companyId, employeeId: { in: csvEmpIds } },
      select: { id: true, employeeId: true }
    });
    const employeeMap = new Map(employees.map(e => [e.employeeId, e.id]));

    // 2. Bulk lookup existing attendance
    const existingAttendances = await prisma.attendance.findMany({
      where: {
        employeeId: { in: Array.from(employeeMap.values()) }
      },
      select: { id: true, employeeId: true, date: true }
    });
    const attendanceMap = new Map(existingAttendances.map(a => [
      `${a.employeeId}_${a.date.toISOString().split('T')[0]}`,
      a.id
    ]));

    const successes: any[] = [];
    const failures: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      
      const employeeId = row.employeeId?.trim();
      const dateStr = row.date?.trim();
      const checkInStr = row.checkIn?.trim();
      const checkOutStr = row.checkOut?.trim();
      const status = row.status?.trim() || 'present';

      if (!employeeId || !dateStr || !checkInStr || !checkOutStr) {
        failures.push({ row: rowNum, employeeId, error: 'Required fields cannot be empty' });
        continue;
      }

      // Resolve employee ID
      const employeeDbId = employeeMap.get(employeeId);
      if (!employeeDbId) {
        failures.push({ row: rowNum, employeeId, error: `Employee ID ${employeeId} not found in company` });
        continue;
      }

      const date = parseCsvDate(dateStr);
      if (!date) {
        failures.push({ row: rowNum, employeeId, error: `Invalid date format: ${dateStr}` });
        continue;
      }

      // Format Date purely to YYYY-MM-DDT00:00:00.000Z to store as DB Date without timezone offset issues
      const dateOnlyStr = date.toISOString().split('T')[0];
      const normalizedDate = new Date(`${dateOnlyStr}T00:00:00.000Z`);

      // Resolve checkIn & checkOut to full DateTime objects
      let checkIn: Date;
      let checkOut: Date;

      if (checkInStr.includes('T')) {
        checkIn = new Date(checkInStr);
      } else {
        checkIn = new Date(`${dateOnlyStr}T${checkInStr}:00.000Z`);
      }

      if (checkOutStr.includes('T')) {
        checkOut = new Date(checkOutStr);
      } else {
        checkOut = new Date(`${dateOnlyStr}T${checkOutStr}:00.000Z`);
      }

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        failures.push({ row: rowNum, employeeId, error: `Invalid time format for checkIn or checkOut: ${checkInStr} / ${checkOutStr}` });
        continue;
      }

      if (checkOut <= checkIn) {
        failures.push({ row: rowNum, employeeId, error: `Check-out time must be after check-in time` });
        continue;
      }

      try {
        const uniqueKey = `${employeeDbId}_${dateOnlyStr}`;
        const existingId = attendanceMap.get(uniqueKey);

        if (existingId) {
          // Update
          await prisma.attendance.update({
            where: { id: existingId },
            data: {
              checkIn,
              checkOut,
              status
            }
          });
        } else {
          // Create
          const newAtt = await prisma.attendance.create({
            data: {
              employeeId: employeeDbId,
              date: normalizedDate,
              checkIn,
              checkOut,
              status
            }
          });
          attendanceMap.set(uniqueKey, newAtt.id);
        }

        successes.push({ row: rowNum, employeeId, date: dateOnlyStr });
      } catch (err: any) {
        failures.push({ row: rowNum, employeeId, error: err.message || 'Database error occurred during upsert' });
      }
    }

    return res.json({
      success: true,
      totalRows: rows.length,
      successCount: successes.length,
      failureCount: failures.length,
      successes,
      failures
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to import attendance' });
  }
};

// ==========================================
// 3. SHIFT ROSTER IMPORT
// ==========================================
export const importShiftRoster = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(401).json({ error: 'Unauthorized: User context missing' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as any[];
    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    const requiredHeaders = ['employeeId', 'date', 'shiftName'];
    const headers = parsed.meta.fields || [];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({ error: `Missing required CSV columns: ${missingHeaders.join(', ')}` });
    }

    // 1. Bulk lookup employees
    const csvEmpIds = Array.from(new Set(rows.map(r => r.employeeId?.trim()).filter(Boolean)));
    const employees = await prisma.employee.findMany({
      where: { companyId: user.companyId, employeeId: { in: csvEmpIds } },
      select: { id: true, employeeId: true }
    });
    const employeeMap = new Map(employees.map(e => [e.employeeId, e.id]));

    // 2. Bulk lookup shifts
    const csvShiftNames = Array.from(new Set(rows.map(r => r.shiftName?.trim()).filter(Boolean)));
    const shifts = await prisma.shift.findMany({
      where: { companyId: user.companyId, name: { in: csvShiftNames } },
      select: { id: true, name: true }
    });
    const shiftMap = new Map(shifts.map(s => [s.name.toLowerCase(), s.id]));

    // 3. Bulk lookup existing rosters
    const existingRosters = await prisma.shiftRoster.findMany({
      where: {
        employeeId: { in: Array.from(employeeMap.values()) }
      },
      select: { id: true, employeeId: true, date: true }
    });
    const rosterMap = new Map(existingRosters.map(r => [
      `${r.employeeId}_${r.date.toISOString().split('T')[0]}`,
      r.id
    ]));

    const successes: any[] = [];
    const failures: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const employeeId = row.employeeId?.trim();
      const dateStr = row.date?.trim();
      const shiftName = row.shiftName?.trim();

      if (!employeeId || !dateStr || !shiftName) {
        failures.push({ row: rowNum, employeeId, error: 'Required fields cannot be empty' });
        continue;
      }

      // Resolve employee
      const employeeDbId = employeeMap.get(employeeId);
      if (!employeeDbId) {
        failures.push({ row: rowNum, employeeId, error: `Employee ID ${employeeId} not found in company` });
        continue;
      }

      // Resolve shift
      const shiftId = shiftMap.get(shiftName.toLowerCase());
      if (!shiftId) {
        failures.push({ row: rowNum, employeeId, error: `Shift name "${shiftName}" not found in company` });
        continue;
      }

      const date = parseCsvDate(dateStr);
      if (!date) {
        failures.push({ row: rowNum, employeeId, error: `Invalid date format: ${dateStr}` });
        continue;
      }

      const dateOnlyStr = date.toISOString().split('T')[0];
      const normalizedDate = new Date(`${dateOnlyStr}T00:00:00.000Z`);

      try {
        const uniqueKey = `${employeeDbId}_${dateOnlyStr}`;
        const existingId = rosterMap.get(uniqueKey);

        if (existingId) {
          // Update
          await prisma.shiftRoster.update({
            where: { id: existingId },
            data: { shiftId }
          });
        } else {
          // Create
          const newRoster = await prisma.shiftRoster.create({
            data: {
              employeeId: employeeDbId,
              shiftId,
              date: normalizedDate
            }
          });
          rosterMap.set(uniqueKey, newRoster.id);
        }

        successes.push({ row: rowNum, employeeId, date: dateOnlyStr, shiftName });
      } catch (err: any) {
        failures.push({ row: rowNum, employeeId, error: err.message || 'Database error occurred during roster upsert' });
      }
    }

    return res.json({
      success: true,
      totalRows: rows.length,
      successCount: successes.length,
      failureCount: failures.length,
      successes,
      failures
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to import shift roster' });
  }
};

// ==========================================
// 4. TEMPLATE DOWNLOADS
// ==========================================
export const downloadEmployeeTemplate = async (req: AuthRequest, res: Response) => {
  const csv = Papa.unparse([
    {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '9876543210',
      dateOfJoining: '2026-01-15',
      departmentName: 'Engineering',
      positionName: 'Software Engineer',
      salary: '80000'
    },
    {
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '9876543211',
      dateOfJoining: '2026-02-01',
      departmentName: 'Marketing',
      positionName: 'Marketing Manager',
      salary: '75000'
    }
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=employee_import_template.csv');
  return res.send(csv);
};

export const downloadAttendanceTemplate = async (req: AuthRequest, res: Response) => {
  const csv = Papa.unparse([
    {
      employeeId: 'EMP001',
      date: '2026-07-01',
      checkIn: '09:00',
      checkOut: '18:00',
      status: 'present'
    },
    {
      employeeId: 'EMP002',
      date: '2026-07-01',
      checkIn: '09:15',
      checkOut: '17:45',
      status: 'present'
    }
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance_import_template.csv');
  return res.send(csv);
};

export const downloadShiftRosterTemplate = async (req: AuthRequest, res: Response) => {
  const csv = Papa.unparse([
    {
      employeeId: 'EMP001',
      date: '2026-07-01',
      shiftName: 'General Shift'
    },
    {
      employeeId: 'EMP002',
      date: '2026-07-01',
      shiftName: 'Night Shift'
    }
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=shift_roster_import_template.csv');
  return res.send(csv);
};
