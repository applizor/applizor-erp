import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import paypal from '@paypal/checkout-server-sdk';

// Initialize Razorpay
let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Initialize Cashfree
let cashfree: Cashfree | null = null;
if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
  cashfree = new Cashfree(
    process.env.NODE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
  );
}

// Initialize PayPal
let paypalClient: paypal.core.PayPalHttpClient | null = null;
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  const Environment = process.env.NODE_ENV === 'production'
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;

  const env = new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
  paypalClient = new paypal.core.PayPalHttpClient(env);
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
   * RAZORPAY: Create Payment Link
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
      throw new Error(`Razorpay Link failed: ${error.message}`);
    }
  }

  /**
   * RAZORPAY: Create Order
   */
  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    try {
      if (!razorpay) throw new Error('Razorpay is not configured');
      return await razorpay.orders.create({
        amount: amount * 100,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      });
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      throw new Error(`Razorpay Order failed: ${error.message}`);
    }
  }

  /**
   * RAZORPAY: Verify Signature
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');
    return generatedSignature === signature;
  }

  /**
   * CASHFREE: Create Order
   */
  async createCashfreeOrder(amount: number, customerId: string, customerPhone: string, customerEmail: string, returnUrl?: string) {
    try {
      if (!cashfree) throw new Error('Cashfree is not configured');

      const request = {
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customerId,
          customer_phone: customerPhone,
          customer_email: customerEmail
        },
        order_meta: {
          return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/cashfree/callback?order_id={order_id}`
        }
      };

      const response = await cashfree.PGCreateOrder(request);
      return response.data;
    } catch (error: any) {
      console.error('Cashfree order creation error:', error);
      throw new Error(`Cashfree Order failed: ${error.message}`);
    }
  }

  /**
   * CASHFREE: Verify Webhook Signature
   */
  verifyCashfreeSignature(timestamp: string, rawBody: string, signature: string): boolean {
    const dbSecret = process.env.CASHFREE_SECRET_KEY || '';
    const data = timestamp + rawBody;
    const genSignature = crypto.createHmac('sha256', dbSecret).update(data).digest('base64');
    return genSignature === signature;
  }

  /**
   * PAYPAL: Create Order
   */
  async createPaypalOrder(amount: number, currency: string = 'USD') {
    try {
      if (!paypalClient) throw new Error('PayPal is not configured');

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }]
      });

      const response = await paypalClient.execute(request);
      return response.result;
    } catch (error: any) {
      console.error('PayPal order creation error:', error);
      throw new Error(`PayPal Order failed: ${error.message}`);
    }
  }

  /**
   * PAYPAL: Capture Order
   */
  async capturePaypalOrder(orderId: string) {
    try {
      if (!paypalClient) throw new Error('PayPal is not configured');

      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({} as any);

      const response = await paypalClient.execute(request);
      return response.result;
    } catch (error: any) {
      console.error('PayPal capture error:', error);
      throw new Error(`PayPal Capture failed: ${error.message}`);
    }
  }

  /**
   * GENERIC: Get Payment Details (Generic wrapper logic could go here)
   */
  async getGenericPaymentDetails(provider: 'razorpay' | 'cashfree' | 'paypal', id: string) {
    // Placeholder for unified fetch logic
    if (provider === 'razorpay') {
      if (!razorpay) throw new Error('Razorpay not configured');
      return await razorpay.payments.fetch(id);
    }
    // Add others if SDKs support direct fetch by ID simply
    throw new Error('Provider details fetch not implemented');
  }

  async getPaymentDetails(provider: 'razorpay' | 'cashfree' | 'paypal', id: string) {
    return this.getGenericPaymentDetails(provider, id);
  }
}

export default new PaymentService();
