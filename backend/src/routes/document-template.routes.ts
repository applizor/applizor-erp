import { Router } from 'express';
import multer from 'multer';
import { uploadTemplate, listTemplates, deleteTemplate } from '../controllers/document-template.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ dest: 'uploads/templates/' }); // Save to disk

// List Templates
router.get('/', authenticate, listTemplates);

// Upload Template
router.post('/', authenticate, upload.single('file'), uploadTemplate);

// Delete Template
router.delete('/:id', authenticate, deleteTemplate);

export default router;
