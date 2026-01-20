import express from 'express';
import {
    processPayroll,
    getPayrollList,
    getSalaryComponents,
    createSalaryComponent,
    getEmployeeSalaryStructure,
    upsertEmployeeSalaryStructure,
    downloadPayslip,
    approvePayroll
} from '../controllers/payroll.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/process', authenticate, processPayroll);
router.post('/approve/:id', authenticate, approvePayroll);
router.get('/list', authenticate, getPayrollList);
router.get('/download/:id', authenticate, downloadPayslip);

// Salary Components
router.get('/components', authenticate, getSalaryComponents);
router.post('/components', authenticate, createSalaryComponent);

// Employee Salary Structure
router.get('/structure/:employeeId', authenticate, getEmployeeSalaryStructure);
router.post('/structure/:employeeId', authenticate, upsertEmployeeSalaryStructure);

export default router;
