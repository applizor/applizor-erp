import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

export const createEnrollment = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!PermissionService.hasBasicPermission(req.user, 'CourseEnrollment', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for CourseEnrollment' });
        }

        const { studentId, courseId, enrollmentDate, status, progress, grade } = req.body;
        if (!studentId || !courseId) {
            return res.status(400).json({ error: 'Student ID and Course ID are required' });
        }

        const enrollment = await prisma.courseEnrollment.create({
            data: {
                companyId,
                studentId,
                courseId,
                enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : undefined,
                status: status || 'active',
                progress: progress ? parseFloat(progress) : 0.0,
                grade
            },
            include: {
                student: true,
                course: true
            }
        });

        res.status(201).json(enrollment);
    } catch (error: any) {
        console.error('Create enrollment error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Student is already enrolled in this course.' });
        }
        res.status(500).json({ error: 'Failed to create course enrollment' });
    }
};

export const updateEnrollment = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'CourseEnrollment', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for CourseEnrollment' });
        }

        const { id } = req.params;
        const { status, progress, grade, completionDate } = req.body;

        const data: any = {};
        if (status !== undefined) data.status = status;
        if (progress !== undefined) data.progress = parseFloat(progress);
        if (grade !== undefined) data.grade = grade;
        
        // Auto handle completionDate when status is marked completed
        if (status === 'completed') {
            data.completionDate = completionDate ? new Date(completionDate) : new Date();
        } else if (status === 'active') {
            data.completionDate = null;
        }

        const enrollment = await prisma.courseEnrollment.update({
            where: { id },
            data,
            include: {
                student: true,
                course: true
            }
        });

        res.json(enrollment);
    } catch (error: any) {
        console.error('Update enrollment error:', error);
        res.status(500).json({ error: 'Failed to update enrollment' });
    }
};

export const getEnrollments = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!PermissionService.hasBasicPermission(req.user, 'CourseEnrollment', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for CourseEnrollment' });
        }

        const { courseId, studentId, status } = req.query;
        const where: any = { companyId };
        if (courseId) where.courseId = courseId as string;
        if (studentId) where.studentId = studentId as string;
        if (status) where.status = status as string;

        const enrollments = await prisma.courseEnrollment.findMany({
            where,
            include: {
                student: true,
                course: true
            },
            orderBy: { enrollmentDate: 'desc' }
        });

        res.json(enrollments);
    } catch (error: any) {
        console.error('Get enrollments error:', error);
        res.status(500).json({ error: 'Failed to fetch course enrollments' });
    }
};

export const getEnrollmentById = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'CourseEnrollment', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for CourseEnrollment' });
        }

        const { id } = req.params;
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: { id },
            include: {
                student: true,
                course: true
            }
        });

        if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
        res.json(enrollment);
    } catch (error: any) {
        console.error('Get enrollment by id error:', error);
        res.status(500).json({ error: 'Failed to fetch enrollment details' });
    }
};

export const deleteEnrollment = async (req: AuthRequest, res: Response) => {
    try {
        if (!PermissionService.hasBasicPermission(req.user, 'CourseEnrollment', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for CourseEnrollment' });
        }

        const { id } = req.params;
        await prisma.courseEnrollment.delete({ where: { id } });
        res.json({ message: 'Enrollment deleted successfully' });
    } catch (error: any) {
        console.error('Delete enrollment error:', error);
        res.status(500).json({ error: 'Failed to delete enrollment' });
    }
};
