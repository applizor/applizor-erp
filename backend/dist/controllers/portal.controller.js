"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContractDetails = exports.getMyContracts = exports.getContractPdf = exports.getQuotationPdf = exports.getQuotationDetails = exports.getMyQuotations = exports.exportInvoices = exports.getInvoicePdf = exports.getInvoiceDetails = exports.getMyProjects = exports.getMyInvoices = exports.getDashboardStats = void 0;
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
                items: true,
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
        // Timeline Logic
        const timeline = [
            { status: 'Draft', date: invoice.createdAt, completed: true },
            { status: 'Sent', date: invoice.invoiceDate || invoice.createdAt, completed: invoice.status !== 'draft' },
            { status: 'Paid', date: invoice.payments[0]?.createdAt, completed: invoice.status === 'paid' }
        ];
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
                items: true,
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
        const pdfBuffer = await pdf_service_1.PDFService.generateInvoicePDF({ ...invoice, items: hydratedItems, useLetterhead: true });
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
            lead: {
                email: clientEmail
            }
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
        const clientEmail = req.client?.email;
        const quotation = await client_1.default.quotation.findUnique({
            where: { id },
            include: {
                items: true,
                lead: true,
                company: true
            }
        });
        // Security check: Ensure quotation belongs to this client (via lead email)
        if (!quotation || quotation.lead?.email !== clientEmail) {
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
        res.json({ quotation: { ...quotation, items: hydratedItems } });
    }
    catch (error) {
        console.error('Get quotation details error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation details' });
    }
};
exports.getQuotationDetails = getQuotationDetails;
const getQuotationPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const clientEmail = req.client?.email;
        const quotation = await client_1.default.quotation.findUnique({
            where: { id },
            include: {
                lead: true,
                company: true,
                items: true
            }
        });
        if (!quotation || quotation.lead?.email !== clientEmail) {
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
        // Use appropriate PDF generation (signed if accepted?)
        const pdfBuffer = await pdf_service_1.PDFService.generateQuotationPDF({ ...quotation, items: hydratedItems, useLetterhead: true });
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
//# sourceMappingURL=portal.controller.js.map