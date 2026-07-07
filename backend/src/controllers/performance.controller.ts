import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';
import { PerformanceService } from '../services/performance.service';
import { notifyPerformanceReview, notifyExitInitiated } from '../services/email.service';

export const createOKR = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, startDate, endDate, keyResults, employeeId } = req.body;
        const companyId = req.user!.companyId;

        if (!PermissionService.hasBasicPermission(req.user, 'OKR', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const okr = await prisma.oKR.create({
            data: {
                companyId,
                employeeId,
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                keyResults: {
                    create: keyResults.map((kr: any) => ({
                        title: kr.title,
                        targetValue: Number(kr.targetValue),
                        startValue: Number(kr.startValue || 0),
                        unit: kr.unit
                    }))
                }
            },
            include: { keyResults: true }
        });

        // Auto-calculate progress
        PerformanceService.updateOKRProgress(okr.id).catch(err => console.error('OKR progress update error:', err));

        res.json(okr);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to create OKR', details: error.message });
    }
};

export const getOKRs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { employeeId } = req.query;

        if (!PermissionService.hasBasicPermission(req.user, 'OKR', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const okrs = await prisma.oKR.findMany({
            where: {
                companyId,
                ...(employeeId ? { employeeId: employeeId as string } : {})
            },
            include: { keyResults: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json(okrs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch OKRs' });
    }
};

export const createPerformanceReview = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId, reviewDate, rating, feedback, goals } = req.body;
        const companyId = req.user!.companyId;
        const reviewerId = req.userId;
        if (!reviewerId) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(req.user, 'Performance', 'create')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const review = await prisma.performanceReview.create({
            data: {
                companyId,
                employeeId,
                reviewerId,
                reviewDate: new Date(reviewDate),
                rating: Number(rating),
                feedback,
                goals,
                status: 'submitted'
            }
        });

        res.json(review);

        // Notify Employee
        try {
            const employee = await prisma.employee.findUnique({
                where: { id: employeeId },
                select: { email: true, firstName: true }
            });
            if (employee?.email) {
                await notifyPerformanceReview(review, employee);
            }
        } catch (emailError) {
            console.error('Failed to send performance review email:', emailError);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create review' });
    }
};

export const initiateExit = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId, resignationDate, lastWorkingDay, reason } = req.body;

        if (!PermissionService.hasBasicPermission(req.user, 'Employee', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const exit = await prisma.exitDetail.create({
            data: {
                employeeId,
                resignationDate: new Date(resignationDate),
                lastWorkingDay: new Date(lastWorkingDay),
                reason,
                fnfStatus: 'pending'
            }
        });

        // Update employee status
        await prisma.employee.update({
            where: { id: employeeId },
            data: { status: 'resigned' }
        });

        // Notify Employee
        try {
            const employee = await prisma.employee.findUnique({
                where: { id: employeeId },
                select: { email: true, firstName: true }
            });
            if (employee?.email) {
                await notifyExitInitiated(employee, new Date(lastWorkingDay));
            }
        } catch (emailError) {
            console.error('Failed to send exit initiation email:', emailError);
        }

        res.json(exit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to initiate exit' });
    }
};

export const getFnFStatement = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId } = req.params;
        const companyId = req.user!.companyId;
        const statement = await PerformanceService.calculateFnF(employeeId, companyId);
        res.json(statement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate FnF' });
    }
};

export const createReviewCycle = async (req: AuthRequest, res: Response) => {
    try {
        const { name, period, startDate, endDate, description } = req.body;
        const companyId = req.user!.companyId;

        const cycle = await prisma.performanceReviewCycle.create({
            data: { companyId, name, period, startDate: new Date(startDate), endDate: new Date(endDate), description, status: 'active' }
        });

        res.status(201).json(cycle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create review cycle' });
    }
};

export const listReviewCycles = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const cycles = await prisma.performanceReviewCycle.findMany({
            where: { companyId },
            orderBy: { startDate: 'desc' }
        });
        res.json(cycles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list review cycles' });
    }
};

export const closeReviewCycle = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const cycle = await prisma.performanceReviewCycle.findFirst({ where: { id, companyId } });
        if (!cycle) return res.status(404).json({ error: 'Cycle not found' });

        // Close all pending reviews in this cycle
        await prisma.performanceReview.updateMany({
            where: { cycleId: id, status: 'pending' },
            data: { status: 'closed' }
        });

        await prisma.performanceReviewCycle.update({
            where: { id },
            data: { status: 'closed' }
        });

        res.json({ message: 'Review cycle closed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to close review cycle' });
    }
};
