import express from 'express';
import * as assetController from '../controllers/asset.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, assetController.getAssets);
router.post('/', authenticate, assetController.createAsset);
router.put('/:id', authenticate, assetController.updateAsset);
router.delete('/:id', authenticate, assetController.deleteAsset);

export default router;
