import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PDFService } from '../services/pdf.service';

/**
 * Get public invoice details by token
 */
export const getInvoiceByToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const invoice = await prisma.invoice.findFirst({
            where: {
                publicToken: token,
                isPublicEnabled: true,
                OR: [
                    { publicExpiresAt: null },
                    { publicExpiresAt: { gt: new Date() } }
                ]
            },
            include: {
                company: true,
                client: true,
                items: {
                    include: {
                        appliedTaxes: true
                    }
                },
                payments: {
                    orderBy: { createdAt: 'desc' }
                },
            },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found or link expired' });
        }

        // Update Analytics: View Count
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
                    browser: 'PublicLink'
                }
            })
        ]);

        // Hydrate appliedTaxes for legacy invoices
        const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map<number, any>();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t));

        const hydratedItems = invoice.items.map((item: any) => {
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
                            percentage: new Decimal(legacyRate),
                            amount: new Decimal(amount)
                        }]
                    };
                }
            }
            return item;
        });

        res.json({ invoice: { ...invoice, items: hydratedItems } });
    } catch (error: any) {
        console.error('Get public invoice error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice', details: error.message });
    }
};

/**
 * Download public invoice PDF by token
 */
export const downloadPDFPublic = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const invoice = await prisma.invoice.findFirst({
            where: {
                publicToken: token,
                isPublicEnabled: true,
                OR: [
                    { publicExpiresAt: null },
                    { publicExpiresAt: { gt: new Date() } }
                ]
            },
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
            return res.status(404).json({ error: 'Invoice not found or link expired' });
        }

        // Calculate Tax Breakdown
        const allTaxRates = await prisma.taxRate.findMany({ where: { companyId: invoice.companyId } });
        const taxMap = new Map<number, string>();
        allTaxRates.forEach(t => taxMap.set(Number(t.percentage), t.name));

        const taxBreakdown: Record<string, { name: string; percentage: number; amount: number }> = {};

        ((invoice as any).items || []).forEach((item: any) => {
            if (item.appliedTaxes && item.appliedTaxes.length > 0) {
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
            } else if (item.taxRate || item.tax) {
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

        const pdfBuffer = await PDFService.generateInvoicePDF({
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
                company: (invoice.client as any).companyName || undefined,
                email: invoice.client.email || undefined,
                phone: invoice.client.phone || undefined,
                mobile: (invoice.client as any).mobile || undefined,
                address: invoice.client.address || undefined,
                city: invoice.client.city || undefined,
                state: invoice.client.state || undefined,
                country: invoice.client.country || undefined,
                pincode: invoice.client.pincode || undefined,
                gstin: invoice.client.gstin || undefined,
                pan: invoice.client.pan || undefined,
                website: invoice.client.website || undefined,
            } : undefined,
            items: ((invoice as any).items || []).map((item: any) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit || undefined,
                unitPrice: Number(item.rate || item.unitPrice || 0),
                discount: Number(item.discount || 0),
                hsnSacCode: item.hsnSacCode || undefined,
                appliedTaxes: item.appliedTaxes ? (item.appliedTaxes as any[]).map((t: any) => ({
                    name: t.name,
                    percentage: Number(t.percentage),
                    amount: Number(t.amount)
                })) : undefined
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
                pdfMarginTop: (invoice.company as any).pdfMarginTop || undefined,
                pdfMarginBottom: (invoice.company as any).pdfMarginBottom || undefined,
                pdfMarginLeft: (invoice.company as any).pdfMarginLeft || undefined,
                pdfMarginRight: (invoice.company as any).pdfMarginRight || undefined,
                pdfContinuationTop: (invoice.company as any).pdfContinuationTop || undefined
            },
            useLetterhead: true
        });

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
                    browser: 'PublicLink'
                }
            });
        } catch (logError) {
            console.error('Failed to log public download activity:', logError);
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Download public PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
};
