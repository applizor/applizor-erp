import express from 'express';
import {
    processPayroll,
    getMyPayrolls,
    getPayrollList,
    getSalaryComponents,
    createSalaryComponent,
    updateSalaryComponent,
    deleteSalaryComponent,
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
    bulkEmailPayslips,
    postPayrollToAccounting as handlePayrollPosting
} from '../controllers/payroll.controller';
import {
    getTaxDeclarations,
    submitTaxDeclaration,
    reviewInvestment,
    getPendingReviews
} from '../controllers/tax-declaration.controller';
import { authenticate } from '../middleware/auth';
import { requireModule } from '../middleware/enforcePlanLimit';

const router = express.Router();

router.use(authenticate);
router.use(requireModule('payroll'));

router.post('/process', processPayroll);
router.get('/mine', getMyPayrolls);
router.post('/:id/approve', approvePayroll);
router.get('/list', getPayrollList);
router.get('/statutory-config', getStatutoryConfig);
router.post('/statutory-config', updateStatutoryConfig);

// Salary Components
router.get('/components', getSalaryComponents);
router.post('/components', createSalaryComponent);
router.put('/components/:id', updateSalaryComponent);
router.delete('/components/:id', deleteSalaryComponent);

// Salary Templates
router.get('/templates', getSalaryTemplates);
router.post('/templates', createSalaryTemplate);
router.get('/templates/:id', getSalaryTemplate);
router.put('/templates/:id', updateSalaryTemplate);
router.delete('/templates/:id', deleteSalaryTemplate);
router.post('/templates/preview', previewTemplateStructure);

// Tax Declarations
router.get('/declarations/:employeeId', getTaxDeclarations);
router.post('/declarations/submit', submitTaxDeclaration);
router.post('/declarations/investments/:id/review', reviewInvestment);
router.get('/declarations/pending', getPendingReviews);
router.get('/compliance/export', exportCompliance);

router.post('/run/post-to-accounting', handlePayrollPosting);

// Employee Salary Structure
router.get('/structure/:employeeId', getEmployeeSalaryStructure);
router.post('/structure/:employeeId', upsertEmployeeSalaryStructure);
router.post('/structure/bulk-assign', bulkAssignTemplate);

// Payslip Actions
router.get('/:id/payslip', downloadPayslip);
router.post('/:id/email-payslip', emailPayslip);
router.post('/bulk/email-payslips', bulkEmailPayslips);

export default router;
