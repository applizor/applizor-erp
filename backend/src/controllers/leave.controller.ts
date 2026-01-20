import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { logAction } from '../services/audit.service';
import { PermissionService } from '../services/permission.service';

// Get all Leave Types
export const getLeaveTypes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'User not authenticated' });

        // Basic Read Permission check for LeaveType (Configuration)
        if (!PermissionService.hasBasicPermission(req.user, 'LeaveType', 'read')) {
            // Fallback: If they can read 'Leave', maybe they should see Types to apply?
            // Actually, usually everyone needs to see types to apply.
            // But let's stick to the request: Granular control.
            // If they don't have LeaveType read, maybe they rely on system default?
            // Let's assume for Apply Leave, we might need a bypass or specific check?
            // For now, Strict: Must have LeaveType read.
            return res.status(403).json({ error: 'Access denied' });
        }

        const isAdmin = PermissionService.hasBasicPermission(req.user, 'Leave', 'delete'); // Proxy for Admin/Manager who manages types?
        // Actually, Leave Types are "Configuration". Maybe different permission? 
        // But for now, let's assume if you can Read Leaves, you can see Leave Types (needed for dropdowns).
        // Filtering by Department/Position is business logic, not just permission.

        // If Admin (can manage types), return all?
        // If Employee, filter by scope.

        // Let's rely on Employee Record presence to determine filtering.
        const employee = await prisma.employee.findUnique({ where: { userId } });

        // If no employee record (e.g. Super Admin), return all.
        if (!employee) {
            const allTypes = await prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
            return res.json(allTypes);
        }

        // Fetch all and filter in memory (Business Logic for applicability)
        const allTypes = await prisma.leaveType.findMany({ orderBy: { name: 'asc' } });

        const applicableTypes = allTypes.filter(type => {
            const deptMatch = type.departmentIds.length === 0 || (employee.departmentId && type.departmentIds.includes(employee.departmentId));
            const posMatch = type.positionIds.length === 0 || (employee.positionId && type.positionIds.includes(employee.positionId));
            // employmentStatus check could go here too (Probation etc)

            return deptMatch && posMatch;
        });

        res.json(applicableTypes);
    } catch (error) {
        console.error('Get leave types error:', error);
        res.status(500).json({ error: 'Failed to fetch leave types' });
    }
};

