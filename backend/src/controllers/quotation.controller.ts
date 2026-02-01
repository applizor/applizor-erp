import { Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { PermissionService } from '../services/permission.service';
import { InvoiceService } from '../services/invoice.service';

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
            discount, // Extract overall discount
            reminderFrequency,
            maxReminders
        } = req.body;

        // Generate quotation number
        const count = await prisma.quotation.count({
            where: { companyId: user.companyId }
        });
        const quotationNumber = `QUO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const taxRates = await prisma.taxRate.findMany({
            where: {
                id: { in: items.flatMap((item: any) => item.taxRateIds || []) }
            }
        });

        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        const processedItems = items.map((item: any) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
            const taxableAmount = itemSubtotal - itemDiscount;

            let itemTotalTax = 0;
            const appliedTaxes = (item.taxRateIds || []).map((taxId: string) => {
                const taxConfig = taxRates.find(t => t.id === taxId);
                const taxPercentage = taxConfig ? Number(taxConfig.percentage) : 0;
                const taxAmount = taxableAmount * (taxPercentage / 100);
                itemTotalTax += taxAmount;
                return {
                    taxRateId: taxId,
                    name: taxConfig?.name || 'Tax',
                    percentage: taxPercentage,
                    amount: taxAmount
                };
            });

            subtotal += itemSubtotal;
            totalTax += itemTotalTax;
            totalDiscount += itemDiscount;

            return {
                ...item,
                appliedTaxes,
                total: itemSubtotal - itemDiscount + itemTotalTax
            };
        });

        const overallDiscount = Number(discount || 0);
        const total = subtotal + totalTax - totalDiscount - overallDiscount;

        // Fetch company currency

        // Fetch Client or Lead to determine currency
        let currency = 'INR';
        if (clientId) {
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                select: { currency: true }
            });
            if (client?.currency) currency = client.currency;
        } else if (leadId) {
            const lead = await prisma.lead.findUnique({
                where: { id: leadId },
                select: { currency: true }
            });
            if (lead?.currency) currency = lead.currency;
        } else {
            const company = await prisma.company.findUnique({
                where: { id: user.companyId },
                select: { currency: true }
            });
            if (company?.currency) currency = company.currency;
        }

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
                discount: overallDiscount,
                total,
                currency: currency, // Store determined currency
                paymentTerms,
                deliveryTerms,
                notes,
                reminderFrequency,
                maxReminders: maxReminders ? parseInt(maxReminders) : 3,
                nextReminderAt,
                items: {
                    create: processedItems.map((item: any) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unit: item.unit,
                        unitPrice: item.unitPrice,
                        hsnSacCode: item.hsnSacCode,
                        discount: item.discount,
                        total: item.total,
                        appliedTaxes: {
                            create: item.appliedTaxes
                        }
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
                items: {
                    include: {
                        appliedTaxes: true
                    }
                },
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

        res.json({ quotation: { ...quotation, items: hydratedItems } });
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
            discount, // Extract overall discount
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
            const taxRates = await prisma.taxRate.findMany({
                where: {
                    id: { in: items.flatMap((item: any) => item.taxRateIds || []) }
                }
            });

            // Calculate totals
            let subtotal = 0;
            let totalTax = 0;
            let totalDiscount = 0;

            const processedItems = items.map((item: any) => {
                const itemSubtotal = item.quantity * item.unitPrice;
                const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
                const taxableAmount = itemSubtotal - itemDiscount;

                let itemTotalTax = 0;
                const appliedTaxes = (item.taxRateIds || []).map((taxId: string) => {
                    const taxConfig = taxRates.find(t => t.id === taxId);
                    const taxPercentage = taxConfig ? Number(taxConfig.percentage) : 0;
                    const taxAmount = taxableAmount * (taxPercentage / 100);
                    itemTotalTax += taxAmount;
                    return {
                        taxRateId: taxId,
                        name: taxConfig?.name || 'Tax',
                        percentage: taxPercentage,
                        amount: taxAmount
                    };
                });

                subtotal += itemSubtotal;
                totalTax += itemTotalTax;
                totalDiscount += itemDiscount;

                return {
                    ...item,
                    appliedTaxes,
                    total: itemSubtotal - itemDiscount + itemTotalTax
                };
            });

            const overallDiscount = Number(discount || 0);
            const total = subtotal + totalTax - totalDiscount - overallDiscount;

            updateData.subtotal = subtotal;
            updateData.tax = totalTax;
            updateData.discount = overallDiscount;
            updateData.total = total;

            // Delete existing items and create new ones
            await prisma.quotationItem.deleteMany({
                where: { quotationId: id }
            });

            updateData.items = {
                create: processedItems.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                    hsnSacCode: item.hsnSacCode,
                    discount: item.discount,
                    total: item.total,
                    appliedTaxes: {
                        create: item.appliedTaxes
                    }
                }))
            };
        }

        const quotation = await prisma.quotation.update({
            where: { id },
            data: updateData,
            include: {
                items: {
                    include: {
                        appliedTaxes: true
                    }
                }
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
            include: {
                items: {
                    include: {
                        appliedTaxes: true
                    }
                }
            }
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

        // Calculate true additional discount to handle potentially "tainted" source data (legacy quotes)
        const totalItemDiscount = (quotation.items as any[]).reduce((acc, item) => {
            const gross = Number(item.quantity) * Number(item.unitPrice);
            return acc + (gross * (Number(item.discount || 0) / 100));
        }, 0);

        // Formula: Total = Subtotal + Tax - ItemDiscounts - AdditionalDiscount
        // Therefore: AdditionalDiscount = Subtotal + Tax - ItemDiscounts - Total
        const overallDiscount = (Number(quotation.subtotal) + Number(quotation.tax) - totalItemDiscount) - Number(quotation.total);

        // Create invoice using InvoiceService to centralized business logic and numbering
        const invoice = await InvoiceService.createInvoice({
            companyId: user.companyId,
            clientId: finalClientId,
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            currency: quotation.currency,
            discount: Math.max(0, overallDiscount), // Use cleansed overall discount
            notes: quotation.notes || undefined,
            type: 'invoice',
            items: quotation.items.map(item => ({
                description: item.description,
                hsnSacCode: item.hsnSacCode || undefined,
                quantity: Number(item.quantity),
                unit: item.unit || undefined,
                rate: Number(item.unitPrice),
                discount: Number(item.discount),
                taxRate: Number(item.tax),
                taxRateId: item.taxRateId || undefined,
                explicitAppliedTaxes: item.appliedTaxes.map(t => ({
                    taxRateId: t.taxRateId,
                    name: t.name,
                    percentage: Number(t.percentage),
                    amount: Number(t.amount)
                }))
            }))
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
                items: {
                    include: {
                        appliedTaxes: true
                    }
                },
                lead: true,
                company: true,
                client: true
            }
        });

        if (!quotation) {
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

        // Use hydrated items for breakdowns
        (quotation as any).items = hydratedItems;

        // Import PDF service dynamically
        const { PDFService } = await import('../services/pdf.service');

        // Calculate Tax Breakdown
        const taxBreakdown: Record<string, { name: string; percentage: number; amount: number }> = {};
        quotation.items.forEach((item: any) => {
            if (item.appliedTaxes) {
                item.appliedTaxes.forEach((tax: any) => {
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

        // Generate PDF
        const pdfBuffer = await PDFService.generateQuotationPDF({
            taxBreakdown: Object.values(taxBreakdown),
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
                taxName: quotation.client.taxName || undefined
            } : undefined,
            lead: quotation.lead ? {
                name: quotation.lead.name,
                company: quotation.lead.company || undefined,
                email: quotation.lead.email || undefined,
                phone: quotation.lead.phone || undefined
            } : undefined,
            items: quotation.items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit || undefined,
                rate: Number(item.unitPrice || 0),
                discount: Number(item.discount || 0),
                hsnSacCode: item.hsnSacCode || undefined,
                appliedTaxes: (item.appliedTaxes as any[] || []).map(t => ({
                    name: t.name,
                    percentage: Number(t.percentage),
                    amount: Number(t.amount)
                }))
            })),
            subtotal: Number(quotation.subtotal),
            tax: Number(quotation.tax),
            discount: Number(quotation.discount),
            total: Number(quotation.total),
            currency: quotation.currency,
            notes: quotation.notes || undefined,
            paymentTerms: quotation.paymentTerms || undefined,
            deliveryTerms: quotation.deliveryTerms || undefined,
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
                items: {
                    include: {
                        appliedTaxes: true
                    }
                },
                lead: true,
                company: true,
                client: true
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

        // Calculate Tax Breakdown
        const taxBreakdown: Record<string, { name: string; percentage: number; amount: number }> = {};
        quotation.items.forEach((item: any) => {
            if (item.appliedTaxes) {
                item.appliedTaxes.forEach((tax: any) => {
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

        // Generate signed PDF
        const pdfBuffer = await PDFService.generateSignedQuotationPDF({
            taxBreakdown: Object.values(taxBreakdown),
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
                taxName: quotation.client.taxName || undefined
            } : undefined,
            lead: quotation.lead ? {
                name: quotation.lead.name,
                company: quotation.lead.company || undefined,
                email: quotation.lead.email || undefined,
                phone: quotation.lead.phone || undefined
            } : undefined,
            items: quotation.items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit || undefined,
                rate: Number(item.unitPrice || 0),
                discount: Number(item.discount || 0),
                hsnSacCode: item.hsnSacCode || undefined,
                appliedTaxes: (item.appliedTaxes as any[] || []).map((t: any) => ({
                    name: t.name,
                    percentage: Number(t.percentage),
                    amount: Number(t.amount)
                }))
            })),
            subtotal: Number(quotation.subtotal),
            tax: Number(quotation.tax),
            discount: Number(quotation.discount),
            total: Number(quotation.total),
            currency: quotation.currency,
            notes: quotation.notes || undefined,
            paymentTerms: quotation.paymentTerms || undefined,
            deliveryTerms: quotation.deliveryTerms || undefined,
            clientSignature: quotation.clientSignature,
            clientName: quotation.clientName || undefined,
            clientAcceptedAt: quotation.clientAcceptedAt,
            signatureToken: quotation.publicToken || undefined,
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
                company: true,
                client: true
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
