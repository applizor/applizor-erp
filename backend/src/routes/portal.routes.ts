import express from 'express';
import { login } from '../controllers/client.auth.controller';
import {
    getDashboardStats,
    getMyInvoices,
    getMyProjects,
    getInvoiceDetails,
    getInvoicePdf,
    exportInvoices,
    getMyQuotations,
    getQuotationDetails,
    getQuotationPdf,
    getContractPdf,
    getMyContracts,
    getContractDetails
} from '../controllers/portal.controller';
import { authenticateClient } from '../middleware/client.auth';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/dashboard', authenticateClient, getDashboardStats);
// Quotations
router.get('/quotations', authenticateClient, getMyQuotations);
router.get('/quotations/:id', authenticateClient, getQuotationDetails);
router.get('/quotations/:id/pdf', authenticateClient, getQuotationPdf);

// Contracts
router.get('/contracts', authenticateClient, getMyContracts);
router.get('/contracts/:id', authenticateClient, getContractDetails);
router.get('/contracts/:id/pdf', authenticateClient, getContractPdf);

// Projects & Invoices
router.get('/invoices', authenticateClient, getMyInvoices);
router.get('/invoices/export', authenticateClient, exportInvoices);
router.get('/invoices/:id', authenticateClient, getInvoiceDetails);
router.get('/invoices/:id/pdf', authenticateClient, getInvoicePdf);
router.get('/projects', authenticateClient, getMyProjects);

// Portal Task Management
import * as portalTaskController from '../controllers/portal.task.controller';
import { upload } from '../middleware/upload';

router.get('/tasks', authenticateClient, portalTaskController.getPortalTasks);
router.get('/tasks/:id', authenticateClient, portalTaskController.getPortalTaskDetails);
router.post('/tasks', authenticateClient, upload.array('files'), portalTaskController.createPortalTask);
router.get('/tasks/:id/comments', authenticateClient, portalTaskController.getPortalComments);
router.post('/tasks/:id/comments', authenticateClient, portalTaskController.addPortalComment);
router.put('/tasks/:id/status', authenticateClient, portalTaskController.updatePortalTaskStatus);

export default router;
