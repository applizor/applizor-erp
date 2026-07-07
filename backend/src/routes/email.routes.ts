import { Router } from 'express';
import { sendGenericEmail } from '../controllers/email.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Used for AI and third-party integrations to send emails dynamically
router.post('/send', authenticate, sendGenericEmail);

export default router;
