import { Router, Response, Request } from 'express';
import { AIService } from '../services/ai.service';
import { combinedAuth, AuthRequest } from '../middleware/auth';

const router = Router();

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

export default router;
