import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';

// Create Quotation
// Create Quotation
export const createQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'create')) {
            return res.status(403).json({ error: 'Access denied: No create rights for Quotation' });
        }

        const {
            leadId,
            clientId,
            title,
            description,
            validUntil,
            items,
            paymentTerms,
            deliveryTerms,
            notes,
            reminderFrequency,
            maxReminders
        } = req.body;

        // Generate quotation number
        const count = await prisma.quotation.count({
            where: { companyId: user.companyId }
        });
        const quotationNumber = `QUO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        items.forEach((item: any) => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = (itemTotal * item.tax) / 100;
            const itemDiscount = (itemTotal * item.discount) / 100;

            subtotal += itemTotal;
            totalTax += itemTax;
            totalDiscount += itemDiscount;
        });

        const total = subtotal + totalTax - totalDiscount;

        // Fetch company currency
        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            select: { currency: true }
        });

        // Calculate next reminder date if frequency is set
        let nextReminderAt = null;
        if (reminderFrequency) {
            const now = new Date();
            if (reminderFrequency === 'DAILY') {
                nextReminderAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            } else if (reminderFrequency === 'WEEKLY') {
                nextReminderAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            } else if (reminderFrequency === '3_DAYS') {
                nextReminderAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            }
        }

        // Create quotation
        const quotation = await prisma.quotation.create({
            data: {
                companyId: user.companyId,
                createdBy: user.id,
                leadId,
                clientId,
                quotationNumber,
                title,
                description,
                quotationDate: new Date(),
                validUntil: new Date(validUntil),
                subtotal,
                tax: totalTax,
                discount: totalDiscount,
                total,
                currency: company?.currency || 'INR', // Store currency at time of creation
                paymentTerms,
                deliveryTerms,
                notes,
                reminderFrequency,
                maxReminders: maxReminders ? parseInt(maxReminders) : 3,
                nextReminderAt,
                items: {
                    create: items.map((item: any) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        tax: item.tax,
                        discount: item.discount,
                        total: item.quantity * item.unitPrice
                    }))
                }
            },
            include: {
                items: true
            }
        });

        res.status(201).json({
            message: 'Quotation created successfully',
            quotation
        });
    } catch (error: any) {
        console.error('Create quotation error:', error);
        res.status(500).json({ error: 'Failed to create quotation', details: error.message });
    }
};

// Get Quotations
export const getQuotations = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }

        const { status, leadId, clientId, page = 1, limit = 10 } = req.query;

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Base filter
        let where: any = {
            companyId: user.companyId
        };

        // Apply Scope
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'read', 'Quotation', 'createdBy', 'assignedTo'
        );
        where = { ...where, ...scopeFilter };

        if (status) where.status = status;
        if (leadId) where.leadId = leadId;
        if (clientId) {
            where.OR = [
                { clientId: clientId },
                { lead: { convertedToClientId: clientId } }
            ];
        }

        const [quotations, total] = await Promise.all([
            prisma.quotation.findMany({
                where,
                include: {
                    items: true,
                    lead: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit)
            }),
            prisma.quotation.count({ where })
        ]);

        res.json({
            quotations,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error('Get quotations error:', error);
        res.status(500).json({ error: 'Failed to fetch quotations', details: error.message });
    }
};

// Get Single Quotation
// Get Single Quotation
export const getQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'read')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Scope check
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'read', 'Quotation', 'createdBy', 'assignedTo'
        );

        const quotation = await prisma.quotation.findFirst({
            where: { AND: [{ id }, scopeFilter] },
            include: {
                items: true,
                lead: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        legalName: true,
                        email: true,
                        phone: true,
                        address: true,
                        city: true,
                        state: true,
                        country: true,
                        pincode: true,
                        gstin: true,
                        pan: true,
                        logo: true,
                        digitalSignature: true,
                        letterhead: true,
                        continuationSheet: true,
                        pdfMarginTop: true,
                        pdfMarginBottom: true,
                        pdfMarginLeft: true,
                        pdfMarginRight: true,
                        pdfContinuationTop: true
                    }
                }
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found or access denied' });
        }

        res.json({ quotation });
    } catch (error: any) {
        console.error('Get quotation error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation', details: error.message });
    }
};

// Update Quotation
export const updateQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'update')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Scope check
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'update', 'Quotation', 'createdBy', 'assignedTo'
        );
        const count = await prisma.quotation.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (count === 0) return res.status(403).json({ error: 'Access denied' });

        const {
            title,
            description,
            validUntil,
            status,
            paymentTerms,
            deliveryTerms,
            notes,
            items,
            reminderFrequency,
            maxReminders
        } = req.body;

        // Prepare update data
        const updateData: any = {
            title,
            description,
            validUntil: validUntil ? new Date(validUntil) : undefined,
            status,
            paymentTerms,
            deliveryTerms,
            notes
        };

        // Recalculate next reminder if frequency changed
        if (reminderFrequency) {
            updateData.reminderFrequency = reminderFrequency;
            const now = new Date();
            let nextDate = null;
            if (reminderFrequency === 'DAILY') {
                nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            } else if (reminderFrequency === 'WEEKLY') {
                nextDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            } else if (reminderFrequency === '3_DAYS') {
                nextDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            }
            updateData.nextReminderAt = nextDate;
        }

        if (maxReminders !== undefined) {
            updateData.maxReminders = parseInt(maxReminders);
        }

        // If items are provided, recalculate totals and update items
        if (items && Array.isArray(items)) {
            // Calculate totals
            let subtotal = 0;
            let totalTax = 0;
            let totalDiscount = 0;

            items.forEach((item: any) => {
                const itemTotal = item.quantity * item.unitPrice;
                const itemTax = (itemTotal * item.tax) / 100;
                const itemDiscount = (itemTotal * item.discount) / 100;

                subtotal += itemTotal;
                totalTax += itemTax;
                totalDiscount += itemDiscount;
            });

            const total = subtotal + totalTax - totalDiscount;

            updateData.subtotal = subtotal;
            updateData.tax = totalTax;
            updateData.discount = totalDiscount;
            updateData.total = total;

            // Delete existing items and create new ones
            await prisma.quotationItem.deleteMany({
                where: { quotationId: id }
            });

            updateData.items = {
                create: items.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    tax: item.tax,
                    discount: item.discount,
                    total: item.quantity * item.unitPrice
                }))
            };
        }

        const quotation = await prisma.quotation.update({
            where: { id },
            data: updateData,
            include: {
                items: true
            }
        });

        res.json({
            message: 'Quotation updated successfully',
            quotation
        });
    } catch (error: any) {
        console.error('Update quotation error:', error);
        res.status(500).json({ error: 'Failed to update quotation', details: error.message });
    }
};

// Convert Quotation to Invoice
export const convertQuotationToInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!user.companyId) {
            return res.status(400).json({ error: 'User must belong to a company' });
        }

        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'update')) {
            return res.status(403).json({ error: 'Access denied: Cannot update Quotation' });
        }
        if (!PermissionService.hasBasicPermission(user, 'Invoice', 'create')) {
            return res.status(403).json({ error: 'Access denied: Cannot create Invoice' });
        }

        // Scope check for Quotation access
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'update', 'Quotation', 'createdBy', 'assignedTo'
        );

        const quotation = await prisma.quotation.findFirst({
            where: { AND: [{ id }, scopeFilter] },
            include: { items: true }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        let finalClientId = quotation.clientId;

        if (!finalClientId) {
            if (quotation.leadId) {
                // Check if the lead has been converted
                const lead = await prisma.lead.findUnique({
                    where: { id: quotation.leadId }
                });

                if (lead && lead.convertedToClientId) {
                    finalClientId = lead.convertedToClientId;

                    // Self-heal: Update the quotation with the correct client ID
                    await prisma.quotation.update({
                        where: { id: quotation.id },
                        data: { clientId: finalClientId }
                    });
                } else {
                    return res.status(400).json({ error: 'Linked Lead has not been converted to a Client yet. Please convert the lead first.' });
                }
            } else {
                return res.status(400).json({ error: 'Quotation must have a client to convert to invoice' });
            }
        }

        // Generate invoice number
        const invoiceCount = await prisma.invoice.count({
            where: { companyId: user.companyId }
        });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

        // Create invoice
        const invoice = await prisma.invoice.create({
            data: {
                companyId: user.companyId,
                clientId: finalClientId,
                invoiceNumber,
                invoiceDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                subtotal: quotation.subtotal,
                tax: quotation.tax,
                discount: quotation.discount,
                total: quotation.total,
                items: {
                    create: quotation.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        rate: item.unitPrice,
                        taxRate: item.tax,
                        amount: item.total
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // Update quotation
        await prisma.quotation.update({
            where: { id },
            data: {
                status: 'accepted',
                convertedToInvoiceId: invoice.id,
                convertedAt: new Date()
            }
        });

        res.json({
            message: 'Quotation converted to invoice successfully',
            invoice
        });
    } catch (error: any) {
        console.error('Convert quotation error:', error);
        res.status(500).json({ error: 'Failed to convert quotation', details: error.message });
    }
};

// Delete Quotation
export const deleteQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'delete')) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Scope check
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'delete', 'Quotation', 'createdBy', 'assignedTo'
        );
        const count = await prisma.quotation.count({
            where: { AND: [{ id }, scopeFilter] }
        });
        if (count === 0) return res.status(403).json({ error: 'Access denied' });

        await prisma.quotation.delete({
            where: { id }
        });

        res.json({ message: 'Quotation deleted successfully' });
    } catch (error: any) {
        console.error('Delete quotation error:', error);
        res.status(500).json({ error: 'Failed to delete quotation', details: error.message });
    }
};

// Download Quotation PDF
export const downloadQuotationPDF = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Quotation' });
        }

        // Scope check
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'read', 'Quotation', 'createdBy', 'assignedTo'
        );

        const quotation = await prisma.quotation.findFirst({
            where: { AND: [{ id }, scopeFilter] },
            include: {
                items: true,
                lead: true,
                company: true
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        // Import PDF service dynamically
        const { PDFService } = await import('../services/pdf.service');

        // Generate PDF
        const pdfBuffer = await PDFService.generateQuotationPDF({
            quotationNumber: quotation.quotationNumber,
            quotationDate: quotation.quotationDate,
            validUntil: quotation.validUntil || undefined,
            title: quotation.title || undefined,
            description: quotation.description || undefined,
            company: {
                name: quotation.company.name,
                logo: quotation.company.logo || undefined,
                address: quotation.company.address || undefined,
                city: quotation.company.city || undefined,
                state: quotation.company.state || undefined,
                country: quotation.company.country,
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
            lead: quotation.lead ? {
                name: quotation.lead.name,
                company: quotation.lead.company || undefined,
                email: quotation.lead.email || undefined,
                phone: quotation.lead.phone || undefined
            } : undefined,
            items: quotation.items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice)
            })),
            subtotal: Number(quotation.subtotal),
            tax: Number(quotation.tax),
            discount: Number(quotation.discount),
            total: Number(quotation.total),
            currency: quotation.currency,
            notes: quotation.notes || undefined,
            useLetterhead: req.query.useLetterhead === 'true'
        });

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quotation.quotationNumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Download quotation PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
};

// Download Signed Quotation PDF
export const downloadSignedQuotationPDF = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Quotation' });
        }

        // Scope check
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'read', 'Quotation', 'createdBy', 'assignedTo'
        );

        const quotation = await prisma.quotation.findFirst({
            where: { AND: [{ id }, scopeFilter] },
            include: {
                items: true,
                lead: true,
                company: true
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        if (!quotation.clientAcceptedAt || !quotation.clientSignature) {
            return res.status(400).json({ error: 'Quotation has not been accepted by client' });
        }

        // Import PDF service dynamically
        const { PDFService } = await import('../services/pdf.service');

        // Generate signed PDF
        const pdfBuffer = await PDFService.generateSignedQuotationPDF({
            quotationNumber: quotation.quotationNumber,
            quotationDate: quotation.quotationDate,
            validUntil: quotation.validUntil || undefined,
            title: quotation.title || undefined,
            description: quotation.description || undefined,
            company: {
                name: quotation.company.name,
                logo: quotation.company.logo || undefined,
                address: quotation.company.address || undefined,
                city: quotation.company.city || undefined,
                state: quotation.company.state || undefined,
                country: quotation.company.country,
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
            lead: quotation.lead ? {
                name: quotation.lead.name,
                company: quotation.lead.company || undefined,
                email: quotation.lead.email || undefined,
                phone: quotation.lead.phone || undefined
            } : undefined,
            items: quotation.items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice)
            })),
            subtotal: Number(quotation.subtotal),
            tax: Number(quotation.tax),
            discount: Number(quotation.discount),
            total: Number(quotation.total),
            currency: quotation.currency,
            notes: quotation.notes || undefined,
            clientSignature: quotation.clientSignature,
            clientName: quotation.clientName || undefined,
            clientAcceptedAt: quotation.clientAcceptedAt,
            useLetterhead: req.query.useLetterhead === 'true'
        });

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quotation.quotationNumber}-Signed.pdf"`);
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Download signed quotation PDF error:', error);
        res.status(500).json({ error: 'Failed to generate signed PDF', details: error.message });
    }
};

