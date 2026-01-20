"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../../controllers/crm/lead.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, lead_controller_1.getLeads);
router.post('/', auth_1.authenticate, lead_controller_1.createLead);
router.put('/:id', auth_1.authenticate, lead_controller_1.updateLead);
router.delete('/:id', auth_1.authenticate, lead_controller_1.deleteLead);
exports.default = router;
//# sourceMappingURL=lead.routes.js.map