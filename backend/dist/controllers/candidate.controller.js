"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCandidate = exports.updateCandidateStatus = exports.getCandidateById = exports.getCandidates = exports.createCandidate = void 0;
const client_1 = require("@prisma/client");
const permission_service_1 = require("../services/permission.service");
const prisma = new client_1.PrismaClient();
// Create a new candidate (Apply)
const createCandidate = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // Candidates are part of Recruitment module
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Recruitment' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User/Company not found' });
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
    }
    catch (error) {
        console.error('Create candidate error:', error);
        res.status(500).json({ error: 'Failed to create candidate' });
    }
};
exports.createCandidate = createCandidate;
// Get all candidates with filters
const getCandidates = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { jobOpeningId, status, email } = req.query;
        const where = {};
        if (jobOpeningId)
            where.jobOpeningId = jobOpeningId;
        if (status)
            where.status = status;
        if (email)
            where.email = { contains: email, mode: 'insensitive' };
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
    }
    catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
};
exports.getCandidates = getCandidates;
// Get a single candidate by ID
const getCandidateById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'read')) {
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
    }
    catch (error) {
        console.error('Get candidate error:', error);
        res.status(500).json({ error: 'Failed to fetch candidate' });
    }
};
exports.getCandidateById = getCandidateById;
// Update candidate status
const updateCandidateStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'update')) {
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
    }
    catch (error) {
        console.error('Update candidate status error:', error);
        res.status(500).json({ error: 'Failed to update candidate status' });
    }
};
exports.updateCandidateStatus = updateCandidateStatus;
// Delete a candidate
const deleteCandidate = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!permission_service_1.PermissionService.hasBasicPermission(req.user, 'Recruitment', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Recruitment' });
        }
        const { id } = req.params;
        await prisma.candidate.delete({
            where: { id },
        });
        res.json({ message: 'Candidate deleted successfully' });
    }
    catch (error) {
        console.error('Delete candidate error:', error);
        res.status(500).json({ error: 'Failed to delete candidate' });
    }
};
exports.deleteCandidate = deleteCandidate;
//# sourceMappingURL=candidate.controller.js.map