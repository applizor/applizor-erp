"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, lead_controller_1.createLead);
router.get('/', auth_1.authenticate, lead_controller_1.getLeads);
router.get('/:id', auth_1.authenticate, lead_controller_1.getLead);
router.put('/:id', auth_1.authenticate, lead_controller_1.updateLead);
router.post('/:id/convert', auth_1.authenticate, lead_controller_1.convertLeadToClient);
router.delete('/:id', auth_1.authenticate, lead_controller_1.deleteLead);
exports.default = router;
//# sourceMappingURL=lead.routes.js.map