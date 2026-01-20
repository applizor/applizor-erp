"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const salary_structure_controller_1 = require("../controllers/salary-structure.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
// Get structure
router.get('/:employeeId', (0, auth_1.authorize)(['Admin', 'HR Manager']), salary_structure_controller_1.getEmployeeStructure);
// Update structure
router.put('/:employeeId', (0, auth_1.authorize)(['Admin', 'HR Manager']), salary_structure_controller_1.updateEmployeeStructure);
exports.default = router;
//# sourceMappingURL=salary-structure.routes.js.map