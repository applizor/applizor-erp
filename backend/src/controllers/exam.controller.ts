import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { PermissionService } from '../services/permission.service';
import { generateCertificateNo } from './certificate.controller';

const prisma = new PrismaClient();

// Get list of exams for a course
export const getExams = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const isStudent = user.roles?.some((r: any) => r.role?.name.toLowerCase() === 'student');

        if (isStudent) {
            // Find student
            const student = await prisma.student.findFirst({
                where: { userId: user.id, companyId: user.companyId }
            });
            if (!student) {
                return res.status(403).json({ error: 'Student profile not found' });
            }

            // Check if enrolled
            const enrollment = await prisma.courseEnrollment.findFirst({
                where: { studentId: student.id, courseId }
            });
            if (!enrollment) {
                return res.status(403).json({ error: 'You are not enrolled in this course' });
            }
        } else {
            if (!PermissionService.hasBasicPermission(user, 'Exam', 'read')) {
                return res.status(403).json({ error: 'Access denied: No read rights for Exam' });
            }
        }

        const exams = await prisma.exam.findMany({
            where: {
                courseId,
                companyId: user.companyId,
                ...(isStudent ? { isActive: true } : {})
            },
            include: {
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.json(exams);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to fetch exams' });
    }
};

// Get details of a single exam (students don't get correctOption)
export const getExam = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

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
        } else {
            if (!PermissionService.hasBasicPermission(user, 'Exam', 'read')) {
                return res.status(403).json({ error: 'Access denied: No read rights for Exam' });
            }
        }

        const exam = await prisma.exam.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                questions: true,
                course: true
            }
        });

        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        if (isStudent) {
            // Verify student is enrolled in the course
            const enrollment = await prisma.courseEnrollment.findFirst({
                where: { studentId, courseId: exam.courseId }
            });
            if (!enrollment) {
                return res.status(403).json({ error: 'You are not enrolled in this course' });
            }

            // Check if student has previous submissions
            const submissions = await prisma.examSubmission.findMany({
                where: { studentId, examId: exam.id },
                orderBy: { createdAt: 'desc' }
            });

            // Strip correctOption for security in student view
            const sanitizedQuestions = exam.questions.map(q => {
                const { correctOption, ...rest } = q;
                return rest;
            });

            return res.json({
                ...exam,
                questions: sanitizedQuestions,
                submissions
            });
        }

        return res.json(exam);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to fetch exam' });
    }
};

// Create an exam
export const createExam = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!PermissionService.hasBasicPermission(user, 'Exam', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Exam' });
        }

        const { courseId, title, description, passingScore, isActive, questions } = req.body;

        if (!courseId || !title) {
            return res.status(400).json({ error: 'Course ID and Title are required' });
        }

        const exam = await prisma.exam.create({
            data: {
                companyId: user.companyId,
                courseId,
                title,
                description,
                passingScore: passingScore ?? 60.0,
                isActive: isActive ?? true
            }
        });

        // Add questions if provided
        if (questions && Array.isArray(questions)) {
            for (const q of questions) {
                await prisma.examQuestion.create({
                    data: {
                        examId: exam.id,
                        questionText: q.questionText,
                        options: q.options,
                        correctOption: q.correctOption
                    }
                });
            }
        }

        const fullExam = await prisma.exam.findUnique({
            where: { id: exam.id },
            include: { questions: true }
        });

        return res.status(201).json(fullExam);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to create exam' });
    }
};

// Update an exam (and sync questions list)
export const updateExam = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!PermissionService.hasBasicPermission(user, 'Exam', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Exam' });
        }

        const { title, description, passingScore, isActive, questions } = req.body;

        const existing = await prisma.exam.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        await prisma.exam.update({
            where: { id },
            data: {
                title,
                description,
                passingScore: passingScore ?? undefined,
                isActive: isActive ?? undefined
            }
        });

        // Sync questions list
        if (questions && Array.isArray(questions)) {
            const currentQuestions = await prisma.examQuestion.findMany({
                where: { examId: id }
            });

            const currentIds = currentQuestions.map(q => q.id);
            const incomingIds = questions.map(q => q.id).filter(Boolean);

            // Delete questions not in incoming list
            const idsToDelete = currentIds.filter(id => !incomingIds.includes(id));
            if (idsToDelete.length > 0) {
                await prisma.examQuestion.deleteMany({
                    where: { id: { in: idsToDelete } }
                });
            }

            // Create or update incoming questions
            for (const q of questions) {
                if (q.id) {
                    await prisma.examQuestion.update({
                        where: { id: q.id },
                        data: {
                            questionText: q.questionText,
                            options: q.options,
                            correctOption: q.correctOption
                        }
                    });
                } else {
                    await prisma.examQuestion.create({
                        data: {
                            examId: id,
                            questionText: q.questionText,
                            options: q.options,
                            correctOption: q.correctOption
                        }
                    });
                }
            }
        }

        const fullExam = await prisma.exam.findUnique({
            where: { id },
            include: { questions: true }
        });

        return res.json(fullExam);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to update exam' });
    }
};

