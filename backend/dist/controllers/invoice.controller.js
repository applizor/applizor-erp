"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertQuotation = exports.batchSendInvoices = exports.batchUpdateStatus = exports.updateInvoiceStatus = exports.sendInvoice = exports.getInvoiceStats = exports.recordPayment = exports.generateInvoicePDF = exports.getInvoice = exports.getInvoices = exports.createInvoice = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const invoice_service_1 = require("../services/invoice.service");
const emailService = __importStar(require("../services/email.service"));
const pdf_service_1 = require("../services/pdf.service");
/**
 * Create a new invoice
 */
const createInvoice = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const invoice = await invoice_service_1.InvoiceService.createInvoice({
            ...req.body,
            companyId: user.companyId,
            createdBy: userId,
        });
        res.status(201).json({
            message: 'Invoice created successfully',
            invoice,
        });
    }
    catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice', details: error.message });
    }
};
exports.createInvoice = createInvoice;
/**
 * Get list of invoices with pagination and filters
 */
const getInvoices = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { status, clientId, page = 1, limit = 10, search } = req.query;
        const where = {
            companyId: user.companyId,
        };
        if (status)
            where.status = status;
        if (clientId)
            where.clientId = clientId;
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: String(search), mode: 'insensitive' } },
                { client: { name: { contains: String(search), mode: 'insensitive' } } },
            ];
        }
        const [invoices, total] = await Promise.all([
            client_1.default.invoice.findMany({
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
            client_1.default.invoice.count({ where }),
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
    }
    catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to get invoices', details: error.message });
    }
};
exports.getInvoices = getInvoices;
/**
 * Get a single invoice by ID
 */
const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await client_1.default.invoice.findUnique({
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
    }
    catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Failed to get invoice', details: error.message });
    }
};
exports.getInvoice = getInvoice;
/**
 * Generate Invoice PDF
 */
const generateInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await client_1.default.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                company: true,
                items: true,
            },
        });
        if (!invoice)
            return res.status(404).json({ error: 'Invoice not found' });
        // Use PDFService (HTML-to-PDF) for cleaner output
        const pdfBuffer = await pdf_service_1.PDFService.generateInvoicePDF({
            ...invoice,
            company: {
                ...invoice.company,
                digitalSignature: invoice.company.digitalSignature || undefined,
                letterhead: invoice.company.letterhead || undefined,
                continuationSheet: invoice.company.continuationSheet || undefined
            },
            useLetterhead: req.query.useLetterhead === 'true'
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
exports.generateInvoicePDF = generateInvoicePDF;
/**
 * Record a payment for an invoice
 */
const recordPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentMethod, transactionId } = req.body;
        if (!amount || !paymentMethod) {
            return res.status(400).json({ error: 'Amount and payment method are required' });
        }
        const updatedInvoice = await invoice_service_1.InvoiceService.recordPayment(id, Number(amount), paymentMethod, transactionId);
        res.json({
            message: 'Payment recorded successfully',
            invoice: updatedInvoice
        });
    }
    catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({ error: error.message || 'Failed to record payment' });
    }
};
exports.recordPayment = recordPayment;
/**
 * Get invoice statistics for dashboard
 */
const getInvoiceStats = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'Company not found' });
        const stats = await invoice_service_1.InvoiceService.getDashboardStats(user.companyId);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
exports.getInvoiceStats = getInvoiceStats;
/**
 * Send invoice via email
 */
const sendInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await client_1.default.invoice.findUnique({
            where: { id },
            include: { client: true, company: true, items: true }
        });
        if (!invoice)
            return res.status(404).json({ error: 'Invoice not found' });
        if (!invoice.client.email)
            return res.status(400).json({ error: 'Client has no email' });
        const pdfBuffer = await pdf_service_1.PDFService.generateInvoicePDF({
            ...invoice,
            useLetterhead: req.body.useLetterhead === true
        });
        await emailService.sendInvoiceEmail(invoice.client.email, invoice, pdfBuffer);
        if (invoice.status === 'draft') {
            await client_1.default.invoice.update({
                where: { id },
                data: { status: 'sent' }
            });
        }
        res.json({ message: 'Invoice sent successfully' });
    }
    catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
};
exports.sendInvoice = sendInvoice;
/**
 * Update invoice status manually
 */
const updateInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const invoice = await client_1.default.invoice.update({
            where: { id },
            data: { status },
        });
        res.json({ message: 'Invoice status updated', invoice });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};
exports.updateInvoiceStatus = updateInvoiceStatus;
/**
 * Batch update invoice status
 */
const batchUpdateStatus = async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!ids || !Array.isArray(ids) || !status) {
            return res.status(400).json({ error: 'Invalid request' });
        }
        await client_1.default.invoice.updateMany({
            where: { id: { in: ids } },
            data: { status }
        });
        res.json({ message: `Successfully updated ${ids.length} invoices` });
    }
    catch (error) {
        res.status(500).json({ error: 'Batch update failed' });
    }
};
exports.batchUpdateStatus = batchUpdateStatus;
/**
 * Batch send invoices via email
 */
const batchSendInvoices = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'Invalid request' });
        }
        const invoices = await client_1.default.invoice.findMany({
            where: { id: { in: ids } },
            include: { client: true, company: true, items: true }
        });
        // Send emails in background
        for (const invoice of invoices) {
            if (invoice.client?.email) {
                const pdfBuffer = await pdf_service_1.PDFService.generateInvoicePDF(invoice);
                emailService.sendInvoiceEmail(invoice.client.email, invoice, pdfBuffer).catch(err => {
                    console.error(`Failed to send batch email for ${invoice.invoiceNumber}`, err);
                });
                if (invoice.status === 'draft') {
                    await client_1.default.invoice.update({
                        where: { id: invoice.id },
                        data: { status: 'sent' }
                    });
                }
            }
        }
        res.json({ message: `Initiated sending for ${invoices.length} invoices` });
    }
    catch (error) {
        res.status(500).json({ error: 'Batch send failed' });
    }
};
exports.batchSendInvoices = batchSendInvoices;
/**
 * Convert quotation to invoice
 */
const convertQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await invoice_service_1.InvoiceService.convertQuotationToInvoice(id);
        res.json({ message: 'Quotation converted successfully', invoice });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Conversion failed' });
    }
};
exports.convertQuotation = convertQuotation;
//# sourceMappingURL=invoice.controller.js.map