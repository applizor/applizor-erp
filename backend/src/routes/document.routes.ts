import { Router } from 'express';
import multer from 'multer';
import { generateDocument, healthCheck } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';
import { enforcePlanLimit } from '../middleware/enforcePlanLimit';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Keep in memory for processing

// Public health check?
router.get('/health', healthCheck);

// Generation endpoint - Protected
// 'file' matches the form-data key
router.post('/generate', authenticate, enforcePlanLimit('maxStorageGb'), upload.single('file'), generateDocument);

import { generateFromTemplate, previewDocument, createDocument, uploadSignedDocument, reviewDocument, deleteDocument, publishDocument, updateDocument } from '../controllers/document.controller';
router.post('/generate-from-template', authenticate, generateFromTemplate);
router.post('/preview', authenticate, previewDocument);
router.post('/publish', authenticate, createDocument);

// Workflow Routes
router.post('/:id/publish', authenticate, publishDocument);
router.post('/:id/sign', authenticate, enforcePlanLimit('maxStorageGb'), upload.single('file'), uploadSignedDocument);
router.post('/:id/review', authenticate, reviewDocument);
router.patch('/:id', authenticate, updateDocument);
router.delete('/:id', authenticate, deleteDocument);

// Generic Upload (Employee Self-Service)
// 'file' key must match frontend FormData
// Generic Upload (Employee Self-Service)
// 'file' key must match frontend FormData
import { uploadGenericDocument, generateInstantDocument } from '../controllers/document.controller';
router.post('/upload', authenticate, enforcePlanLimit('maxStorageGb'), upload.single('file'), uploadGenericDocument);
router.post('/generate-instant', authenticate, generateInstantDocument);

export default router;
