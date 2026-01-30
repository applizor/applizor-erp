import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';


// Create Employee (with optional User account)
export const createEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const adminUserId = req.userId;
        if (!adminUserId) return res.status(401).json({ error: 'Unauthorized' });

        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
        if (!adminUser?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        const {
            firstName,
            lastName,
            email,
            phone,
            employeeId,
            dateOfJoining,
            dateOfBirth,
            departmentId,
            positionId,
            status,
            password, // Optional: if provided, create a User account
            candidateId, // Optional: to link back to recruitment
            roleId, // Optional: Assign a Role immediately
            // Advanced Fields
            gender, bloodGroup, maritalStatus,
            currentAddress, permanentAddress,
            emergencyContact,
            bankName, accountNumber, ifscCode, panNumber, aadhaarNumber,
            // New Fields from Screenshot Request
            hourlyRate, employmentType, skills, slackMemberId,
            probationEndDate, noticePeriodStartDate, noticePeriodEndDate
        } = req.body;

        if (!firstName || !lastName || !email || !dateOfJoining) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let finalEmployeeId = employeeId;

        // Auto-generate Employee ID if not provided
        if (!finalEmployeeId) {
            const lastEmployee = await prisma.employee.findFirst({
                where: { companyId: adminUser.companyId },
                orderBy: { createdAt: 'desc' }
            });

            if (lastEmployee && lastEmployee.employeeId && lastEmployee.employeeId.startsWith('EMP-')) {
                const parts = lastEmployee.employeeId.split('-');
                if (parts.length === 2) {
                    const num = parseInt(parts[1], 10);
                    if (!isNaN(num)) {
                        finalEmployeeId = `EMP-${(num + 1).toString().padStart(4, '0')}`;
                    }
                }
            }

            if (!finalEmployeeId) {
                finalEmployeeId = 'EMP-0001';
            }
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            let newUserId = null;

            // 1. Create User if password provided
            if (password) {
                const existingUser = await tx.user.findUnique({ where: { email } });
                if (existingUser) throw new Error('User with this email already exists');

                const { hashPassword } = await import('../utils/password');
                const hashedPassword = await hashPassword(password);

                const newUser = await tx.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        firstName,
                        lastName,
                        phone,
                        companyId: adminUser.companyId,
                        // Default role could be 'employee', but roles logic handles that or permissions
                    }
                });
                newUserId = newUser.id;

                // Assign Role: Use provided roleId OR default to 'Employee' role
                let roleToAssign = roleId;

                if (!roleToAssign) {
                    const defaultRole = await tx.role.findUnique({ where: { name: 'Employee' } });
                    if (defaultRole) {
                        roleToAssign = defaultRole.id;
                    }
                }

                if (roleToAssign) {
                    await tx.userRole.create({
                        data: {
                            userId: newUserId,
                            roleId: roleToAssign
                        }
                    });
                }
            }

            const finalEmploymentType = employmentType || undefined;
            const finalSlackId = slackMemberId || undefined;

            // 2. Create Employee
            const employee = await tx.employee.create({
                data: {
                    userId: newUserId ? newUserId : undefined,
                    createdById: adminUserId ? adminUserId : undefined,
                    companyId: adminUser.companyId as string,
                    firstName,
                    lastName,
                    email,
                    phone,
                    employeeId: finalEmployeeId,
                    dateOfJoining: new Date(dateOfJoining),
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                    departmentId,
                    positionId,
                    status: status || 'active',
                    // Advanced Fields
                    gender, bloodGroup, maritalStatus,
                    currentAddress, permanentAddress,
                    emergencyContact,
                    bankName, accountNumber, ifscCode, panNumber, aadhaarNumber,
                    // New Fields
                    hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
                    employmentType: finalEmploymentType,
                    skills,
                    slackMemberId: finalSlackId,
                    probationEndDate: probationEndDate ? new Date(probationEndDate) : undefined,
                    noticePeriodStartDate: noticePeriodStartDate ? new Date(noticePeriodStartDate) : undefined,
                    noticePeriodEndDate: noticePeriodEndDate ? new Date(noticePeriodEndDate) : undefined,
                },
            });

            // 3. If linked to a candidate, update candidate status
            if (candidateId) {
                await tx.candidate.update({
                    where: { id: candidateId },
                    data: { status: 'hired', currentStage: 'Hired & Onboarded' }
                });
            }

            // 4. Auto-assign Leave Balances for the current year
            const currentYear = new Date().getFullYear();

            // Fetch all leave types
            const allLeaveTypes = await tx.leaveType.findMany();

            // Filter leave types applicable to this employee
            const applicableLeaveTypes = allLeaveTypes.filter(leaveType => {
                // Check department match
                const deptMatch = leaveType.departmentIds.length === 0 ||
                    (employee.departmentId && leaveType.departmentIds.includes(employee.departmentId));

                // Check position match
                const posMatch = leaveType.positionIds.length === 0 ||
                    (employee.positionId && leaveType.positionIds.includes(employee.positionId));

                return deptMatch && posMatch;
            });

            // Create leave balance records for applicable leave types
            if (applicableLeaveTypes.length > 0) {
                // Check if employee is in probation
                const isProbation = probationEndDate && new Date(probationEndDate) > new Date();

                const balanceData = applicableLeaveTypes.map(leaveType => {
                    let allocated = 0;

                    // Priority 1: Use probation quota if employee is in probation AND quota > 0
                    if (isProbation && leaveType.probationQuota > 0) {
                        allocated = leaveType.probationQuota;
                    }
                    // Priority 2: Monthly accrual types start at 0
                    else if (leaveType.accrualType === 'monthly') {
                        allocated = 0; // Starts at 0, accrues monthly
                    }
                    // Priority 3: Yearly Upfront - Pro-Rata Calculation
                    else {
                        const joinDate = new Date(dateOfJoining);
                        const joinYear = joinDate.getFullYear();

                        if (joinYear > currentYear) {
                            allocated = 0;
                        } else {
                            // If joined previous year, they get full quota for this year
                            if (joinYear < currentYear) {
                                allocated = leaveType.days;
                            } else {
                                // Joined THIS year - Pro Rata
                                const joinMonth = joinDate.getMonth(); // 0 = Jan, 6 = July
                                const remainingMonths = 12 - joinMonth;
                                const proRata = (leaveType.days / 12) * remainingMonths;
                                allocated = Math.round(proRata * 2) / 2; // Round to nearest 0.5
                            }
                        }
                    }

                    return {
                        employeeId: employee.id,
                        leaveTypeId: leaveType.id,
                        year: currentYear,
                        allocated,
                        used: 0,
                        carriedOver: 0
                    };
                });

                await tx.employeeLeaveBalance.createMany({
                    data: balanceData
                });
            }

            return employee;
        });

        // Audit Log
        if (result && 'id' in result) {
            const { logAction } = await import('../services/audit.service');
            await logAction(req, {
                action: 'CREATE',
                module: 'HRMS',
                entityType: 'Employee',
                entityId: result.id,
                details: `Created employee ${result.firstName} ${result.lastName} (ID: ${result.employeeId})`,
                changes: req.body
            });
        }

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Create employee error:', error);
        if (error.code === 'P2002') {
            const targets = error.meta?.target || [];
            if (targets.includes('email')) {
                return res.status(400).json({ error: 'An employee or user with this email already exists.' });
            }
            if (targets.includes('employeeId')) {
                return res.status(400).json({ error: 'This Employee ID is already assigned to another employee.' });
            }
            if (targets.includes('userId')) {
                return res.status(400).json({ error: 'This User Account is already linked to another employee.' });
            }
            return res.status(400).json({ error: 'Employee already exists with unique field mismatch.' });
        }
        res.status(500).json({ error: 'Failed to create employee', details: error.message });
    }
};