// Create Leave Type
export const createLeaveType = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Strict Check: Need Create permission on 'Leave' (or separate 'Settings'?)?
        // Using 'Leave' Create might overlap with "Create Leave Request".
        // BUT 'Leave' module usually acts as the "Feature".
        // ideally, "Leave Type" Management should be restricted to Admins.
        // Let's assume user.roles includes 'Admin' or specific 'manage_leave_types' if we had it.
        // For now, let's stick to: "Update" permission on 'Leave' module implies Configuration access?
        // OR: We can use a Check for User Role 'Admin' explicitly for Configuration items if Granularity isn't enough.
        // Let's use 'update' level on 'Leave' as a proxy for "Manager" who can Config? 
        // Or better: 'delete' level usually implies Admin.

        // Safety: Let's require 'create' permission AND check if user is Admin/HR via Role Name just to be safe for Config?
        // Or just trust the Permission System: 'Leave' module permissions for 'create' might be assigned to Employees for Requests.
        // WAIT. 'Leave' module in RolePermission determines if they can Create "Leave Records" (Requests) presumably.
        // If so, we can't use the SAME permission for "Leave Type".
        // Options:
        // 1. New Module 'LeaveConfiguration'.
        // 2. Hardcoded Admin/HR check.
        // 3. 'Leave' Create permission is for Requests, 'Leave' Update/Delete is for Config? No, that's messy.

        // DECISION: Leave Types are Master Data.
        // We generally use 'Admin' role check for Master Data if no specific module exists.
        // Or, we assume 'Leave' module with 'Delete' permission = Admin.

        // Check Permission on 'LeaveType' module
        if (!PermissionService.hasBasicPermission(req.user, 'LeaveType', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for LeaveType' });
        }

        const {
            name, days, isPaid, description, frequency, carryForward,
            // Advanced
            maxCarryForward, monthlyLimit, maxConsecutiveDays, minServiceDays,
            sandwichRule, encashable, proofRequired, color,
            // Relations
            departmentIds, positionIds, employmentStatus
        } = req.body;

        const leaveType = await prisma.leaveType.create({
            data: {
                name,
                days: parseInt(days),
                isPaid,
                description,
                frequency: frequency || 'yearly',
                carryForward: carryForward !== undefined ? carryForward : true,
                // Advanced
                maxCarryForward: maxCarryForward ? parseInt(maxCarryForward) : 0,
                monthlyLimit: monthlyLimit ? parseInt(monthlyLimit) : 0,
                maxConsecutiveDays: maxConsecutiveDays ? parseInt(maxConsecutiveDays) : 0,
                minServiceDays: minServiceDays ? parseInt(minServiceDays) : 0,
                sandwichRule: sandwichRule !== undefined ? sandwichRule : false,
                encashable: encashable !== undefined ? encashable : false,
                proofRequired: proofRequired !== undefined ? proofRequired : false,
                color: color || '#3B82F6',
                // Relations
                departmentIds: departmentIds || [],
                positionIds: positionIds || [],
                employmentStatus: employmentStatus || [],
                // Dynamic Policy
                policySettings: req.body.policySettings || {}
            }
        });

        // Auto-initialize balances for all eligible employees for the current year
        const currentYear = new Date().getFullYear();

        // Find all employees matches the criteria (dept/pos)
        // If arrays are empty, it applies to ALL.
        const whereClause: any = { isActive: true };

        if (departmentIds && departmentIds.length > 0) {
            whereClause.departmentId = { in: departmentIds };
        }
        if (positionIds && positionIds.length > 0) {
            whereClause.positionId = { in: positionIds };
        }
        // ignoring employmentStatus for simplicity in this auto-seed, or add if needed

        const eligibleEmployees = await prisma.employee.findMany({
            where: whereClause,
            select: { id: true }
        });

        if (eligibleEmployees.length > 0) {
            const balanceData = eligibleEmployees.map(emp => {
                let allocated = 0;
                if (req.body.accrualType === 'monthly') {
                    allocated = 0;
                } else {
                    // Yearly - Pro Rata from NOW (Date of adding this leave type)
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const remainingMonths = 12 - currentMonth;
                    const proRata = (parseInt(days) / 12) * remainingMonths;
                    allocated = Math.round(proRata * 2) / 2;
                }

                return {
                    employeeId: emp.id,
                    leaveTypeId: leaveType.id,
                    year: currentYear,
                    allocated,
                    used: 0,
                    carriedOver: 0
                };
            });

            await prisma.employeeLeaveBalance.createMany({
                data: balanceData
            });
        }

        await logAction(req, {
            action: 'CREATE',
            module: 'LEAVE',
            entityType: 'LeaveType',
            entityId: leaveType.id,
            details: `Created Leave Type: ${leaveType.name}`,
            changes: req.body
        });

        res.status(201).json(leaveType);
    } catch (error) {
        console.error('Create leave type error:', error);
        res.status(500).json({ error: 'Failed to create leave type' });
    }
};

// Update Leave Type
export const updateLeaveType = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Leave', 'delete')) {
            return res.status(403).json({ error: 'Access denied: Requires Admin privileges' });
        }

        const { id } = req.params;
        const {
            name, days, isPaid, description, frequency, carryForward,
            // Advanced
            maxCarryForward, monthlyLimit, maxConsecutiveDays, minServiceDays,
            sandwichRule, encashable, proofRequired, color,
            // Relations
            departmentIds, positionIds, employmentStatus
        } = req.body;

        const leaveType = await prisma.leaveType.update({
            where: { id },
            data: {
                name,
                days: parseInt(days),
                isPaid,
                description,
                frequency,
                carryForward,
                // Advanced
                maxCarryForward: maxCarryForward ? parseInt(maxCarryForward) : undefined,
                monthlyLimit: monthlyLimit ? parseInt(monthlyLimit) : undefined,
                maxConsecutiveDays: maxConsecutiveDays ? parseInt(maxConsecutiveDays) : undefined,
                minServiceDays: minServiceDays ? parseInt(minServiceDays) : undefined,
                sandwichRule,
                encashable,
                proofRequired,
                color,
                // Relations
                departmentIds: departmentIds || [],
                positionIds: positionIds || [],
                employmentStatus: employmentStatus || [],
                // Accrual
                accrualType: req.body.accrualType,
                accrualRate: req.body.accrualRate ? parseFloat(req.body.accrualRate) : 0,
                maxAccrual: req.body.maxAccrual ? parseFloat(req.body.maxAccrual) : 0,
                // Dynamic Policy
                policySettings: req.body.policySettings || undefined
            }
        });

        await logAction(req, {
            action: 'UPDATE',
            module: 'LEAVE',
            entityType: 'LeaveType',
            entityId: leaveType.id,
            details: `Updated Leave Type: ${leaveType.name}`,
            changes: req.body
        });

        res.json(leaveType);
    } catch (error) {
        console.error('Update leave type error:', error);
        res.status(500).json({ error: 'Failed to update leave type' });
    }
};

