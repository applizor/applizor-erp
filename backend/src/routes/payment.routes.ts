import { Router, Request, Response } from 'express';
import {
  createPaymentLink,
  handlePaymentWebhook,
  verifyPayment,
  getPayments,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Webhook endpoint (no auth required, uses signature verification)
router.post('/webhook', (req: Request, res: Response) => {
  handlePaymentWebhook(req, res);
});

// Protected routes
router.post('/link', authenticate, createPaymentLink);
router.post('/verify', authenticate, verifyPayment);
router.get('/', authenticate, getPayments);

export default router;
