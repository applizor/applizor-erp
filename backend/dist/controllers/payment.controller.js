"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayments = exports.verifyPayment = exports.handlePaymentWebhook = exports.createPaymentLink = void 0;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = __importDefault(require("../prisma/client"));
const payment_service_1 = __importDefault(require("../services/payment.service"));
const createPaymentLink = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { invoiceId, amount, description, customer } = req.body;
        if (!invoiceId || !amount) {
            return res.status(400).json({ error: 'Invoice ID and amount are required' });
        }
        // Get invoice
        const invoice = await client_1.default.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: true },
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Create payment link
        const paymentLink = await payment_service_1.default.createPaymentLink({
            amount: amount || invoice.total,
            currency: 'INR',
            description: description || `Payment for Invoice ${invoice.invoiceNumber}`,
            customer: customer || {
                name: invoice.client.name,
                email: invoice.client.email || '',
                contact: invoice.client.phone || '',
            },
            notes: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
            },
            callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
        });
        // Save payment record
        const payment = await client_1.default.payment.create({
            data: {
                invoiceId: invoice.id,
                amount: amount || invoice.total,
                paymentDate: new Date(),
                paymentMethod: 'razorpay',
                gateway: 'razorpay',
                gatewayOrderId: paymentLink.id,
                status: 'pending',
            },
        });
        res.json({
            message: 'Payment link created successfully',
            paymentLink: {
                id: paymentLink.id,
                short_url: paymentLink.short_url,
                amount: paymentLink.amount / 100,
            },
            payment,
        });
    }
    catch (error) {
        console.error('Create payment link error:', error);
        res.status(500).json({ error: 'Failed to create payment link', details: error.message });
    }
};
exports.createPaymentLink = createPaymentLink;
const handlePaymentWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(req.body);
        // Verify webhook signature
        const expectedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(webhookBody)
            .digest('hex');
        if (webhookSignature !== expectedSignature) {
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }
        const event = req.body.event;
        const payload = req.body.payload;
        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            // Find payment record
            const paymentRecord = await client_1.default.payment.findFirst({
                where: {
                    gatewayOrderId: payment.order_id,
                    transactionId: payment.id,
                },
                include: { invoice: true },
            });
            if (paymentRecord) {
                // Update payment status
                await client_1.default.payment.update({
                    where: { id: paymentRecord.id },
                    data: {
                        status: 'success',
                        transactionId: payment.id,
                    },
                });
                // Update invoice
                if (paymentRecord.invoice) {
                    const newPaidAmount = paymentRecord.invoice.paidAmount + payment.amount / 100;
                    const status = newPaidAmount >= paymentRecord.invoice.total ? 'paid' : 'partial';
                    await client_1.default.invoice.update({
                        where: { id: paymentRecord.invoiceId },
                        data: {
                            paidAmount: newPaidAmount,
                            status,
                        },
                    });
                }
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed', details: error.message });
    }
};
exports.handlePaymentWebhook = handlePaymentWebhook;
const verifyPayment = async (req, res) => {
    try {
        const { paymentId, orderId, signature } = req.body;
        if (!paymentId || !orderId || !signature) {
            return res.status(400).json({ error: 'Payment ID, Order ID, and Signature are required' });
        }
        // Verify signature
        const isValid = payment_service_1.default.verifyPaymentSignature(orderId, paymentId, signature);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }
        // Get payment details from Razorpay
        const paymentDetails = await payment_service_1.default.getPaymentDetails(paymentId);
        // Find payment record
        const payment = await client_1.default.payment.findFirst({
            where: {
                transactionId: paymentId,
            },
            include: { invoice: true },
        });
        if (payment && payment.invoice) {
            // Update payment status
            await client_1.default.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'success',
                },
            });
            // Update invoice
            const newPaidAmount = payment.invoice.paidAmount + payment.amount;
            const status = newPaidAmount >= payment.invoice.total ? 'paid' : 'partial';
            await client_1.default.invoice.update({
                where: { id: payment.invoiceId },
                data: {
                    paidAmount: newPaidAmount,
                    status,
                },
            });
        }
        res.json({
            message: 'Payment verified successfully',
            payment: paymentDetails,
        });
    }
    catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment', details: error.message });
    }
};
exports.verifyPayment = verifyPayment;
const getPayments = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { invoiceId, status, page = 1, limit = 10 } = req.query;
        const where = {};
        if (invoiceId) {
            where.invoiceId = invoiceId;
        }
        if (status) {
            where.status = status;
        }
        const [payments, total] = await Promise.all([
            client_1.default.payment.findMany({
                where,
                include: {
                    invoice: {
                        include: {
                            client: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            client_1.default.payment.count({ where }),
        ]);
        res.json({
            payments,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to get payments', details: error.message });
    }
};
exports.getPayments = getPayments;
//# sourceMappingURL=payment.controller.js.map