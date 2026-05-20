import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

export const createCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!PermissionService.hasBasicPermission(req.user, 'Course', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Course' });
        }

        const { courseCode, title, description, duration, syllabus, fees, isActive } = req.body;
        if (!courseCode || !title) {
            return res.status(400).json({ error: 'Course code and title are required' });
        }

        const course = await prisma.course.create({
            data: {
                companyId,
                courseCode,
                title,
                description,
                duration,
                syllabus,
                fees: fees ? parseFloat(fees) : null,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json(course);
    } catch (error: any) {
        console.error('Create course error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A course with this code already exists.' });
        }
        res.status(500).json({ error: 'Failed to create course' });
    }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Course', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Course' });
        }

        const { id } = req.params;
        const { courseCode, title, description, duration, syllabus, fees, isActive } = req.body;

        const course = await prisma.course.update({
            where: { id },
            data: {
                courseCode,
                title,
                description,
                duration,
                syllabus,
                fees: fees !== undefined ? (fees ? parseFloat(fees) : null) : undefined,
                isActive
            }
        });

        res.json(course);
    } catch (error: any) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
};

export const getCourses = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!PermissionService.hasBasicPermission(req.user, 'Course', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Course' });
        }

        const courses = await prisma.course.findMany({
            where: { companyId },
            include: {
                enrollments: {
                    select: { id: true }
                },
                _count: {
                    select: { enrollments: true, classes: true }
                }
            },
            orderBy: { courseCode: 'asc' }
        });

        res.json(courses);
    } catch (error: any) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

export const getCourseById = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Course', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Course' });
        }

        const { id } = req.params;
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                classes: {
                    orderBy: { schedule: 'asc' }
                },
                enrollments: {
                    include: {
                        student: true
                    }
                }
            }
        });

        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json(course);
    } catch (error: any) {
        console.error('Get course by id error:', error);
        res.status(500).json({ error: 'Failed to fetch course details' });
    }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'Course', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Course' });
        }

        const { id } = req.params;
        await prisma.course.delete({ where: { id } });
        res.json({ message: 'Course deleted successfully' });
    } catch (error: any) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
};
