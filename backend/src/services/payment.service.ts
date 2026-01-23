import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay only if keys are provided
let razorpay: Razorpay | null = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export interface PaymentLinkOptions {
  amount: number;
  currency?: string;
  description: string;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  callback_url?: string;
  callback_method?: 'get' | 'post';
}

export class PaymentService {
  /**
   * Create Razorpay payment link
   */
  async createPaymentLink(options: PaymentLinkOptions) {
    try {
      if (!razorpay) {
        throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
      }

      const paymentLink = await razorpay.paymentLink.create({
        amount: options.amount * 100, // Convert to paise
        currency: options.currency || 'INR',
        description: options.description,
        customer: options.customer,
        notify: {
          sms: true,
          email: true,
        },
        reminder_enable: true,
        notes: options.notes || {},
        callback_url: options.callback_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
        callback_method: options.callback_method || 'get',
      });

      return paymentLink;
    } catch (error: any) {
      console.error('Razorpay payment link creation error:', error);
      throw new Error(`Payment link creation failed: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const text = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(text)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string) {
    try {
      if (!razorpay) {
        throw new Error('Razorpay is not configured');
      }

      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      console.error('Get payment details error:', error);
      throw new Error(`Failed to get payment details: ${error.message}`);
    }
  }

  /**
   * Create Razorpay order
   */
  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    try {
      if (!razorpay) {
        throw new Error('Razorpay is not configured');
      }

      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      });

      return order;
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      throw new Error(`Order creation failed: ${error.message}`);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number, notes?: Record<string, string>) {
    try {
      if (!razorpay) {
        throw new Error('Razorpay is not configured');
      }

      const refundOptions: any = {
        payment_id: paymentId,
      };

      if (amount) {
        refundOptions.amount = amount * 100; // Convert to paise
      }

      if (notes) {
        refundOptions.notes = notes;
      }

      const refund = await razorpay.payments.refund(paymentId, refundOptions);
      return refund;
    } catch (error: any) {
      console.error('Refund error:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }
}

export default new PaymentService();
