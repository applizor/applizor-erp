import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  generateInvoicePDF,
  updateInvoiceStatus,
  sendInvoice,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createInvoice);
router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoice);
router.post('/:id/generate-pdf', authenticate, generateInvoicePDF);
router.post('/:id/send', authenticate, sendInvoice);
router.put('/:id/status', authenticate, updateInvoiceStatus);

export default router;
