import { Router, Request, Response } from 'express';
import {
  createPaymentLink,
  handlePaymentWebhook,
  verifyPayment,
  getPayments,
  deletePayment // Import the new controller
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/enforcePlanLimit';

const router = Router();

// Webhook endpoint (no auth required, uses signature verification)
router.post('/webhook', (req: Request, res: Response) => {
  handlePaymentWebhook(req, res);
});

// Protected routes (gated by whiteLabel feature)
router.post('/link', authenticate, requireFeature('whiteLabel'), createPaymentLink);
router.post('/verify', authenticate, requireFeature('whiteLabel'), verifyPayment);
router.get('/', authenticate, requireFeature('whiteLabel'), getPayments);
router.delete('/:id', authenticate, requireFeature('whiteLabel'), deletePayment); // Add delete route

export default router;
