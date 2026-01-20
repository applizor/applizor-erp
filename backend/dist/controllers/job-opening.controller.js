"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJobOpening = exports.getPublicJobOpenings = exports.updateJobOpening = exports.getJobOpeningById = exports.getJobOpenings = exports.createJobOpening = void 0;
const client_1 = require("@prisma/client");
const permission_service_1 = require("../services/permission.service");
const prisma = new client_1.PrismaClient();
// Create Job Opening
const createJobOpening = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Recruitment' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User/Company not found' });
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
    }
    catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Failed to create job opening' });
    }
};
exports.createJobOpening = createJobOpening;
// Get All Job Openings (for Company)
const getJobOpenings = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User/Company not found' });
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
    }
    catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch job openings' });
    }
};
exports.getJobOpenings = getJobOpenings;
// Get Single Job
const getJobOpeningById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'read')) {
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
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    }
    catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};
exports.getJobOpeningById = getJobOpeningById;
// Update Job
const updateJobOpening = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'update')) {
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
    }
    catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ error: 'Failed to update job' });
    }
};
exports.updateJobOpening = updateJobOpening;
// Public: Get Jobs by Company ID
const getPublicJobOpenings = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get public jobs error:', error);
        res.status(500).json({ error: 'Failed to fetch public jobs' });
    }
};
exports.getPublicJobOpenings = getPublicJobOpenings;
// Delete Job
const deleteJobOpening = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Recruitment' });
        }
        const { id } = req.params;
        await prisma.jobOpening.delete({ where: { id } });
        res.json({ message: 'Job opening deleted' });
    }
    catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
};
exports.deleteJobOpening = deleteJobOpening;
//# sourceMappingURL=job-opening.controller.js.map