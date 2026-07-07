import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

// Submit Resignation
export const submitResignation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) {
            return res.status(400).json({ error: 'User does not belong to a company' });
        }

        const employeeId = user.employee?.id;
        if (!employeeId) {
            return res.status(400).json({ error: 'User does not have an employee profile' });
        }

        // Check if employee is already inactive
        if (user.employee?.status === 'inactive') {
            return res.status(400).json({ error: 'Employee is already inactive/exited' });
        }

        // Check if there is an existing exit record
        const existing = await prisma.exitDetail.findFirst({
            where: { employeeId }
        });

        if (existing) {
            return res.status(400).json({ error: 'Resignation has already been submitted' });
        }

        const { resignationDate, lastWorkingDay, reason } = req.body;

        if (!resignationDate || !lastWorkingDay) {
            return res.status(400).json({ error: 'Resignation date and last working day are required' });
        }

        const initialClearance = {
            IT: { status: 'pending', clearedBy: null, clearedAt: null, notes: '' },
            HR: { status: 'pending', clearedBy: null, clearedAt: null, notes: '' },
            Finance: { status: 'pending', clearedBy: null, clearedAt: null, notes: '' },
            Admin: { status: 'pending', clearedBy: null, clearedAt: null, notes: '' }
        };

        const exitDetail = await prisma.exitDetail.create({
            data: {
                employeeId,
                resignationDate: new Date(resignationDate),
                lastWorkingDay: new Date(lastWorkingDay),
                reason,
                clearanceDetails: initialClearance,
                fnfStatus: 'pending',
                assetRecoveryStatus: 'pending'
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true
                    }
                }
            }
        });

        res.status(201).json(exitDetail);
    } catch (error: any) {
        console.error('Submit resignation error:', error);
        res.status(500).json({ error: 'Failed to submit resignation', details: error.message });
    }
};

// Retrieve resignation / exit requests list
export const getExitDetails = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) return res.status(400).json({ error: 'Company not resolved' });
        const companyId = user.companyId;

        const scope = PermissionService.getPermissionScope(req.user, 'Employee', 'read');
        const employeeId = user.employee?.id;

        let whereClause: any = {};

        if (scope.all) {
            whereClause = {
                employee: { companyId }
            };
        } else {
            if (!employeeId) return res.status(400).json({ error: 'Employee profile not found' });
            whereClause = { employeeId };
        }

        const exits = await prisma.exitDetail.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        status: true,
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(exits);
    } catch (error: any) {
        console.error('Get exit details error:', error);
        res.status(500).json({ error: 'Failed to fetch exit records', details: error.message });
    }
};

// Clear department NOC
export const clearDepartmentNOC = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!user?.companyId) return res.status(400).json({ error: 'Company not resolved' });
        const companyId = user.companyId;

        // Verify write rights
        if (!PermissionService.hasBasicPermission(req.user, 'Employee', 'update')) {
            return res.status(403).json({ error: 'Access denied: Requires permission to process exit clearance' });
        }

        const { id } = req.params;
        const { department, status, notes } = req.body;

        if (!department || !['IT', 'HR', 'Finance', 'Admin'].includes(department)) {
            return res.status(400).json({ error: "Department must be one of 'IT', 'HR', 'Finance', 'Admin'" });
        }

        if (!status || !['cleared', 'pending', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "Status must be 'cleared', 'pending', or 'rejected'" });
        }

        const exitDetail = await prisma.exitDetail.findFirst({
            where: {
                id,
                employee: { companyId }
            }
        });

        if (!exitDetail) return res.status(404).json({ error: 'Exit record not found' });

        const clearance = (exitDetail.clearanceDetails as any) || {};
        clearance[department] = {
            status,
            clearedBy: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || user.email,
            clearedAt: new Date().toISOString(),
            notes: notes || ''
        };

        const allCleared = (
            clearance.IT?.status === 'cleared' &&
            clearance.HR?.status === 'cleared' &&
            clearance.Finance?.status === 'cleared' &&
            clearance.Admin?.status === 'cleared'
        );

        await prisma.$transaction(async (tx) => {
            await tx.exitDetail.update({
                where: { id },
                data: {
                    clearanceDetails: clearance,
                    assetRecoveryStatus: clearance.IT?.status === 'cleared' ? 'recovered' : 'pending',
                    fnfStatus: allCleared ? 'completed' : 'pending'
                }
            });

            if (allCleared) {
                await tx.employee.update({
                    where: { id: exitDetail.employeeId },
                    data: {
                        status: 'inactive',
                        exitDate: exitDetail.lastWorkingDay
                    }
                });
            }
        });

        const updated = await prisma.exitDetail.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        status: true
                    }
                }
            }
        });

        res.json({
            message: `Department ${department} clearance updated successfully`,
            exitDetail: updated
        });
    } catch (error: any) {
        console.error('Clear department NOC error:', error);
        res.status(500).json({ error: 'Failed to update clearance NOC', details: error.message });
    }
};

// Generate finalized NOC Confirmation PDF/Data
export const generateNOCConfirmation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'Company not resolved' });
        const companyId = user.companyId;

        const exitDetail = await prisma.exitDetail.findFirst({
            where: {
                id,
                employee: { companyId }
            },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        dateOfJoining: true,
                        department: { select: { name: true } },
                        position: { select: { title: true } }
                    }
                }
            }
        });

        if (!exitDetail) return res.status(404).json({ error: 'Exit record not found' });

        if (exitDetail.fnfStatus !== 'completed') {
            return res.status(400).json({ error: 'NOC confirmation cannot be generated until all departments clear the exit requests' });
        }

        const companyInfo = await prisma.company.findUnique({ where: { id: companyId } });

        const nocPayload = {
            nocNumber: `NOC-${exitDetail.employee.employeeId}-${new Date(exitDetail.lastWorkingDay).getFullYear()}`,
            employeeName: `${exitDetail.employee.firstName} ${exitDetail.employee.lastName}`,
            employeeId: exitDetail.employee.employeeId,
            department: exitDetail.employee.department?.name || 'N/A',
            designation: exitDetail.employee.position?.title || 'N/A',
            dateOfJoining: exitDetail.employee.dateOfJoining,
            lastWorkingDay: exitDetail.lastWorkingDay,
            companyName: companyInfo?.name || 'Applizor ERP Tenant',
            status: 'CLEARED_AND_RELEASED',
            clearanceLogs: exitDetail.clearanceDetails,
            issuedAt: new Date().toISOString()
        };

        res.json(nocPayload);
    } catch (error: any) {
        console.error('Generate NOC error:', error);
        res.status(500).json({ error: 'Failed to generate digital NOC document', details: error.message });
    }
};
