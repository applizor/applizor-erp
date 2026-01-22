import express from 'express';
import { login } from '../controllers/client.auth.controller';
import {
    getDashboardStats,
    getMyInvoices,
    getMyProjects,
    getInvoiceDetails,
    getInvoicePdf,
    exportInvoices
} from '../controllers/portal.controller';
import { authenticateClient } from '../middleware/client.auth';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/dashboard', authenticateClient, getDashboardStats);
router.get('/invoices', authenticateClient, getMyInvoices);
router.get('/invoices/export', authenticateClient, exportInvoices); // Must be before /:id
router.get('/invoices/:id', authenticateClient, getInvoiceDetails);
router.get('/invoices/:id/pdf', authenticateClient, getInvoicePdf);
router.get('/projects', authenticateClient, getMyProjects);

export default router;
