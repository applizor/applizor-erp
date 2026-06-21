import { Router } from 'express';
import { sendGenericEmail } from '../controllers/email.controller';

const router = Router();

// Used for AI and third-party integrations to send emails dynamically
router.post('/send', sendGenericEmail);

export default router;
