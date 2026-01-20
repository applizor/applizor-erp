import { Router } from 'express';
import { getCompany, updateCompany, uploadLetterhead } from '../controllers/company.controller';
import { uploadLogo } from '../utils/upload';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCompany);
router.put('/', authenticate, updateCompany);
router.post('/letterhead', authenticate, uploadLetterhead);
router.put('/logo', authenticate, uploadLogo.single('logo'), (req, res) => {
    import('../controllers/company.controller').then(mod => mod.updateLogo(req, res));
});
router.put('/company/profile', authenticate, updateCompany); // Allow updating profile directly

export default router;
