import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

// Create Student (with optional User account)
export const createStudent = async (req: AuthRequest, res: Response) => {
    try {
        const adminUserId = req.userId;
        if (!adminUserId) return res.status(401).json({ error: 'Unauthorized' });

        const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
        if (!adminUser?.companyId) return res.status(400).json({ error: 'User does not belong to a company' });

        if (!PermissionService.hasBasicPermission(req.user, 'Student', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Student' });
        }

        const {
            firstName,
            lastName,
            email,
            phone,
            studentId,
            dateOfBirth,
            status,
            password, // Optional: if provided, create a User account
            roleId, // Optional: Custom Role ID for student user (defaults to finding Student/Employee role)
            employeeId // Optional: Link existing employee
        } = req.body;

        let finalFirstName = firstName;
        let finalLastName = lastName;
        let finalEmail = email;
        let finalPhone = phone;
        let finalDOB = dateOfBirth;
        let linkedUserId = null;

        if (employeeId) {
            const employee = await prisma.employee.findUnique({
                where: { id: employeeId }
            });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Verify they don't already have a student profile
            const existingStudent = await prisma.student.findFirst({
                where: {
                    OR: [
                        { email: employee.email },
                        ...(employee.userId ? [{ userId: employee.userId }] : [])
                    ]
                }
            });
            if (existingStudent) {
                return res.status(400).json({ error: 'This employee is already onboarded as a student.' });
            }

            finalFirstName = employee.firstName;
            finalLastName = employee.lastName;
            finalEmail = employee.email;
            finalPhone = employee.phone || undefined;
            finalDOB = employee.dateOfBirth ? employee.dateOfBirth.toISOString().split('T')[0] : undefined;
            linkedUserId = employee.userId;
        }

        if (!finalFirstName || !finalLastName || !finalEmail) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let finalStudentId = studentId;

        // Auto-generate Student ID if not provided
        if (!finalStudentId) {
            const lastStudent = await prisma.student.findFirst({
                where: { companyId: adminUser.companyId },
                orderBy: { createdAt: 'desc' }
            });

            if (lastStudent && lastStudent.studentId && lastStudent.studentId.startsWith('STU-')) {
                const parts = lastStudent.studentId.split('-');
                if (parts.length === 2) {
                    const num = parseInt(parts[1], 10);
                    if (!isNaN(num)) {
                        finalStudentId = `STU-${(num + 1).toString().padStart(4, '0')}`;
                    }
                }
            }

            if (!finalStudentId) {
                finalStudentId = 'STU-0001';
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            let newUserId = linkedUserId;

            if (!newUserId && password) {
                const existingUser = await tx.user.findUnique({ where: { email: finalEmail } });
                if (existingUser) throw new Error('User with this email already exists');

                const { hashPassword } = await import('../utils/password');
                const hashedPassword = await hashPassword(password);

                const newUser = await tx.user.create({
                    data: {
                        email: finalEmail,
                        password: hashedPassword,
                        firstName: finalFirstName,
                        lastName: finalLastName,
                        phone: finalPhone,
                        companyId: adminUser.companyId,
                    }
                });
                newUserId = newUser.id;

                // Update employee with user link
                if (employeeId) {
                    await tx.employee.update({
                        where: { id: employeeId },
                        data: { userId: newUserId }
                    });
                }

                let roleToAssign = roleId;
                if (!roleToAssign) {
                    const defaultRole = await tx.role.findFirst({ 
                        where: { 
                            name: { in: ['Student', 'student', 'Employee'] } 
                        } 
                    });
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

            const student = await tx.student.create({
                data: {
                    userId: newUserId,
                    companyId: adminUser.companyId as string,
                    studentId: finalStudentId,
                    firstName: finalFirstName,
                    lastName: finalLastName,
                    email: finalEmail,
                    phone: finalPhone,
                    dateOfBirth: finalDOB ? new Date(finalDOB) : null,
                    status: status || 'active'
                }
            });

            return student;
        });

        // Audit Log
        if (result && 'id' in result) {
            const { logAction } = await import('../services/audit.service');
            await logAction(req, {
                action: 'CREATE',
                module: 'Student',
                entityType: 'Student',
                entityId: result.id,
                details: `Created student ${result.firstName} ${result.lastName} (ID: ${result.studentId})`,
                changes: req.body
            });
        }

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Create student error:', error);
        if (error.code === 'P2002') {
            const targets = error.meta?.target || [];
            if (targets.includes('email')) {
                return res.status(400).json({ error: 'A student or user with this email already exists.' });
            }
            if (targets.includes('studentId')) {
                return res.status(400).json({ error: 'This Student ID is already assigned.' });
            }
            return res.status(400).json({ error: 'Student already exists with unique field mismatch.' });
        }
        res.status(500).json({ error: error.message || 'Failed to create student' });
    }
};

// Update Student
export const updateStudent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Student', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Student' });
        }

        const { id } = req.params;
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            status,
            password,
            roleId,
            createAccount,
            portalActive
        } = req.body;

        const existing = await prisma.student.findFirst({
            where: { id, companyId: req.user!.companyId }
        });
        if (!existing) return res.status(404).json({ error: 'Student not found' });

        const student = await prisma.student.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                status
            }
        });

        if (createAccount !== undefined || password || roleId || portalActive !== undefined) {
            await prisma.$transaction(async (tx) => {
                const currentStudent = await tx.student.findUnique({
                    where: { id },
                    include: { user: true }
                });

                if (!currentStudent) throw new Error('Student not found');

                let targetUserId = currentStudent.userId;

                if (!targetUserId && createAccount && password) {
                    const existingUser = await tx.user.findUnique({ where: { email: currentStudent.email } });
                    if (existingUser) throw new Error('A user account with this email already exists.');

                    const { hashPassword } = await import('../utils/password');
                    const hashedPassword = await hashPassword(password);

                    const newUser = await tx.user.create({
                        data: {
                            email: currentStudent.email,
                            password: hashedPassword,
                            firstName: currentStudent.firstName,
                            lastName: currentStudent.lastName,
                            phone: currentStudent.phone,
                            companyId: currentStudent.companyId,
                            isActive: true
                        }
                    });
                    targetUserId = newUser.id;

                    await tx.student.update({
                        where: { id },
                        data: { userId: targetUserId }
                    });
                }

                if (targetUserId) {
                    const userData: any = {};
                    if (password) {
                        const { hashPassword } = await import('../utils/password');
                        userData.password = await hashPassword(password);
                    }
                    if (portalActive !== undefined) {
                        userData.isActive = portalActive;
                    }

                    if (Object.keys(userData).length > 0) {
                        await tx.user.update({
                            where: { id: targetUserId },
                            data: userData
                        });
                    }

                    if (roleId) {
                        await tx.userRole.deleteMany({ where: { userId: targetUserId } });
                        await tx.userRole.create({
                            data: {
                                userId: targetUserId,
                                roleId: roleId
                            }
                        });
                    }
                }
            });
        }

        // Audit Log
        const { logAction } = await import('../services/audit.service');
        await logAction(req, {
            action: 'UPDATE',
            module: 'Student',
            entityType: 'Student',
            entityId: id,
            details: `Updated student ${student.firstName} ${student.lastName}`,
            changes: req.body
        });

        res.json(student);
    } catch (error: any) {
        console.error('Update student error:', error);
        res.status(500).json({ error: error.message || 'Failed to update student' });
    }
};

