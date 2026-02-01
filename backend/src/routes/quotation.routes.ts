import { Router } from 'express';
import {
    createQuotation,
    getQuotations,
    getQuotation,
    updateQuotation,
    convertQuotationToInvoice,
    deleteQuotation,
    downloadQuotationPDF,
    downloadSignedQuotationPDF,
    sendQuotationEmail,
    getQuotationAnalytics
} from '../controllers/quotation.controller';
import {
    generatePublicLink,
    revokePublicLink,
    getQuotationByToken,
    acceptQuotation,
    rejectQuotation,
    downloadSignedQuotationPDFPublic,
    downloadPDFPublic
} from '../controllers/quotation-public.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected routes (require authentication)
router.post('/', authenticate, createQuotation);
router.get('/', authenticate, getQuotations);
router.get('/:id', authenticate, getQuotation);
router.put('/:id', authenticate, updateQuotation);
router.post('/:id/convert-to-invoice', authenticate, convertQuotationToInvoice);
router.delete('/:id', authenticate, deleteQuotation);

// Public link management (require authentication)
router.post('/:id/generate-link', authenticate, generatePublicLink);
router.post('/:id/revoke-link', authenticate, revokePublicLink);

// PDF downloads (require authentication)
router.get('/:id/pdf', authenticate, downloadQuotationPDF);
router.get('/:id/signed-pdf', authenticate, downloadSignedQuotationPDF);

// Send quotation email (require authentication)
router.post('/:id/send-email', authenticate, sendQuotationEmail);

// Analytics
router.get('/:id/analytics', authenticate, getQuotationAnalytics);

// Public routes (no authentication required)
router.get('/public/:token', getQuotationByToken);
router.post('/public/:token/accept', acceptQuotation);
router.post('/public/:token/reject', rejectQuotation);
router.get('/public/:token/pdf', downloadPDFPublic);
router.get('/public/:token/signed-pdf', downloadSignedQuotationPDFPublic);

export default router;
