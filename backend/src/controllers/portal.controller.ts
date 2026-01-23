import { Response } from 'express';
import prisma from '../prisma/client';
import { ClientAuthRequest } from '../middleware/client.auth';
import { PDFService } from '../services/pdf.service';

export const getDashboardStats = async (req: ClientAuthRequest, res: Response) => {
    try {
        const clientId = req.clientId;

        const [invoices, projects] = await Promise.all([
            prisma.invoice.findMany({
                where: { clientId },
                select: { total: true, status: true, currency: true }
            }),
            prisma.project.count({
                where: { clientId, status: 'active' } // Assuming active status string
            })
        ]);

        // Calculate totals
        const totalDue = invoices
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + Number(inv.total), 0);

        // Simple currency assumption for MVP (taking first found or default)
        const currency = invoices[0]?.currency || 'USD';

        res.json({
            activeProjects: projects,
            pendingInvoicesCount: invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').length,
            totalDue,
            currency
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

        const pdfBuffer = await PDFService.generateInvoicePDF(invoice);

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
