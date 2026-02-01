import { Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
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
        const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map<number, any>();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));

        const hydratedItems = invoice.items.map((item: any) => {
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
                            percentage: new Decimal(rate),
                            amount: new Decimal(amount)
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
            const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            await prisma.$transaction([
                prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        viewCount: { increment: 1 },
                        lastViewedAt: new Date()
                    }
                }),
                prisma.invoiceActivity.create({
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
        } catch (logError) {
            console.error('Failed to log portal invoice view:', logError);
        }

        res.json({ invoice: { ...invoice, items: hydratedItems }, timeline });
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
                items: {
                    include: { appliedTaxes: true }
                },
            }
        });

        if (!invoice || invoice.clientId !== clientId) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Hydrate appliedTaxes for legacy items
        const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map<number, any>();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));

        const hydratedItems = invoice.items.map((item: any) => {
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
                            percentage: new Decimal(rate),
                            amount: new Decimal(amount)
                        }]
                    };
                }
            }
            return item;
        });

        const pdfBuffer = await PDFService.generateInvoicePDF({ ...invoice, items: hydratedItems, useLetterhead: true });

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
                    deviceType: userAgent.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop',
                    browser: 'Portal'
                }
            });
        } catch (logError) {
            console.error('Failed to log portal invoice download:', logError);
        }

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
        const clientId = req.clientId;
        const clientEmail = req.client?.email;

        const quotation = await prisma.quotation.findUnique({
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
        const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: quotation.companyId } });
        const taxMap = new Map<number, any>();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));

        const hydratedItems = quotation.items.map((item: any) => {
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
                            percentage: new Decimal(legacyRate),
                            amount: new Decimal(amount)
                        }]
                    };
                }
            }
            return item;
        });

        // Capture Analytics Data
        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Update View Statistics & Activity Log
        await prisma.$transaction(async (tx) => {
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
    } catch (error) {
        console.error('Get quotation details error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation details' });
    }
};

export const acceptQuotation = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const clientEmail = req.client?.email;
        const { signature, email, name, comments } = req.body;

        // Validate required fields
        if (!signature || !email || !name) {
            return res.status(400).json({ error: 'Signature, email, and name are required' });
        }

        const quotation = await prisma.quotation.findUnique({
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
        const updated = await prisma.quotation.update({
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
            const { sendQuotationAcceptanceToClient, sendQuotationAcceptanceToCompany } = await import('../services/email.service');
            await sendQuotationAcceptanceToClient(updated);
            if (updated.lead?.email && updated.lead.email !== email) {
                await sendQuotationAcceptanceToClient({
                    ...updated,
                    clientEmail: updated.lead.email,
                    clientName: updated.lead.name
                });
            }
            await sendQuotationAcceptanceToCompany(updated);
        } catch (emailError) {
            console.error('Failed to send acceptance emails:', emailError);
        }

        // Create activity log
        try {
            const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            await prisma.quotationActivity.create({
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
        } catch (logError) {
            console.error('Failed to log acceptance activity:', logError);
        }

        res.json({
            message: 'Quotation accepted successfully',
            quotation: updated
        });
    } catch (error: any) {
        console.error('Accept quotation error:', error);
        res.status(500).json({ error: 'Failed to accept quotation', details: error.message });
    }
};

export const rejectQuotation = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const clientEmail = req.client?.email;
        const { email, name, comments } = req.body;

        // Validate required fields
        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        const quotation = await prisma.quotation.findUnique({
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
        const updated = await prisma.quotation.update({
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
            const { sendQuotationRejectionToCompany } = await import('../services/email.service');
            await sendQuotationRejectionToCompany(updated);
        } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
        }

        // Create activity log
        try {
            const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            await prisma.quotationActivity.create({
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
        } catch (logError) {
            console.error('Failed to log rejection activity:', logError);
        }

        res.json({
            message: 'Quotation rejected',
            quotation: updated
        });
    } catch (error: any) {
        console.error('Reject quotation error:', error);
        res.status(500).json({ error: 'Failed to reject quotation', details: error.message });
    }
};

export const getQuotationPdf = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const clientId = req.clientId;
        const clientEmail = req.client?.email;

        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: {
                lead: true,
                company: true,
                items: {
                    include: { appliedTaxes: true }
                }
            }
        });

        if (!quotation || (quotation.clientId !== clientId && quotation.lead?.email !== clientEmail)) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        // Hydrate appliedTaxes for legacy items
        const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: quotation.companyId } });
        const taxMap = new Map<number, any>();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));

        const hydratedItems = quotation.items.map((item: any) => {
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
                            percentage: new Decimal(legacyRate),
                            amount: new Decimal(amount)
                        }]
                    };
                }
            }
            return item;
        });

        // Use appropriate PDF generation (signed if accepted?)
        const pdfBuffer = await PDFService.generateQuotationPDF({ ...quotation, items: hydratedItems, useLetterhead: true });

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
