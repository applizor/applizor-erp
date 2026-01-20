"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCandidateStage = exports.getKanbanBoard = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get Kanban Board Data (Candidates grouped by stage)
const getKanbanBoard = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'User/Company not found' });
        const candidates = await prisma.candidate.findMany({
            where: { companyId: user.companyId },
            include: {
                jobOpening: {
                    select: { title: true }
                },
                interviews: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 1
                }
            }
        });
        // Group by stage
        const board = {
            'Applied': candidates.filter(c => c.status === 'Applied' || c.currentStage === 'Applied'),
            'Screening': candidates.filter(c => c.currentStage === 'Screening'),
            'Interview': candidates.filter(c => c.currentStage === 'Interview' || c.status === 'Interview'),
            'Offer': candidates.filter(c => c.currentStage === 'Offer' || c.status === 'Offer'),
            'Hired': candidates.filter(c => c.status === 'Hired'),
            'Rejected': candidates.filter(c => c.status === 'Rejected')
        };
        res.json(board);
    }
    catch (error) {
        console.error('Get kanban error:', error);
        res.status(500).json({ error: 'Failed to fetch kanban board' });
    }
};
exports.getKanbanBoard = getKanbanBoard;
// Update Candidate Stage (Drag & Drop)
const updateCandidateStage = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const { stage, status } = req.body; // stage: 'Screening', 'Interview'; status: 'Active', 'Rejected'
        const candidate = await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                currentStage: stage,
                status: status || 'Active' // Optional status update
            }
        });
        res.json(candidate);
    }
    catch (error) {
        console.error('Update stage error:', error);
        res.status(500).json({ error: 'Failed to update candidate stage' });
    }
};
exports.updateCandidateStage = updateCandidateStage;
//# sourceMappingURL=kanban.controller.js.map