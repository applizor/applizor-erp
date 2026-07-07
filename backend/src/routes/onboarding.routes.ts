import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    triggerBGV,
    updateBGVStatus,
    initializeChecklist,
    updateChecklistTask,
    getOnboardingStatus
} from '../controllers/onboarding.controller';

const router = express.Router();

// Enforce authentication
router.use(authenticate);

// BGV endpoints
router.post('/bgv/trigger', triggerBGV);
router.put('/bgv/:id', updateBGVStatus);

// Checklist endpoints
router.post('/checklist', initializeChecklist);
router.put('/checklist/:candidateId/task', updateChecklistTask);

// Overall status view
router.get('/status/:candidateId', getOnboardingStatus);

export default router;
