import { Router } from 'express';
import { generateExperienceLetter } from '../controllers/experience-letter.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:employeeId/experience-letter', authenticate, generateExperienceLetter);

export default router;
