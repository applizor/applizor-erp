import { Response } from 'express';
import prisma from '../prisma/client';
import { ClientAuthRequest } from '../middleware/client.auth';
import { PDFService } from '../services/pdf.service';

export const getDashboardStats = async (req: ClientAuthRequest, res: Response) => {
    try {
        const clientId = req.clientId;

        // Fetch basic stats and task metrics in parallel
        const [invoices, projects, taskStats, recentComments] = await Promise.all([
            // 1. Invoices
            prisma.invoice.findMany({
                where: { clientId },
                select: { total: true, status: true, currency: true }
            }),
            // 2. Active Projects count
            prisma.project.count({
                where: { clientId, status: 'active' }
            }),
            // 3. Task Counts (In Progress & Review)
            prisma.task.groupBy({
                by: ['status'],
                where: {
                    project: { clientId },
                    status: { not: 'done' } // generalized check, specific buckets below
                },
                _count: { id: true }
            }),
            // 4. Recent Comments (Activity Feed) - exluding client's own comments
            prisma.taskComment.findMany({
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
            } else if (['todo', 'in-progress'].includes(bucket.status)) {
                tasksInProgress += bucket._count.id;
            }
        });

        // Process Invoices
        const totalDue = invoices
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + Number(inv.total), 0);

        const currency = invoices[0]?.currency || 'USD';

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

    } catch (error) {
        console.error('Portal stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

export const getMyInvoices = async (req: ClientAuthRequest, res: Response) => {
    try {
        const clientId = req.clientId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, status, startDate, endDate, projectId } = req.query;

        const where: any = { clientId };

        if (status && status !== 'all') {
            where.status = status;
        }

        if (projectId && projectId !== 'all') {
            where.projectId = projectId;
        }

        if (startDate && endDate) {
            where.invoiceDate = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }

        if (search) {
            where.invoiceNumber = {
                contains: search as string,
                mode: 'insensitive'
            };
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                orderBy: { invoiceDate: 'desc' },
                skip,
                take: limit,
                include: { items: true, project: true }
            }),
            prisma.invoice.count({ where })
        ]);

        res.json({ invoices, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

export const getMyProjects = async (req: ClientAuthRequest, res: Response) => {
    try {
        const clientId = req.clientId;
        const projects = await prisma.project.findMany({
            where: { clientId },
            orderBy: { updatedAt: 'desc' },
            include: { tasks: false }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

export const getInvoiceDetails = async (req: ClientAuthRequest, res: Response) => {
    try {
        const clientId = req.clientId;
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
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

        // Timeline Logic
        const timeline = [
            { status: 'Draft', date: invoice.createdAt, completed: true },
            { status: 'Sent', date: invoice.invoiceDate || invoice.createdAt, completed: invoice.status !== 'draft' },
            { status: 'Paid', date: invoice.payments[0]?.createdAt, completed: invoice.status === 'paid' }
        ];

        res.json({ invoice, timeline });
    } catch (error) {
        console.error('Get invoice details error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice details' });
    }
};

export const getInvoicePdf = async (req: ClientAuthRequest, res: Response) => {
    try {
        const clientId = req.clientId;
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
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

        const pdfBuffer = await PDFService.generateInvoicePDF({ ...invoice, useLetterhead: true });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Get PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

export const exportInvoices = async (req: ClientAuthRequest, res: Response) => {
    try {
        const clientId = req.clientId;
        const { search, status, startDate, endDate, projectId } = req.query;

        const where: any = { clientId };

        if (status && status !== 'all') where.status = status;
        if (projectId && projectId !== 'all') where.projectId = projectId;
        if (startDate && endDate) {
            where.invoiceDate = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }
        if (search) {
            where.invoiceNumber = {
                contains: search as string,
                mode: 'insensitive'
            };
        }

        const invoices = await prisma.invoice.findMany({
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

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export invoices' });
    }
};

// ==========================================
// Quotations
// ==========================================


export const getMyQuotations = async (req: ClientAuthRequest, res: Response) => {
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
        const where: any = {
            lead: {
                email: clientEmail
            }
        };

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.quotationNumber = {
                contains: search as string,
                mode: 'insensitive'
            };
        }

        const [quotations, total] = await Promise.all([
            prisma.quotation.findMany({
                where,
                orderBy: { quotationDate: 'desc' },
                skip,
                take: limit,
                include: { items: true, lead: true, company: true }
            }),
            prisma.quotation.count({ where })
        ]);

        res.json({ quotations, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Get quotations error:', error);
        res.status(500).json({ error: 'Failed to fetch quotations' });
    }
};

export const getQuotationDetails = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientEmail = req.client?.email;

        const quotation = await prisma.quotation.findUnique({
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

        res.json({ quotation });
    } catch (error) {
        console.error('Get quotation details error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation details' });
    }
};

export const getQuotationPdf = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientEmail = req.client?.email;

        const quotation = await prisma.quotation.findUnique({
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

        // Use appropriate PDF generation (signed if accepted?)
        const pdfBuffer = await PDFService.generateQuotationPDF({ ...quotation, useLetterhead: true });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quotation.quotationNumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Get Quotation PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

export const getContractPdf = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId; // Contracts likely linked to ClientId directly

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                client: true,
                company: true
            }
        });

        if (!contract || contract.clientId !== clientId) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        const pdfBuffer = await PDFService.generateContractPDF({ ...contract, useLetterhead: true });

        res.setHeader('Content-Type', 'application/pdf');
        // Contract model has 'title', not 'contractNumber'. Use title or id.
        res.setHeader('Content-Disposition', `attachment; filename="Contract-${contract.title.replace(/\s+/g, '-')}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Get Contract PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

export const getMyContracts = async (req: ClientAuthRequest, res: Response) => {
    try {
        const clientId = req.clientId;
        // Search by client ID
        const where: any = { clientId: clientId };

        // Support search filter if needed in future
        if (req.query.search) {
            where.title = { contains: req.query.search as string, mode: 'insensitive' };
        }

        const contracts = await prisma.contract.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { company: true }
        });

        res.json(contracts);
    } catch (error) {
        console.error('Get contracts error:', error);
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
};

export const getContractDetails = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!contract || contract.clientId !== clientId) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        res.json(contract);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contract' });
    }
};
