import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import documentService, { LetterheadMode } from '../services/document.service';
import * as emailService from '../services/email.service';

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    const {
      clientId,
      invoiceDate,
      dueDate,
      items,
      tax = 0,
      discount = 0,
      notes,
      type = 'invoice', // invoice, quotation, proforma
      terms,
      currency = 'USD',
      letterheadMode = LetterheadMode.EVERY_PAGE,
    } = req.body;

    // Validation
    if (!clientId || !invoiceDate || !dueDate || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      const itemAmount = Number(item.quantity) * Number(item.rate);
      return sum + itemAmount;
    }, 0);

    const total = subtotal + Number(tax) - Number(discount);

    // Generate number based on type
    const prefix = type === 'quotation' ? 'QTN' : 'INV';
    const count = await prisma.invoice.count({
      where: {
        companyId: user.companyId,
        type: type
      },
    });
    const invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        companyId: user.companyId,
        clientId,
        invoiceNumber,
        type,
        currency,
        terms,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        subtotal,
        tax,
        discount,
        total,
        notes,
        status: type === 'quotation' ? 'sent' : 'draft',
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Create invoice items
    const invoiceItems = await Promise.all(
      items.map((item: any) =>
        prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            hsnCode: item.hsnCode,
            taxRate: item.taxRate || 0,
            amount: item.quantity * item.rate,
          },
        })
      )
    );

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: {
        ...invoice,
        items: invoiceItems,
      },
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice', details: error.message });
  }
};

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

    const { status, clientId, page = 1, limit = 10 } = req.query;

    const where: any = {
      companyId: user.companyId,
    };

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: true,
          items: true,
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

export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        company: true,
        items: true,
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

export const generateInvoicePDF = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { letterheadMode = LetterheadMode.EVERY_PAGE } = req.query;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        company: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Generate document
    const docBuffer = await documentService.generateInvoice(
      {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        clientName: invoice.client.name,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        notes: invoice.notes,
      },
      invoice.company,
      letterheadMode as LetterheadMode
    );

    // Save document
    const filename = `invoice-${invoice.invoiceNumber}-${Date.now()}.docx`;
    const filePath = await documentService.saveDocument(docBuffer, filename);

    // Update invoice with PDF path
    await prisma.invoice.update({
      where: { id },
      data: { pdfPath: filePath },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(docBuffer);
  } catch (error: any) {
    console.error('Generate invoice PDF error:', error);
    res.status(500).json({ error: 'Failed to generate invoice PDF', details: error.message });
  }
};

export const updateInvoiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status },
    });

    res.json({ message: 'Invoice status updated', invoice });
  } catch (error: any) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Failed to update invoice status', details: error.message });
  }
};

// Email sending endpoint
export const sendInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body; // Optional override email

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, company: true, items: true }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const recipientEmail = email || invoice.client.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Client has no email address' });
    }

    // Generate PDF (Mock buffer for now, real implementation would use documentService.generateInvoice)
    // const pdfBuffer = await documentService.generateInvoice(invoice, invoice.company, 'every');
    // Using mock buffer until PDF generation is robust
    const pdfBuffer = Buffer.from('Mock PDF Content');

    await emailService.sendInvoiceEmail(recipientEmail, invoice, pdfBuffer);

    // Update status if it was draft
    if (invoice.status === 'draft') {
      await prisma.invoice.update({
        where: { id },
        data: { status: 'sent' }
      });
    }

    res.json({ message: 'Email sent successfully' });

  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
