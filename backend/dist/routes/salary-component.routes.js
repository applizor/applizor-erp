"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const salary_component_controller_1 = require("../controllers/salary-component.controller");
const router = express_1.default.Router();
// Allow 'Payroll' module access (or specific roles)
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)(['Admin', 'HR Manager']), salary_component_controller_1.getComponents);
router.post('/', (0, auth_1.authorize)(['Admin', 'HR Manager']), salary_component_controller_1.createComponent);
router.put('/:id', (0, auth_1.authorize)(['Admin', 'HR Manager']), salary_component_controller_1.updateComponent);
router.delete('/:id', (0, auth_1.authorize)(['Admin', 'HR Manager']), salary_component_controller_1.deleteComponent);
exports.default = router;
//# sourceMappingURL=salary-component.routes.js.map