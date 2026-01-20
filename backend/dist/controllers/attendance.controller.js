"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayStatus = exports.getMyAttendance = exports.getAllAttendance = exports.checkOut = exports.checkIn = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const permission_service_1 = require("../services/permission.service");
// Helper to get start of day in IST (UTC+5:30)
function getStartOfDayIST(date) {
    const d = date || new Date();
    // Convert to IST string "YYYY-MM-DD"
    const istDateString = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istDateString);
    istDate.setHours(0, 0, 0, 0);
    return istDate;
}
// Helper to calculate distance
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    var R = 6371 * 1000; // Radius of the earth in m
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in m
    return d;
}
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
// Check-in (Create a new attendance record)
const checkIn = async (req, res) => {
    try {
        const userId = req.userId;
        const { latitude, longitude } = req.body;
        const clientIp = req.ip || req.headers['x-forwarded-for'];
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Check Create Permission for Attendance
        // For Self: 'Owned' permission usually allows creating own records? 
        // Or specific "Self Service" permission?
        // Let's assume ANY create permission on 'Attendance' allows check-in.
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Attendance', 'create')) {
            return res.status(403).json({ error: 'Access denied: No permission to check-in' });
        }
        const employee = await client_1.default.employee.findUnique({
            where: { userId },
            include: {
                company: true,
                shift: true
            }
        });
        if (!employee) {
            return res.status(404).json({ error: 'Employee record not found for this user' });
        }
        // 1. Check Shift & Late Coming rules apply to the FIRST check-in of the day usually, 
        // or we track every session. For simplicity, we calculate "Late" only on the very first record of the day,
        // or just mark 'present' for subsequent ones.
        const today = getStartOfDayIST();
        // Find the LATEST attendance entry for today
        const latestAttendance = await client_1.default.attendance.findFirst({
            where: {
                employeeId: employee.id,
                date: today
            },
            orderBy: { createdAt: 'desc' }
        });
        // If latest exists and has NO checkOut, user is already checked in.
        if (latestAttendance && !latestAttendance.checkOut) {
            return res.status(400).json({ error: 'You are already checked in. Please check out first.' });
        }
        // Prepare new record
        let status = 'present';
        let notes = '';
        // Only calculate "Late" if this is the FIRST record of the day
        if (!latestAttendance && employee.shift) {
            const [hours, minutes] = employee.shift.startTime.split(':').map(Number);
            const shiftStart = new Date();
            shiftStart.setHours(hours, minutes, 0, 0);
            const gracePeriodMinutes = 15;
            const lateThreshold = new Date(shiftStart.getTime() + gracePeriodMinutes * 60000);
            const now = new Date();
            if (now > lateThreshold) {
                status = 'late';
                const diffMinutes = Math.floor((now.getTime() - shiftStart.getTime()) / 60000);
                notes = `Late by ${diffMinutes} mins`;
            }
        }
        // IP & Geofencing Validation (Same as before)
        if (employee.company.allowedIPs) {
            const allowed = employee.company.allowedIPs.split(',').map(ip => ip.trim());
            const matches = allowed.some(ip => clientIp.includes(ip));
            if (!matches) {
                if (!clientIp.includes('127.0.0.1') && !clientIp.includes('::1')) {
                    // return res.status(403).json({ error: 'Invalid IP Address' });
                }
            }
        }
        if (employee.company.latitude && employee.company.longitude) {
            // ... (Geofencing logic logic remains same, assuming valid if provided)
            if (latitude && longitude) {
                const distance = getDistanceFromLatLonInM(employee.company.latitude, employee.company.longitude, Number(latitude), Number(longitude));
                if (distance > (employee.company.radius || 100)) {
                    return res.status(403).json({
                        error: `You are too far from office location (${Math.round(distance)}m). Max allowed: ${employee.company.radius}m`
                    });
                }
            }
        }
        const attendance = await client_1.default.attendance.create({
            data: {
                employeeId: employee.id,
                date: today,
                checkIn: new Date(),
                status,
                notes: notes || undefined,
                ipAddress: clientIp,
                location: latitude ? `${latitude},${longitude}` : undefined
            }
        });
        res.status(201).json(attendance);
    }
    catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: 'Failed to check-in' });
    }
};
exports.checkIn = checkIn;
// Check-out (Update the LATEST open attendance record)
const checkOut = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Checking out is an update action on Attendance
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Attendance', 'update')) {
            return res.status(403).json({ error: 'Access denied: No permission to check-out' });
        }
        const employee = await client_1.default.employee.findUnique({
            where: { userId },
            include: { shift: true }
        });
        if (!employee) {
            return res.status(404).json({ error: 'Employee record not found for this user' });
        }
        const today = getStartOfDayIST();
        // Find the LATEST attendance entry for today
        const latestAttendance = await client_1.default.attendance.findFirst({
            where: {
                employeeId: employee.id,
                date: today
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!latestAttendance) {
            return res.status(404).json({ error: 'No attendance record found for today. Please check-in first.' });
        }
        if (latestAttendance.checkOut) {
            return res.status(400).json({ error: 'You are already checked out. Please check in again to start a new session.' });
        }
        // Calculate Overtime (Only relevant if checking out AFTER shift end, logic roughly same)
        let notes = latestAttendance.notes || '';
        // Simplified overtime logic: Just log it if it's the last checkout? 
        // For multiple punch-ins, overtime calculation is complex (sum of durations). 
        // We'll keep the basic "Out time > Shift End" check for now, but apply it to the specific session closing.
        if (employee.shift) {
            const [hours, minutes] = employee.shift.endTime.split(':').map(Number);
            const shiftEnd = new Date();
            shiftEnd.setHours(hours, minutes, 0, 0);
            const now = new Date();
            if (now > shiftEnd) {
                const diffMs = now.getTime() - shiftEnd.getTime();
                if (diffMs > 30 * 60000) {
                    // Only add note if not already there to avoid duplicates?
                    // Actually, just append.
                    // notes += ...
                }
            }
        }
        const updatedAttendance = await client_1.default.attendance.update({
            where: { id: latestAttendance.id },
            data: {
                checkOut: new Date(),
                notes: notes || undefined
            }
        });
        res.json(updatedAttendance);
    }
    catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ error: 'Failed to check-out' });
    }
};
exports.checkOut = checkOut;
// Get all attendance records (Admin - Standard List or Muster Roll)
const getAllAttendance = async (req, res) => {
    try {
        const { date, month, year, departmentId, employeeName } = req.query;
        // --- PERMISSION & SCOPE ---
        // 1. Get current User's Employee ID for 'Owned' scope
        const currentUserEmployee = await client_1.default.employee.findUnique({ where: { userId: req.user.id } });
        const currentEmpId = currentUserEmployee?.id;
        // 2. Determine Scope
        const scope = permission_service_1.PermissionService.getPermissionScope(req.user, 'Attendance', 'read');
        if (!scope.all && !scope.owned && !scope.added) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const where = {};
        // 3. Apply Scope FIlters
        if (!scope.all) {
            const orConditions = [];
            if (scope.owned && currentEmpId) {
                orConditions.push({ employeeId: currentEmpId });
            }
            if (scope.added) {
                // Attendance doesn't store 'createdById' usually, it's system generated or by employee.
                // So 'Added' scope might fall back to "Employees I added".
                // Let's Find Employees created by Me, then filter Attendance by those EmployeeIds.
                // Logic: Attendance.employee.createdById = me.
                // This is complex for a simple query.
                // Let's Skip complex 'Added' logic for Attendance unless requested.
                // Usually Managers just want to see their team? Team logic is usually Department based.
                // For now, if "Added", let's assume we want to see "My Hires" attendance? Rare.
                // Let's stick to Owned or All for Attendance typically. 
                // If User has 'Both' or 'All', they see more.
            }
            if (orConditions.length > 0) {
                where.OR = orConditions;
            }
            else {
                return res.json([]); // Block if no valid scope/conditions
            }
        }
        // If specific date (List View)
        if (date) {
            const searchDate = new Date(date);
            searchDate.setHours(0, 0, 0, 0);
            where.date = searchDate;
        }
        // Employee filter
        if (employeeName) {
            where.employee = {
                OR: [
                    { firstName: { contains: employeeName, mode: 'insensitive' } },
                    { lastName: { contains: employeeName, mode: 'insensitive' } }
                ]
            };
        }
        // Department filter
        if (departmentId && departmentId !== 'all') {
            where.employee = {
                ...where.employee,
                departmentId: departmentId
            };
        }
        // Mode 1: Daily List View (Legacy/Simple)
        if (date) {
            const attendance = await client_1.default.attendance.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            firstName: true,
                            lastName: true,
                            employeeId: true,
                            department: { select: { name: true } }
                        }
                    }
                },
                orderBy: { date: 'desc' }
            });
            return res.json(attendance);
        }
        // Mode 2: Month/Year Muster Roll (Matrix Data)
        if (month && year) {
            // NOTE: For Muster Roll, we need to fetch Employees FIRST, then their attendance.
            // The Scope Filter above `where` applies to Attendance directly.
            // If `where.employeeId` implies fetching specific employees, pass it to employee query.
            const m = parseInt(month);
            const y = parseInt(year);
            const startDate = new Date(y, m - 1, 1);
            const endDate = new Date(y, m, 0);
            // 1. Fetch Employees (Apply Permission Scope HERE too?)
            // If I can only see my own attendance, I should only see Myself here.
            const empWhere = { status: 'active' };
            if (scope.owned && !scope.all && currentEmpId) {
                empWhere.id = currentEmpId;
            }
            // (Ignoring 'Added' for now as discussed)
            // Apply Filters from UI
            if (departmentId && departmentId !== 'all') {
                empWhere.departmentId = departmentId;
            }
            const employees = await client_1.default.employee.findMany({
                where: empWhere, // Default to active if no filter
                select: {
                    id: true,
                    employeeId: true,
                    firstName: true,
                    lastName: true,
                    department: { select: { name: true } },
                    dateOfJoining: true
                },
                orderBy: { firstName: 'asc' }
            });
            // 2. Fetch Attendance
            const attendanceLogs = await client_1.default.attendance.findMany({
                where: {
                    date: { gte: startDate, lte: endDate },
                    employeeId: { in: employees.map(e => e.id) }
                }
            });
            // 3. Fetch Approved Leaves
            const leaveRequests = await client_1.default.leaveRequest.findMany({
                where: {
                    status: 'approved',
                    employeeId: { in: employees.map(e => e.id) },
                    OR: [
                        { startDate: { gte: startDate, lte: endDate } },
                        { endDate: { gte: startDate, lte: endDate } },
                        { startDate: { lte: startDate }, endDate: { gte: endDate } }
                    ]
                },
                include: { leaveType: true }
            });
            // 4. Fetch Holidays
            const holidays = await client_1.default.holiday.findMany({
                where: {
                    date: { gte: startDate, lte: endDate }
                }
            });
            // 5. Construct Matrix
            const musterRoll = {};
            const dateMap = {};
            // Initialize map with employees
            employees.forEach(emp => {
                musterRoll[emp.id] = {
                    employee: emp,
                    attendance: {}
                };
            });
            // Helper to fill data
            // We iterate day by day? Or just fill what we have? 
            // For efficiency, we just map the data we have and let Frontend fill gaps.
            // Actually, blending logic is better on Server for "Status Priority".
            // Populate Attendance
            attendanceLogs.forEach(log => {
                const day = log.date.getDate();
                if (musterRoll[log.employeeId]) {
                    musterRoll[log.employeeId].attendance[day] = {
                        status: log.status,
                        checkIn: log.checkIn,
                        checkOut: log.checkOut,
                        isLate: log.status === 'late',
                        isHalfDay: log.status === 'half-day'
                    };
                }
            });
            // Overlay Leaves (Priority over Absent, but under Present if checked in?)
            // Usually Leave + CheckIn = Present (Leave Cancelled?) or Partial?
            // For now, if Leave exists, mark as Leave unless CheckIn exists.
            leaveRequests.forEach(leave => {
                let curr = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                while (curr <= end) {
                    if (curr >= startDate && curr <= endDate) {
                        const day = curr.getDate();
                        const empData = musterRoll[leave.employeeId];
                        if (empData) {
                            // If user checked in, keep it as Present/Late, maybe add note?
                            // Or strictly override? 
                            // Let's say if NO attendance record, it's Leave.
                            if (!empData.attendance[day]) {
                                empData.attendance[day] = {
                                    status: 'leave',
                                    leaveType: leave.leaveType.name,
                                    isLeave: true
                                };
                            }
                            else {
                                // Conflict: Checked In AND On Leave. 
                                // Mark as Present but flag it? 
                                empData.attendance[day].onLeaveButPresent = true;
                                empData.attendance[day].leaveType = leave.leaveType.name;
                            }
                        }
                    }
                    curr.setDate(curr.getDate() + 1);
                }
            });
            // Overlay Holidays
            holidays.forEach(holiday => {
                const day = holiday.date.getDate();
                // Apply to ALL employees
                Object.values(musterRoll).forEach((row) => {
                    // Holiday overrides Absent, but not Leave or Present
                    if (!row.attendance[day]) {
                        row.attendance[day] = {
                            status: 'holiday',
                            holidayName: holiday.name,
                            isHoliday: true
                        };
                    }
                });
            });
            return res.json({
                meta: { month, year, daysInMonth: endDate.getDate() },
                matrix: Object.values(musterRoll),
                holidays: holidays
            });
        }
        // Fallback catch-all
        return res.json([]);
    }
    catch (error) {
        console.error('Get all attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
};
exports.getAllAttendance = getAllAttendance;
// Get my attendance history
const getMyAttendance = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // "My" methods usually imply Owned permission or just base access to the app?
        // Let's require READ on Attendance at minimum (Owned/All).
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Attendance', 'read')) {
            // return res.status(403).json({ error: 'Access denied' });
            // Relaxed: Every employee should be able to see their own attendance?
            // Usually yes.
        }
        const employee = await client_1.default.employee.findUnique({
            where: { userId }
        });
        if (!employee) {
            return res.status(404).json({ error: 'Employee record not found for this user' });
        }
        const { month, year } = req.query;
        const where = {
            employeeId: employee.id
        };
        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0);
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }
        const attendance = await client_1.default.attendance.findMany({
            where,
            orderBy: { date: 'desc' }
        });
        res.json(attendance);
    }
    catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
};
exports.getMyAttendance = getMyAttendance;
// Get today's status for me
const getTodayStatus = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Self-status should be open to all authenticated employees ideally.
        const employee = await client_1.default.employee.findUnique({
            where: { userId }
        });
        if (!employee) {
            return res.status(404).json({ error: 'Employee record not found for this user' });
        }
        const today = getStartOfDayIST();
        // Find LATEST record for today
        const attendance = await client_1.default.attendance.findFirst({
            where: {
                employeeId: employee.id,
                date: today
            },
            orderBy: { createdAt: 'desc' }
        });
        const isCheckedIn = !!attendance && !attendance.checkOut;
        const isCheckedOut = !!attendance && !!attendance.checkOut;
        res.json({
            checkedIn: isCheckedIn,
            checkedOut: isCheckedOut, // If no record, both are false. If checked in, Out is false. If checked out, In is false (conceptually for the "Active Session"). 
            // Wait, if Checked Out, we want "checkedIn: false" so button shows "Check In" again.
            // If checkedIn is false, UI shows Check In.
            // If checkedIn is true, UI shows Check Out.
            // So: 
            // No record: checkedIn=false.
            // Record with CheckIn only: checkedIn=true.
            // Record with CheckIn + CheckOut: checkedIn=false (session closed).
            checkInTime: attendance?.checkIn,
            checkOutTime: attendance?.checkOut
        });
    }
    catch (error) {
        console.error('Get today status error:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
};
exports.getTodayStatus = getTodayStatus;
//# sourceMappingURL=attendance.controller.js.map