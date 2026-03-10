import { Router, Response } from 'express';
import { AIService } from '../services/ai.service';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/ai/generate-task
 * @desc Generate a structured task from a user prompt
 * @access Private
 */
router.post('/generate-task', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const task = await AIService.generateTask(prompt);
        res.json(task);
    } catch (error: any) {
        console.error('AI Task Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate task' });
    }
});

export default router;
