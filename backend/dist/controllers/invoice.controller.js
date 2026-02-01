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
exports.getActivityLog = exports.revokePublicLink = exports.generatePublicLink = exports.getPublicInvoicePdf = exports.getPublicInvoice = exports.convertQuotation = exports.updateInvoice = exports.deleteInvoice = exports.batchSendInvoices = exports.batchUpdateStatus = exports.updateInvoiceStatus = exports.sendInvoice = exports.getInvoiceStats = exports.recordPayment = exports.generateInvoicePDF = exports.getInvoice = exports.getInvoices = exports.createInvoice = void 0;
const library_1 = require("@prisma/client/runtime/library");
const client_1 = __importDefault(require("../prisma/client"));
const invoice_service_1 = require("../services/invoice.service");
const emailService = __importStar(require("../services/email.service"));
const pdf_service_1 = require("../services/pdf.service");
const uuid_1 = require("uuid");
const permission_service_1 = require("../services/permission.service");
/**
 * Create a new invoice
 */
const createInvoice = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = req.user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        const invoice = await invoice_service_1.InvoiceService.createInvoice({
            ...req.body,
            companyId: user.companyId,
            createdBy: userId,
        });
        // Log Activity
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.invoiceActivity.create({
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
        }
        catch (logError) {
            console.error('Failed to log invoice creation:', logError);
        }
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
        const user = req.user;
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
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));
        const hydratedItems = invoice.items.map((item) => {
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
                                percentage: new library_1.Decimal(legacyRate),
                                amount: new library_1.Decimal(amount)
                            }]
                    };
                }
            }
            return item;
        });
        res.json({ invoice: { ...invoice, items: hydratedItems } });
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
                items: {
                    include: {
                        appliedTaxes: true
                    }
                },
            },
        });
        if (!invoice)
            return res.status(404).json({ error: 'Invoice not found' });
        // Calculate Tax Breakdown
        // Fetch all tax rates to fallback intelligently
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));
        const taxBreakdown = {};
        (invoice.items || []).forEach((item) => {
            // 1. Detailed Taxes
            if (item.appliedTaxes && item.appliedTaxes.length > 0) {
                item.appliedTaxes.forEach((tax) => {
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
        const pdfBuffer = await pdf_service_1.PDFService.generateInvoicePDF({
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
                appliedTaxes: (item.appliedTaxes || []).map(t => ({
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
                pdfMarginTop: invoice.company.pdfMarginTop || undefined,
                pdfMarginBottom: invoice.company.pdfMarginBottom || undefined,
                pdfMarginLeft: invoice.company.pdfMarginLeft || undefined,
                pdfMarginRight: invoice.company.pdfMarginRight || undefined,
                pdfContinuationTop: invoice.company.pdfContinuationTop || undefined
            },
            useLetterhead: req.body.useLetterhead === true || req.query.useLetterhead === 'true'
        });
        // Log Activity
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.invoiceActivity.create({
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
        }
        catch (logError) {
            console.error('Failed to log invoice download:', logError);
        }
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
        // Log Activity
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.invoiceActivity.create({
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
        }
        catch (logError) {
            console.error('Failed to log invoice payment:', logError);
        }
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
        const user = req.user;
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
        if (!invoice)
            return res.status(404).json({ error: 'Invoice not found' });
        if (!invoice.client.email)
            return res.status(400).json({ error: 'Client has no email' });
        // Calculate Tax Breakdown
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));
        const taxBreakdown = {};
        (invoice.items || []).forEach((item) => {
            // 1. Detailed Taxes
            if (item.appliedTaxes && item.appliedTaxes.length > 0) {
                item.appliedTaxes.forEach((tax) => {
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
        const pdfBuffer = await pdf_service_1.PDFService.generateInvoicePDF({
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
                appliedTaxes: (item.appliedTaxes || []).map(t => ({
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
                pdfMarginTop: invoice.company.pdfMarginTop || undefined,
                pdfMarginBottom: invoice.company.pdfMarginBottom || undefined,
                pdfMarginLeft: invoice.company.pdfMarginLeft || undefined,
                pdfMarginRight: invoice.company.pdfMarginRight || undefined,
                pdfContinuationTop: invoice.company.pdfContinuationTop || undefined
            },
            useLetterhead: req.body.useLetterhead === true
        });
        const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/invoices/${invoice.id}`;
        // Send in background and update status
        emailService.sendInvoiceEmail(invoice.client.email, invoice, pdfBuffer, false, publicUrl)
            .then(async () => {
            if (invoice.status === 'draft') {
                await client_1.default.invoice.update({
                    where: { id },
                    data: { status: 'sent' }
                });
            }
        })
            .catch(err => console.error(`Failed to send invoice ${invoice.invoiceNumber}:`, err));
        res.json({ message: 'Invoice sending initiated' });
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
        // Log Activity
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.invoiceActivity.create({
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
        }
        catch (logError) {
            console.error('Failed to log status update:', logError);
        }
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
                const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: invoice.companyId } });
                const taxMap = new Map();
                allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));
                const taxBreakdown = {};
                (invoice.items || []).forEach((item) => {
                    if (item.appliedTaxes && item.appliedTaxes.length > 0) {
                        item.appliedTaxes.forEach((tax) => {
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
                            const amount = (Number(item.quantity) * Number(item.rate) * rate) / 100;
                            taxBreakdown[key].amount += amount;
                        }
                    }
                });
                const pdfBuffer = await pdf_service_1.PDFService.generateInvoicePDF({
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
                        appliedTaxes: (item.appliedTaxes || []).map(t => ({
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
                        pdfMarginTop: invoice.company.pdfMarginTop || undefined,
                        pdfMarginBottom: invoice.company.pdfMarginBottom || undefined,
                        pdfMarginLeft: invoice.company.pdfMarginLeft || undefined,
                        pdfMarginRight: invoice.company.pdfMarginRight || undefined,
                        pdfContinuationTop: invoice.company.pdfContinuationTop || undefined
                    },
                    useLetterhead: true
                });
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
 * Delete an invoice
 */
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        // Use req.user which is already hydrated with roles by authenticate middleware
        const user = req.user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }
        // Check permissions
        if (!permission_service_1.PermissionService.hasBasicPermission(user, 'Invoice', 'delete')) {
            return res.status(403).json({ error: 'Access denied: No delete rights for Invoice' });
        }
        await invoice_service_1.InvoiceService.deleteInvoice(id, user.companyId);
        res.json({ message: 'Invoice deleted successfully' });
    }
    catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete invoice' });
    }
};
exports.deleteInvoice = deleteInvoice;
/**
 * Convert quotation to invoice
 */
/**
 * Update an invoice
 */
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
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
        const invoice = await invoice_service_1.InvoiceService.updateInvoice(id, {
            ...req.body,
            companyId: user.companyId,
        });
        // Log Activity
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.invoiceActivity.create({
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
        }
        catch (logError) {
            console.error('Failed to log invoice update:', logError);
        }
        res.json({
            message: 'Invoice updated successfully',
            invoice,
        });
    }
    catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ error: 'Failed to update invoice', details: error.message });
    }
};
exports.updateInvoice = updateInvoice;
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
/**
 * Get public invoice details by ID
 */
const getPublicInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DEBUG] getPublicInvoice called with ID: ${id}`);
        const invoice = await client_1.default.invoice.findUnique({
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
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));
        const hydratedItems = invoice.items.map((item) => {
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
                                percentage: new library_1.Decimal(legacyRate),
                                amount: new library_1.Decimal(amount)
                            }]
                    };
                }
            }
            return item;
        });
        res.json({ invoice: { ...invoice, items: hydratedItems } });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoice', details: error.message });
    }
};
exports.getPublicInvoice = getPublicInvoice;
/**
 * Get public invoice PDF by ID
 */
const getPublicInvoicePdf = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await client_1.default.invoice.findUnique({
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
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));
        const taxBreakdown = {};
        (invoice.items || []).forEach((item) => {
            // 1. Detailed Taxes
            if (item.appliedTaxes && item.appliedTaxes.length > 0) {
                item.appliedTaxes.forEach((tax) => {
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
        const pdfBuffer = await pdf_service_1.PDFService.generateInvoicePDF({
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
                appliedTaxes: (item.appliedTaxes || []).map(t => ({
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
                pdfMarginTop: invoice.company.pdfMarginTop || undefined,
                pdfMarginBottom: invoice.company.pdfMarginBottom || undefined,
                pdfMarginLeft: invoice.company.pdfMarginLeft || undefined,
                pdfMarginRight: invoice.company.pdfMarginRight || undefined,
                pdfContinuationTop: invoice.company.pdfContinuationTop || undefined
            },
            useLetterhead: true
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Get public PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
};
exports.getPublicInvoicePdf = getPublicInvoicePdf;
/**
 * Generate Public Link for Invoice
 */
const generatePublicLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { expiresInDays = 30 } = req.body;
        const userId = req.userId;
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'Company not found' });
        // Verify access to invoice
        const invoice = await client_1.default.invoice.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Generate unique token
        const publicToken = (0, uuid_1.v4)();
        const publicExpiresAt = new Date();
        publicExpiresAt.setDate(publicExpiresAt.getDate() + expiresInDays);
        // Update invoice
        await client_1.default.invoice.update({
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
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.invoiceActivity.create({
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
        }
        catch (logError) {
            console.error('Failed to log public link generation:', logError);
        }
        res.json({
            message: 'Public link generated successfully',
            publicToken,
            publicUrl,
            expiresAt: publicExpiresAt
        });
    }
    catch (error) {
        console.error('Generate public link error:', error);
        res.status(500).json({ error: 'Failed to generate public link', details: error.message });
    }
};
exports.generatePublicLink = generatePublicLink;
/**
 * Revoke Public Link
 */
const revokePublicLink = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'Company not found' });
        // Verify access
        const invoice = await client_1.default.invoice.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Revoke link
        await client_1.default.invoice.update({
            where: { id },
            data: {
                isPublicEnabled: false,
                publicToken: null,
                publicExpiresAt: null
            }
        });
        // Log Activity
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.invoiceActivity.create({
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
        }
        catch (logError) {
            console.error('Failed to log public link revocation:', logError);
        }
        res.json({ message: 'Public link revoked successfully' });
    }
    catch (error) {
        console.error('Revoke public link error:', error);
        res.status(500).json({ error: 'Failed to revoke public link', details: error.message });
    }
};
exports.revokePublicLink = revokePublicLink;
/**
 * Get Activity Log for an Invoice
 */
const getActivityLog = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const user = await client_1.default.user.findUnique({ where: { id: userId } });
        if (!user?.companyId)
            return res.status(400).json({ error: 'Company not found' });
        // Verify access
        const invoice = await client_1.default.invoice.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        const activities = await client_1.default.invoiceActivity.findMany({
            where: { invoiceId: id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ activities });
    }
    catch (error) {
        console.error('Get activity log error:', error);
        res.status(500).json({ error: 'Failed to fetch activity log' });
    }
};
exports.getActivityLog = getActivityLog;
//# sourceMappingURL=invoice.controller.js.map