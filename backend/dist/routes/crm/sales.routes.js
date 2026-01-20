"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_controller_1 = require("../../controllers/crm/sales.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, sales_controller_1.createSalesTarget);
router.get('/', auth_1.authenticate, sales_controller_1.getSalesTargets);
router.post('/calculate-progress', auth_1.authenticate, sales_controller_1.updateProgress);
exports.default = router;
//# sourceMappingURL=sales.routes.js.map