// Update Employee
export const updateEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfJoining,
            dateOfBirth,
            departmentId,
            positionId,
            status,
            gender, bloodGroup, maritalStatus,
            currentAddress, permanentAddress,
            emergencyContact,
            bankName, accountNumber, ifscCode, panNumber, aadhaarNumber,
            // New Fields
            hourlyRate, employmentType, skills, slackMemberId,
            probationEndDate, noticePeriodStartDate, noticePeriodEndDate
        } = req.body;

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                departmentId,
                positionId,
                status,
                gender, bloodGroup, maritalStatus,
                currentAddress, permanentAddress,
                emergencyContact,
                bankName, accountNumber, ifscCode, panNumber, aadhaarNumber,
                // New Fields Update
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
                employmentType,
                skills,
                slackMemberId,
                probationEndDate: probationEndDate ? new Date(probationEndDate) : null,
                noticePeriodStartDate: noticePeriodStartDate ? new Date(noticePeriodStartDate) : null,
                noticePeriodEndDate: noticePeriodEndDate ? new Date(noticePeriodEndDate) : null,
            },
            include: {
                department: true,
                position: true
            }
        });

        // Audit Log
        const { logAction } = await import('../services/audit.service');
        await logAction(req, {
            action: 'UPDATE',
            module: 'HRMS',
            entityType: 'Employee',
            entityId: id,
            details: `Updated employee ${employee.firstName} ${employee.lastName}`,
            changes: req.body
        });

        res.json(employee);
    } catch (error: any) {
        console.error('Update employee error:', error);
        if (error.code === 'P2002') {
            const targets = error.meta?.target || [];
            if (targets.includes('email')) {
                return res.status(400).json({ error: 'This email is already in use by another employee.' });
            }
            if (targets.includes('employeeId')) {
                return res.status(400).json({ error: 'This Employee ID is already assigned.' });
            }
            return res.status(400).json({ error: 'Duplicate field value.' });
        }
        res.status(500).json({ error: 'Failed to update employee', details: error.message });
    }
};

