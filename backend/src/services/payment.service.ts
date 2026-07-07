import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import paypal from '@paypal/checkout-server-sdk';

// Initialize global fallbacks for legacy static code
let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

let cashfree: Cashfree | null = null;
if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
  cashfree = new Cashfree(
    process.env.NODE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
  );
}

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

export interface GatewayConfig {
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  cashfreeAppId?: string;
  cashfreeSecretKey?: string;
  paypalClientId?: string;
  paypalClientSecret?: string;
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
   * Helper to retrieve Razorpay client
   */
  getRazorpayClient(config?: GatewayConfig): Razorpay {
    const keyId = config?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = config?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('Razorpay is not configured');
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  /**
   * Helper to retrieve Cashfree client
   */
  getCashfreeClient(config?: GatewayConfig): Cashfree {
    const appId = config?.cashfreeAppId || process.env.CASHFREE_APP_ID;
    const secretKey = config?.cashfreeSecretKey || process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secretKey) {
      throw new Error('Cashfree is not configured');
    }
    return new Cashfree(
      process.env.NODE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      appId,
      secretKey
    );
  }

  /**
   * Helper to retrieve PayPal client
   */
  getPaypalClient(config?: GatewayConfig): paypal.core.PayPalHttpClient {
    const clientId = config?.paypalClientId || process.env.PAYPAL_CLIENT_ID;
    const clientSecret = config?.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('PayPal is not configured');
    }
    const Environment = process.env.NODE_ENV === 'production'
      ? paypal.core.LiveEnvironment
      : paypal.core.SandboxEnvironment;
    const env = new Environment(clientId, clientSecret);
    return new paypal.core.PayPalHttpClient(env);
  }

  /**
   * RAZORPAY: Create Payment Link
   */
  async createPaymentLink(options: PaymentLinkOptions, config?: GatewayConfig) {
    try {
      const rzp = this.getRazorpayClient(config);
      const paymentLink = await rzp.paymentLink.create({
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
  async createOrder(amount: number, currency: string = 'INR', receipt?: string, config?: GatewayConfig) {
    try {
      const rzp = this.getRazorpayClient(config);
      return await rzp.orders.create({
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
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string, config?: GatewayConfig): boolean {
    const text = `${orderId}|${paymentId}`;
    const keySecret = config?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');
    return generatedSignature === signature;
  }

  /**
   * CASHFREE: Create Order
   */
  async createCashfreeOrder(
    amount: number,
    customerId: string,
    customerPhone: string,
    customerEmail: string,
    returnUrl?: string,
    config?: GatewayConfig
  ) {
    try {
      const cf = this.getCashfreeClient(config);

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

      const response = await cf.PGCreateOrder(request);
      return response.data;
    } catch (error: any) {
      console.error('Cashfree order creation error:', error);
      throw new Error(`Cashfree Order failed: ${error.message}`);
    }
  }

  /**
   * CASHFREE: Verify Webhook Signature
   */
  verifyCashfreeSignature(timestamp: string, rawBody: string, signature: string, config?: GatewayConfig): boolean {
    const secretKey = config?.cashfreeSecretKey || process.env.CASHFREE_SECRET_KEY || '';
    const data = timestamp + rawBody;
    const genSignature = crypto.createHmac('sha256', secretKey).update(data).digest('base64');
    return genSignature === signature;
  }

  /**
   * PAYPAL: Create Order
   */
  async createPaypalOrder(amount: number, currency: string = 'USD', config?: GatewayConfig) {
    try {
      const pClient = this.getPaypalClient(config);

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

      const response = await pClient.execute(request);
      return response.result;
    } catch (error: any) {
      console.error('PayPal order creation error:', error);
      throw new Error(`PayPal Order failed: ${error.message}`);
    }
  }

  /**
   * PAYPAL: Capture Order
   */
  async capturePaypalOrder(orderId: string, config?: GatewayConfig) {
    try {
      const pClient = this.getPaypalClient(config);

      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({} as any);

      const response = await pClient.execute(request);
      return response.result;
    } catch (error: any) {
      console.error('PayPal capture error:', error);
      throw new Error(`PayPal Capture failed: ${error.message}`);
    }
  }

  /**
   * GENERIC: Get Payment Details
   */
  async getGenericPaymentDetails(provider: 'razorpay' | 'cashfree' | 'paypal', id: string, config?: GatewayConfig) {
    if (provider === 'razorpay') {
      const rzp = this.getRazorpayClient(config);
      return await rzp.payments.fetch(id);
    }
    throw new Error('Provider details fetch not implemented');
  }

  async getPaymentDetails(provider: 'razorpay' | 'cashfree' | 'paypal', id: string, config?: GatewayConfig) {
    return this.getGenericPaymentDetails(provider, id, config);
  }
}

export default new PaymentService();
