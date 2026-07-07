import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

// Trigger Candidate BGV
export const triggerBGV = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'Company not resolved' });
        const companyId = user.companyId;

        // Verify write rights
        if (!PermissionService.hasBasicPermission(req.user, 'Candidate', 'update')) {
            return res.status(403).json({ error: 'Access denied: Requires permission to manage recruitment BGV' });
        }

        const { candidateId, agencyName, notes } = req.body;

        if (!candidateId) return res.status(400).json({ error: 'Candidate ID is required' });

        const candidate = await prisma.candidate.findFirst({
            where: { id: candidateId, companyId }
        });

        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        const existing = await prisma.backgroundVerification.findUnique({
            where: { candidateId }
        });

        if (existing) {
            return res.status(400).json({ error: 'Background verification has already been initiated for this candidate' });
        }

        const bgv = await prisma.backgroundVerification.create({
            data: {
                candidateId,
                status: 'pending',
                agencyName,
                notes
            }
        });

        res.status(201).json(bgv);
    } catch (error: any) {
        console.error('Trigger BGV error:', error);
        res.status(500).json({ error: 'Failed to trigger background verification', details: error.message });
    }
};

// Update BGV Status
export const updateBGVStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'Company not resolved' });
        const companyId = user.companyId;

        if (!PermissionService.hasBasicPermission(req.user, 'Candidate', 'update')) {
            return res.status(403).json({ error: 'Access denied: Requires permission to update BGV status' });
        }

        const { id } = req.params;
        const { status, agencyName, reportUrl, notes } = req.body;

        if (!status || !['pending', 'in_progress', 'passed', 'failed'].includes(status)) {
            return res.status(400).json({ error: "Status must be 'pending', 'in_progress', 'passed', or 'failed'" });
        }

        const bgv = await prisma.backgroundVerification.findFirst({
            where: {
                id,
                candidate: { companyId }
            }
        });

        if (!bgv) return res.status(404).json({ error: 'Background verification record not found' });

        const updated = await prisma.backgroundVerification.update({
            where: { id },
            data: {
                status,
                agencyName: agencyName !== undefined ? agencyName : bgv.agencyName,
                reportUrl: reportUrl !== undefined ? reportUrl : bgv.reportUrl,
                notes: notes !== undefined ? notes : bgv.notes,
                completedAt: ['passed', 'failed'].includes(status) ? new Date() : bgv.completedAt
            }
        });

        res.json(updated);
    } catch (error: any) {
        console.error('Update BGV status error:', error);
        res.status(500).json({ error: 'Failed to update background verification status', details: error.message });
    }
};

// Initialize Onboarding Checklist
export const initializeChecklist = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'Company not resolved' });
        const companyId = user.companyId;

        if (!PermissionService.hasBasicPermission(req.user, 'Candidate', 'update')) {
            return res.status(403).json({ error: 'Access denied: Requires permission to initialize onboarding checklist' });
        }

        const { candidateId, tasks } = req.body;

        if (!candidateId) return res.status(400).json({ error: 'Candidate ID is required' });

        const candidate = await prisma.candidate.findFirst({
            where: { id: candidateId, companyId }
        });

        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        const existing = await prisma.onboardingChecklist.findUnique({
            where: { candidateId }
        });

        if (existing) {
            return res.status(400).json({ error: 'Onboarding checklist already exists for this candidate' });
        }

        const defaultTasks = [
            { id: '1', task: 'Submit ID Proof (Aadhaar/PAN/Passport)', status: 'pending', updatedAt: '' },
            { id: '2', task: 'Sign Offer Letter / Employment Agreement', status: 'pending', updatedAt: '' },
            { id: '3', task: 'Submit Bank Account Details', status: 'pending', updatedAt: '' },
            { id: '4', task: 'Complete General Orientation Session', status: 'pending', updatedAt: '' },
            { id: '5', task: 'IT Assets Setup & Email Account Setup', status: 'pending', updatedAt: '' }
        ];

        const customTasks = tasks && Array.isArray(tasks)
            ? tasks.map((t: string, idx: number) => ({
                id: String(idx + 1),
                task: t,
                status: 'pending',
                updatedAt: ''
            }))
            : defaultTasks;

        const checklist = await prisma.onboardingChecklist.create({
            data: {
                candidateId,
                items: customTasks,
                status: 'pending'
            }
        });

        res.status(201).json(checklist);
    } catch (error: any) {
        console.error('Initialize checklist error:', error);
        res.status(500).json({ error: 'Failed to initialize onboarding checklist', details: error.message });
    }
};

// Update Onboarding Checklist Task Status
export const updateChecklistTask = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'Company not resolved' });
        const companyId = user.companyId;

        if (!PermissionService.hasBasicPermission(req.user, 'Candidate', 'update')) {
            return res.status(403).json({ error: 'Access denied: Requires permission to update onboarding checklist' });
        }

        const { candidateId } = req.params;
        const { taskId, status } = req.body;

        if (!taskId || !status || !['pending', 'completed'].includes(status)) {
            return res.status(400).json({ error: "Task ID and status ('pending' or 'completed') are required" });
        }

        const checklist = await prisma.onboardingChecklist.findFirst({
            where: {
                candidateId,
                candidate: { companyId }
            }
        });

        if (!checklist) return res.status(404).json({ error: 'Onboarding checklist not found' });

        const items = (checklist.items as any[]) || [];
        const task = items.find(t => t.id === taskId);

        if (!task) return res.status(404).json({ error: `Task with ID ${taskId} not found in this checklist` });

        task.status = status;
        task.updatedAt = new Date().toISOString();

        const allCompleted = items.every(t => t.status === 'completed');

        const updated = await prisma.onboardingChecklist.update({
            where: { id: checklist.id },
            data: {
                items,
                status: allCompleted ? 'completed' : 'pending'
            }
        });

        res.json(updated);
    } catch (error: any) {
        console.error('Update checklist task error:', error);
        res.status(500).json({ error: 'Failed to update checklist task', details: error.message });
    }
};

// Retrieve Onboarding Status details
export const getOnboardingStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'Company not resolved' });
        const companyId = user.companyId;

        const { candidateId } = req.params;

        const candidate = await prisma.candidate.findFirst({
            where: { id: candidateId, companyId },
            include: {
                backgroundVerification: true,
                onboardingChecklist: true
            }
        });

        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        res.json({
            candidateId: candidate.id,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            status: candidate.status,
            backgroundVerification: candidate.backgroundVerification,
            onboardingChecklist: candidate.onboardingChecklist
        });
    } catch (error: any) {
        console.error('Get onboarding status error:', error);
        res.status(500).json({ error: 'Failed to fetch candidate onboarding details', details: error.message });
    }
};
