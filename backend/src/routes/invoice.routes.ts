import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  generateInvoicePDF,
  sendInvoice,
  getInvoiceStats,
  recordPayment,
  updateInvoiceStatus,
  batchUpdateStatus,
  batchSendInvoices,
  convertQuotation,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createInvoice);
router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoice);
router.post('/:id/generate-pdf', authenticate, generateInvoicePDF);
router.get('/stats/summary', authenticate, getInvoiceStats);
router.post('/batch/status', authenticate, batchUpdateStatus);
router.post('/batch/send', authenticate, batchSendInvoices);
router.post('/:id/convert', authenticate, convertQuotation);
router.post('/:id/payments', authenticate, recordPayment);
router.put('/:id/status', authenticate, updateInvoiceStatus);

export default router;
