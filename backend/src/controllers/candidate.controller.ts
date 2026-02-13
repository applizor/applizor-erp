import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { PermissionService } from '../services/permission.service';

const prisma = new PrismaClient();

// Create a new candidate (Apply)
export const createCandidate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Candidates are part of Recruitment module
        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Recruitment' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User/Company not found' });

        const { firstName, lastName, email, phone, jobOpeningId, resumePath, notes } = req.body;

        // Check if candidate already applied for this job
        if (jobOpeningId) {
            const existingApplication = await prisma.candidate.findFirst({
                where: {
                    email,
                    jobOpeningId,
                    companyId: user.companyId
                }
            });

            if (existingApplication) {
                return res.status(400).json({ error: 'Candidate has already applied for this job' });
            }
        }

        const candidate = await prisma.candidate.create({
            data: {
                companyId: user.companyId,
                firstName,
                lastName,
                email,
                phone,
                jobOpeningId,
                resumePath,
                notes,
                status: 'applied',
                currentStage: 'Applied'
            },
        });

        res.status(201).json(candidate);
    } catch (error) {
        console.error('Create candidate error:', error);
        res.status(500).json({ error: 'Failed to create candidate' });
    }
};

// Get all candidates with filters
export const getCandidates = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { jobOpeningId, status, email } = req.query;

        const where: any = {};
        if (jobOpeningId) where.jobOpeningId = jobOpeningId as string;
        if (status) where.status = status as string;
        if (email) where.email = { contains: email as string, mode: 'insensitive' };

        const candidates = await prisma.candidate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                jobOpening: {
                    select: { title: true }
                }
            }
        });

        res.json(candidates);
    } catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
};

// Get a single candidate by ID
export const getCandidateById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;

        const candidate = await prisma.candidate.findUnique({
            where: { id },
            include: {
                jobOpening: true,
                interviews: {
                    orderBy: { scheduledAt: 'asc' }
                },
                offerLetter: true
            },
        });

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.json(candidate);
    } catch (error) {
        console.error('Get candidate error:', error);
        res.status(500).json({ error: 'Failed to fetch candidate' });
    }
};

// Update candidate status
export const updateCandidateStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Recruitment' });
        }

        const { id } = req.params;
        const { status, currentStage, notes } = req.body;

        const candidate = await prisma.candidate.update({
            where: { id },
            data: {
                status,
                currentStage,
                notes
            },
        });

        res.json(candidate);
    } catch (error) {
        console.error('Update candidate status error:', error);
        res.status(500).json({ error: 'Failed to update candidate status' });
    }
};

// Update candidate details (General)
export const updateCandidate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Recruitment' });
        }

        const { id } = req.params;
        const { firstName, lastName, email, phone, jobOpeningId, notes } = req.body;

        const candidate = await prisma.candidate.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                jobOpeningId,
                notes
            },
        });

        res.json(candidate);
    } catch (error) {
        console.error('Update candidate error:', error);
        res.status(500).json({ error: 'Failed to update candidate' });
    }
};

// Delete a candidate
export const deleteCandidate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Recruitment' });
        }

        const { id } = req.params;

        await prisma.candidate.delete({
            where: { id },
        });

        res.json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error('Delete candidate error:', error);
        res.status(500).json({ error: 'Failed to delete candidate' });
    }
};
