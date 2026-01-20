"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
// Initialize Razorpay only if keys are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new razorpay_1.default({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}
class PaymentService {
    /**
     * Create Razorpay payment link
     */
    async createPaymentLink(options) {
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
        }
        catch (error) {
            console.error('Razorpay payment link creation error:', error);
            throw new Error(`Payment link creation failed: ${error.message}`);
        }
    }
    /**
     * Verify Razorpay payment signature
     */
    verifyPaymentSignature(orderId, paymentId, signature) {
        try {
            const text = `${orderId}|${paymentId}`;
            const generatedSignature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
                .update(text)
                .digest('hex');
            return generatedSignature === signature;
        }
        catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }
    /**
     * Get payment details
     */
    async getPaymentDetails(paymentId) {
        try {
            if (!razorpay) {
                throw new Error('Razorpay is not configured');
            }
            const payment = await razorpay.payments.fetch(paymentId);
            return payment;
        }
        catch (error) {
            console.error('Get payment details error:', error);
            throw new Error(`Failed to get payment details: ${error.message}`);
        }
    }
    /**
     * Create Razorpay order
     */
    async createOrder(amount, currency = 'INR', receipt) {
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
        }
        catch (error) {
            console.error('Razorpay order creation error:', error);
            throw new Error(`Order creation failed: ${error.message}`);
        }
    }
    /**
     * Refund payment
     */
    async refundPayment(paymentId, amount, notes) {
        try {
            if (!razorpay) {
                throw new Error('Razorpay is not configured');
            }
            const refundOptions = {
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
        }
        catch (error) {
            console.error('Refund error:', error);
            throw new Error(`Refund failed: ${error.message}`);
        }
    }
}
exports.PaymentService = PaymentService;
exports.default = new PaymentService();
//# sourceMappingURL=payment.service.js.map