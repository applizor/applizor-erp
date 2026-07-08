import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

// Public route to view/stream editor assets
router.get('/editor/*', uploadController.getEditorAsset);

router.use(authenticate);

// Editor Assets (Images, Files)
router.post('/editor-asset', upload.single('file'), uploadController.uploadEditorAsset);

export default router;
