import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  convertLeadToClient,
  deleteLead,
  getLeadsKanban,
  updateLeadStage,
  convertLeadToClientEnhanced,
  getLeadActivities,
  addLeadActivity,
  scheduleFollowUp,
  updateActivity,
  deleteActivity,
  completeActivity,
  reengageLead
} from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth';
import { requireModule } from '../middleware/enforcePlanLimit';

const router = Router();

router.use(authenticate);
router.use(requireModule('crm'));

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise /kanban/board will match /:id route

// New CRM routes (specific paths first)
router.get('/kanban/board', getLeadsKanban);

// Basic CRUD routes
router.post('/', createLead);
router.get('/', getLeads);

// Parameterized routes (must come after specific routes)
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.put('/:id/stage', updateLeadStage);
router.post('/:id/convert-to-client', convertLeadToClientEnhanced);
router.get('/:id/activities', getLeadActivities);
router.post('/:id/activities', addLeadActivity);
router.put('/:id/activities/:activityId', updateActivity);
router.delete('/:id/activities/:activityId', deleteActivity);
router.post('/:id/activities/:activityId/complete', completeActivity);
router.post('/:id/schedule-follow-up', scheduleFollowUp);
router.post('/:id/reengage', reengageLead);

// Legacy conversion route (keep for backwards compatibility)
router.post('/:id/convert', convertLeadToClient);

export default router;
