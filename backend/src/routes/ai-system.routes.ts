import { Router } from 'express';
import { combinedAuth } from '../middleware/auth';
import {
    getMemories,
    setMemory,
    deleteMemory,
    getApprovals,
    createApproval,
    updateApproval,
    getLogs,
    createLog,
    processClientRequest,
    getDashboardStats
} from '../controllers/ai-system.controller';

const router = Router();

// AI Memory Routes
router.get('/memory', combinedAuth, getMemories);
router.post('/memory', combinedAuth, setMemory);
router.delete('/memory', combinedAuth, deleteMemory);

// AI Approval Queue Routes
router.get('/approvals', combinedAuth, getApprovals);
router.post('/approvals', combinedAuth, createApproval);
router.put('/approvals/:id', combinedAuth, updateApproval);

// AI Activity Logging Routes
router.get('/logs', combinedAuth, getLogs);
router.post('/logs', combinedAuth, createLog);

// Company OS Orchestration Route
router.post('/process-request', combinedAuth, processClientRequest);
router.get('/stats', combinedAuth, getDashboardStats);

export default router;