// Delete Leave Type
export const deleteLeaveType = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Leave', 'delete')) {
            return res.status(403).json({ error: 'Access denied: Requires Admin privileges' });
        }

        const { id } = req.params;

        // Check if there are any leave requests using this type
        const existingUsage = await prisma.leaveRequest.count({
            where: { leaveTypeId: id }
        });

        if (existingUsage > 0) {
            return res.status(400).json({
                error: `Cannot delete this Leave Type because it is used in ${existingUsage} leave requests. Please delete the requests or archive the type instead.`
            });
        }

        await prisma.leaveType.delete({ where: { id } });

        await logAction(req, {
            action: 'DELETE',
            module: 'LEAVE',
            entityType: 'LeaveType',
            entityId: id,
            details: `Deleted Leave Type (ID: ${id})`
        });

        res.json({ message: 'Leave type deleted successfully' });
    } catch (error) {
        console.error('Delete leave type error:', error);
        res.status(500).json({ error: 'Failed to delete leave type' });
    }
};

// Apply for Leave
export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'User not authenticated' });

        // Basic Check: User must have 'Create' permission on Leave.
        // Assuming this covers "Apply for Leave".
        if (!PermissionService.hasBasicPermission(req.user, 'Leave', 'create')) {
            return res.status(403).json({ error: 'Access denied: No permission to apply for leave.' });
        }

        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ error: 'Employee record not found for this user.' });

        // Input Validation
        const { leaveTypeId, startDate, endDate, reason, durationType, attachmentPath, employeeId } = req.body;

        // Determine target employee (self or another if admin assigning)
        const targetEmployeeId = employeeId || employee.id;

        // If assigning to another employee, check for management permissions
        if (employeeId && employeeId !== employee.id) {
            if (!PermissionService.hasBasicPermission(req.user, 'Leave', 'update')) {
                return res.status(403).json({ error: 'Access denied: No permission to assign leave to others.' });
            }
        }

        const targetEmployee = employeeId ? await prisma.employee.findUnique({ where: { id: employeeId } }) : employee;
        if (!targetEmployee) return res.status(404).json({ error: 'Target employee record not found.' });

        if (!leaveTypeId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields: leaveType, startDate, or endDate.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Date Validity Check
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format provided.' });
        }

        // Logic Validation
        if (end < start) {
            return res.status(400).json({ error: 'End date cannot be before start date.' });
        }

        // Fetch Leave Type
        const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
        if (!leaveType) return res.status(404).json({ error: 'Selected Leave Type does not exist.' });

        // 0. Check Scope (Dept/Position)
        if (leaveType.departmentIds && leaveType.departmentIds.length > 0) {
            if (!employee.departmentId || !leaveType.departmentIds.includes(employee.departmentId)) {
                return res.status(403).json({ error: 'This Leave Type is not applicable to your Department.' });
            }
        }
        if (leaveType.positionIds && leaveType.positionIds.length > 0) {
            if (!employee.positionId || !leaveType.positionIds.includes(employee.positionId)) {
                return res.status(403).json({ error: 'This Leave Type is not applicable to your Position.' });
            }
        }

        // Parse dynamic policy settings
        const policySettings: any = typeof leaveType.policySettings === 'object' && leaveType.policySettings
            ? leaveType.policySettings
            : typeof leaveType.policySettings === 'string'
                ? JSON.parse(leaveType.policySettings)
                : {};

        // 0. Dynamic Policy: Advance Notice Requirement
        // Example: "2 weeks notice for > 4 days leave"
        const noticePeriod = policySettings.noticePeriod || 0; // days
        const minDaysForNotice = policySettings.minDaysForNotice || 0; // threshold

        if (noticePeriod > 0) {
            // Estimate requested duration roughly first or use logic?
            // Let's rely on date diff or assume user intention.
            // Better: We check calculatedDays later, BUT we need to check notice BEFORE processing too much?
            // Actually, notice is based on Start Date vs Application Date (Now).

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const noticeThresholdDate = new Date(today);
            noticeThresholdDate.setDate(today.getDate() + noticePeriod);

            // If start date is BEFORE the required notice date...
            if (start < noticeThresholdDate) {
                // ONLY if duration exceeds threshold. We need to know duration first.
                // So we must defer this check until calculatedDays is computed?
                // Let's compute duration first, then check.
            }
        }

        // 1. Check Probation Period (Min Service Days)
        if (leaveType.minServiceDays > 0) {
            const joiningDate = new Date(employee.dateOfJoining);
            const serviceTime = new Date().getTime() - joiningDate.getTime();
            const serviceDays = Math.floor(serviceTime / (1000 * 60 * 60 * 24));

            if (serviceDays < leaveType.minServiceDays) {
                return res.status(400).json({
                    error: `You are in probation/active service period (Served: ${serviceDays} days). Minimum ${leaveType.minServiceDays} days required for this leave type.`
                });
            }
        }

        // 2. Advanced Day Calculation (Excluding Holidays/Weekends + Sandwich Rule)
        // Fetch Holidays in this range
        const holidays = await prisma.holiday.findMany({
            where: {
                date: { gte: start, lte: end },
                isActive: true
            }
        });

        let calculatedDays = 0;
        let currentDate = new Date(start);
        const holidayDates = holidays.map(h => h.date.toDateString());

        let shiftWorkDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']; // Default
        if (employee.shiftId) {
            const shift = await prisma.shift.findUnique({ where: { id: employee.shiftId } });
            if (shift && shift.workDays) {
                // shift.workDays is Json, assuming string[]
                shiftWorkDays = shift.workDays as string[];
                // Normalize to lowercase
                shiftWorkDays = shiftWorkDays.map(d => d.toLowerCase());
            }
        }

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const includeNonWorkingDays = policySettings.includeNonWorkingDays === true;

        // Loop through dates
        while (currentDate <= end) {
            const dayName = dayNames[currentDate.getDay()];
            const isWeekend = !shiftWorkDays.includes(dayName);
            const isHoliday = holidayDates.includes(currentDate.toDateString());

            if (leaveType.sandwichRule || includeNonWorkingDays) {
                // If Sandwich Rule OR "Calendar Days" policy (Bereavement) is ON, we count everything.
                calculatedDays++;
            } else {
                // Standard: Exclude Holidays and Weekends
                if (!isWeekend && !isHoliday) {
                    calculatedDays++;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (durationType === 'first_half' || durationType === 'second_half') {
            calculatedDays = 0.5;
        }

        if (calculatedDays === 0) {
            return res.status(400).json({ error: 'Selected range contains only holidays or non-working days.' });
        }

        // --- Deferred Check: Advance Notice ---
        if (noticePeriod > 0) {
            // Logic: If calculatedDays > minDaysForNotice (e.g. 4), then Enforce Notice
            // OR if minDaysForNotice is 0, enforce for ANY duration.

            if (calculatedDays > minDaysForNotice) {
                const today = new Date();
                const minStartDate = new Date(today);
                minStartDate.setDate(today.getDate() + noticePeriod);
                // Reset time to ignore hours
                minStartDate.setHours(0, 0, 0, 0);

                // If start date is BEFORE minStartDate
                if (start < minStartDate) {
                    return res.status(400).json({
                        error: `Advance notice required. For leaves > ${minDaysForNotice} days, you must apply ${noticePeriod} days in advance.`
                    });
                }
            }
        }

        // --- Dynamic Check: Proof Requirement Threshold ---
        const minDaysForProof = policySettings.minDaysForProof || 0;
        if (leaveType.proofRequired && calculatedDays > minDaysForProof) {
            if (!attachmentPath) {
                return res.status(400).json({
                    error: `Proof (Medical/Other) is required for leaves exceeding ${minDaysForProof} days.`
                });
            }
        }

        // 3. Check Max Consecutive Days
        if (leaveType.maxConsecutiveDays > 0 && calculatedDays > leaveType.maxConsecutiveDays) {
            return res.status(400).json({
                error: `Request exceeds maximum consecutive days limit (${leaveType.maxConsecutiveDays} days).`
            });
        }

        // 4. Check Monthly Limit
        if (leaveType.monthlyLimit > 0) {
            const currentMonth = start.getMonth();
            const currentYear = start.getFullYear();
            const monthStart = new Date(currentYear, currentMonth, 1);
            const monthEnd = new Date(currentYear, currentMonth + 1, 0);

            const existingRequestsInMonth = await prisma.leaveRequest.findMany({
                where: {
                    employeeId: targetEmployee.id,
                    leaveTypeId,
                    status: { not: 'rejected' },
                    startDate: { gte: monthStart, lte: monthEnd }
                }
            });

            const totalDaysInMonth = existingRequestsInMonth.reduce((acc, req) => acc + req.days, 0);
            if (totalDaysInMonth + calculatedDays > leaveType.monthlyLimit) {
                return res.status(400).json({
                    error: `Monthly limit exceeded for ${leaveType.name}. Max allowed: ${leaveType.monthlyLimit}/month, Used: ${totalDaysInMonth}, Requesting: ${calculatedDays}.`
                });
            }
        }

        // 5. Check Quarterly Limit
        if (leaveType.quarterlyLimit && leaveType.quarterlyLimit > 0) {
            const currentYear = start.getFullYear();
            const currentMonth = start.getMonth();
            const currentQuarter = Math.floor(currentMonth / 3) + 1;
            const quarterStart = new Date(currentYear, (currentQuarter - 1) * 3, 1);
            const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);

            const existingRequestsInQuarter = await prisma.leaveRequest.findMany({
                where: {
                    employeeId: targetEmployee.id,
                    leaveTypeId,
                    status: { not: 'rejected' },
                    startDate: { gte: quarterStart, lte: quarterEnd }
                }
            });

            const totalDaysInQuarter = existingRequestsInQuarter.reduce((acc, req) => acc + req.days, 0);
            if (totalDaysInQuarter + calculatedDays > leaveType.quarterlyLimit) {
                return res.status(400).json({
                    error: `Quarterly limit exceeded for ${leaveType.name}. Max allowed: ${leaveType.quarterlyLimit}/quarter, Used: ${totalDaysInQuarter}, Requesting: ${calculatedDays}.`
                });
            }
        }

        // 6. Calculate LOP Days (Allow Overdraft)
        // Fetch current balance
        const currentYear = start.getFullYear();
        let balanceRecord = await prisma.employeeLeaveBalance.findFirst({
            where: {
                employeeId: targetEmployee.id,
                leaveTypeId: leaveTypeId,
                year: currentYear
            }
        });

        // Calculate currently available balance
        let availableBalance = 0;
        if (balanceRecord) {
            availableBalance = (balanceRecord.allocated + balanceRecord.carriedOver) - balanceRecord.used;
        }

        // Subtract pending requests to get Net Available
        const pendingReqs = await prisma.leaveRequest.findMany({
            where: {
                employeeId: targetEmployee.id,
                leaveTypeId,
                status: 'pending',
                startDate: {
                    gte: new Date(currentYear, 0, 1),
                    lte: new Date(currentYear, 11, 31)
                }
            }
        });
        const pendingDays = pendingReqs.reduce((acc, req) => acc + req.days, 0); // Note: Should we subtract pending LOP days? Ideally yes, but for now strict count.

        const netAvailable = Math.max(0, availableBalance - pendingDays);

        let lopDays = 0;
        if (calculatedDays > netAvailable) {
            lopDays = calculatedDays - netAvailable;
        }

        // Create Request
        const status = employeeId ? 'approved' : 'pending';
        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId: targetEmployee.id,
                leaveTypeId,
                startDate: start,
                endDate: durationType === 'multiple' ? end : start, // If half/full, end is same as start
                days: calculatedDays,
                lopDays: lopDays, // Store LOP days
                reason: reason || 'No reason provided',
                status: status,
                durationType: durationType || 'full',
                attachmentPath: attachmentPath || null,
                assignedBy: employeeId ? userId : null,
                category: req.body.category || null, // Capture Sick/Casual category
                approvedBy: employeeId ? userId : null,
                approvedAt: employeeId ? new Date() : null
            }
        });

        // Update balance immediately if auto-approved (admin assigned)
        if (status === 'approved') {
            const paidDays = calculatedDays - lopDays; // Only deduct paid days

            if (paidDays > 0) {
                const year = start.getFullYear();
                const existingBalance = await prisma.employeeLeaveBalance.findFirst({
                    where: {
                        employeeId: targetEmployee.id,
                        leaveTypeId: leaveTypeId,
                        year
                    }
                });

                if (existingBalance) {
                    await prisma.employeeLeaveBalance.update({
                        where: { id: existingBalance.id },
                        data: {
                            used: existingBalance.used + paidDays
                        }
                    });
                } else {
                    await prisma.employeeLeaveBalance.create({
                        data: {
                            employeeId: targetEmployee.id,
                            leaveTypeId: leaveTypeId,
                            year,
                            allocated: leaveType.days || 0,
                            used: paidDays,
                            carriedOver: 0
                        }
                    });
                }
            }
        }

        res.status(201).json(leaveRequest);
    } catch (error) {
        console.error('Create leave request error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
        res.status(500).json({ error: `Failed to create leave request: ${errorMessage}` });
    }
};

