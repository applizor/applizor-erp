"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise /kanban/board will match /:id route
// New CRM routes (specific paths first)
router.get('/kanban/board', auth_1.authenticate, lead_controller_1.getLeadsKanban);
// Basic CRUD routes
router.post('/', auth_1.authenticate, lead_controller_1.createLead);
router.get('/', auth_1.authenticate, lead_controller_1.getLeads);
// Parameterized routes (must come after specific routes)
router.get('/:id', auth_1.authenticate, lead_controller_1.getLead);
router.put('/:id', auth_1.authenticate, lead_controller_1.updateLead);
router.delete('/:id', auth_1.authenticate, lead_controller_1.deleteLead);
router.put('/:id/stage', auth_1.authenticate, lead_controller_1.updateLeadStage);
router.post('/:id/convert-to-client', auth_1.authenticate, lead_controller_1.convertLeadToClientEnhanced);
router.get('/:id/activities', auth_1.authenticate, lead_controller_1.getLeadActivities);
router.post('/:id/activities', auth_1.authenticate, lead_controller_1.addLeadActivity);
router.put('/:id/activities/:activityId', auth_1.authenticate, lead_controller_1.updateActivity);
router.delete('/:id/activities/:activityId', auth_1.authenticate, lead_controller_1.deleteActivity);
router.post('/:id/activities/:activityId/complete', auth_1.authenticate, lead_controller_1.completeActivity);
router.post('/:id/schedule-follow-up', auth_1.authenticate, lead_controller_1.scheduleFollowUp);
// Legacy conversion route (keep for backwards compatibility)
router.post('/:id/convert', auth_1.authenticate, lead_controller_1.convertLeadToClient);
exports.default = router;
//# sourceMappingURL=lead.routes.js.map