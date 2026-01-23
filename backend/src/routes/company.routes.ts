import { Router } from 'express';
import { getCompany, updateCompany, uploadLetterhead, updateSignature, updateLogo, updateLetterheadAsset } from '../controllers/company.controller';
import { uploadLogo as uploadLogoUtils, uploadSignature, uploadLetterheadAsset } from '../utils/upload';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCompany);
router.put('/', authenticate, updateCompany);
router.post('/letterhead', authenticate, uploadLetterhead);
router.put('/logo', authenticate, uploadLogoUtils.single('logo'), updateLogo);
router.put('/signature', authenticate, uploadSignature.single('signature'), updateSignature);
router.put('/letterhead-asset', authenticate, uploadLetterheadAsset.single('letterhead'), updateLetterheadAsset);
router.put('/continuation-sheet-asset', authenticate, uploadLetterheadAsset.single('continuationSheet'), updateLetterheadAsset);
router.put('/company/profile', authenticate, updateCompany); // Allow updating profile directly

export default router;
