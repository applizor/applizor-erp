import express from 'express';
import {
    processPayroll,
    getPayrollList,
    getSalaryComponents,
    createSalaryComponent,
    getEmployeeSalaryStructure,
    upsertEmployeeSalaryStructure,
    downloadPayslip,
    approvePayroll,
    getStatutoryConfig,
    updateStatutoryConfig,
    getSalaryTemplates,
    createSalaryTemplate,
    previewTemplateStructure,
    exportCompliance,
    emailPayslip
} from '../controllers/payroll.controller';
import {
    getTaxDeclarations,
    submitTaxDeclaration,
    reviewInvestment
} from '../controllers/tax-declaration.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/process', authenticate, processPayroll);
router.post('/approve/:id', authenticate, approvePayroll);
router.get('/list', authenticate, getPayrollList);
router.get('/statutory-config', authenticate, getStatutoryConfig);
router.post('/statutory-config', authenticate, updateStatutoryConfig);

// Salary Components
router.get('/components', authenticate, getSalaryComponents);
router.post('/components', authenticate, createSalaryComponent);

// Salary Templates
router.get('/templates', authenticate, getSalaryTemplates);
router.post('/templates', authenticate, createSalaryTemplate);
router.post('/templates/preview', authenticate, previewTemplateStructure);

// Tax Declarations
router.get('/declarations/:employeeId', authenticate, getTaxDeclarations);
router.post('/declarations/submit', authenticate, submitTaxDeclaration);
router.post('/declarations/investments/:id/review', authenticate, reviewInvestment);
router.get('/compliance/export', authenticate, exportCompliance);

// Employee Salary Structure
router.get('/structure/:employeeId', authenticate, getEmployeeSalaryStructure);
router.post('/structure/:employeeId', authenticate, upsertEmployeeSalaryStructure);

// Payslip Actions
router.get('/:id/payslip', authenticate, downloadPayslip);
router.post('/:id/email-payslip', authenticate, emailPayslip);

export default router;
