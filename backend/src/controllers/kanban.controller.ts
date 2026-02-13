import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { emitToCompany } from '../socket';
import { PermissionService } from '../services/permission.service';

const prisma = new PrismaClient();

// Get Kanban Board Data (Candidates grouped by stage)
export const getKanbanBoard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Permission Check
        if (!PermissionService.hasBasicPermission(req.user, 'RecruitmentBoard', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for RecruitmentBoard' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User/Company not found' });

        const candidates = await prisma.candidate.findMany({
            where: { companyId: user.companyId },
            include: {
                jobOpening: {
                    select: { title: true }
                },
                interviews: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 1
                }
            }
        });

        // Helper for consistent status checking
        const checkStatus = (c: any, status: string) => c.status?.toLowerCase() === status.toLowerCase();

        // Group by stage
        const board = {
            'Applied': candidates.filter(c => checkStatus(c, 'applied')),
            'Screening': candidates.filter(c => checkStatus(c, 'screening')),
            'Interview': candidates.filter(c => checkStatus(c, 'interview') || c.currentStage?.toLowerCase().includes('interview')),
            'Offer': candidates.filter(c => checkStatus(c, 'offer')),
            'Hired': candidates.filter(c => checkStatus(c, 'hired')),
            'Rejected': candidates.filter(c => checkStatus(c, 'rejected'))
        };

        res.json(board);
    } catch (error) {
        console.error('Get kanban error:', error);
        res.status(500).json({ error: 'Failed to fetch kanban board' });
    }
};

// Update Candidate Stage (Drag & Drop)
export const updateCandidateStage = async (req: AuthRequest, res: Response) => {
    try {
        // Permission Check for Board Drag & Drop
        if (!PermissionService.hasBasicPermission(req.user, 'RecruitmentBoard', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for RecruitmentBoard' });
        }

        const { candidateId } = req.params;
        const { stage, status } = req.body; // stage: 'Screening', 'Interview'; status: 'Active', 'Rejected'

        // 1. Update Candidate & Fetch Job Details
        const candidate = await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                currentStage: stage,
                status: status || (stage === 'Hired' ? 'hired' : 'active')
            },
            include: {
                jobOpening: true
            }
        });

        // 2. Auto-Convert to Employee if Hired
        if (stage === 'Hired' && candidate.status === 'hired') {
            // Check for existing employee to match email
            const existingEmp = await prisma.employee.findFirst({
                where: { email: candidate.email }
            });

            if (!existingEmp) {
                // A. Generate Employee ID
                let finalEmployeeId = 'EMP-0001';
                // Safe check for companyId
                const companyId = req.user?.companyId || candidate.companyId;

                const lastEmployee = await prisma.employee.findFirst({
                    where: { companyId },
                    orderBy: { createdAt: 'desc' }
                });

                if (lastEmployee?.employeeId?.startsWith('EMP-')) {
                    const parts = lastEmployee.employeeId.split('-');
                    if (parts.length === 2) {
                        const num = parseInt(parts[1], 10);
                        if (!isNaN(num)) {
                            finalEmployeeId = `EMP-${(num + 1).toString().padStart(4, '0')}`;
                        }
                    }
                }

                // B. Find Department & Position by name match
                let deptId: string | null = null;
                let posId: string | null = null;

                if (candidate.jobOpening?.department) {
                    const dept = await prisma.department.findFirst({
                        where: {
                            companyId,
                            name: { equals: candidate.jobOpening.department, mode: 'insensitive' }
                        }
                    });
                    if (dept) deptId = dept.id;
                }

                if (candidate.jobOpening?.position) {
                    const pos = await prisma.position.findFirst({
                        where: {
                            department: { companyId },
                            title: { equals: candidate.jobOpening.position, mode: 'insensitive' }
                        }
                    });
                    if (pos) posId = pos.id;
                }

                // C. Create Employee
                await prisma.employee.create({
                    data: {
                        companyId,
                        firstName: candidate.firstName,
                        lastName: candidate.lastName,
                        email: candidate.email,
                        phone: candidate.phone,
                        employeeId: finalEmployeeId,
                        dateOfJoining: new Date(),
                        status: 'active',
                        departmentId: deptId,
                        positionId: posId,
                        candidateId: candidate.id
                    }
                });
            }
        }

        // Emit real-time update
        if (req.user?.companyId) {
            emitToCompany(req.user.companyId, 'recruitment:candidate-moved', {
                candidateId,
                stage,
                status: candidate.status,
                candidate: {
                    id: candidate.id,
                    firstName: candidate.firstName,
                    lastName: candidate.lastName,
                    currentStage: stage,
                    status: candidate.status
                }
            });
        }

        res.json(candidate);
    } catch (error) {
        console.error('Update stage error:', error);
        res.status(500).json({ error: 'Failed to update candidate stage' });
    }
};
