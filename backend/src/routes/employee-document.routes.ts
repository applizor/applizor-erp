import { Router } from 'express';
import multer from 'multer';
import { uploadDocument, getMyDocuments, deleteDocument } from '../controllers/employee-document.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/mine', getMyDocuments);
router.post('/upload', upload.single('file'), uploadDocument);
router.delete('/:id', deleteDocument);

// Note: Admin routes to view employee docs would go here or in a separate controller

export default router;
