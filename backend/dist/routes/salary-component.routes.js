"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const salary_component_controller_1 = require("../controllers/salary-component.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.checkPermission)('Payroll', 'create'), salary_component_controller_1.createComponent);
router.get('/', (0, auth_1.checkPermission)('Payroll', 'read'), salary_component_controller_1.getComponents);
router.put('/:id', (0, auth_1.checkPermission)('Payroll', 'update'), salary_component_controller_1.updateComponent);
router.delete('/:id', (0, auth_1.checkPermission)('Payroll', 'delete'), salary_component_controller_1.deleteComponent);
exports.default = router;
//# sourceMappingURL=salary-component.routes.js.map