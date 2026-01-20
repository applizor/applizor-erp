import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { PermissionService } from '../services/permission.service';

const prisma = new PrismaClient();

// Create Job Opening
export const createJobOpening = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Recruitment' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User/Company not found' });

        const { title, department, position, description, requirements, status } = req.body;

        const job = await prisma.jobOpening.create({
            data: {
                companyId: user.companyId,
                title,
                department,
                position,
                description,
                requirements,
                status: status || 'open'
            }
        });

        res.status(201).json(job);
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Failed to create job opening' });
    }
};

// Get All Job Openings (for Company)
export const getJobOpenings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User/Company not found' });

        const jobs = await prisma.jobOpening.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { candidates: true }
                }
            }
        });

        res.json(jobs);
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch job openings' });
    }
};

// Get Single Job
export const getJobOpeningById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { id } = req.params;
        const job = await prisma.jobOpening.findUnique({
            where: { id },
            include: {
                candidates: {
                    select: { id: true, firstName: true, lastName: true, status: true }
                }
            }
        });

        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};

// Update Job
export const updateJobOpening = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Recruitment' });
        }

        const { id } = req.params;
        const { title, department, position, description, requirements, status } = req.body;

        const job = await prisma.jobOpening.update({
            where: { id },
            data: {
                title, department, position, description, requirements, status
            }
        });

        res.json(job);
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
};

// Public: Get Jobs by Company ID
export const getPublicJobOpenings = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;

        const jobs = await prisma.jobOpening.findMany({
            where: {
                companyId,
                status: 'open'
            },
            orderBy: { createdAt: 'desc' }
        });

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });

        res.json({ company: company?.name, jobs });
    } catch (error) {
        console.error('Get public jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch public jobs' });
    }
};

// Delete Job
export const deleteJobOpening = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Recruitment', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Recruitment' });
        }

        const { id } = req.params;
        await prisma.jobOpening.delete({ where: { id } });
        res.json({ message: 'Job opening deleted' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
};
