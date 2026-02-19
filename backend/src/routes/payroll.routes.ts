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
    getSalaryTemplate,
    createSalaryTemplate,
    updateSalaryTemplate,
    deleteSalaryTemplate,
    bulkAssignTemplate,
    previewTemplateStructure,
    exportCompliance,
    emailPayslip,
    postPayrollToAccounting as handlePayrollPosting
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
router.get('/templates/:id', authenticate, getSalaryTemplate);
router.put('/templates/:id', authenticate, updateSalaryTemplate);
router.delete('/templates/:id', authenticate, deleteSalaryTemplate);
router.post('/templates/preview', authenticate, previewTemplateStructure);

// Tax Declarations
router.get('/declarations/:employeeId', authenticate, getTaxDeclarations);
router.post('/declarations/submit', authenticate, submitTaxDeclaration);
router.post('/declarations/investments/:id/review', authenticate, reviewInvestment);
router.get('/compliance/export', authenticate, exportCompliance);

router.post('/run/post-to-accounting', authenticate, handlePayrollPosting);

// Employee Salary Structure
router.get('/structure/:employeeId', authenticate, getEmployeeSalaryStructure);
router.post('/structure/:employeeId', authenticate, upsertEmployeeSalaryStructure);
router.post('/structure/bulk-assign', authenticate, bulkAssignTemplate);

// Payslip Actions
router.get('/:id/payslip', authenticate, downloadPayslip);
router.post('/:id/email-payslip', authenticate, emailPayslip);

export default router;
