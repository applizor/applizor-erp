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

import { generateFromTemplate } from '../controllers/document.controller';
router.post('/generate-from-template', authenticate, generateFromTemplate);

export default router;