// ... (Upload Document) needs to normally exist below, but was untouched by me. But WAIT.

// Get All Employees
export const getEmployees = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        const userId = req.user.id;

        // Check if super admin (Check name AND isSystem)
        const isSuperAdmin = req.user.roles.some((ur: any) =>
            ['admin', 'super admin', 'administrator'].includes(ur.role.name.toLowerCase()) || ur.role.isSystem
        );

        // Base where clause
        const whereClause: any = {
            companyId: companyId
        };

        // --- SCOPE BASED FILTERING ---
        const scopeFilter = await PermissionService.getScopedWhereClause(
            req.user,
            'Employee',
            'read',
            'Employee',
            'createdById',
            'userId'
        );
        whereClause.AND = [scopeFilter];

        // Bypass old manual logic
        let canViewAll = true;
        let canViewOwned = false;
        let canViewAdded = false;

        if (isSuperAdmin) {
            canViewAll = true;
        } else {
            req.user.roles.forEach((ur: any) => {
                const perms = ur.role.permissions || [];
                const empPerm = perms.find((p: any) => p.module === 'Employee');
                if (empPerm) {
                    const level = empPerm.readLevel;
                    if (level === 'all') canViewAll = true;
                    if (level === 'both' || level === 'added_owned') { canViewOwned = true; canViewAdded = true; }
                    if (level === 'owned') canViewOwned = true;
                    if (level === 'added') canViewAdded = true;
                }
            });
        }

        // 2. Apply Filters
        // 2. Apply Filters
        if (!canViewAll) {
            const orConditions: any[] = [];

            // Condition 1: Owned (userId matches)
            if (canViewOwned) {
                orConditions.push({ userId: userId });
            }

            // Condition 2: Added (createdById matches)
            // CRITICAL FIX: Use RAW QUERY to bypass stale Prisma Client
            if (canViewAdded) {
                try {
                    const addedEmps: any[] = await prisma.$queryRawUnsafe(
                        `SELECT id FROM "Employee" WHERE "createdById" = $1`,
                        userId
                    );
                    const addedIds = addedEmps.map(e => e.id);

                    if (addedIds.length > 0) {
                        orConditions.push({ id: { in: addedIds } });
                    }
                } catch (e) {
                    console.warn('Failed to query createdById raw:', e);
                }
            }

            if (orConditions.length > 0) {
                whereClause.AND = [
                    { OR: orConditions }
                ];
            } else {
                return res.json([]);
            }
        }

        // Query Employees WITHOUT user relation to avoid "Unknown field" error on stale clients
        const employeesRaw = await prisma.employee.findMany({
            where: whereClause,
            include: {
                department: true,
                position: true,
                // user: true -- REMOVED to prevent crash
            },
            orderBy: { createdAt: 'desc' }
        });

        // Manual Join: Fetch Users
        const userIds = employeesRaw
            .map(e => e.userId)
            .filter(id => id); // Filter nulls

        let users: any[] = [];
        if (userIds.length > 0) {
            users = await prisma.user.findMany({
                where: { id: { in: userIds as string[] } },
                include: {
                    roles: {
                        include: {
                            role: true
                        }
                    }
                }
            });
        }

        // Map Users to Employees
        let employees = employeesRaw.map(emp => {
            const user = users.find(u => u.id === emp.userId);
            return { ...emp, user };
        });

        // In-Memory Filtering: Remove System Admins
        if (!isSuperAdmin) {
            employees = employees.filter(emp => {
                // Keep if no user
                if (!emp.user) return true;
                // Keep if NO system roles
                const hasSystemRole = emp.user.roles.some((r: any) => r.role?.isSystem);
                return !hasSystemRole;
            });
        }

        res.json(employees);
    } catch (error) {
        // ... error handling
        res.status(500).json({ error: 'Failed to fetch employees', details: (error as any).message });
    }
};

