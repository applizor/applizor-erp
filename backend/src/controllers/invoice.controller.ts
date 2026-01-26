import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { InvoiceService } from '../services/invoice.service';
import documentService, { LetterheadMode } from '../services/document.service';
import * as emailService from '../services/email.service';
import { PDFService } from '../services/pdf.service';

/**
 * Create a new invoice
 */
export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    const invoice = await InvoiceService.createInvoice({
      ...req.body,
      companyId: user.companyId,
      createdBy: userId,
    });

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice', details: error.message });
  }
};

/**
 * Get list of invoices with pagination and filters
 */
export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    const { status, clientId, page = 1, limit = 10, search } = req.query;

    const where: any = {
      companyId: user.companyId,
    };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: String(search), mode: 'insensitive' } },
        { client: { name: { contains: String(search), mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: true,
          items: true,
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices', details: error.message });
  }
};

/**
 * Get a single invoice by ID
 */
export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        company: true,
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ invoice });
  } catch (error: any) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to get invoice', details: error.message });
  }
};

/**
 * Generate Invoice PDF
 */
export const generateInvoicePDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Use PDFService (HTML-to-PDF) for cleaner output
    const pdfBuffer = await PDFService.generateInvoicePDF({
      ...invoice,
      company: {
        ...invoice.company,
        digitalSignature: invoice.company.digitalSignature || undefined,
        letterhead: invoice.company.letterhead || undefined,
        continuationSheet: invoice.company.continuationSheet || undefined,
        pdfMarginTop: (invoice.company as any).pdfMarginTop || undefined,
        pdfMarginBottom: (invoice.company as any).pdfMarginBottom || undefined,
        pdfMarginLeft: (invoice.company as any).pdfMarginLeft || undefined,
        pdfMarginRight: (invoice.company as any).pdfMarginRight || undefined,
        pdfContinuationTop: (invoice.company as any).pdfContinuationTop || undefined
      },
      useLetterhead: req.body.useLetterhead === true || req.query.useLetterhead === 'true'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

/**
 * Record a payment for an invoice
 */
export const recordPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }

    const updatedInvoice = await InvoiceService.recordPayment(id, Number(amount), paymentMethod, transactionId);

    res.json({
      message: 'Payment recorded successfully',
      invoice: updatedInvoice
    });
  } catch (error: any) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to record payment' });
  }
};

/**
 * Get invoice statistics for dashboard
 */
export const getInvoiceStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return res.status(400).json({ error: 'Company not found' });

    const stats = await InvoiceService.getDashboardStats(user.companyId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

/**
 * Send invoice via email
 */
export const sendInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, company: true, items: true }
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (!invoice.client.email) return res.status(400).json({ error: 'Client has no email' });

    const pdfBuffer = await PDFService.generateInvoicePDF({
      ...invoice,
      useLetterhead: req.body.useLetterhead === true
    });

    const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/invoices/${invoice.id}`;
    await emailService.sendInvoiceEmail(invoice.client.email, invoice, pdfBuffer, false, publicUrl);

    if (invoice.status === 'draft') {
      await prisma.invoice.update({
        where: { id },
        data: { status: 'sent' }
      });
    }

    res.json({ message: 'Invoice sent successfully' });
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

/**
 * Update invoice status manually
 */
export const updateInvoiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status },
    });

    res.json({ message: 'Invoice status updated', invoice });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

/**
 * Batch update invoice status
 */
export const batchUpdateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    await prisma.invoice.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });

    res.json({ message: `Successfully updated ${ids.length} invoices` });
  } catch (error: any) {
    res.status(500).json({ error: 'Batch update failed' });
  }
};

/**
 * Batch send invoices via email
 */
export const batchSendInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { id: { in: ids } },
      include: { client: true, company: true, items: true }
    });

    // Send emails in background
    for (const invoice of invoices) {
      if (invoice.client?.email) {
        const pdfBuffer = await PDFService.generateInvoicePDF(invoice as any);
        emailService.sendInvoiceEmail(invoice.client.email, invoice, pdfBuffer).catch(err => {
          console.error(`Failed to send batch email for ${invoice.invoiceNumber}`, err);
        });

        if (invoice.status === 'draft') {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'sent' }
          });
        }
      }
    }

    res.json({ message: `Initiated sending for ${invoices.length} invoices` });
  } catch (error: any) {
    res.status(500).json({ error: 'Batch send failed' });
  }
};

/**
 * Convert quotation to invoice
 */

/**
 * Update an invoice
 */
export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    const invoice = await InvoiceService.updateInvoice(id, {
      ...req.body,
      companyId: user.companyId,
    });

    res.json({
      message: 'Invoice updated successfully',
      invoice,
    });
  } catch (error: any) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice', details: error.message });
  }
};

/**
 * Convert quotation to invoice
 */
export const convertQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await InvoiceService.convertQuotationToInvoice(id);
    res.json({ message: 'Quotation converted successfully', invoice });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Conversion failed' });
  }
};

/**
 * Get public invoice details by ID
 */
export const getPublicInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        client: true,
        items: true,
        payments: true, // Include payments for timeline
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ invoice });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch invoice', details: error.message });
  }
};

/**
 * Get public invoice PDF by ID
 */
export const getPublicInvoicePdf = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const pdfBuffer = await PDFService.generateInvoicePDF({ ...invoice, useLetterhead: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Get public PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
};
