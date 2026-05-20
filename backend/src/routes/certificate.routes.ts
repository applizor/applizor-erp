import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    // Templates
    listCertificateTemplates,
    getCertificateTemplate,
    createCertificateTemplate,
    updateCertificateTemplate,
    deleteCertificateTemplate,
    // Certificates
    listCertificates,
    getCertificate,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    revokeCertificate,
    issueCertificate,
    generateCertificatePDF,
    downloadCertificatePDF,
    sendCertificateEmail,
} from '../controllers/certificate.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Certificate Templates ─────────────────────────────────────────────────
router.get('/templates', listCertificateTemplates);
router.post('/templates', createCertificateTemplate);
router.get('/templates/:id', getCertificateTemplate);
router.put('/templates/:id', updateCertificateTemplate);
router.delete('/templates/:id', deleteCertificateTemplate);

// ─── Certificates ──────────────────────────────────────────────────────────
router.get('/', listCertificates);
router.post('/', createCertificate);
router.get('/:id', getCertificate);
router.put('/:id', updateCertificate);
router.delete('/:id', deleteCertificate);

// ─── Actions ──────────────────────────────────────────────────────────────
router.post('/:id/issue', issueCertificate);
router.post('/:id/revoke', revokeCertificate);
router.post('/:id/generate-pdf', generateCertificatePDF);
router.get('/:id/download', downloadCertificatePDF);
router.post('/:id/send-email', sendCertificateEmail);

export default router;