// Get Single Employee
export const getEmployeeById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                department: true,
                position: true,
                company: true,
                documents: true
            },
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employee);
    } catch (error: any) {
        console.error('Get employee error:', error);
        res.status(500).json({ error: 'Failed to fetch employee', details: error.message });
    }
};

// Upload Document for Employee
export const uploadEmployeeDocument = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params; // Employee ID
        const { type, name } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const employee = await prisma.employee.findUnique({ where: { id } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const fileUrl = `/uploads/documents/${req.file.filename}`;

        const document = await prisma.document.create({
            data: {
                companyId: employee.companyId,
                employeeId: id,
                name: name || req.file.originalname,
                type: type || 'other',
                filePath: fileUrl,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                // Personal/Standard Upload Workflow
                status: 'submitted',
                workflowType: 'standard'
            }
        });

        // Audit Log
        const { logAction } = await import('../services/audit.service');
        await logAction(req, {
            action: 'UPLOAD',
            module: 'DOCUMENT',
            entityType: 'Document',
            entityId: document.id,
            details: `Uploaded document ${document.name} for employee ${employee.firstName} ${employee.lastName}`
        });

        res.status(201).json(document);
    } catch (error: any) {
        console.error('Upload document error:', error);
        res.status(500).json({ error: 'Failed to upload document', details: error.message });
    }
};

// Delete Employee
export const deleteEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Check Delete Permission
        if (!PermissionService.hasBasicPermission(req.user, 'Employee', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights' });
        }

        const { id } = req.params;

        // 2. Check Scope
        const scopeFilter = await PermissionService.getScopedWhereClause(
            req.user, 'Employee', 'delete', 'Employee', 'createdById', 'userId'
        );
        const count = await prisma.employee.count({ where: { AND: [{ id }, scopeFilter] } });
        if (count === 0) return res.status(403).json({ error: 'Access denied: No permission to delete this record' });

        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                // @ts-ignore - Prisma Client types stale
                user: {
                    include: {
                        roles: {
                            include: {
                                role: {
                                    include: { permissions: true } // Need permissions for isSystem check
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }



        // Safeguard: Prevent deletion of System Admins
        // @ts-ignore - Prisma types might be stale regarding user relation
        const isTargetSystemAdmin = employee.user?.roles?.some((r: any) => r.role?.isSystem);
        if (isTargetSystemAdmin) {
            return res.status(403).json({ error: 'Action Forbidden: Cannot delete a System Administrator account.' });
        }

        // Delete User first (if exists) or delete employee?
        // ... (rest of logic)

        // Transaction
        await prisma.$transaction(async (tx) => {
            await tx.employee.delete({ where: { id } });
            if (employee.userId) {
                await tx.user.delete({ where: { id: employee.userId } });
            }
        });

        // Audit Log
        const { logAction } = await import('../services/audit.service');
        await logAction(req, {
            action: 'DELETE',
            module: 'HRMS',
            entityType: 'Employee',
            entityId: id,
            details: `Deleted employee record`
        });

        res.json({ message: 'Employee deleted successfully' });
    } catch (error: any) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: 'Failed to delete employee', details: error.message });
    }
};
