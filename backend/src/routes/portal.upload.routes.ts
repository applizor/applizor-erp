import { Router } from 'express';
import { authenticateClient } from '../middleware/client.auth';
import { upload } from '../middleware/upload';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

router.use(authenticateClient);

// Editor Assets (Images, Files) - Using the same controller, just different auth
router.post('/editor-asset', upload.single('file'), uploadController.uploadEditorAsset);

export default router;
