import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import paymentService from '../services/payment.service';

export const createPaymentLink = async (req: AuthRequest, res: Response) => {
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
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Create payment link
    const paymentLink = await paymentService.createPaymentLink({
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
    const payment = await prisma.payment.create({
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
  } catch (error: any) {
    console.error('Create payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link', details: error.message });
  }
};

export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'] as string;
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
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
      const paymentRecord = await prisma.payment.findFirst({
        where: {
          gatewayOrderId: payment.order_id,
          transactionId: payment.id,
        },
        include: { invoice: true },
      });

      if (paymentRecord) {
        // Update payment status
        await prisma.payment.update({
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

          await prisma.invoice.update({
            where: { id: paymentRecord.invoiceId! },
            data: {
              paidAmount: newPaidAmount,
              status,
            },
          });
        }
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed', details: error.message });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, orderId, signature } = req.body;

    if (!paymentId || !orderId || !signature) {
      return res.status(400).json({ error: 'Payment ID, Order ID, and Signature are required' });
    }

    // Verify signature
    const isValid = paymentService.verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get payment details from Razorpay
    const paymentDetails = await paymentService.getPaymentDetails(paymentId);

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: paymentId,
      },
      include: { invoice: true },
    });

    if (payment && payment.invoice) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
        },
      });

      // Update invoice
      const newPaidAmount = payment.invoice.paidAmount + payment.amount;
      const status = newPaidAmount >= payment.invoice.total ? 'paid' : 'partial';

      await prisma.invoice.update({
        where: { id: payment.invoiceId! },
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
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment', details: error.message });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { invoiceId, status, page = 1, limit = 10 } = req.query;

    const where: any = {};

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
      prisma.payment.count({ where }),
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
  } catch (error: any) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments', details: error.message });
  }
};
