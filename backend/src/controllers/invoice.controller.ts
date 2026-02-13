import { Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { InvoiceService } from '../services/invoice.service';
import documentService, { LetterheadMode } from '../services/document.service';
import * as emailService from '../services/email.service';
import { PDFService } from '../services/pdf.service';
import { v4 as uuidv4 } from 'uuid';
import { PermissionService } from '../services/permission.service';

/**
 * Create a new invoice
 */
export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    const invoice = await InvoiceService.createInvoice({
      ...req.body,
      companyId: user.companyId,
      createdBy: userId,
    });

    // Log Activity
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: invoice.id,
          type: 'STATUS_CHANGE',
          ipAddress,
          userAgent,
          browser: 'Admin',
          metadata: {
            new_status: invoice.status,
            action: 'CREATED',
            userId: userId,
            userName: `${user.firstName} ${user.lastName}`
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log invoice creation:', logError);
    }

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

    const user = req.user;

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
          items: {
            include: {
              appliedTaxes: true
            }
          },
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
        items: {
          include: {
            appliedTaxes: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Hydrate appliedTaxes for legacy invoices
    const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
    const taxMap = new Map<number, any>();
    allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));

    const hydratedItems = invoice.items.map((item: any) => {
      // Check for legacy tax rate if appliedTaxes is empty
      if ((!item.appliedTaxes || item.appliedTaxes.length === 0)) {
        const legacyRate = Number(item.taxRate) || Number(item.tax) || 0;

        if (legacyRate > 0) {
          const taxConfig = taxMap.get(legacyRate);
          const quantity = Number(item.quantity);
          const unitPrice = Number(item.rate || item.unitPrice || 0);
          const amount = (quantity * unitPrice * legacyRate) / 100;

          return {
            ...item,
            appliedTaxes: [{
              id: 'legacy-hydrate',
              invoiceItemId: item.id,
              taxRateId: taxConfig?.id || 'legacy',
              name: taxConfig?.name || 'Tax',
              percentage: new Decimal(legacyRate),
              amount: new Decimal(amount)
            }]
          };
        }
      }
      return item;
    });

    res.json({ invoice: { ...invoice, items: hydratedItems } });
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
        items: {
          include: {
            appliedTaxes: true
          }
        },
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Calculate Tax Breakdown
    // Fetch all tax rates to fallback intelligently
    const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
    const taxMap = new Map<number, string>();
    allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));

    const taxBreakdown: Record<string, { name: string; percentage: number; amount: number }> = {};

    ((invoice as any).items || []).forEach((item: any) => {
      // 1. Detailed Taxes
      if (item.appliedTaxes && item.appliedTaxes.length > 0) {
        item.appliedTaxes.forEach((tax: any) => {
          const key = `${tax.name}_${tax.percentage}`;
          if (!taxBreakdown[key]) {
            taxBreakdown[key] = {
              name: tax.name,
              percentage: Number(tax.percentage),
              amount: 0
            };
          }
          taxBreakdown[key].amount += Number(tax.amount);
        });
      }
      // 2. Fallback to simple tax rate
      else if (item.taxRate || item.tax) {
        const rate = Number(item.taxRate || item.tax);
        if (rate > 0) {
          const key = `Tax_${rate}`;
          if (!taxBreakdown[key]) {
            // Try to resolve name from Tax Map
            const resolvedName = taxMap.get(rate) || 'Tax';
            taxBreakdown[key] = {
              name: resolvedName,
              percentage: rate,
              amount: 0
            };
          }
          const amount = (Number(item.quantity) * Number(item.rate || item.unitPrice) * rate) / 100;
          taxBreakdown[key].amount += amount;
        }
      }
    });

    // Use PDFService (HTML-to-PDF) for cleaner output
    const pdfBuffer = await PDFService.generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || undefined,
      notes: invoice.notes || undefined,
      terms: invoice.terms || undefined,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      client: invoice.client ? {
        name: invoice.client.name,
        company: invoice.client.companyName || undefined,
        email: invoice.client.email || undefined,
        phone: invoice.client.phone || undefined,
        mobile: invoice.client.mobile || undefined,
        address: invoice.client.address || undefined,
        city: invoice.client.city || undefined,
        state: invoice.client.state || undefined,
        country: invoice.client.country || undefined,
        pincode: invoice.client.pincode || undefined,
        gstin: invoice.client.gstin || undefined,
        pan: invoice.client.pan || undefined,
        tan: invoice.client.tan || undefined,
        website: invoice.client.website || undefined,
      } : undefined,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit || undefined,
        rate: Number(item.rate || 0),
        discount: Number(item.discount || 0),
        hsnSacCode: item.hsnSacCode || undefined,
        appliedTaxes: (item.appliedTaxes as any[] || []).map(t => ({
          name: t.name,
          percentage: Number(t.percentage),
          amount: Number(t.amount)
        }))
      })),
      taxBreakdown: Object.values(taxBreakdown),
      company: {
        name: invoice.company.name,
        logo: invoice.company.logo || undefined,
        address: invoice.company.address || undefined,
        city: invoice.company.city || undefined,
        state: invoice.company.state || undefined,
        country: invoice.company.country || undefined,
        pincode: invoice.company.pincode || undefined,
        email: invoice.company.email || undefined,
        phone: invoice.company.phone || undefined,
        gstin: invoice.company.gstin || undefined,
        digitalSignature: invoice.company.digitalSignature || undefined,
        letterhead: invoice.company.letterhead || undefined,
        continuationSheet: invoice.company.continuationSheet || undefined,
        pdfMarginTop: (invoice.company as any).pdfMarginTop || undefined,
        pdfMarginBottom: (invoice.company as any).pdfMarginBottom || undefined,
        pdfMarginLeft: (invoice.company as any).pdfMarginLeft || undefined,
        pdfMarginRight: (invoice.company as any).pdfMarginRight || undefined,
        pdfContinuationTop: (invoice.company as any).pdfContinuationTop || undefined,
        bankName: (invoice.company as any).bankName || undefined,
        bankAccountName: (invoice.company as any).bankAccountName || undefined,
        bankAccountNumber: (invoice.company as any).bankAccountNumber || undefined,
        bankIfscCode: (invoice.company as any).bankIfscCode || undefined,
        bankBranch: (invoice.company as any).bankBranch || undefined
      },
      useLetterhead: req.body.useLetterhead === true || req.query.useLetterhead === 'true',
      includeBankDetails: invoice.includeBankDetails
    });

    // Log Activity
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: invoice.id,
          type: 'DOWNLOADED',
          ipAddress,
          userAgent,
          browser: 'Admin',
          metadata: {
            userId: req.userId,
            action: 'DOWNLOAD_PDF'
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log invoice download:', logError);
    }

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

    // Log Activity
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: id,
          type: 'STATUS_CHANGE',
          ipAddress,
          userAgent,
          browser: 'Admin',
          metadata: {
            action: 'PAYMENT_RECORDED',
            amount: Number(amount),
            paymentMethod,
            transactionId,
            new_status: updatedInvoice.status,
            userId: req.userId
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log invoice payment:', logError);
    }

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
    const user = req.user;
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
      include: {
        client: true,
        company: true,
        items: {
          include: {
            appliedTaxes: true
          }
        }
      }
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (!invoice.client.email) return res.status(400).json({ error: 'Client has no email' });

    // Calculate Tax Breakdown
    const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
    const taxMap = new Map<number, string>();
    allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));

    const taxBreakdown: Record<string, { name: string; percentage: number; amount: number }> = {};

    ((invoice as any).items || []).forEach((item: any) => {
      // 1. Detailed Taxes
      if (item.appliedTaxes && item.appliedTaxes.length > 0) {
        item.appliedTaxes.forEach((tax: any) => {
          const key = `${tax.name}_${tax.percentage}`;
          if (!taxBreakdown[key]) {
            taxBreakdown[key] = {
              name: tax.name,
              percentage: Number(tax.percentage),
              amount: 0
            };
          }
          taxBreakdown[key].amount += Number(tax.amount);
        });
      }
      // 2. Fallback
      else if (item.taxRate || item.tax) {
        const rate = Number(item.taxRate || item.tax);
        if (rate > 0) {
          const key = `Tax_${rate}`;
          if (!taxBreakdown[key]) {
            // Try to resolve name from Tax Map
            const resolvedName = taxMap.get(rate) || 'Tax';
            taxBreakdown[key] = {
              name: resolvedName,
              percentage: rate,
              amount: 0
            };
          }
          const amount = (Number(item.quantity) * Number(item.rate || item.unitPrice) * rate) / 100;
          taxBreakdown[key].amount += amount;
        }
      }
    });

    const pdfBuffer = await PDFService.generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || undefined,
      notes: invoice.notes || undefined,
      terms: invoice.terms || undefined,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      client: invoice.client ? {
        name: invoice.client.name,
        company: invoice.client.companyName || undefined,
        email: invoice.client.email || undefined,
        phone: invoice.client.phone || undefined,
        mobile: invoice.client.mobile || undefined,
        address: invoice.client.address || undefined,
        city: invoice.client.city || undefined,
        state: invoice.client.state || undefined,
        country: invoice.client.country || undefined,
        pincode: invoice.client.pincode || undefined,
        gstin: invoice.client.gstin || undefined,
        pan: invoice.client.pan || undefined,
        website: invoice.client.website || undefined,
      } : undefined,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit || undefined,
        rate: Number(item.rate || 0),
        discount: Number(item.discount || 0),
        hsnSacCode: item.hsnSacCode || undefined,
        appliedTaxes: (item.appliedTaxes as any[] || []).map(t => ({
          name: t.name,
          percentage: Number(t.percentage),
          amount: Number(t.amount)
        }))
      })),
      taxBreakdown: Object.values(taxBreakdown),
      company: {
        name: invoice.company.name,
        logo: invoice.company.logo || undefined,
        address: invoice.company.address || undefined,
        city: invoice.company.city || undefined,
        state: invoice.company.state || undefined,
        country: invoice.company.country || undefined,
        pincode: invoice.company.pincode || undefined,
        email: invoice.company.email || undefined,
        phone: invoice.company.phone || undefined,
        gstin: invoice.company.gstin || undefined,
        digitalSignature: invoice.company.digitalSignature || undefined,
        letterhead: invoice.company.letterhead || undefined,
        continuationSheet: invoice.company.continuationSheet || undefined,
        pdfMarginTop: (invoice.company as any).pdfMarginTop || undefined,
        pdfMarginBottom: (invoice.company as any).pdfMarginBottom || undefined,
        pdfMarginLeft: (invoice.company as any).pdfMarginLeft || undefined,
        pdfMarginRight: (invoice.company as any).pdfMarginRight || undefined,
        pdfContinuationTop: (invoice.company as any).pdfContinuationTop || undefined,
        bankName: (invoice.company as any).bankName || undefined,
        bankAccountName: (invoice.company as any).bankAccountName || undefined,
        bankAccountNumber: (invoice.company as any).bankAccountNumber || undefined,
        bankIfscCode: (invoice.company as any).bankIfscCode || undefined,
        bankBranch: (invoice.company as any).bankBranch || undefined
      },
      useLetterhead: req.body.useLetterhead === true,
      includeBankDetails: invoice.includeBankDetails
    });

    const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/invoices/${invoice.id}`;

    // Send in background and update status
    emailService.sendInvoiceEmail(invoice.client.email, invoice, pdfBuffer, false, publicUrl)
      .then(async () => {
        if (invoice.status === 'draft') {
          await prisma.invoice.update({
            where: { id },
            data: { status: 'sent' }
          });
        }
      })
      .catch(err => console.error(`Failed to send invoice ${invoice.invoiceNumber}:`, err));

    res.json({ message: 'Invoice sending initiated' });
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

    // Log Activity
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: id,
          type: 'STATUS_CHANGE',
          ipAddress,
          userAgent,
          browser: 'Admin',
          metadata: {
            action: 'STATUS_UPDATE',
            new_status: status,
            userId: req.userId
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log status update:', logError);
    }

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
      include: {
        client: true,
        company: true,
        items: {
          include: {
            appliedTaxes: true
          }
        }
      }
    });

    // Send emails in background
    for (const invoice of invoices) {
      if (invoice.client?.email) {
        // Calculate Tax Breakdown
        // In Batch mode, fetching tax rates repeatedly might be slow, but safe for now.
        const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map<number, string>();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));

        const taxBreakdown: Record<string, { name: string; percentage: number; amount: number }> = {};

        ((invoice as any).items || []).forEach((item: any) => {
          if (item.appliedTaxes && item.appliedTaxes.length > 0) {
            item.appliedTaxes.forEach((tax: any) => {
              const key = `${tax.name}_${tax.percentage}`;
              if (!taxBreakdown[key]) {
                taxBreakdown[key] = {
                  name: tax.name,
                  percentage: Number(tax.percentage),
                  amount: 0
                };
              }
              taxBreakdown[key].amount += Number(tax.amount);
            });
          } else if (item.taxRate || item.tax) {
            // Fallback for simple tax rate
            const rate = Number(item.taxRate || item.tax);
            if (rate > 0) {
              const key = `Tax_${rate}`;
              if (!taxBreakdown[key]) {
                const resolvedName = taxMap.get(rate) || 'Tax';
                taxBreakdown[key] = {
                  name: resolvedName,
                  percentage: rate,
                  amount: 0
                };
              }
              const amount = (Number(item.quantity) * Number(item.rate) * rate) / 100;
              taxBreakdown[key].amount += amount;
            }
          }
        });

        const pdfBuffer = await PDFService.generateInvoicePDF({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate || undefined,
          notes: invoice.notes || undefined,
          terms: invoice.terms || undefined,
          currency: invoice.currency,
          subtotal: Number(invoice.subtotal),
          tax: Number(invoice.tax),
          discount: Number(invoice.discount),
          total: Number(invoice.total),
          client: invoice.client ? {
            name: invoice.client.name,
            company: invoice.client.companyName || undefined,
            email: invoice.client.email || undefined,
            phone: invoice.client.phone || undefined,
            mobile: invoice.client.mobile || undefined,
            address: invoice.client.address || undefined,
            city: invoice.client.city || undefined,
            state: invoice.client.state || undefined,
            country: invoice.client.country || undefined,
            pincode: invoice.client.pincode || undefined,
            gstin: invoice.client.gstin || undefined,
            pan: invoice.client.pan || undefined,
            tan: invoice.client.tan || undefined,
            website: invoice.client.website || undefined,
          } : undefined,
          items: invoice.items.map(item => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit || undefined,
            rate: Number(item.rate || 0),
            discount: Number(item.discount || 0),
            hsnSacCode: item.hsnSacCode || undefined,
            appliedTaxes: (item.appliedTaxes as any[] || []).map(t => ({
              name: t.name,
              percentage: Number(t.percentage),
              amount: Number(t.amount)
            }))
          })),
          taxBreakdown: Object.values(taxBreakdown),
          company: {
            name: invoice.company.name,
            logo: invoice.company.logo || undefined,
            address: invoice.company.address || undefined,
            city: invoice.company.city || undefined,
            state: invoice.company.state || undefined,
            country: invoice.company.country || undefined,
            pincode: invoice.company.pincode || undefined,
            email: invoice.company.email || undefined,
            phone: invoice.company.phone || undefined,
            gstin: invoice.company.gstin || undefined,
            digitalSignature: invoice.company.digitalSignature || undefined,
            letterhead: invoice.company.letterhead || undefined,
            continuationSheet: invoice.company.continuationSheet || undefined,
            pdfMarginTop: (invoice.company as any).pdfMarginTop || undefined,
            pdfMarginBottom: (invoice.company as any).pdfMarginBottom || undefined,
            pdfMarginLeft: (invoice.company as any).pdfMarginLeft || undefined,
            pdfMarginRight: (invoice.company as any).pdfMarginRight || undefined,
            pdfContinuationTop: (invoice.company as any).pdfContinuationTop || undefined,
            bankName: (invoice.company as any).bankName || undefined,
            bankAccountName: (invoice.company as any).bankAccountName || undefined,
            bankAccountNumber: (invoice.company as any).bankAccountNumber || undefined,
            bankIfscCode: (invoice.company as any).bankIfscCode || undefined,
            bankBranch: (invoice.company as any).bankBranch || undefined
          },
          useLetterhead: true,
          includeBankDetails: invoice.includeBankDetails
        });
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
 * Delete an invoice
 */
export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Use req.user which is already hydrated with roles by authenticate middleware
    const user = req.user;

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Check permissions
    if (!PermissionService.hasBasicPermission(user, 'Invoice', 'delete')) {
      return res.status(403).json({ error: 'Access denied: No delete rights for Invoice' });
    }

    await InvoiceService.deleteInvoice(id, user.companyId);

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete invoice' });
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

    // Log Activity
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: id,
          type: 'STATUS_CHANGE', // Using status_change for general updates for now
          ipAddress,
          userAgent,
          browser: 'Admin',
          metadata: {
            action: 'UPDATED',
            userId: userId
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log invoice update:', logError);
    }

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
    console.log(`[DEBUG] getPublicInvoice called with ID: ${id}`);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        client: true,
        items: {
          include: {
            appliedTaxes: true
          }
        },
        payments: true, // Include payments for timeline
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Hydrate appliedTaxes for legacy invoices
    const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
    const taxMap = new Map<number, any>();
    allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));

    const hydratedItems = invoice.items.map((item: any) => {
      // Check for legacy tax rate if appliedTaxes is empty
      if ((!item.appliedTaxes || item.appliedTaxes.length === 0)) {
        const legacyRate = Number(item.taxRate) || Number(item.tax) || 0;

        if (legacyRate > 0) {
          const taxConfig = taxMap.get(legacyRate);
          const quantity = Number(item.quantity);
          const unitPrice = Number(item.rate || item.unitPrice || 0);
          const amount = (quantity * unitPrice * legacyRate) / 100;

          return {
            ...item,
            appliedTaxes: [{
              id: 'legacy-hydrate',
              invoiceItemId: item.id,
              taxRateId: taxConfig?.id || 'legacy',
              name: taxConfig?.name || 'Tax',
              percentage: new Decimal(legacyRate),
              amount: new Decimal(amount)
            }]
          };
        }
      }
      return item;
    });

    res.json({ invoice: { ...invoice, items: hydratedItems } });
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
        items: {
          include: {
            appliedTaxes: true
          }
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Calculate Tax Breakdown
    // Fetch all tax rates to fallback intelligently
    const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
    const taxMap = new Map<number, string>();
    allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));

    const taxBreakdown: Record<string, { name: string; percentage: number; amount: number }> = {};

    ((invoice as any).items || []).forEach((item: any) => {
      // 1. Detailed Taxes
      if (item.appliedTaxes && item.appliedTaxes.length > 0) {
        item.appliedTaxes.forEach((tax: any) => {
          const key = `${tax.name}_${tax.percentage}`;
          if (!taxBreakdown[key]) {
            taxBreakdown[key] = {
              name: tax.name,
              percentage: Number(tax.percentage),
              amount: 0
            };
          }
          taxBreakdown[key].amount += Number(tax.amount);
        });
      }
      // 2. Fallback
      else if (item.taxRate || item.tax) {
        // Fallback for simple tax rate
        const rate = Number(item.taxRate || item.tax);
        if (rate > 0) {
          const key = `Tax_${rate}`;
          if (!taxBreakdown[key]) {
            const resolvedName = taxMap.get(rate) || 'Tax';
            taxBreakdown[key] = {
              name: resolvedName,
              percentage: rate,
              amount: 0
            };
          }
          const amount = (Number(item.quantity) * Number(item.rate || item.unitPrice) * rate) / 100;
          taxBreakdown[key].amount += amount;
        }
      }
    });

    const pdfBuffer = await PDFService.generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || undefined,
      notes: invoice.notes || undefined,
      terms: invoice.terms || undefined,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      client: invoice.client ? {
        name: invoice.client.name,
        company: invoice.client.companyName || undefined,
        email: invoice.client.email || undefined,
        phone: invoice.client.phone || undefined,
        mobile: invoice.client.mobile || undefined,
        address: invoice.client.address || undefined,
        city: invoice.client.city || undefined,
        state: invoice.client.state || undefined,
        country: invoice.client.country || undefined,
        pincode: invoice.client.pincode || undefined,
        gstin: invoice.client.gstin || undefined,
        pan: invoice.client.pan || undefined,
        website: invoice.client.website || undefined,
      } : undefined,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit || undefined,
        rate: Number(item.rate || 0),
        discount: Number(item.discount || 0),
        hsnSacCode: item.hsnSacCode || undefined,
        appliedTaxes: (item.appliedTaxes as any[] || []).map(t => ({
          name: t.name,
          percentage: Number(t.percentage),
          amount: Number(t.amount)
        }))
      })),
      taxBreakdown: Object.values(taxBreakdown),
      company: {
        name: invoice.company.name,
        logo: invoice.company.logo || undefined,
        address: invoice.company.address || undefined,
        city: invoice.company.city || undefined,
        state: invoice.company.state || undefined,
        country: invoice.company.country || undefined,
        pincode: invoice.company.pincode || undefined,
        email: invoice.company.email || undefined,
        phone: invoice.company.phone || undefined,
        gstin: invoice.company.gstin || undefined,
        digitalSignature: invoice.company.digitalSignature || undefined,
        letterhead: invoice.company.letterhead || undefined,
        continuationSheet: invoice.company.continuationSheet || undefined,
        pdfMarginTop: (invoice.company as any).pdfMarginTop || undefined,
        pdfMarginBottom: (invoice.company as any).pdfMarginBottom || undefined,
        pdfMarginLeft: (invoice.company as any).pdfMarginLeft || undefined,
        pdfMarginRight: (invoice.company as any).pdfMarginRight || undefined,
        pdfContinuationTop: (invoice.company as any).pdfContinuationTop || undefined
      },
      useLetterhead: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Get public PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
};

/**
 * Generate Public Link for Invoice
 */
export const generatePublicLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expiresInDays = 30 } = req.body;
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return res.status(400).json({ error: 'Company not found' });

    // Verify access to invoice
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId: user.companyId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate unique token
    const publicToken = uuidv4();
    const publicExpiresAt = new Date();
    publicExpiresAt.setDate(publicExpiresAt.getDate() + expiresInDays);

    // Update invoice
    await prisma.invoice.update({
      where: { id },
      data: {
        publicToken,
        publicExpiresAt,
        isPublicEnabled: true,
        status: invoice.status === 'draft' ? 'sent' : invoice.status
      }
    });

    // Generate public URL
    const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/invoices/${publicToken}`;

    // Log Activity
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: id,
          type: 'STATUS_CHANGE',
          ipAddress,
          userAgent,
          browser: 'Admin',
          metadata: {
            action: 'PUBLIC_LINK_GENERATED',
            publicToken,
            expiresAt: publicExpiresAt,
            userId: userId
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log public link generation:', logError);
    }

    res.json({
      message: 'Public link generated successfully',
      publicToken,
      publicUrl,
      expiresAt: publicExpiresAt
    });
  } catch (error: any) {
    console.error('Generate public link error:', error);
    res.status(500).json({ error: 'Failed to generate public link', details: error.message });
  }
};

/**
 * Revoke Public Link
 */
export const revokePublicLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return res.status(400).json({ error: 'Company not found' });

    // Verify access
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId: user.companyId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Revoke link
    await prisma.invoice.update({
      where: { id },
      data: {
        isPublicEnabled: false,
        publicToken: null,
        publicExpiresAt: null
      }
    });

    // Log Activity
    try {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      await prisma.invoiceActivity.create({
        data: {
          invoiceId: id,
          type: 'STATUS_CHANGE',
          ipAddress,
          userAgent,
          browser: 'Admin',
          metadata: {
            action: 'PUBLIC_LINK_REVOKED',
            userId: userId
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log public link revocation:', logError);
    }

    res.json({ message: 'Public link revoked successfully' });
  } catch (error: any) {
    console.error('Revoke public link error:', error);
    res.status(500).json({ error: 'Failed to revoke public link', details: error.message });
  }
};

/**
 * Get Activity Log for an Invoice
 */
export const getActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return res.status(400).json({ error: 'Company not found' });

    // Verify access
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId: user.companyId }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const activities = await prisma.invoiceActivity.findMany({
      where: { invoiceId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ activities });
  } catch (error: any) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
};
