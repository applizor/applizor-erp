import prisma from '../prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as accountingService from './accounting.service';

export interface InvoiceItemInput {
    description: string;
    quantity: number;
    rate: number;
    taxRateIds?: string[]; // Multiple tax rates
    hsnSacCode?: string;
    discount?: number; // Optional item-level discount percentage
    explicitAppliedTaxes?: any[]; // For strictly converting quotations with snapshot taxes
}

export interface CreateInvoiceInput {
    companyId: string;
    clientId: string;
    invoiceDate: Date;
    dueDate: Date;
    items: (InvoiceItemInput & { unit?: string; taxRateId?: string })[];
    currency?: string;
    notes?: string;
    terms?: string;
    discount?: number; // Overall discount amount
    type?: string;
    projectId?: string;
    isRecurring?: boolean;
    recurringInterval?: string;
    recurringStartDate?: Date;
    recurringEndDate?: Date;
    recurringNextRun?: Date;
    includeBankDetails?: boolean;
    subscriptionDetails?: {
        planId: string;
        name: string;
    };
}

export class InvoiceService {
    /**
     * Create a new invoice with its items
     */
    static async createInvoice(data: CreateInvoiceInput) {
        // Explicitly remove createdBy and subscriptionDetails if present in the input
        const { items: rawItems, createdBy, subscriptionDetails, ...invoiceData } = data as any;
        const items = rawItems as (InvoiceItemInput & { unit?: string; taxRateId?: string })[];

        // Ensure dates are valid Date objects
        const invoiceDate = new Date(invoiceData.invoiceDate);
        const dueDate = new Date(invoiceData.dueDate);

        // Calculate subtotal and total tax
        let subtotal = 0;
        let totalTax = 0;
        let totalItemDiscount = 0;

        // Fetch tax rates only if needed (if explicit taxes are NOT provided)
        const taxRateIdsToFetch = items
            .filter(item => !item.explicitAppliedTaxes && item.taxRateIds)
            .flatMap(item => item.taxRateIds || []);

        const taxRates = await prisma.taxRate.findMany({
            where: {
                id: { in: taxRateIdsToFetch }
            }
        });

        const processedItems = items.map(item => {
            const quantity = Number(item.quantity || 0);
            const rate = Number(item.rate || 0);
            const grossAmount = quantity * rate;
            const discountPercentage = Number(item.discount || 0);
            const itemDiscount = grossAmount * (discountPercentage / 100);
            const taxableAmount = grossAmount - itemDiscount;

            let itemTotalTax = 0;
            let appliedTaxes = [];

            if (item.explicitAppliedTaxes) {
                // strict conversion mode
                appliedTaxes = item.explicitAppliedTaxes.map(t => {
                    const percentage = new Decimal(t.percentage);
                    const amountValue = taxableAmount * (Number(percentage) / 100);
                    itemTotalTax += amountValue;
                    return {
                        taxRateId: t.taxRateId,
                        name: t.name,
                        percentage: percentage,
                        amount: new Decimal(amountValue)
                    };
                });
            } else {
                // Standard look up mode
                appliedTaxes = (item.taxRateIds || []).map(taxId => {
                    const taxConfig = taxRates.find(t => t.id === taxId);
                    const taxPercentage = taxConfig ? Number(taxConfig.percentage) : 0;
                    const taxAmount = taxableAmount * (taxPercentage / 100);
                    itemTotalTax += taxAmount;
                    return {
                        taxRateId: taxId,
                        name: taxConfig?.name || 'Tax',
                        percentage: new Decimal(taxPercentage),
                        amount: new Decimal(taxAmount)
                    };
                });
            }

            subtotal += grossAmount;
            totalTax += itemTotalTax;
            totalItemDiscount += itemDiscount;

            return {
                ...item,
                discount: new Decimal(discountPercentage),
                amount: new Decimal(taxableAmount), // Storing taxable amount (net of item discount)
                appliedTaxes
            };
        });

        const overallDiscount = Number(invoiceData.discount || 0);
        const total = subtotal + totalTax - totalItemDiscount - overallDiscount;

        // Generate Invoice Number
        const prefix = invoiceData.type === 'quotation' ? 'QTN' : 'INV';
        const currentYear = new Date().getFullYear();

        // Find the last invoice number for this year to ensure uniqueness
        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                companyId: invoiceData.companyId,
                type: invoiceData.type || 'invoice',
                invoiceNumber: {
                    startsWith: `${prefix}-${currentYear}-`
                }
            },
            orderBy: {
                invoiceNumber: 'desc'
            }
        });

        let nextNumber = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const parts = lastInvoice.invoiceNumber.split('-');
            if (parts.length === 3) {
                const lastSeq = parseInt(parts[2], 10);
                if (!isNaN(lastSeq)) {
                    nextNumber = lastSeq + 1;
                }
            }
        }

        const invoiceNumber = `${prefix}-${currentYear}-${String(nextNumber).padStart(5, '0')}`;

        try {
            const result = await prisma.$transaction(async (tx) => {
                const invoice = await tx.invoice.create({
                    data: {
                        ...invoiceData,
                        invoiceDate, // Use explicitly parsed date
                        dueDate,     // Use explicitly parsed date
                        invoiceNumber,
                        subtotal: new Decimal(subtotal),
                        tax: new Decimal(totalTax),
                        discount: new Decimal(overallDiscount),
                        total: new Decimal(total),
                        status: invoiceData.type === 'quotation' ? 'sent' : 'draft',
                        isRecurring: invoiceData.isRecurring || false,
                        recurringInterval: invoiceData.recurringInterval,
                        recurringStartDate: invoiceData.recurringStartDate ? new Date(invoiceData.recurringStartDate) : undefined,
                        recurringEndDate: invoiceData.recurringEndDate ? new Date(invoiceData.recurringEndDate) : undefined,
                        recurringNextRun: invoiceData.recurringNextRun ? new Date(invoiceData.recurringNextRun) : (invoiceData.isRecurring ? new Date(invoiceData.recurringStartDate || Date.now()) : undefined),
                        recurringStatus: invoiceData.isRecurring ? 'active' : undefined,
                        items: {
                            create: processedItems.map(item => ({
                                description: item.description,
                                quantity: new Decimal(item.quantity),
                                rate: new Decimal(item.rate),
                                unit: item.unit,
                                amount: item.amount,
                                hsnSacCode: item.hsnSacCode,
                                discount: item.discount,
                                appliedTaxes: {
                                    create: item.appliedTaxes.map(t => ({
                                        taxRateId: t.taxRateId,
                                        name: t.name,
                                        percentage: t.percentage,
                                        amount: t.amount
                                    }))
                                }
                            }))
                        }
                    },
                    include: {
                        client: true,
                        items: {
                            include: {
                                appliedTaxes: true
                            }
                        }
                    }
                });

                // Log activity
                await tx.auditLog.create({
                    data: {
                        companyId: invoiceData.companyId,
                        action: 'CREATE',
                        module: 'INVOICE',
                        entityType: 'Invoice',
                        entityId: invoice.id,
                        details: `Created invoice ${invoiceNumber}`
                    }
                });

                // Create Subscription Record if this is a new subscription
                if (subscriptionDetails) {
                    const subDetails = subscriptionDetails;
                    await tx.subscription.create({
                        data: {
                            companyId: invoiceData.companyId,
                            clientId: invoiceData.clientId,
                            name: subDetails.name,
                            plan: subDetails.name, // Legacy fallback
                            planId: subDetails.planId,
                            amount: new Decimal(total), // Use invoice total as subscription amount
                            billingCycle: invoiceData.recurringInterval || 'monthly',
                            startDate: invoiceData.recurringStartDate || new Date(),
                            status: 'active',
                            nextBillingDate: invoiceData.recurringNextRun
                        }
                    });
                }

                return invoice;
            });

            // Auto-post outside transaction for visibility
            if (result.type !== 'quotation' && result.status === 'sent') {
                try {
                    await accountingService.postInvoiceToLedger(result.id);
                } catch (err) {
                    console.error('Failed to auto-post created invoice to ledger:', err);
                }
            }

            return result;
        } catch (error) {
            console.error('Create Invoice Transaction Failed:', error);
            throw error;
        }
    }

    /**
     * Delete an invoice and its associated items
     */
    static async deleteInvoice(id: string, companyId: string) {
        // Find the invoice first to check its status and paidAmount
        const invoice = await prisma.invoice.findUnique({
            where: { id },
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (invoice.companyId !== companyId) {
            throw new Error('Unauthorized access to this invoice');
        }

        // Prevent deletion of invoices with payments unless status is draft
        if (Number(invoice.paidAmount) > 0 && invoice.status !== 'draft') {
            throw new Error('Cannot delete an invoice with recorded payments. Please void or refund payments first.');
        }

        return await prisma.$transaction(async (tx) => {
            // Delete associated taxes first (cascading handled by Prisma if configured, but let's be safe)
            // Actually, based on schema, InvoiceItemTax has onDelete: Cascade
            // And InvoiceItem has onDelete: Cascade

            // Unlink any quotation that was converted to this invoice
            await tx.quotation.updateMany({
                where: { convertedToInvoiceId: id },
                data: {
                    status: 'sent', // Revert to sent status so it can be converted again
                    convertedToInvoiceId: null,
                    convertedAt: null
                }
            });

            // Log deletion before we lose the record
            await tx.auditLog.create({
                data: {
                    companyId,
                    action: 'DELETE',
                    module: 'INVOICE',
                    entityType: 'Invoice',
                    entityId: id,
                    details: `Deleted invoice ${invoice.invoiceNumber}`
                }
            });

            // Cleanup ledger
            await accountingService.deleteLedgerPostings(`INV-${invoice.invoiceNumber}`);

            return await tx.invoice.delete({
                where: { id }
            });
        });
    }

    /**
     * Get invoice dashboard statistics
     */
    static async getDashboardStats(companyId: string) {
        const stats = await prisma.invoice.groupBy({
            by: ['status'],
            where: { companyId },
            _sum: {
                total: true,
                paidAmount: true
            },
            _count: true
        });

        const overdueCount = await prisma.invoice.count({
            where: {
                companyId,
                status: { notIn: ['paid', 'cancelled'] },
                dueDate: { lt: new Date() }
            }
        });

        return {
            byStatus: stats,
            overdueCount
        };
    }

    /**
     * Record a payment for an invoice
     */
    static async recordPayment(invoiceId: string, amount: number, paymentMethod: string, transactionId?: string) {
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId }
            });

            if (!invoice) throw new Error('Invoice not found');

            const newPaidAmount = Number(invoice.paidAmount) + amount;
            let status = invoice.status;

            if (newPaidAmount >= Number(invoice.total)) {
                status = 'paid';
            } else if (newPaidAmount > 0) {
                status = 'partial';
            }

            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    paidAmount: new Decimal(newPaidAmount),
                    status
                }
            });

            const pay = await tx.payment.create({
                data: {
                    invoiceId,
                    amount: new Decimal(amount),
                    paymentMethod,
                    transactionId,
                    paymentDate: new Date(),
                    status: 'success'
                }
            });

            return { updatedInvoice, paymentRecordId: pay.id, status };
        });

        // Post to Ledger outside transaction
        try {
            if (result.paymentRecordId) {
                await accountingService.postPaymentToLedger(result.paymentRecordId);
            }
            if (result.status !== 'draft') {
                await accountingService.postInvoiceToLedger(invoiceId);
            }
        } catch (err) {
            console.error('Failed to sync ledger after payment record:', err);
        }

        return result.updatedInvoice;
    }

    /**
     * Process all recurring invoices that are due for generation
     */
    static async processRecurringInvoices() {
        const today = new Date();
        const dueInvoices = await prisma.invoice.findMany({
            where: {
                isRecurring: true,
                recurringStatus: 'active',
                nextOccurrence: { lte: today },
                OR: [
                    { recurringEndDate: null },
                    { recurringEndDate: { gte: today } }
                ]
            },
            include: {
                items: {
                    include: {
                        appliedTaxes: true
                    }
                },
            }
        });

        const results = [];
        for (const source of dueInvoices) {
            try {
                // Clone the invoice
                const newInvoice = await InvoiceService.createInvoice({
                    companyId: source.companyId,
                    clientId: source.clientId,
                    invoiceDate: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
                    items: source.items.map(item => ({
                        description: item.description,
                        quantity: Number(item.quantity),
                        rate: Number(item.rate),
                        taxRateIds: item.appliedTaxes.map(at => at.taxRateId),
                        hsnSacCode: item.hsnSacCode || undefined,
                        unit: item.unit || undefined,
                        discount: Number(item.discount)
                    })),
                    currency: source.currency,
                    notes: source.notes || undefined,
                    terms: source.terms || undefined,
                    discount: Number(source.discount),
                    type: 'invoice'
                });

                // Update the source invoice's next occurrence
                const nextDate = InvoiceService.calculateNextOccurrence(source.recurringNextRun || source.nextOccurrence || new Date(), source.recurringInterval || 'monthly');

                await prisma.invoice.update({
                    where: { id: source.id },
                    data: {
                        recurringNextRun: nextDate,
                        nextOccurrence: nextDate, // Keep both in sync for now
                    }
                });

                results.push({ sourceId: source.id, newId: newInvoice.id });
            } catch (error) {
                console.error(`Failed to generate recurring invoice for ${source.id}:`, error);
            }
        }
        return results;
    }

    private static calculateNextOccurrence(startDate: Date, interval: string): Date {
        const date = new Date(startDate);
        switch (interval.toLowerCase()) {
            case 'daily': date.setDate(date.getDate() + 1); break;
            case 'weekly': date.setDate(date.getDate() + 7); break;
            case 'monthly': date.setMonth(date.getMonth() + 1); break;
            case 'quarterly': date.setMonth(date.getMonth() + 3); break;
            case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
            default: date.setMonth(date.getMonth() + 1);
        }
        return date;
    }

    /**
     * Convert a quotation into a full invoice
     */
    static async convertQuotationToInvoice(quotationId: string) {
        // Correctly fetch from Quotation model
        const quotation = await prisma.quotation.findUnique({
            where: { id: quotationId },
            include: {
                items: {
                    include: {
                        appliedTaxes: true
                    }
                }
            }
        });

        if (!quotation) {
            throw new Error('Quotation not found');
        }

        // Return existing invoice if already converted
        if (quotation.convertedToInvoiceId) {
            const existingInvoice = await prisma.invoice.findUnique({
                where: { id: quotation.convertedToInvoiceId }
            });
            if (existingInvoice) {
                return existingInvoice;
            }
            // If invoice was deleted, allow re-conversion
            console.log(`[CONVERSION] Invoice ${quotation.convertedToInvoiceId} not found, allowing re-conversion for Quotation ${quotationId}`);
        }

        console.log(`[CONVERSION] Starting conversion for Quotation ${quotationId} with ${quotation.items.length} items`);

        const invoice = await InvoiceService.createInvoice({
            companyId: quotation.companyId,
            clientId: quotation.clientId || '', // Handle optional clientId
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days for converted
            items: quotation.items.map(item => {
                console.log(`[CONVERSION] Mapping item: ${item.description}, HSN: ${item.hsnSacCode}, UOM: ${item.unit}, Disc: ${item.discount}`);
                return {
                    description: item.description,
                    quantity: Number(item.quantity),
                    rate: Number(item.unitPrice),
                    taxRateIds: item.appliedTaxes.map(at => at.taxRateId),
                    unit: item.unit || undefined,
                    discount: Number(item.discount || 0),
                    hsnSacCode: item.hsnSacCode || undefined,
                    explicitAppliedTaxes: item.appliedTaxes
                };
            }),
            currency: quotation.currency,
            notes: quotation.notes || undefined,
            terms: quotation.paymentTerms || undefined, // Map paymentTerms to terms
            discount: Number(quotation.discount),
            type: 'invoice'
        });

        // Mark quotation as accepted and link to invoice
        await prisma.quotation.update({
            where: { id: quotationId },
            data: {
                status: 'accepted',
                convertedToInvoiceId: invoice.id,
                convertedAt: new Date()
            }
        });

        return invoice;
    }

    /**
     * Send email reminders for all overdue invoices
     */
    static async sendOverdueReminders() {
        const today = new Date();
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: { in: ['sent', 'partial'] },
                dueDate: { lt: today },
            },
            include: { client: true, company: true, items: true }
        });

        const results = [];
        for (const invoice of overdueInvoices) {
            if (invoice.client?.email) {
                try {
                    const pdfBuffer = await (require('./pdf.service').PDFService.generateInvoicePDF(invoice as any));
                    await (require('./email.service').sendInvoiceEmail(invoice.client.email, invoice, pdfBuffer, true));
                    results.push(invoice.id);
                } catch (e) {
                    console.error(`Failed to send reminder for ${invoice.invoiceNumber}`, e);
                }
            }
        }
        return results;
    }

    /**
     * Update an existing invoice
     */
    static async updateInvoice(id: string, data: CreateInvoiceInput) {
        // Explicitly remove createdBy if present in the input
        const { items: rawItems, createdBy, ...invoiceData } = data as any;
        const items = rawItems as (InvoiceItemInput & { unit?: string })[];

        // Ensure dates are valid Date objects
        const invoiceDate = new Date(invoiceData.invoiceDate);
        const dueDate = new Date(invoiceData.dueDate);

        // Calculate subtotal and total tax
        let subtotal = 0;
        let totalTax = 0;
        let totalItemDiscount = 0;

        const taxRates = await prisma.taxRate.findMany({
            where: {
                id: { in: items.flatMap(item => item.taxRateIds || []) }
            }
        });

        const processedItems = items.map(item => {
            const grossAmount = Number(item.quantity) * Number(item.rate);
            const discountPercentage = Number((item as any).discount || 0);
            const itemDiscount = grossAmount * (discountPercentage / 100);
            const taxableAmount = grossAmount - itemDiscount;

            let itemTotalTax = 0;

            const appliedTaxes = (item.taxRateIds || []).map(taxId => {
                const taxConfig = taxRates.find(t => t.id === taxId);
                const taxPercentage = taxConfig ? Number(taxConfig.percentage) : 0;
                const taxAmount = taxableAmount * (taxPercentage / 100);
                itemTotalTax += taxAmount;
                return {
                    taxRateId: taxId,
                    name: taxConfig?.name || 'Tax',
                    percentage: new Decimal(taxPercentage),
                    amount: new Decimal(taxAmount)
                };
            });

            subtotal += grossAmount;
            totalTax += itemTotalTax;
            totalItemDiscount += itemDiscount;

            return {
                ...item,
                discount: new Decimal(discountPercentage),
                amount: new Decimal(taxableAmount),
                appliedTaxes
            };
        });

        const overallDiscount = Number(invoiceData.discount || 0);
        const total = subtotal + totalTax - totalItemDiscount - overallDiscount;

        const result = await prisma.$transaction(async (tx) => {
            // Delete existing items
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: id }
            });

            // Update invoice and create new items
            const invoice = await tx.invoice.update({
                where: { id },
                data: {
                    ...invoiceData,
                    invoiceDate,
                    dueDate,
                    subtotal: new Decimal(subtotal),
                    tax: new Decimal(totalTax),
                    discount: new Decimal(overallDiscount), // Only store the overall/global discount
                    total: new Decimal(total),
                    isRecurring: invoiceData.isRecurring || false,
                    recurringInterval: invoiceData.recurringInterval,
                    recurringStartDate: invoiceData.recurringStartDate ? new Date(invoiceData.recurringStartDate) : undefined,
                    recurringEndDate: invoiceData.recurringEndDate ? new Date(invoiceData.recurringEndDate) : null,
                    nextOccurrence: invoiceData.nextOccurrence ? new Date(invoiceData.nextOccurrence) : undefined,
                    items: {
                        create: processedItems.map(item => ({
                            description: item.description,
                            quantity: new Decimal(item.quantity),
                            rate: new Decimal(item.rate),
                            unit: item.unit,
                            amount: item.amount,
                            hsnSacCode: item.hsnSacCode,
                            discount: item.discount,
                            appliedTaxes: {
                                create: item.appliedTaxes
                            }
                        }))
                    }
                },
                include: {
                    client: true,
                    items: {
                        include: {
                            appliedTaxes: true
                        }
                    }
                }
            });

            // Log activity
            await tx.auditLog.create({
                data: {
                    companyId: invoiceData.companyId,
                    action: 'UPDATE',
                    module: 'INVOICE',
                    entityType: 'Invoice',
                    entityId: invoice.id,
                    details: `Updated invoice ${invoice.invoiceNumber}`
                }
            });

            return invoice;
        });

        // Sync ledger outside transaction
        try {
            await accountingService.postInvoiceToLedger(id);
        } catch (err) {
            console.error('Failed to sync ledger after invoice update:', err);
        }

        return result;
    }
}

export const invoiceService = new InvoiceService();
