import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { PermissionService } from '../services/permission.service';
import { PerformanceService } from '../services/performance.service';

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

        res.json(exit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to initiate exit' });
    }
};

export const getFnFStatement = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId } = req.params;
        const statement = await PerformanceService.calculateFnF(employeeId);
        res.json(statement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate FnF' });
    }
};
