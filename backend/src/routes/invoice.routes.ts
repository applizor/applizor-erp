import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  getPublicInvoice,
  getPublicInvoicePdf,
  generateInvoicePDF,
  sendInvoice,
  getInvoiceStats,
  recordPayment,
  updateInvoiceStatus,
  batchUpdateStatus,
  batchSendInvoices,
  convertQuotation,
  updateInvoice,
  generatePublicLink,
  revokePublicLink,
  getActivityLog,
  deleteInvoice,
} from '../controllers/invoice.controller';
import {
  getInvoiceByToken,
  downloadPDFPublic
} from '../controllers/invoice-public.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createInvoice);
router.get('/', authenticate, getInvoices);
router.put('/:id', authenticate, updateInvoice);
router.get('/:id/public', getPublicInvoice);
router.get('/:id/public/pdf', getPublicInvoicePdf);
router.get('/:id', authenticate, getInvoice);
router.post('/:id/generate-pdf', authenticate, generateInvoicePDF);
router.get('/stats/summary', authenticate, getInvoiceStats);
router.post('/:id/send', authenticate, sendInvoice);
router.post('/batch/status', authenticate, batchUpdateStatus);
router.post('/batch/send', authenticate, batchSendInvoices);
router.post('/:id/convert', authenticate, convertQuotation);
router.post('/:id/payments', authenticate, recordPayment);
router.post('/:id/generate-link', authenticate, generatePublicLink);
router.post('/:id/revoke-link', authenticate, revokePublicLink);
router.post('/:id/revoke-link', authenticate, revokePublicLink);
router.put('/:id/status', authenticate, updateInvoiceStatus);
router.delete('/:id', authenticate, deleteInvoice);

// Public routes (no authentication required)
router.get('/public/:token', getInvoiceByToken);
router.get('/public/:token/download', downloadPDFPublic);
router.get('/:id/activities', authenticate, getActivityLog);

export default router;