// Get My Leave Requests
export const getMyLeaveRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'User not authenticated' });

        // Basic Access Check
        if (!PermissionService.hasBasicPermission(req.user, 'Leave', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ error: 'Employee record not found' });

        const leaveRequests = await prisma.leaveRequest.findMany({
            where: { employeeId: employee.id },
            include: { leaveType: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json(leaveRequests);
    } catch (error) {
        console.error('Get my leave requests error:', error);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
};

// Get All Leave Requests (Admin/Manager)
export const getAllLeaveRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;

        // --- PERMISSION & SCOPE ---
        // 1. Get current User's Employee ID for 'Owned/Adding' scope resolution (if needed)
        const currentUserEmployee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
        const currentEmpId = currentUserEmployee?.id;

        // 2. Determine Scope
        const scope = PermissionService.getPermissionScope(req.user, 'Leave', 'read');

        if (!scope.all && !scope.owned && !scope.added) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // 3. Construct Where Clause
        const where: any = {};
        if (status) where.status = status as string;

        if (!scope.all) {
            const orConditions: any[] = [];

            // Owned Scope: See OWN requests
            if (scope.owned && currentEmpId) {
                orConditions.push({ employeeId: currentEmpId });
            }

            // Added Scope: See requests from Employees I added/manage?
            // Since 'LeaveRequest' doesn't store 'createdById' (user creates it), 
            // we rely on relationship: LeaveRequest.employee.createdById === me.
            if (scope.added) {
                orConditions.push({
                    employee: {
                        createdById: req.user.id
                    }
                });
            }

            if (orConditions.length > 0) {
                where.OR = orConditions;
            } else {
                return res.json([]); // No access
            }
        }

        const leaveRequests = await prisma.leaveRequest.findMany({
            where,
            include: {
                leaveType: true,
                employee: {
                    select: { firstName: true, lastName: true, department: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(leaveRequests);
    } catch (error) {
        console.error('Get all leave requests error:', error);
        res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
};

// Update Leave Status (Approve/Reject)
export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Requires Update permission on 'Leave' module
        // We might want to check if they have access to *this specific* request too (Scope), but 
        // usually Approvers have broad access.
        // Let's enforce Scope check implicitly via retrieval or explicit check if needed.
        // For now: Basic Update permission check.

        if (!PermissionService.hasBasicPermission(req.user, 'Leave', 'update')) {
            return res.status(403).json({ error: 'Access denied: No permission to approve/reject leaves matching criteria.' });
        }

        // Enhance: Check if user can actually SEE/MANAGE this request based on scope?
        // Ideally yes.
        const { id } = req.params;

        // Retrieve existing to check scope
        const existing = await prisma.leaveRequest.findUnique({
            where: { id },
            include: { employee: true }
        });

        if (!existing) return res.status(404).json({ error: 'Leave request not found' });

        // Check if user has scope to update this specific record
        // This is complex. Use PermissionService.getScopedWhereClause logic or re-verify.
        // Simple verification:
        const scope = PermissionService.getPermissionScope(req.user, 'Leave', 'update');
        let hasAccess = false;

        if (scope.all) hasAccess = true;
        else {
            const currentUserEmployee = await prisma.employee.findUnique({ where: { userId } });
            const currentEmpId = currentUserEmployee?.id;

            if (scope.owned && existing.employeeId === currentEmpId) hasAccess = true; // Can I approve my own? Policy... maybe? Usually No.
            if (scope.added && existing.employee.createdById === userId) hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied: You do not have permission to manage this request.' });
        }

        const { status } = req.body; // approved, rejected

        const leaveRequest = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                approvedBy: userId,
                approvedAt: new Date()
            }
        });

        // Update Leave Balance when approved
        if (status === 'approved') {
            const year = new Date(existing.startDate).getFullYear();

            // Calculate paid portion
            const paidDays = existing.days - existing.lopDays; // Subtract LOP days

            // Only update balance if there are paid days to deduct
            if (paidDays > 0) {
                // Find or create leave balance record
                const existingBalance = await prisma.employeeLeaveBalance.findFirst({
                    where: {
                        employeeId: existing.employeeId,
                        leaveTypeId: existing.leaveTypeId,
                        year
                    }
                });

                if (existingBalance) {
                    // Update existing balance - increment 'used' days by PAID amount
                    await prisma.employeeLeaveBalance.update({
                        where: { id: existingBalance.id },
                        data: {
                            used: existingBalance.used + paidDays
                        }
                    });
                } else {
                    // Create new balance record if doesn't exist
                    const leaveType = await prisma.leaveType.findUnique({
                        where: { id: existing.leaveTypeId }
                    });

                    await prisma.employeeLeaveBalance.create({
                        data: {
                            employeeId: existing.employeeId,
                            leaveTypeId: existing.leaveTypeId,
                            year,
                            allocated: leaveType?.days || 0,
                            used: paidDays,
                            carriedOver: 0
                        }
                    });
                }
            }
        }

        res.json(leaveRequest);
    } catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({ error: 'Failed to update leave status' });
    }
};

