import express from 'express';
import { login } from '../controllers/client.auth.controller';
import { getDashboardStats, getMyInvoices, getMyProjects } from '../controllers/portal.controller';
import { authenticate } from '../middleware/auth'; // We assume this works for any valid token user

const router = express.Router();

// Public routes
router.post('/auth/login', login);

// Protected routes
router.get('/dashboard', authenticate, getDashboardStats);
router.get('/invoices', authenticate, getMyInvoices);
router.get('/projects', authenticate, getMyProjects);

export default router;
