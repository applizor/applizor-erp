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
exports.sendInvoice = exports.updateInvoiceStatus = exports.generateInvoicePDF = exports.getInvoice = exports.getInvoices = exports.createInvoice = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const document_service_1 = __importStar(require("../services/document.service"));
const emailService = __importStar(require("../services/email.service"));
const createInvoice = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.default.user.findUnique({
            where: { id: userId },
            include: { company: true },
        });
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const { clientId, invoiceDate, dueDate, items, tax = 0, discount = 0, notes, type = 'invoice', // invoice, quotation, proforma
        terms, currency = 'USD', letterheadMode = document_service_1.LetterheadMode.EVERY_PAGE, } = req.body;
        // Validation
        if (!clientId || !invoiceDate || !dueDate || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Calculate totals
        const subtotal = items.reduce((sum, item) => {
            const itemAmount = Number(item.quantity) * Number(item.rate);
            return sum + itemAmount;
        }, 0);
        const total = subtotal + Number(tax) - Number(discount);
        // Generate number based on type
        const prefix = type === 'quotation' ? 'QTN' : 'INV';
        const count = await client_1.default.invoice.count({
            where: {
                companyId: user.companyId,
                type: type
            },
        });
        const invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
        // Create invoice
        const invoice = await client_1.default.invoice.create({
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
        const invoiceItems = await Promise.all(items.map((item) => client_1.default.invoiceItem.create({
            data: {
                invoiceId: invoice.id,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                hsnCode: item.hsnCode,
                taxRate: item.taxRate || 0,
                amount: item.quantity * item.rate,
            },
        })));
        res.status(201).json({
            message: 'Invoice created successfully',
            invoice: {
                ...invoice,
                items: invoiceItems,
            },
        });
    }
    catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice', details: error.message });
    }
};
exports.createInvoice = createInvoice;
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
        const { status, clientId, page = 1, limit = 10 } = req.query;
        const where = {
            companyId: user.companyId,
        };
        if (status) {
            where.status = status;
        }
        if (clientId) {
            where.clientId = clientId;
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
const getInvoice = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const invoice = await client_1.default.invoice.findUnique({
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
    }
    catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Failed to get invoice', details: error.message });
    }
};
exports.getInvoice = getInvoice;
const generateInvoicePDF = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const { letterheadMode = document_service_1.LetterheadMode.EVERY_PAGE } = req.query;
        const invoice = await client_1.default.invoice.findUnique({
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
        const docBuffer = await document_service_1.default.generateInvoice({
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
        }, invoice.company, letterheadMode);
        // Save document
        const filename = `invoice-${invoice.invoiceNumber}-${Date.now()}.docx`;
        const filePath = await document_service_1.default.saveDocument(docBuffer, filename);
        // Update invoice with PDF path
        await client_1.default.invoice.update({
            where: { id },
            data: { pdfPath: filePath },
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(docBuffer);
    }
    catch (error) {
        console.error('Generate invoice PDF error:', error);
        res.status(500).json({ error: 'Failed to generate invoice PDF', details: error.message });
    }
};
exports.generateInvoicePDF = generateInvoicePDF;
const updateInvoiceStatus = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const { status } = req.body;
        const invoice = await client_1.default.invoice.update({
            where: { id },
            data: { status },
        });
        res.json({ message: 'Invoice status updated', invoice });
    }
    catch (error) {
        console.error('Update invoice status error:', error);
        res.status(500).json({ error: 'Failed to update invoice status', details: error.message });
    }
};
exports.updateInvoiceStatus = updateInvoiceStatus;
// Email sending endpoint
const sendInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body; // Optional override email
        const invoice = await client_1.default.invoice.findUnique({
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
            await client_1.default.invoice.update({
                where: { id },
                data: { status: 'sent' }
            });
        }
        res.json({ message: 'Email sent successfully' });
    }
    catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
};
exports.sendInvoice = sendInvoice;
//# sourceMappingURL=invoice.controller.js.map