// Calculate Days (Dry Run)
export const calculateLeaveDaysValue = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'User not authenticated' });

        // Basic Auth enough?
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ error: 'Employee record not found.' });

        const { leaveTypeId, startDate, endDate } = req.body;
        if (!leaveTypeId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
            return res.status(400).json({ error: 'Invalid date range.' });
        }

        const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
        if (!leaveType) return res.status(404).json({ error: 'Leave Type not found.' });

        // Logic reused from createLeaveRequest
        // 1. Fetch Holidays
        const holidays = await prisma.holiday.findMany({
            where: { date: { gte: start, lte: end }, isActive: true }
        });

        // 2. Determine Shift Days
        let shiftWorkDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        if (employee.shiftId) {
            const shift = await prisma.shift.findUnique({ where: { id: employee.shiftId } });
            if (shift && shift.workDays) {
                // shift.workDays is likely Json/Array
                // Safe cast if possible or assume string[]
                const wd = shift.workDays as any;
                if (Array.isArray(wd)) {
                    shiftWorkDays = wd.map((d: any) => String(d).toLowerCase());
                }
            }
        }

        let calculatedDays = 0;
        let currentDate = new Date(start);
        const holidayDates = holidays.map(h => h.date.toDateString());
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const breakdown = [];

        while (currentDate <= end) {
            const dayName = dayNames[currentDate.getDay()];
            const isWeekend = !shiftWorkDays.includes(dayName);
            const isHoliday = holidayDates.includes(currentDate.toDateString());
            let type = 'working';

            if (isHoliday) type = 'holiday';
            else if (isWeekend) type = 'weekend';

            let count = 0;
            if (leaveType.sandwichRule) {
                count = 1; // Count everything
            } else {
                if (!isWeekend && !isHoliday) count = 1;
            }

            if (count > 0) calculatedDays += count;

            breakdown.push({
                date: currentDate.toISOString().split('T')[0],
                day: dayName,
                type,
                counted: count === 1
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.json({
            days: calculatedDays,
            breakdown,
            sandwichApplied: leaveType.sandwichRule
        });

    } catch (error) {
        console.error('Calculate days error:', error);
        res.status(500).json({ error: 'Failed to calculate days' });
    }
};

// Get My Leave Balances
export const getMyBalances = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Check Permission: LeaveBalance 'read' (owned or higher)
        // If they have 'Leave' read, we might allow it, but we added explicit 'LeaveBalance' module.
        // Let's rely on 'LeaveBalance' module check.
        const hasAccess = PermissionService.hasBasicPermission(req.user, 'LeaveBalance', 'read');

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied: Cannot view leave balances.' });
        }

        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ error: 'Employee record not found' });

        const rawBalances = await prisma.employeeLeaveBalance.findMany({
            where: {
                employeeId: employee.id,
                year: new Date().getFullYear() // Current year balances
            },
            include: { leaveType: true }
        });

        // Calculate derived fields
        // Pending leaves are those in 'pending' status for this leave type in current year?
        // Ideally we should query them. For now let's set 0 or do a subquery if performance allows.
        // Let's keep it simple for now.

        const currentYear = new Date().getFullYear();
        const joinDate = new Date(employee.dateOfJoining);
        const joinYear = joinDate.getFullYear();

        let effectiveMonths = 12;
        if (joinYear === currentYear) {
            effectiveMonths = 12 - joinDate.getMonth();
        } else if (joinYear > currentYear) {
            effectiveMonths = 0;
        }

        // Fetch pending requests for this employee for current year
        const pendingRequests = await prisma.leaveRequest.findMany({
            where: {
                employeeId: employee.id,
                status: 'pending',
                startDate: {
                    gte: new Date(`${currentYear}-01-01`),
                    lte: new Date(`${currentYear}-12-31`)
                }
            }
        });

        const balances = rawBalances.map(b => {
            let displayTotal = 0;

            // Check if employee is in probation
            const isProbation = employee.probationEndDate && new Date() < new Date(employee.probationEndDate);

            // Robust check: handle 'Monthly', 'monthly', 'Monthly Accrual'
            const isMonthly = b.leaveType.accrualType && b.leaveType.accrualType.toLowerCase().includes('monthly');

            // If in probation and leave type has probation quota, use that
            if (isProbation && b.leaveType.probationQuota !== undefined && b.leaveType.probationQuota !== null) {
                displayTotal = b.leaveType.probationQuota;
            } else if (isMonthly) {
                // Calculate projected total for this user
                // Using leaveType.days as base (Annual Quota)
                const annualQuota = b.leaveType.days;
                if (joinYear === currentYear) {
                    const proRata = (annualQuota / 12) * effectiveMonths;
                    displayTotal = Math.round(proRata * 2) / 2;
                    console.log(`DEBUG_PRO_RATA: Type=${b.leaveType.name}, Accrual=${b.leaveType.accrualType}, Quota=${annualQuota}, Months=${effectiveMonths}, Display=${displayTotal}`);
                } else {
                    displayTotal = annualQuota;
                }
            } else {
                // Yearly types - allocated is just the right value
                displayTotal = b.allocated + b.carriedOver;
            }

            const remaining = (isMonthly ? b.allocated : displayTotal) - b.used;

            // Calculate pending days for this specific leave type
            const pendingDays = pendingRequests
                .filter(req => req.leaveTypeId === b.leaveTypeId)
                .reduce((sum, req) => sum + req.days, 0);

            return {
                ...b,
                total: displayTotal,
                remaining: b.allocated - b.used, // Remaining is always (Allocrued/Assigned - Used)
                pending: pendingDays
            };
        });

        res.json(balances);
    } catch (error: any) {
        console.error('Get my balances error:', error);
        res.status(500).json({ error: 'Failed to fetch leave balances', details: error.message, stack: error.stack });
    }
};

