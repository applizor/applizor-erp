import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as aiController from '../controllers/ai.controller';

const router = Router();

// Apply authentication middleware to all AI Center routes
router.use(authenticate);

// AI Agent Registry Routes
router.post('/agents', aiController.createAgent);
router.get('/agents', aiController.getAgents);
router.put('/agents/:id/status', aiController.toggleAgentStatus);

// AI Task Management Routes
router.post('/tasks', aiController.createAiTask);
router.get('/tasks', aiController.getAiTasks);
router.put('/tasks/:id/status', aiController.updateAiTaskStatus);

// AI Approvals Queue Routes
router.post('/approvals', aiController.createApproval);
router.get('/approvals', aiController.getApprovals);
router.put('/approvals/:id/action', aiController.handleApproval);

// Project Memory Routes
router.post('/memory', aiController.createProjectMemory);
router.get('/memory/:projectId', aiController.getProjectMemory);

// AI Chat Command Console Route
router.post('/chat', aiController.chatCommand);

export default router;
