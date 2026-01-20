"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelInterview = exports.getScorecard = exports.updateFeedback = exports.getCandidateInterviews = exports.scheduleInterview = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Schedule Interview
const scheduleInterview = async (req, res) => {
    try {
        const { candidateId, round, type, scheduledAt, interviewer } = req.body;
        const interview = await prisma.interview.create({
            data: {
                candidateId,
                round: Number(round),
                type,
                scheduledAt: new Date(scheduledAt),
                interviewer,
                status: 'scheduled'
            }
        });
        // Update candidate status and stage
        await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                status: 'interview',
                currentStage: `Round ${round} (${type})`
            }
        });
        res.status(201).json(interview);
    }
    catch (error) {
        console.error('Schedule interview error:', error);
        res.status(500).json({ error: 'Failed to schedule interview' });
    }
};
exports.scheduleInterview = scheduleInterview;
// Get Interviews for a Candidate
const getCandidateInterviews = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const interviews = await prisma.interview.findMany({
            where: { candidateId },
            orderBy: { round: 'asc' }
        });
        res.json(interviews);
    }
    catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
};
exports.getCandidateInterviews = getCandidateInterviews;
// Update Interview Feedback & Scorecard
const updateFeedback = async (req, res) => {
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
                        submittedBy: req.user?.userId
                    },
                    update: {
                        technical: scorecard.technical || 0,
                        communication: scorecard.communication || 0,
                        problemSolving: scorecard.problemSolving || 0,
                        cultureFit: scorecard.cultureFit || 0,
                        comments: scorecard.comments,
                        submittedBy: req.user?.userId
                    }
                });
            }
            return interview;
        });
        res.json(result);
    }
    catch (error) {
        console.error('Update feedback error:', error);
        res.status(500).json({ error: 'Failed to update feedback' });
    }
};
exports.updateFeedback = updateFeedback;
// Get Interview Scorecard
const getScorecard = async (req, res) => {
    try {
        const { id } = req.params;
        const scorecard = await prisma.interviewScorecard.findUnique({
            where: { interviewId: id }
        });
        res.json(scorecard);
    }
    catch (error) {
        console.error('Get scorecard error:', error);
        res.status(500).json({ error: 'Failed to fetch scorecard' });
    }
};
exports.getScorecard = getScorecard;
// Cancel Interview
const cancelInterview = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.interview.update({
            where: { id },
            data: { status: 'cancelled' }
        });
        res.json({ message: 'Interview cancelled' });
    }
    catch (error) {
        console.error('Cancel interview error:', error);
        res.status(500).json({ error: 'Failed to cancel interview' });
    }
};
exports.cancelInterview = cancelInterview;
//# sourceMappingURL=interview.controller.js.map