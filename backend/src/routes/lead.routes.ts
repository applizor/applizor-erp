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
  completeActivity
} from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise /kanban/board will match /:id route

// New CRM routes (specific paths first)
router.get('/kanban/board', authenticate, getLeadsKanban);

// Basic CRUD routes
router.post('/', authenticate, createLead);
router.get('/', authenticate, getLeads);

// Parameterized routes (must come after specific routes)
router.get('/:id', authenticate, getLead);
router.put('/:id', authenticate, updateLead);
router.delete('/:id', authenticate, deleteLead);
router.put('/:id/stage', authenticate, updateLeadStage);
router.post('/:id/convert-to-client', authenticate, convertLeadToClientEnhanced);
router.get('/:id/activities', authenticate, getLeadActivities);
router.post('/:id/activities', authenticate, addLeadActivity);
router.put('/:id/activities/:activityId', authenticate, updateActivity);
router.delete('/:id/activities/:activityId', authenticate, deleteActivity);
router.post('/:id/activities/:activityId/complete', authenticate, completeActivity);
router.post('/:id/schedule-follow-up', authenticate, scheduleFollowUp);

// Legacy conversion route (keep for backwards compatibility)
router.post('/:id/convert', authenticate, convertLeadToClient);

export default router;