// Get All Balances (HR/Admin)
export const getAllBalances = async (req: AuthRequest, res: Response) => {
    try {
        const { departmentId, employeeId, year } = req.query;
        const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

        // Check Permissions
        console.log('getAllBalances: Checking permissions for user', req.user?.id);
        const scope = PermissionService.getPermissionScope(req.user, 'LeaveBalance', 'read');
        console.log('getAllBalances: Scope', scope);

        if (!scope.all && !scope.owned && !scope.added) {
            console.log('getAllBalances: Access denied');
            return res.status(403).json({ error: 'Access denied' });
        }

        const where: any = { year: currentYear };
        if (departmentId) where.employee = { departmentId: String(departmentId) };
        if (employeeId) where.employeeId = String(employeeId);

        console.log('getAllBalances: Initial where', where);

        if (!scope.all) {
            const orConditions: any[] = [];
            const currentUserEmployee = await prisma.employee.findUnique({ where: { userId: req.user.id } });

            console.log('getAllBalances: Current Employee', currentUserEmployee?.id);

            if (scope.owned && currentUserEmployee) {
                // If scope is 'owned', they can only see their own balances
                orConditions.push({ employeeId: currentUserEmployee.id });
            }
            if (scope.added) {
                orConditions.push({ employee: { createdById: req.user.id } });
            }

            if (orConditions.length > 0) {
                where.OR = orConditions;
            } else {
                return res.json([]);
            }
        }

        console.log('getAllBalances: Final where', JSON.stringify(where));

        const rawBalances = await prisma.employeeLeaveBalance.findMany({
            where,
            include: {
                leaveType: true,
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        dateOfJoining: true, // Needed for pro-rata
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: [
                { employee: { firstName: 'asc' } },
                { leaveType: { name: 'asc' } }
            ]
        });

        const balances = rawBalances.map(b => {
            // Robust check: handle 'Monthly', 'monthly', 'Monthly Accrual'
            const isMonthly = b.leaveType.accrualType && b.leaveType.accrualType.toLowerCase().includes('monthly');
            let displayTotal = 0;

            if (isMonthly) {
                const annualQuota = b.leaveType.days;
                if (b.employee && b.employee.dateOfJoining) {
                    const joinDate = new Date(b.employee.dateOfJoining);
                    const joinYear = joinDate.getFullYear();

                    let effectiveMonths = 12;
                    if (joinYear === currentYear) {
                        effectiveMonths = 12 - joinDate.getMonth();
                    } else if (joinYear > currentYear) {
                        effectiveMonths = 0;
                    }

                    if (joinYear === currentYear) {
                        const proRata = (annualQuota / 12) * effectiveMonths;
                        displayTotal = Math.round(proRata * 2) / 2;
                    } else {
                        displayTotal = annualQuota;
                    }
                } else {
                    displayTotal = annualQuota; // Fallback
                }
            } else {
                displayTotal = b.allocated + b.carriedOver;
            }

            const remaining = (isMonthly ? b.allocated : displayTotal) - b.used;
            return {
                ...b,
                total: displayTotal,
                remaining,
                pending: 0
            };
        });

        res.json(balances);

    } catch (error) {
        console.error('Get all balances error:', error);
        res.status(500).json({ error: 'Failed to fetch balances' });
    }
};

// Upload Leave Attachment
export const uploadAttachment = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return the relative path for database storage
        const filePath = `uploads/leaves/${req.file.filename}`;
        res.json({ filePath });
    } catch (error) {
        console.error('Upload attachment error:', error);
        res.status(500).json({ error: 'Failed to upload attachment' });
    }
};

