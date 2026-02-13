import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Schedule Interview
export const scheduleInterview = async (req: AuthRequest, res: Response) => {
    try {
        const { candidateId, round, type, scheduledAt, interviewer, meetingLink } = req.body;

        const interview = await prisma.interview.create({
            data: {
                candidateId,
                round: Number(round),
                type,
                scheduledAt: new Date(scheduledAt),
                interviewer,
                meetingLink, // Add meeting link
                status: 'scheduled'
            }
        });

        // Update candidate status and stage
        const candidate = await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                status: 'interview',
                currentStage: `Round ${round} (${type})`
            }
        });

        // Send Email Notification
        if (candidate.email) {
            // Import dynamically to avoid circular dependency issues if any, or standard import
            const emailService = await import('../services/email.service');
            await emailService.sendInterviewInvite(candidate.email, {
                candidateName: candidate.firstName,
                round: Number(round),
                type,
                scheduledAt: new Date(scheduledAt),
                interviewer,
                meetingLink // Pass link to email
            });
        }

        res.status(201).json(interview);
    } catch (error) {
        console.error('Schedule interview error:', error);
        res.status(500).json({ error: 'Failed to schedule interview' });
    }
};

export const rescheduleInterview = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { scheduledAt, interviewer, type, round, meetingLink } = req.body;

        const interview = await prisma.interview.update({
            where: { id },
            data: {
                scheduledAt: new Date(scheduledAt),
                interviewer,
                type,
                round: Number(round),
                meetingLink, // Update link
                status: 'scheduled' // Reset status if it was cancelled
            },
            include: { candidate: true }
        });

        // Send Updated Email
        if (interview.candidate?.email) {
            const emailService = await import('../services/email.service');
            await emailService.sendInterviewInvite(interview.candidate.email, {
                candidateName: interview.candidate.firstName,
                round: Number(round),
                type,
                scheduledAt: new Date(scheduledAt),
                interviewer,
                meetingLink
            });
        }

        res.json(interview);
    } catch (error) {
        console.error('Reschedule interview error:', error);
        res.status(500).json({ error: 'Failed to reschedule interview' });
    }
};

// Get Interviews for a Candidate
export const getCandidateInterviews = async (req: AuthRequest, res: Response) => {
    try {
        const { candidateId } = req.params;

        const interviews = await prisma.interview.findMany({
            where: { candidateId },
            orderBy: { round: 'asc' }
        });

        res.json(interviews);
    } catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
};



// Get Single Interview by ID
export const getInterviewById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                candidate: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        jobOpening: {
                            select: { title: true }
                        }
                    }
                },
                scorecard: true
            }
        });

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Map database scorecard fields to frontend 'ratings' object
        const response: any = { ...interview };
        if (interview.scorecard) {
            response.scorecard = {
                ...interview.scorecard,
                ratings: {
                    technical: interview.scorecard.technical,
                    communication: interview.scorecard.communication,
                    problem_solving: interview.scorecard.problemSolving,
                    culture: interview.scorecard.cultureFit
                }
            };
        }

        res.json(response);
    } catch (error) {
        console.error('Get interview error:', error);
        res.status(500).json({ error: 'Failed to fetch interview' });
    }
};

// Get All Interviews (Dashboard/List View)
export const getAllInterviews = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId) return res.status(400).json({ error: 'User/Company not found' });

        const interviews = await prisma.interview.findMany({
            where: {
                candidate: {
                    companyId: user.companyId
                }
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { scheduledAt: 'asc' }
        });

        res.json(interviews);
    } catch (error) {
        console.error('Get all interviews error:', error);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
};

// Update Interview Feedback & Scorecard
export const updateFeedback = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { feedback, rating, status, scorecard } = req.body;

        // Transaction to update interview and create/update scorecard
        const result = await prisma.$transaction(async (prisma) => {
            const interview = await prisma.interview.update({
                where: { id },
                data: {
                    feedback,
                    rating: Number(rating),
                    status // completed, no-show, cancelled
                }
            });

            if (scorecard) {
                await prisma.interviewScorecard.upsert({
                    where: { interviewId: id },
                    create: {
                        interviewId: id,
                        technical: scorecard.technical || 0,
                        communication: scorecard.communication || 0,
                        problemSolving: scorecard.problemSolving || 0,
                        cultureFit: scorecard.cultureFit || 0,
                        comments: scorecard.comments,
                        submittedBy: req.userId
                    },
                    update: {
                        technical: scorecard.technical || 0,
                        communication: scorecard.communication || 0,
                        problemSolving: scorecard.problemSolving || 0,
                        cultureFit: scorecard.cultureFit || 0,
                        comments: scorecard.comments,
                        submittedBy: req.userId
                    }
                });
            }

            return interview;
        });

        res.json(result);
    } catch (error) {
        console.error('Update feedback error:', error);
        res.status(500).json({ error: 'Failed to update feedback' });
    }
};

// Get Interview Scorecard
export const getScorecard = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const scorecard = await prisma.interviewScorecard.findUnique({
            where: { interviewId: id }
        });
        res.json(scorecard);
    } catch (error) {
        console.error('Get scorecard error:', error);
        res.status(500).json({ error: 'Failed to fetch scorecard' });
    }
};

// Save Interview Scorecard (Frontend compatible)
export const saveScorecard = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { ratings, comments, recommendation } = req.body;

        // Transaction to update interview and create/update scorecard
        const result = await prisma.$transaction(async (tx) => {
            const interview = await tx.interview.update({
                where: { id },
                data: {
                    status: 'completed', // Auto-complete interview
                    rating: Math.round(
                        (ratings.technical + ratings.communication + ratings.problem_solving + ratings.culture) / 4
                    )
                }
            });

            const scorecard = await tx.interviewScorecard.upsert({
                where: { interviewId: id },
                create: {
                    interviewId: id,
                    technical: ratings.technical || 0,
                    communication: ratings.communication || 0,
                    problemSolving: ratings.problem_solving || 0,
                    cultureFit: ratings.culture || 0,
                    comments,
                    recommendation,
                    submittedBy: req.userId
                },
                update: {
                    technical: ratings.technical || 0,
                    communication: ratings.communication || 0,
                    problemSolving: ratings.problem_solving || 0,
                    cultureFit: ratings.culture || 0,
                    comments,
                    recommendation,
                    submittedBy: req.userId
                }
            });

            return { interview, scorecard };
        });

        res.json(result);
    } catch (error) {
        console.error('Save scorecard error:', error);
        res.status(500).json({ error: 'Failed to save scorecard' });
    }
};

// Cancel Interview
export const cancelInterview = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.interview.update({
            where: { id },
            data: { status: 'cancelled' }
        });

        res.json({ message: 'Interview cancelled' });
    } catch (error) {
        console.error('Cancel interview error:', error);
        res.status(500).json({ error: 'Failed to cancel interview' });
    }
};
