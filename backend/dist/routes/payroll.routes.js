"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payroll_controller_1 = require("../controllers/payroll.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/process', auth_1.authenticate, payroll_controller_1.processPayroll);
router.post('/approve/:id', auth_1.authenticate, payroll_controller_1.approvePayroll);
router.get('/list', auth_1.authenticate, payroll_controller_1.getPayrollList);
router.get('/download/:id', auth_1.authenticate, payroll_controller_1.downloadPayslip);
// Salary Components
router.get('/components', auth_1.authenticate, payroll_controller_1.getSalaryComponents);
router.post('/components', auth_1.authenticate, payroll_controller_1.createSalaryComponent);
// Employee Salary Structure
router.get('/structure/:employeeId', auth_1.authenticate, payroll_controller_1.getEmployeeSalaryStructure);
router.post('/structure/:employeeId', auth_1.authenticate, payroll_controller_1.upsertEmployeeSalaryStructure);
exports.default = router;
//# sourceMappingURL=payroll.routes.js.map