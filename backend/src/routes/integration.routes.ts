import { Router } from 'express';
import {
    handleSlackWebhook,
    handleTeamsWebhook,
    replyToSlack,
    replyToTeams,
    getProjectIntegration,
    saveProjectIntegration
} from '../controllers/integration.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/integrations/slack/webhook', handleSlackWebhook);
router.post('/integrations/teams/webhook', handleTeamsWebhook);

router.post('/integrations/slack/reply', authenticate, replyToSlack);
router.post('/integrations/teams/reply', authenticate, replyToTeams);

router.get('/projects/:projectId/integrations', authenticate, getProjectIntegration);
router.post('/projects/:projectId/integrations', authenticate, saveProjectIntegration);

export default router;