// Get All Students
export const getStudents = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!PermissionService.hasBasicPermission(req.user, 'Student', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Student' });
        }

        const students = await prisma.student.findMany({
            where: { companyId },
            include: {
                user: {
                    select: {
                        isActive: true,
                        roles: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
                enrollments: {
                    include: {
                        course: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(students);
    } catch (error: any) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

// Get Student by ID
export const getStudentById = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Student', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Student' });
        }

        const { id } = req.params;
        const student = await prisma.student.findFirst({
            where: { id, companyId: req.user!.companyId },
            include: {
                user: true,
                enrollments: {
                    include: {
                        course: true
                    }
                },
                certificates: true
            }
        });

        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (error: any) {
        console.error('Get student by id error:', error);
        res.status(500).json({ error: 'Failed to fetch student profile' });
    }
};

// Delete Student
export const deleteStudent = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Student', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Student' });
        }

        const { id } = req.params;
        const student = await prisma.student.findFirst({
            where: { id, companyId: req.user!.companyId }
        });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        await prisma.$transaction(async (tx) => {
            await tx.student.delete({ where: { id } });
            if (student.userId) {
                await tx.user.delete({ where: { id: student.userId } });
            }
        });

        // Audit Log
        const { logAction } = await import('../services/audit.service');
        await logAction(req, {
            action: 'DELETE',
            module: 'Student',
            entityType: 'Student',
            entityId: id,
            details: `Deleted student ${student.firstName} ${student.lastName}`
        });

        res.json({ message: 'Student deleted successfully' });
    } catch (error: any) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
};
