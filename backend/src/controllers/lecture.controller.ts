import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { PermissionService } from '../services/permission.service';

const prisma = new PrismaClient();

// Get lectures for a specific course
export const getLectures = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if student
        const isStudent = user.roles?.some((r: any) => r.role?.name.toLowerCase() === 'student');
        let studentId = '';

        if (isStudent) {
            const student = await prisma.student.findFirst({
                where: { userId: user.id, companyId: user.companyId }
            });
            if (!student) {
                return res.status(403).json({ error: 'Student profile not found' });
            }
            studentId = student.id;

            // Check if enrolled
            const enrollment = await prisma.courseEnrollment.findFirst({
                where: { studentId, courseId }
            });
            if (!enrollment) {
                return res.status(403).json({ error: 'You are not enrolled in this course' });
            }
        } else {
            // Check basic permission for non-students
            if (!PermissionService.hasBasicPermission(user, 'Lecture', 'read')) {
                return res.status(403).json({ error: 'Access denied: No read rights for Lecture' });
            }
        }

        // Fetch lectures ordered by 'order' asc
        const lectures = await prisma.lecture.findMany({
            where: {
                courseId,
                companyId: user.companyId,
                ...(isStudent ? { isActive: true } : {}) // Students only see active lectures
            },
            orderBy: {
                order: 'asc'
            }
        });

        // If student, attach completion status
        if (isStudent && studentId) {
            const progress = await prisma.lectureProgress.findMany({
                where: {
                    studentId,
                    lecture: { courseId }
                }
            });

            const completedMap = new Map(progress.map(p => [p.lectureId, p.completed]));

            const mappedLectures = lectures.map(l => ({
                ...l,
                completed: completedMap.get(l.id) ?? false
            }));

            return res.json(mappedLectures);
        }

        return res.json(lectures);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to fetch lectures' });
    }
};

// Create a new lecture
export const createLecture = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!PermissionService.hasBasicPermission(user, 'Lecture', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Lecture' });
        }

        const { courseId, title, description, videoUrl, content, order, isActive } = req.body;

        if (!courseId || !title) {
            return res.status(400).json({ error: 'Course ID and Title are required' });
        }

        const lecture = await prisma.lecture.create({
            data: {
                companyId: user.companyId,
                courseId,
                title,
                description,
                videoUrl,
                content,
                order: order ?? 0,
                isActive: isActive ?? true
            }
        });

        return res.status(201).json(lecture);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to create lecture' });
    }
};

// Update a lecture
export const updateLecture = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!PermissionService.hasBasicPermission(user, 'Lecture', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Lecture' });
        }

        const { title, description, videoUrl, content, order, isActive } = req.body;

        // Verify the lecture belongs to this company
        const existing = await prisma.lecture.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Lecture not found' });
        }

        const updated = await prisma.lecture.update({
            where: { id },
            data: {
                title,
                description,
                videoUrl,
                content,
                order: order ?? undefined,
                isActive: isActive ?? undefined
            }
        });

        return res.json(updated);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to update lecture' });
    }
};

// Delete a lecture
export const deleteLecture = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!PermissionService.hasBasicPermission(user, 'Lecture', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Lecture' });
        }

        // Verify company ownership
        const existing = await prisma.lecture.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Lecture not found' });
        }

        await prisma.lecture.delete({
            where: { id }
        });

        return res.json({ message: 'Lecture deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to delete lecture' });
    }
};

// Mark a lecture complete (or toggle status)
export const completeLecture = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { completed } = req.body; // boolean

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get student record
        const student = await prisma.student.findFirst({
            where: { userId: user.id, companyId: user.companyId }
        });
        if (!student) {
            return res.status(403).json({ error: 'Only student profiles can update lecture progress' });
        }

        const lecture = await prisma.lecture.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!lecture) {
            return res.status(404).json({ error: 'Lecture not found' });
        }

        // Upsert progress
        const isCompleted = completed ?? true;
        await prisma.lectureProgress.upsert({
            where: {
                studentId_lectureId: {
                    studentId: student.id,
                    lectureId: id
                }
            },
            update: {
                completed: isCompleted,
                completedAt: isCompleted ? new Date() : null
            },
            create: {
                studentId: student.id,
                lectureId: id,
                completed: isCompleted,
                completedAt: isCompleted ? new Date() : null
            }
        });

        // Re-calculate course enrollment progress percentage
        const courseId = lecture.courseId;
        const total = await prisma.lecture.count({
            where: { courseId, isActive: true, companyId: user.companyId }
        });

        const completedCount = await prisma.lectureProgress.count({
            where: {
                studentId: student.id,
                completed: true,
                lecture: { courseId, isActive: true }
            }
        });

        const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        await prisma.courseEnrollment.updateMany({
            where: { studentId: student.id, courseId },
            data: { progress: progressPercent }
        });

        return res.json({ success: true, progress: progressPercent, completed: isCompleted });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to update progress' });
    }
};
