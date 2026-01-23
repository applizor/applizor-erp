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
export declare class PaymentService {
    /**
     * Create Razorpay payment link
     */
    createPaymentLink(options: PaymentLinkOptions): Promise<import("razorpay/dist/types/paymentLink").PaymentLinks.RazorpayPaymentLink>;
    /**
     * Verify Razorpay payment signature
     */
    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
    /**
     * Get payment details
     */
    getPaymentDetails(paymentId: string): Promise<import("razorpay/dist/types/payments").Payments.RazorpayPayment>;
    /**
     * Create Razorpay order
     */
    createOrder(amount: number, currency?: string, receipt?: string): Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder>;
    /**
     * Refund payment
     */
    refundPayment(paymentId: string, amount?: number, notes?: Record<string, string>): Promise<import("razorpay/dist/types/refunds").Refunds.RazorpayRefund>;
}
declare const _default: PaymentService;
export default _default;
//# sourceMappingURL=payment.service.d.ts.map