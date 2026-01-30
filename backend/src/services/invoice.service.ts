import prisma from '../prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface InvoiceItemInput {
    description: string;
    quantity: number;
    rate: number;
    taxRateIds?: string[]; // Multiple tax rates
    hsnCode?: string;
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
    discount?: number;
    type?: string;
    projectId?: string;
    isRecurring?: boolean;
    recurringInterval?: string;
    recurringStartDate?: Date;
    recurringEndDate?: Date;
    recurringNextRun?: Date;
}

export class InvoiceService {
    /**
     * Create a new invoice with its items
     */
    static async createInvoice(data: CreateInvoiceInput) {
        // Explicitly remove createdBy if present in the input (even if not in interface)
        const { items: rawItems, createdBy, ...invoiceData } = data as any;
        const items = rawItems as (InvoiceItemInput & { unit?: string; taxRateId?: string })[];

        // Ensure dates are valid Date objects
        const invoiceDate = new Date(invoiceData.invoiceDate);
        const dueDate = new Date(invoiceData.dueDate);

        // Calculate subtotal and total tax
        let subtotal = 0;
        let totalTax = 0;

        const taxRates = await prisma.taxRate.findMany({
            where: {
                id: { in: items.flatMap(item => item.taxRateIds || []) }
            }
        });

        const processedItems = items.map(item => {
            const amount = Number(item.quantity) * Number(item.rate);
            let itemTotalTax = 0;

            const appliedTaxes = (item.taxRateIds || []).map(taxId => {
                const taxConfig = taxRates.find(t => t.id === taxId);
                const taxPercentage = taxConfig ? Number(taxConfig.percentage) : 0;
                const taxAmount = amount * (taxPercentage / 100);
                itemTotalTax += taxAmount;
                return {
                    taxRateId: taxId,
                    name: taxConfig?.name || 'Tax',
                    percentage: new Decimal(taxPercentage),
                    amount: new Decimal(taxAmount)
                };
            });

            subtotal += amount;
            totalTax += itemTotalTax;

            return {
                ...item,
                amount: new Decimal(amount),
                appliedTaxes
            };
        });

        const discount = Number(invoiceData.discount || 0);
        const total = subtotal + totalTax - discount;

        // Generate Invoice Number
        const prefix = invoiceData.type === 'quotation' ? 'QTN' : 'INV';
        const currentYear = new Date().getFullYear();

        const count = await prisma.invoice.count({
            where: {
                companyId: invoiceData.companyId,
                type: invoiceData.type || 'invoice'
            }
        });

        const invoiceNumber = `${prefix}-${currentYear}-${String(count + 1).padStart(5, '0')}`;

        try {
            return await prisma.$transaction(async (tx) => {
                const invoice = await tx.invoice.create({
                    data: {
                        ...invoiceData,
                        invoiceDate, // Use explicitly parsed date
                        dueDate,     // Use explicitly parsed date
                        invoiceNumber,
                        subtotal: new Decimal(subtotal),
                        tax: new Decimal(totalTax),
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
                                hsnCode: item.hsnCode,
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
                        action: 'CREATE',
                        module: 'INVOICE',
                        entityType: 'Invoice',
                        entityId: invoice.id,
                        details: `Created invoice ${invoiceNumber}`
                    }
                });

                return invoice;
            });
        } catch (error) {
            console.error('Create Invoice Transaction Failed:', error);
            throw error;
        }
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
        return await prisma.$transaction(async (tx) => {
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

            await tx.payment.create({
                data: {
                    invoiceId,
                    amount: new Decimal(amount),
                    paymentMethod,
                    transactionId,
                    paymentDate: new Date(),
                    status: 'success'
                }
            });

            return updatedInvoice;
        });
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
                        hsnCode: item.hsnCode || undefined,
                        unit: item.unit || undefined
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
            return await prisma.invoice.findUnique({
                where: { id: quotation.convertedToInvoiceId }
            });
        }

        const invoice = await InvoiceService.createInvoice({
            companyId: quotation.companyId,
            clientId: quotation.clientId || '', // Handle optional clientId
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days for converted
            items: quotation.items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                rate: Number(item.unitPrice),
                taxRateIds: item.appliedTaxes.map(at => at.taxRateId),
                unit: item.unit || undefined
            })),
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

        const taxRates = await prisma.taxRate.findMany({
            where: {
                id: { in: items.flatMap(item => item.taxRateIds || []) }
            }
        });

        const processedItems = items.map(item => {
            const amount = Number(item.quantity) * Number(item.rate);
            let itemTotalTax = 0;

            const appliedTaxes = (item.taxRateIds || []).map(taxId => {
                const taxConfig = taxRates.find(t => t.id === taxId);
                const taxPercentage = taxConfig ? Number(taxConfig.percentage) : 0;
                const taxAmount = amount * (taxPercentage / 100);
                itemTotalTax += taxAmount;
                return {
                    taxRateId: taxId,
                    name: taxConfig?.name || 'Tax',
                    percentage: new Decimal(taxPercentage),
                    amount: new Decimal(taxAmount)
                };
            });

            subtotal += amount;
            totalTax += itemTotalTax;

            return {
                ...item,
                amount: new Decimal(amount),
                appliedTaxes
            };
        });

        const discount = Number(invoiceData.discount || 0);
        const total = subtotal + totalTax - discount;

        try {
            return await prisma.$transaction(async (tx) => {
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
                        total: new Decimal(total),
                        isRecurring: invoiceData.isRecurring || false,
                        recurringInterval: invoiceData.recurringInterval,
                        nextOccurrence: invoiceData.nextOccurrence,
                        items: {
                            create: processedItems.map(item => ({
                                description: item.description,
                                quantity: new Decimal(item.quantity),
                                rate: new Decimal(item.rate),
                                unit: item.unit,
                                amount: item.amount,
                                hsnCode: item.hsnCode,
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
        } catch (error) {
            console.error('Update Invoice Failed:', error);
            throw error;
        }
    }
}

export const invoiceService = new InvoiceService();
