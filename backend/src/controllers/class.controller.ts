import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

export const createClass = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!PermissionService.hasBasicPermission(req.user, 'OnlineClass', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for OnlineClass' });
        }

        const { courseId, title, description, schedule, meetingUrl, status } = req.body;
        if (!courseId || !title || !schedule) {
            return res.status(400).json({ error: 'Course, title, and schedule date/time are required' });
        }

        const onlineClass = await prisma.onlineClass.create({
            data: {
                companyId,
                courseId,
                title,
                description,
                schedule: new Date(schedule),
                meetingUrl,
                status: status || 'scheduled'
            },
            include: {
                course: true
            }
        });

        res.status(201).json(onlineClass);
    } catch (error: any) {
        console.error('Create class error:', error);
        res.status(500).json({ error: 'Failed to create online class schedule' });
    }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'OnlineClass', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for OnlineClass' });
        }

        const { id } = req.params;
        const { title, description, schedule, meetingUrl, status } = req.body;

        const onlineClass = await prisma.onlineClass.update({
            where: { id },
            data: {
                title,
                description,
                schedule: schedule ? new Date(schedule) : undefined,
                meetingUrl,
                status
            },
            include: {
                course: true
            }
        });

        res.json(onlineClass);
    } catch (error: any) {
        console.error('Update class error:', error);
        res.status(500).json({ error: 'Failed to update online class schedule' });
    }
};

export const getClasses = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!PermissionService.hasBasicPermission(req.user, 'OnlineClass', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for OnlineClass' });
        }

        const { courseId, status } = req.query;
        const where: any = { companyId };
        if (courseId) where.courseId = courseId as string;
        if (status) where.status = status as string;

        const classes = await prisma.onlineClass.findMany({
            where,
            include: {
                course: true
            },
            orderBy: { schedule: 'asc' }
        });

        res.json(classes);
    } catch (error: any) {
        console.error('Get classes error:', error);
        res.status(500).json({ error: 'Failed to fetch online classes' });
    }
};

export const getClassById = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'OnlineClass', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for OnlineClass' });
        }

        const { id } = req.params;
        const onlineClass = await prisma.onlineClass.findUnique({
            where: { id },
            include: {
                course: true
            }
        });

        if (!onlineClass) return res.status(404).json({ error: 'Online class schedule not found' });
        res.json(onlineClass);
    } catch (error: any) {
        console.error('Get class by id error:', error);
        res.status(500).json({ error: 'Failed to fetch online class details' });
    }
};

export const deleteClass = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'OnlineClass', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for OnlineClass' });
        }

        const { id } = req.params;
        await prisma.onlineClass.delete({ where: { id } });
        res.json({ message: 'Online class schedule deleted successfully' });
    } catch (error: any) {
        console.error('Delete class error:', error);
        res.status(500).json({ error: 'Failed to delete online class' });
    }
};