// Send Quotation Email to Client
export const sendQuotationEmail = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'update')) {
            return res.status(403).json({ error: 'Access denied: No update rights for Quotation' });
        }

        // Scope check
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'update', 'Quotation', 'createdBy', 'assignedTo'
        );

        const quotation = await prisma.quotation.findFirst({
            where: { AND: [{ id }, scopeFilter] },
            include: {
                items: true,
                lead: true,
                company: true
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        // Check if lead has email
        if (!quotation.lead?.email) {
            return res.status(400).json({ error: 'Lead does not have an email address' });
        }

        // Generate public link if not already generated
        let publicToken = quotation.publicToken;
        let publicUrl = '';

        if (!quotation.isPublicEnabled || !quotation.publicToken) {
            const { v4: uuidv4 } = await import('uuid');
            publicToken = uuidv4();
            const publicExpiresAt = new Date();
            publicExpiresAt.setDate(publicExpiresAt.getDate() + 30); // 30 days

            await prisma.quotation.update({
                where: { id },
                data: {
                    publicToken,
                    publicExpiresAt,
                    isPublicEnabled: true,
                    status: 'sent'
                }
            });
        }

        publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/quotations/${publicToken}`;

        // Send email
        const { sendQuotationToClient } = await import('../services/email.service');
        await sendQuotationToClient(quotation, publicUrl);

        res.json({
            message: 'Quotation email sent successfully',
            publicUrl
        });
    } catch (error: any) {
        console.error('Send quotation email error:', error);
        res.status(500).json({ error: 'Failed to send quotation email', details: error.message });
    }
};

// Get Quotation Analytics
export const getQuotationAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Check permission (Read access required to view analytics)
        if (!PermissionService.hasBasicPermission(user, 'Quotation', 'read')) {
            return res.status(403).json({ error: 'Access denied: No read rights for Quotation' });
        }

        // Scope check
        const scopeFilter = await PermissionService.getScopedWhereClause(
            user, 'Quotation', 'read', 'Quotation', 'createdBy', 'assignedTo'
        );

        const quotation = await prisma.quotation.findFirst({
            where: { AND: [{ id }, scopeFilter] },
            select: {
                id: true,
                viewCount: true,
                lastViewedAt: true,
                emailOpens: true,
                lastEmailOpenedAt: true,
                status: true,
                clientViewedAt: true,
                clientAcceptedAt: true,
                clientRejectedAt: true,
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found or access denied' });
        }

        res.json({ analytics: quotation });
    } catch (error: any) {
        console.error('Get quotation analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch quotation analytics', details: error.message });
    }
};