// Delete an exam
export const deleteExam = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!PermissionService.hasBasicPermission(user, 'Exam', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Exam' });
        }

        const existing = await prisma.exam.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        await prisma.exam.delete({
            where: { id }
        });

        return res.json({ message: 'Exam deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to delete exam' });
    }
};

// Submit student answers & auto-grade + auto-certify
export const submitExam = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { answers } = req.body; // map: questionId -> selectedOptionIndex

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get student record
        const student = await prisma.student.findFirst({
            where: { userId: user.id, companyId: user.companyId }
        });
        if (!student) {
            return res.status(403).json({ error: 'Only student profiles can submit exams' });
        }

        // Fetch exam with questions
        const exam = await prisma.exam.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                questions: true,
                course: true
            }
        });

        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        // Check enrollment
        const enrollment = await prisma.courseEnrollment.findFirst({
            where: { studentId: student.id, courseId: exam.courseId }
        });
        if (!enrollment) {
            return res.status(403).json({ error: 'You are not enrolled in this course' });
        }

        // Grade exam
        let correctCount = 0;
        const questions = exam.questions;
        const gradingDetails: any[] = [];

        for (const question of questions) {
            const studentChoice = answers[question.id];
            const isCorrect = studentChoice === question.correctOption;
            if (isCorrect) {
                correctCount++;
            }
            gradingDetails.push({
                questionId: question.id,
                questionText: question.questionText,
                studentAnswer: studentChoice,
                correctAnswer: question.correctOption,
                isCorrect
            });
        }

        const totalQuestions = questions.length;
        const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = scorePercentage >= exam.passingScore;

        // Save submission
        const submission = await prisma.examSubmission.create({
            data: {
                studentId: student.id,
                examId: exam.id,
                score: scorePercentage,
                passed,
                answers: answers as any
            }
        });

        let certificateCreated = false;
        let certificateId = null;

        // Auto-Certificate Issuance if exam passed
        if (passed) {
            // Check if student completed all lectures
            const totalLectures = await prisma.lecture.count({
                where: { courseId: exam.courseId, isActive: true, companyId: user.companyId }
            });

            const completedLectures = await prisma.lectureProgress.count({
                where: {
                    studentId: student.id,
                    completed: true,
                    lecture: { courseId: exam.courseId, isActive: true }
                }
            });

            if (completedLectures >= totalLectures) {
                // Course is fully completed! Mark enrollment as completed
                await prisma.courseEnrollment.updateMany({
                    where: { studentId: student.id, courseId: exam.courseId },
                    data: {
                        status: 'completed',
                        completionDate: new Date(),
                        grade: scorePercentage >= 90 ? 'A+' : scorePercentage >= 80 ? 'A' : scorePercentage >= 70 ? 'B' : 'C'
                    }
                });

                // Check if certificate already exists
                const existingCert = await prisma.certificate.findFirst({
                    where: {
                        studentId: student.id,
                        courseName: exam.course.title,
                        companyId: user.companyId
                    }
                });

                if (!existingCert) {
                    // Fetch default template if any
                    const template = await prisma.certificateTemplate.findFirst({
                        where: { companyId: user.companyId }
                    });

                    // Generate Cert Number
                    const certNo = await generateCertificateNo(user.companyId);

                    const newCert = await prisma.certificate.create({
                        data: {
                            companyId: user.companyId,
                            certificateNo: certNo,
                            recipientType: 'student',
                            studentId: student.id,
                            type: 'course',
                            title: `Course Completion Certificate - ${exam.course.title}`,
                            issuedDate: new Date(),
                            courseName: exam.course.title,
                            duration: exam.course.duration || 'N/A',
                            grade: scorePercentage >= 90 ? 'A+' : scorePercentage >= 80 ? 'A' : scorePercentage >= 70 ? 'B' : 'C',
                            score: `${scorePercentage}%`,
                            status: 'issued',
                            templateId: template?.id || null
                        }
                    });

                    certificateCreated = true;
                    certificateId = newCert.id;
                } else {
                    certificateId = existingCert.id;
                }
            }
        }

        return res.json({
            submission,
            correctCount,
            totalQuestions,
            scorePercentage,
            passed,
            certificateCreated,
            certificateId
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to submit exam' });
    }
};
