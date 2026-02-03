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
exports.uploadDocument = exports.getDocuments = exports.getContractDetails = exports.getMyContracts = exports.getContractPdf = exports.getQuotationPdf = exports.rejectQuotation = exports.acceptQuotation = exports.getQuotationDetails = exports.getMyQuotations = exports.exportInvoices = exports.getInvoicePdf = exports.getInvoiceDetails = exports.getMyProjects = exports.getMyInvoices = exports.getDashboardStats = void 0;
const library_1 = require("@prisma/client/runtime/library");
const client_1 = __importDefault(require("../prisma/client"));
const pdf_service_1 = require("../services/pdf.service");
const getDashboardStats = async (req, res) => {
    try {
        const clientId = req.clientId;
        // Fetch basic stats and task metrics in parallel
        const [invoices, projects, taskStats, recentComments] = await Promise.all([
            // 1. Invoices
            client_1.default.invoice.findMany({
                where: { clientId },
                select: { total: true, status: true, currency: true }
            }),
            // 2. Active Projects count
            client_1.default.project.count({
                where: { clientId, status: 'active' }
            }),
            // 3. Task Counts (In Progress & Review)
            client_1.default.task.groupBy({
                by: ['status'],
                where: {
                    project: { clientId },
                    status: { not: 'done' } // generalized check, specific buckets below
                },
                _count: { id: true }
            }),
            // 4. Recent Comments (Activity Feed) - exluding client's own comments
            client_1.default.taskComment.findMany({
                where: {
                    task: { project: { clientId } },
                    clientId: { equals: null } // Only show comments by internal users (staff)
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    user: { select: { firstName: true, lastName: true } },
                    task: { select: { id: true, title: true, projectId: true } }
                }
            })
        ]);
        // Process Task Stats
        let tasksInReview = 0;
        let tasksInProgress = 0;
        taskStats.forEach(bucket => {
            if (bucket.status === 'review') {
                tasksInReview += bucket._count.id;
            }
            else if (['todo', 'in-progress'].includes(bucket.status)) {
                tasksInProgress += bucket._count.id;
            }
        });
        // Process Invoices
        const totalDue = invoices
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + Number(inv.total), 0);
        const currency = req.client?.currency || req.client?.company?.currency || invoices[0]?.currency || 'USD';
        res.json({
            activeProjects: projects,
            pendingInvoicesCount: invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').length,
            totalDue,
            currency,
            tasksInReview,
            tasksInProgress,
            recentActivities: recentComments.map(c => ({
                id: c.id,
                type: 'comment',
                user: `${c.user?.firstName} ${c.user?.lastName}`,
                taskTitle: c.task.title,
                taskId: c.task.id,
                projectId: c.task.projectId,
                content: c.content,
                createdAt: c.createdAt
            }))
        });
    }
    catch (error) {
        console.error('Portal stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getMyInvoices = async (req, res) => {
    try {
        const clientId = req.clientId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, status, startDate, endDate, projectId } = req.query;
        const where = { clientId };
        if (status && status !== 'all') {
            where.status = status;
        }
        if (projectId && projectId !== 'all') {
            where.projectId = projectId;
        }
        if (startDate && endDate) {
            where.invoiceDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (search) {
            where.invoiceNumber = {
                contains: search,
                mode: 'insensitive'
            };
        }
        const [invoices, total] = await Promise.all([
            client_1.default.invoice.findMany({
                where,
                orderBy: { invoiceDate: 'desc' },
                skip,
                take: limit,
                include: { items: true, project: true }
            }),
            client_1.default.invoice.count({ where })
        ]);
        res.json({ invoices, total, pages: Math.ceil(total / limit) });
    }
    catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};
exports.getMyInvoices = getMyInvoices;
const getMyProjects = async (req, res) => {
    try {
        const clientId = req.clientId;
        const projects = await client_1.default.project.findMany({
            where: { clientId },
            orderBy: { updatedAt: 'desc' },
            include: { tasks: false }
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};
exports.getMyProjects = getMyProjects;
const getInvoiceDetails = async (req, res) => {
    try {
        const clientId = req.clientId;
        const { id } = req.params;
        const invoice = await client_1.default.invoice.findUnique({
            where: { id },
            include: {
                items: {
                    include: { appliedTaxes: true }
                },
                payments: { orderBy: { createdAt: 'desc' } },
                project: true,
                company: true
            }
        });
        if (!invoice || invoice.clientId !== clientId) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Hydrate appliedTaxes for legacy items
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));
        const hydratedItems = invoice.items.map((item) => {
            if ((!item.appliedTaxes || item.appliedTaxes.length === 0) && (Number(item.taxRate) > 0 || Number(item.tax) > 0)) {
                const rate = Number(item.taxRate || item.tax);
                const taxConfig = taxMap.get(rate);
                if (rate > 0) {
                    const quantity = Number(item.quantity);
                    const rateVal = Number(item.rate);
                    const discount = Number(item.discount || 0);
                    const taxableAmount = quantity * rateVal * (1 - discount / 100);
                    const amount = (taxableAmount * rate) / 100;
                    return {
                        ...item,
                        appliedTaxes: [{
                                id: 'legacy-hydrate',
                                invoiceItemId: item.id,
                                taxRateId: taxConfig?.id || 'legacy',
                                name: taxConfig?.name || 'Tax',
                                percentage: new library_1.Decimal(rate),
                                amount: new library_1.Decimal(amount)
                            }]
                    };
                }
            }
            return item;
        });
        // Timeline Logic
        const timeline = [
            { status: 'Draft', date: invoice.createdAt, completed: true },
            { status: 'Sent', date: invoice.invoiceDate || invoice.createdAt, completed: invoice.status !== 'draft' },
            { status: 'Paid', date: invoice.payments[0]?.createdAt, completed: invoice.status === 'paid' }
        ];
        // Log Activity & Update Stats
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.$transaction([
                client_1.default.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        viewCount: { increment: 1 },
                        lastViewedAt: new Date()
                    }
                }),
                client_1.default.invoiceActivity.create({
                    data: {
                        invoiceId: invoice.id,
                        type: 'VIEWED',
                        ipAddress,
                        userAgent,
                        deviceType: userAgent.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop',
                        browser: 'Portal'
                    }
                })
            ]);
        }
        catch (logError) {
            console.error('Failed to log portal invoice view:', logError);
        }
        res.json({ invoice: { ...invoice, items: hydratedItems }, timeline });
    }
    catch (error) {
        console.error('Get invoice details error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice details' });
    }
};
exports.getInvoiceDetails = getInvoiceDetails;
const getInvoicePdf = async (req, res) => {
    try {
        const clientId = req.clientId;
        const { id } = req.params;
        const invoice = await client_1.default.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                company: true,
                items: {
                    include: { appliedTaxes: true }
                },
            }
        });
        if (!invoice || invoice.clientId !== clientId) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        // Hydrate appliedTaxes for legacy items
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));
        const hydratedItems = invoice.items.map((item) => {
            if ((!item.appliedTaxes || item.appliedTaxes.length === 0) && (Number(item.taxRate) > 0 || Number(item.tax) > 0)) {
                const rate = Number(item.taxRate || item.tax);
                const taxConfig = taxMap.get(rate);
                if (rate > 0) {
                    const amount = (Number(item.quantity) * Number(item.rate) * rate) / 100;
                    return {
                        ...item,
                        appliedTaxes: [{
                                id: 'legacy-hydrate',
                                invoiceItemId: item.id,
                                taxRateId: taxConfig?.id || 'legacy',
                                name: taxConfig?.name || 'Tax',
                                percentage: new library_1.Decimal(rate),
                                amount: new library_1.Decimal(amount)
                            }]
                    };
                }
            }
            return item;
        });
        // Calculate Tax Breakdown from Hydrated Items
        const taxBreakdown = {};
        hydratedItems.forEach((item) => {
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
            items: hydratedItems.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit || undefined,
                rate: Number(item.rate || item.unitPrice || 0),
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
                    deviceType: userAgent.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop',
                    browser: 'Portal'
                }
            });
        }
        catch (logError) {
            console.error('Failed to log portal invoice download:', logError);
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Get PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
exports.getInvoicePdf = getInvoicePdf;
const exportInvoices = async (req, res) => {
    try {
        const clientId = req.clientId;
        const { search, status, startDate, endDate, projectId } = req.query;
        const where = { clientId };
        if (status && status !== 'all')
            where.status = status;
        if (projectId && projectId !== 'all')
            where.projectId = projectId;
        if (startDate && endDate) {
            where.invoiceDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (search) {
            where.invoiceNumber = {
                contains: search,
                mode: 'insensitive'
            };
        }
        const invoices = await client_1.default.invoice.findMany({
            where,
            orderBy: { invoiceDate: 'desc' },
            include: { items: true, project: true }
        });
        // Generate CSV
        const csvRows = [
            ['Invoice Number', 'Date', 'Project', 'Status', 'Total', 'Currency']
        ];
        invoices.forEach(inv => {
            csvRows.push([
                `"${inv.invoiceNumber}"`,
                new Date(inv.invoiceDate).toLocaleDateString(),
                `"${inv.project?.name || 'N/A'}"`,
                inv.status,
                inv.total.toString(),
                inv.currency
            ]);
        });
        const csvString = csvRows.map(row => row.join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="invoices_export.csv"`);
        res.send(csvString);
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export invoices' });
    }
};
exports.exportInvoices = exportInvoices;
// ==========================================
// Quotations
// ==========================================
const getMyQuotations = async (req, res) => {
    try {
        const clientId = req.clientId;
        const clientEmail = req.client?.email;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, status } = req.query;
        // Filter by lead email matching client email
        // Note: Prisma where clause structure depends on schema. 
        // Assuming Quotation -> Lead -> email
        const where = {
            OR: [
                { clientId },
                { lead: { email: clientEmail } }
            ]
        };
        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where.quotationNumber = {
                contains: search,
                mode: 'insensitive'
            };
        }
        const [quotations, total] = await Promise.all([
            client_1.default.quotation.findMany({
                where,
                orderBy: { quotationDate: 'desc' },
                skip,
                take: limit,
                include: { items: true, lead: true, company: true }
            }),
            client_1.default.quotation.count({ where })
        ]);
        res.json({ quotations, total, pages: Math.ceil(total / limit) });
    }
    catch (error) {
        console.error('Get quotations error:', error);
        res.status(500).json({ error: 'Failed to fetch quotations' });
    }
};
exports.getMyQuotations = getMyQuotations;
const getQuotationDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const clientEmail = req.client?.email;
        const quotation = await client_1.default.quotation.findUnique({
            where: { id },
            include: {
                items: {
                    include: { appliedTaxes: true }
                },
                lead: true,
                company: true
            }
        });
        // Security check: Ensure quotation belongs to this client
        if (!quotation || (quotation.clientId !== clientId && quotation.lead?.email !== clientEmail)) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        // Hydrate appliedTaxes for legacy items
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: quotation.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));
        const hydratedItems = quotation.items.map((item) => {
            if ((!item.appliedTaxes || item.appliedTaxes.length === 0)) {
                const legacyRate = Number(item.tax) || 0;
                if (legacyRate > 0) {
                    const taxConfig = taxMap.get(legacyRate);
                    const quantity = Number(item.quantity);
                    const unitPrice = Number(item.unitPrice || 0);
                    const amount = (quantity * unitPrice * legacyRate) / 100;
                    return {
                        ...item,
                        appliedTaxes: [{
                                id: 'legacy-hydrate',
                                quotationItemId: item.id,
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
        // Capture Analytics Data
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        // Update View Statistics & Activity Log
        await client_1.default.$transaction(async (tx) => {
            // 1. Update Quotation Stats
            await tx.quotation.update({
                where: { id: quotation.id },
                data: {
                    viewCount: { increment: 1 },
                    lastViewedAt: new Date(),
                    ...(quotation.status === 'sent' ? {
                        status: 'viewed',
                        clientViewedAt: new Date()
                    } : {})
                }
            });
            // 2. Log Activity
            await tx.quotationActivity.create({
                data: {
                    quotationId: quotation.id,
                    type: 'VIEWED',
                    ipAddress,
                    userAgent,
                    deviceType: userAgent.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop',
                    browser: 'Portal'
                }
            });
        });
        res.json({ quotation: { ...quotation, items: hydratedItems } });
    }
    catch (error) {
        console.error('Get quotation details error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation details' });
    }
};
exports.getQuotationDetails = getQuotationDetails;
const acceptQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const clientEmail = req.client?.email;
        const { signature, email, name, comments } = req.body;
        // Validate required fields
        if (!signature || !email || !name) {
            return res.status(400).json({ error: 'Signature, email, and name are required' });
        }
        const quotation = await client_1.default.quotation.findUnique({
            where: { id },
            include: { lead: true }
        });
        // Security check
        if (!quotation || (quotation.clientId !== clientId && quotation.lead?.email !== clientEmail)) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        // Check if already accepted/rejected
        if (quotation.clientAcceptedAt) {
            return res.status(400).json({ error: 'This quotation has already been accepted' });
        }
        if (quotation.clientRejectedAt) {
            return res.status(400).json({ error: 'This quotation has already been rejected' });
        }
        // Update quotation
        const updated = await client_1.default.quotation.update({
            where: { id: quotation.id },
            data: {
                clientAcceptedAt: new Date(),
                clientSignature: signature,
                clientEmail: email,
                clientName: name,
                clientComments: comments || null,
                status: 'accepted'
            },
            include: {
                lead: true,
                company: true
            }
        });
        // Send acceptance emails
        try {
            const { sendQuotationAcceptanceToClient, sendQuotationAcceptanceToCompany } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
            await sendQuotationAcceptanceToClient(updated);
            if (updated.lead?.email && updated.lead.email !== email) {
                await sendQuotationAcceptanceToClient({
                    ...updated,
                    clientEmail: updated.lead.email,
                    clientName: updated.lead.name
                });
            }
            await sendQuotationAcceptanceToCompany(updated);
        }
        catch (emailError) {
            console.error('Failed to send acceptance emails:', emailError);
        }
        // Create activity log
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.quotationActivity.create({
                data: {
                    quotationId: quotation.id,
                    type: 'STATUS_CHANGE',
                    ipAddress,
                    userAgent,
                    deviceType: userAgent.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop',
                    browser: 'Portal',
                    metadata: {
                        new_status: 'accepted',
                        client_action: true,
                        portal_user: req.client?.name || 'Client'
                    }
                }
            });
        }
        catch (logError) {
            console.error('Failed to log acceptance activity:', logError);
        }
        res.json({
            message: 'Quotation accepted successfully',
            quotation: updated
        });
    }
    catch (error) {
        console.error('Accept quotation error:', error);
        res.status(500).json({ error: 'Failed to accept quotation', details: error.message });
    }
};
exports.acceptQuotation = acceptQuotation;
const rejectQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const clientEmail = req.client?.email;
        const { email, name, comments } = req.body;
        // Validate required fields
        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }
        const quotation = await client_1.default.quotation.findUnique({
            where: { id },
            include: { lead: true }
        });
        // Security check
        if (!quotation || (quotation.clientId !== clientId && quotation.lead?.email !== clientEmail)) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        // Check if already accepted/rejected
        if (quotation.clientAcceptedAt) {
            return res.status(400).json({ error: 'This quotation has already been accepted' });
        }
        if (quotation.clientRejectedAt) {
            return res.status(400).json({ error: 'This quotation has already been rejected' });
        }
        // Update quotation
        const updated = await client_1.default.quotation.update({
            where: { id: quotation.id },
            data: {
                clientRejectedAt: new Date(),
                clientEmail: email,
                clientName: name,
                clientComments: comments || null,
                status: 'rejected'
            },
            include: {
                company: true
            }
        });
        // Send rejection notification email to company
        try {
            const { sendQuotationRejectionToCompany } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
            await sendQuotationRejectionToCompany(updated);
        }
        catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }
        // Create activity log
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await client_1.default.quotationActivity.create({
                data: {
                    quotationId: quotation.id,
                    type: 'STATUS_CHANGE',
                    ipAddress,
                    userAgent,
                    deviceType: userAgent.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop',
                    browser: 'Portal',
                    metadata: {
                        new_status: 'rejected',
                        client_action: true,
                        portal_user: req.client?.name || 'Client'
                    }
                }
            });
        }
        catch (logError) {
            console.error('Failed to log rejection activity:', logError);
        }
        res.json({
            message: 'Quotation rejected',
            quotation: updated
        });
    }
    catch (error) {
        console.error('Reject quotation error:', error);
        res.status(500).json({ error: 'Failed to reject quotation', details: error.message });
    }
};
exports.rejectQuotation = rejectQuotation;
const getQuotationPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const clientEmail = req.client?.email;
        const quotation = await client_1.default.quotation.findUnique({
            where: { id },
            include: {
                lead: true,
                company: true,
                client: true,
                items: {
                    include: { appliedTaxes: true }
                }
            }
        });
        if (!quotation || (quotation.clientId !== clientId && quotation.lead?.email !== clientEmail)) {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        // Hydrate appliedTaxes for legacy items
        const allTaxRates = await client_1.default.taxRate.findMany({ where: { companyId: quotation.companyId } });
        const taxMap = new Map();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));
        const hydratedItems = quotation.items.map((item) => {
            if ((!item.appliedTaxes || item.appliedTaxes.length === 0)) {
                const legacyRate = Number(item.tax) || 0;
                if (legacyRate > 0) {
                    const taxConfig = taxMap.get(legacyRate);
                    const quantity = Number(item.quantity);
                    const unitPrice = Number(item.unitPrice || 0);
                    const amount = (quantity * unitPrice * legacyRate) / 100;
                    return {
                        ...item,
                        appliedTaxes: [{
                                id: 'legacy-hydrate',
                                quotationItemId: item.id,
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
        // Calculate Tax Breakdown from Hydrated Items
        const taxBreakdown = {};
        hydratedItems.forEach((item) => {
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
        });
        // Use appropriate PDF generation (signed if accepted?)
        // Use signed template if quotation is accepted
        const generateMethod = quotation.clientAcceptedAt && quotation.clientSignature ? 'generateSignedQuotationPDF' : 'generateQuotationPDF';
        const pdfBuffer = await pdf_service_1.PDFService[generateMethod]({
            quotationNumber: quotation.quotationNumber,
            quotationDate: quotation.quotationDate,
            validUntil: quotation.validUntil || undefined,
            title: quotation.title || undefined,
            description: quotation.description || undefined,
            notes: quotation.notes || undefined,
            paymentTerms: quotation.paymentTerms || undefined,
            deliveryTerms: quotation.deliveryTerms || undefined,
            currency: quotation.currency,
            subtotal: Number(quotation.subtotal),
            tax: Number(quotation.tax),
            discount: Number(quotation.discount),
            total: Number(quotation.total),
            client: quotation.client ? {
                name: quotation.client.name,
                company: quotation.client.companyName || undefined,
                email: quotation.client.email || undefined,
                phone: quotation.client.phone || undefined,
                mobile: quotation.client.mobile || undefined,
                address: quotation.client.address || undefined,
                city: quotation.client.city || undefined,
                state: quotation.client.state || undefined,
                country: quotation.client.country || undefined,
                pincode: quotation.client.pincode || undefined,
                gstin: quotation.client.gstin || undefined,
                pan: quotation.client.pan || undefined,
                website: quotation.client.website || undefined,
            } : undefined,
            lead: quotation.lead ? {
                name: quotation.lead.name,
                company: quotation.lead.company || undefined,
                email: quotation.lead.email || undefined,
                phone: quotation.lead.phone || undefined
            } : undefined,
            items: hydratedItems.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit || undefined,
                rate: Number(item.unitPrice || 0),
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
                name: quotation.company.name,
                logo: quotation.company.logo || undefined,
                address: quotation.company.address || undefined,
                city: quotation.company.city || undefined,
                state: quotation.company.state || undefined,
                country: quotation.company.country || undefined,
                pincode: quotation.company.pincode || undefined,
                email: quotation.company.email || undefined,
                phone: quotation.company.phone || undefined,
                gstin: quotation.company.gstin || undefined,
                digitalSignature: quotation.company.digitalSignature || undefined,
                letterhead: quotation.company.letterhead || undefined,
                continuationSheet: quotation.company.continuationSheet || undefined,
                pdfMarginTop: quotation.company.pdfMarginTop || undefined,
                pdfMarginBottom: quotation.company.pdfMarginBottom || undefined,
                pdfMarginLeft: quotation.company.pdfMarginLeft || undefined,
                pdfMarginRight: quotation.company.pdfMarginRight || undefined,
                pdfContinuationTop: quotation.company.pdfContinuationTop || undefined
            },
            clientSignature: quotation.clientSignature || undefined,
            clientName: quotation.clientName || undefined,
            clientAcceptedAt: quotation.clientAcceptedAt || undefined,
            signatureToken: quotation.publicToken || undefined,
            useLetterhead: true
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quotation.quotationNumber}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Get Quotation PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
exports.getQuotationPdf = getQuotationPdf;
const getContractPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId; // Contracts likely linked to ClientId directly
        const contract = await client_1.default.contract.findUnique({
            where: { id },
            include: {
                client: true,
                company: true
            }
        });
        if (!contract || contract.clientId !== clientId) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        const pdfBuffer = await pdf_service_1.PDFService.generateContractPDF({ ...contract, useLetterhead: true });
        res.setHeader('Content-Type', 'application/pdf');
        // Contract model has 'title', not 'contractNumber'. Use title or id.
        res.setHeader('Content-Disposition', `attachment; filename="Contract-${contract.title.replace(/\s+/g, '-')}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Get Contract PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
exports.getContractPdf = getContractPdf;
const getMyContracts = async (req, res) => {
    try {
        const clientId = req.clientId;
        // Search by client ID
        const where = { clientId: clientId };
        // Support search filter if needed in future
        if (req.query.search) {
            where.title = { contains: req.query.search, mode: 'insensitive' };
        }
        const contracts = await client_1.default.contract.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { company: true }
        });
        res.json(contracts);
    }
    catch (error) {
        console.error('Get contracts error:', error);
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
};
exports.getMyContracts = getMyContracts;
const getContractDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const contract = await client_1.default.contract.findUnique({
            where: { id },
            include: { company: true }
        });
        if (!contract || contract.clientId !== clientId) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        res.json(contract);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch contract' });
    }
};
exports.getContractDetails = getContractDetails;
// ============================================
// DOCUMENTS (CLIENT UPLOAD)
// ============================================
const getDocuments = async (req, res) => {
    try {
        const clientId = req.clientId;
        const documents = await client_1.default.document.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
                status: true,
                createdAt: true,
                fileSize: true,
                filePath: true,
                mimeType: true,
                rejectionReason: true
            }
        });
        res.json(documents);
    }
    catch (error) {
        console.error('Get Documents Error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};
exports.getDocuments = getDocuments;
const uploadDocument = async (req, res) => {
    try {
        const clientId = req.clientId;
        const { name, type } = req.body;
        // The file upload middleware should populate req.file
        // Assuming we use multer and it places file info in req.file
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!name || !type) {
            return res.status(400).json({ error: 'Document name and type are required' });
        }
        // Get Client to link CompanyId
        const client = await client_1.default.client.findUnique({
            where: { id: clientId },
            select: { companyId: true }
        });
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        const document = await client_1.default.document.create({
            data: {
                clientId,
                companyId: client.companyId,
                name,
                type,
                filePath: file.path || file.location, // Depends on storage provider (disk vs s3)
                fileSize: file.size,
                mimeType: file.mimetype,
                status: 'pending', // Default status for review
                uploadedById: clientId, // Track who uploaded
                category: 'Onboarding'
            }
        });
        res.status(201).json({
            message: 'Document uploaded successfully',
            document
        });
    }
    catch (error) {
        console.error('Upload Document Error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};
exports.uploadDocument = uploadDocument;
//# sourceMappingURL=portal.controller.js.map