import { Router } from 'express';
import multer from 'multer';
import { generateDocument, healthCheck } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Keep in memory for processing

// Public health check?
router.get('/health', healthCheck);

// Generation endpoint - Protected
// 'file' matches the form-data key
router.post('/generate', authenticate, upload.single('file'), generateDocument);

import { generateFromTemplate, previewDocument, createDocument, uploadSignedDocument, reviewDocument, deleteDocument, publishDocument } from '../controllers/document.controller';
router.post('/generate-from-template', authenticate, generateFromTemplate);
router.post('/preview', authenticate, previewDocument);
router.post('/publish', authenticate, createDocument);

// Workflow Routes
router.post('/:id/publish', authenticate, publishDocument);
router.post('/:id/sign', authenticate, upload.single('file'), uploadSignedDocument);
router.post('/:id/review', authenticate, reviewDocument);
router.delete('/:id', authenticate, deleteDocument);

// Generic Upload (Employee Self-Service)
// 'file' key must match frontend FormData
// Generic Upload (Employee Self-Service)
// 'file' key must match frontend FormData
import { uploadGenericDocument, generateInstantDocument } from '../controllers/document.controller';
router.post('/upload', authenticate, upload.single('file'), uploadGenericDocument);
router.post('/generate-instant', authenticate, generateInstantDocument);

export default router;
