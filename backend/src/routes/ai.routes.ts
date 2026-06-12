import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as aiController from '../controllers/ai.controller';
import { AIService } from '../services/ai.service';
import { combinedAuth, AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const router = Router();

// ----------------------------------------------------
// Public/Portal AI Routes (combined auth)
// ----------------------------------------------------

/**
 * @route POST /api/ai/generate-task
 * @desc Generate a structured task from a user prompt
 * @access Private (Staff & Client Portal)
 */
router.post('/generate-task', combinedAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const task = await AIService.generateTask(prompt);
        res.json(task);
    } catch (error: any) {
        console.error('AI Task Generation Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate task' });
    }
});

// ----------------------------------------------------
// AI Center Routes (Internal Staff)
// ----------------------------------------------------

// AI Agent Registry Routes
router.post('/agents', authenticate, aiController.createAgent);
router.get('/agents', authenticate, aiController.getAgents);
router.put('/agents/:id/status', authenticate, aiController.toggleAgentStatus);

// AI Task Management Routes
router.post('/tasks', authenticate, aiController.createAiTask);
router.get('/tasks', authenticate, aiController.getAiTasks);
router.put('/tasks/:id/status', authenticate, aiController.updateAiTaskStatus);

// AI Approvals Queue Routes
router.post('/approvals', authenticate, aiController.createApproval);
router.get('/approvals', authenticate, aiController.getApprovals);
router.put('/approvals/:id/action', authenticate, aiController.handleApproval);

// Project Memory Routes
router.post('/memory', authenticate, aiController.createProjectMemory);
router.get('/memory/:projectId', authenticate, aiController.getProjectMemory);

// AI Chat Command Console Route
router.post('/chat', authenticate, aiController.chatCommand);

export default router;
