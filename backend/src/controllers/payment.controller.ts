import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import paymentService from '../services/payment.service';
import * as accountingService from '../services/accounting.service';

export const createPaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { invoiceId, amount, description } = req.body;

    if (!invoiceId || !amount) {
      return res.status(400).json({ error: 'Invoice ID and amount are required' });
    }

    // Get invoice
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId: req.user!.companyId },
      include: { client: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Load company settings to get payment credentials
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      select: { paymentConfig: true },
    });

    const paymentConfig = (company?.paymentConfig as any) || {};
    const preferredGateway = paymentConfig.preferredGateway || 'razorpay';

    let paymentLinkData: { id: string; short_url: string; amount: number };
    let gatewayMethod = preferredGateway;

    if (preferredGateway === 'cashfree') {
      const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback?gateway=cashfree`;
      const cfOrder = await paymentService.createCashfreeOrder(
        Number(amount || invoice.total),
        invoice.clientId || 'guest',
        invoice.client.phone || '9999999999',
        invoice.client.email || 'customer@acme.com',
        returnUrl,
        paymentConfig
      );

      const isProd = process.env.NODE_ENV === 'production';
      const checkoutUrl = isProd
        ? `https://api.cashfree.com/pg/view/checkout?session_id=${cfOrder.payment_session_id}`
        : `https://sandbox.cashfree.com/pg/view/checkout?session_id=${cfOrder.payment_session_id}`;

      paymentLinkData = {
        id: cfOrder.order_id ?? '',
        short_url: checkoutUrl,
        amount: Number(amount || invoice.total),
      };
    } else if (preferredGateway === 'paypal') {
      const paypalOrder = await paymentService.createPaypalOrder(
        Number(amount || invoice.total),
        invoice.currency || 'USD',
        paymentConfig
      );

      const approveLink = paypalOrder.links.find((l: any) => l.rel === 'approve')?.href;
      if (!approveLink) {
        throw new Error('PayPal approval link missing');
      }

      paymentLinkData = {
        id: paypalOrder.id,
        short_url: approveLink,
        amount: Number(amount || invoice.total),
      };
    } else {
      // Default to Razorpay
      const rzpLink = await paymentService.createPaymentLink(
        {
          amount: Number(amount || invoice.total),
          currency: 'INR',
          description: description || `Payment for Invoice ${invoice.invoiceNumber}`,
          customer: {
            name: invoice.client.name,
            email: invoice.client.email || '',
            contact: invoice.client.phone || '',
          },
          notes: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
          },
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback?gateway=razorpay`,
        },
        paymentConfig
      );

      paymentLinkData = {
        id: rzpLink.id,
        short_url: rzpLink.short_url,
        amount: Number(rzpLink.amount) / 100,
      };
      gatewayMethod = 'razorpay';
    }

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: Number(amount || invoice.total),
        paymentDate: new Date(),
        paymentMethod: gatewayMethod,
        gateway: gatewayMethod,
        gatewayOrderId: paymentLinkData.id,
        status: 'pending',
      },
    });

    res.json({
      message: 'Payment link created successfully',
      paymentLink: paymentLinkData,
      payment,
    });
  } catch (error: any) {
    console.error('Create payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link', details: error.message });
  }
};

export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const webhookBody = JSON.stringify(req.body);
    const razorpaySignature = req.headers['x-razorpay-signature'] as string;
    const cfSignature = req.headers['x-webhook-signature'] as string;
    const cfTimestamp = req.headers['x-webhook-timestamp'] as string;

    let matchedPaymentId: string | null = null;
    let matchedTransactionId: string | null = null;
    let amountPaid = 0;
    let isVerified = false;

    if (cfSignature && cfTimestamp) {
      // Cashfree Webhook
      const orderId = req.body.data?.order?.order_id;
      if (orderId) {
        const paymentRecord = await prisma.payment.findFirst({
          where: { gatewayOrderId: orderId },
          include: { invoice: true },
        });

        if (paymentRecord && paymentRecord.invoice) {
          const company = await prisma.company.findUnique({
            where: { id: paymentRecord.invoice.companyId },
            select: { paymentConfig: true },
          });

          const paymentConfig = (company?.paymentConfig as any) || {};
          isVerified = paymentService.verifyCashfreeSignature(
            cfTimestamp,
            webhookBody,
            cfSignature,
            paymentConfig
          );

          if (isVerified && req.body.event === 'ORDER_PAID') {
            matchedPaymentId = paymentRecord.id;
            matchedTransactionId = req.body.data?.payment?.cf_payment_id || orderId;
            amountPaid = Number(req.body.data?.payment?.payment_amount || paymentRecord.amount);
          }
        }
      }
    } else if (razorpaySignature) {
      // Razorpay Webhook
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(webhookBody)
        .digest('hex');

      if (razorpaySignature === expectedSignature && req.body.event === 'payment.captured') {
        const rzpPayment = req.body.payload.payment.entity;
        const paymentRecord = await prisma.payment.findFirst({
          where: { gatewayOrderId: rzpPayment.order_id },
          include: { invoice: true },
        });

        if (paymentRecord) {
          isVerified = true;
          matchedPaymentId = paymentRecord.id;
          matchedTransactionId = rzpPayment.id;
          amountPaid = Number(rzpPayment.amount) / 100;
        }
      }
    }

    if (isVerified && matchedPaymentId) {
      // Find payment record
      const paymentRecord = await prisma.payment.findUnique({
        where: { id: matchedPaymentId },
        include: { invoice: true },
      });

      if (paymentRecord && paymentRecord.status !== 'success') {
        // Update payment status
        await prisma.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: 'success',
            transactionId: matchedTransactionId,
          },
        });

        // Post to Ledger
        try {
          await accountingService.postPaymentToLedger(paymentRecord.id);
        } catch (postError) {
          console.error('Failed to post webhook payment to ledger:', postError);
        }

        // Update invoice
        if (paymentRecord.invoice) {
          const newPaidAmount = Number(paymentRecord.invoice.paidAmount) + amountPaid;
          const status = newPaidAmount >= Number(paymentRecord.invoice.total) ? 'paid' : 'partial';

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
    const { gateway, paymentId, orderId, signature } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      select: { paymentConfig: true },
    });
    const paymentConfig = (company?.paymentConfig as any) || {};
    const selectedGateway = gateway || paymentConfig.preferredGateway || 'razorpay';

    let isSuccess = false;
    let gatewayTxnId = paymentId;
    let localGatewayOrderId = orderId;
    let details: any = null;

    if (selectedGateway === 'cashfree') {
      if (!orderId) {
        return res.status(400).json({ error: 'Cashfree order ID is required' });
      }
      const cf = paymentService.getCashfreeClient(paymentConfig);
      const resCf = await (cf as any).PGFetchOrder(orderId);
      details = resCf.data;
      isSuccess = details.order_status === 'PAID';
      localGatewayOrderId = orderId;
      gatewayTxnId = orderId;
    } else if (selectedGateway === 'paypal') {
      if (!orderId) {
        return res.status(400).json({ error: 'PayPal order ID is required' });
      }
      const captureResult = await paymentService.capturePaypalOrder(orderId, paymentConfig);
      details = captureResult;
      isSuccess = details.status === 'COMPLETED';
      localGatewayOrderId = orderId;
      gatewayTxnId = details.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId;
    } else {
      // Default to Razorpay
      if (!paymentId || !orderId || !signature) {
        return res.status(400).json({ error: 'Razorpay parameters missing' });
      }
      isSuccess = paymentService.verifyPaymentSignature(orderId, paymentId, signature, paymentConfig);
      if (isSuccess) {
        details = await paymentService.getPaymentDetails('razorpay', paymentId, paymentConfig);
      }
    }

    if (!isSuccess) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Find local payment record
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { gatewayOrderId: localGatewayOrderId },
          { transactionId: gatewayTxnId },
        ],
      },
      include: { invoice: true },
    });

    if (payment && payment.status !== 'success') {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
          transactionId: gatewayTxnId,
        },
      });

      // Post to Ledger
      try {
        await accountingService.postPaymentToLedger(payment.id);
      } catch (postError) {
        console.error('Failed to post verified payment to ledger:', postError);
      }

      // Update invoice
      if (payment.invoice) {
        const newPaidAmount = Number(payment.invoice.paidAmount) + Number(payment.amount);
        const status = newPaidAmount >= Number(payment.invoice.total) ? 'paid' : 'partial';

        await prisma.invoice.update({
          where: { id: payment.invoiceId! },
          data: {
            paidAmount: newPaidAmount,
            status,
          },
        });
      }
    }

    res.json({
      message: 'Payment verified successfully',
      status: 'success',
      transactionId: gatewayTxnId,
      details,
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

    const where: any = {
      invoice: { companyId: req.user!.companyId }
    };

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

export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find payment first to check permissions and get amount
    const payment = await prisma.payment.findFirst({
      where: { id, invoice: { companyId: req.user!.companyId } },
      include: { invoice: true }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Transaction to delete payment and update invoice
    await prisma.$transaction(async (tx) => {
      // 1. Update Invoice Paid Amount and Status
      if (payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: payment.invoiceId }
        });

        if (invoice) {
          const newPaidAmount = Math.max(0, Number(invoice.paidAmount) - Number(payment.amount));
          let newStatus = invoice.status;

          if (newPaidAmount === 0) {
            newStatus = 'sent'; // Revert to sent if no payment left
          } else if (newPaidAmount < Number(invoice.total)) {
            newStatus = 'partial';
          }

          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus
            }
          });
        }
      }
      // 2. Delete Payment
      await tx.payment.delete({
        where: { id }
      });

      // 3. Delete Ledger Postings inside transaction for consistency
      await accountingService.deleteLedgerPostings(`PAY-${id.slice(-6).toUpperCase()}`, tx);

      // 4. Log Activity
      await tx.auditLog.create({
        data: {
          companyId: payment.invoice?.companyId || '',
          action: 'DELETE',
          module: 'PAYMENT',
          entityType: 'Payment',
          entityId: id,
          details: `Deleted payment of ${payment.amount} for Invoice ${payment.invoice?.invoiceNumber}`,
          userId: userId
        }
      });
    });

    res.json({ message: 'Payment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

