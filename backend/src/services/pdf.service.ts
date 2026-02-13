import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://gotenberg:3000';

interface PDFData {
    quotationNumber?: string;
    invoiceNumber?: string;
    quotationDate?: Date;
    invoiceDate?: Date;
    validUntil?: Date;
    dueDate?: Date;
    title?: string;
    description?: string;
    company: {
        name: string;
        logo?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
        email?: string;
        phone?: string;
        gstin?: string;
        digitalSignature?: string;
        letterhead?: string;
        continuationSheet?: string;
        pdfMarginTop?: number;
        pdfContinuationTop?: number;
        pdfMarginBottom?: number;
        pdfMarginLeft?: number;
        pdfMarginRight?: number;
        bankName?: string;
        bankAccountName?: string;
        bankAccountNumber?: string;
        bankIfscCode?: string;
        bankBranch?: string;
    };
    useLetterhead?: boolean;
    includeBankDetails?: boolean;
    client?: {
        name: string;
        company?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
        gstin?: string;
        pan?: string;
        website?: string;
        taxName?: string;
        mobile?: string;
        tan?: string;
    };
    lead?: {
        name: string;
        company?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
        gstin?: string;
        pan?: string;
        website?: string;
        taxName?: string;
        mobile?: string;
        tan?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice?: number;
        rate?: number;
        unit?: string;
        discount?: number;
        hsnSacCode?: string;
        appliedTaxes?: Array<{ name: string; percentage: number; amount: number }>;
    }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
    notes?: string;
    clientSignature?: string;
    clientName?: string;
    clientAcceptedAt?: Date;
    signatureToken?: string;
    project?: { name: string };
    date?: Date;
    content?: string;
    companySignature?: string;
    signerIp?: string;
    signedAt?: Date;
    companySignedAt?: Date;
    id?: string;
    taxBreakdown?: Array<{ name: string; percentage: number; amount: number }>;
    terms?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
}

export class PDFService {
    /**
     * Convert local file path to base64 data URI
     */
    public static getImageBase64(filePath: string | undefined): string | undefined {
        if (!filePath) return undefined;

        // If it's already a base64 or external URL, return as is
        if (filePath.startsWith('data:') || filePath.startsWith('http')) return filePath;

        try {
            // Check if path already starts with uploads/
            let relativeFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

            // If it doesn't start with uploads/ or backend/uploads/, prepend uploads/
            if (!relativeFilePath.startsWith('uploads/') && !relativeFilePath.startsWith('backend/uploads/')) {
                relativeFilePath = path.join('uploads', relativeFilePath);
            }

            // Path.join(__dirname, '../../') takes us to the project root (backend/)
            const absolutePath = path.resolve(process.cwd(), relativeFilePath);

            if (fs.existsSync(absolutePath)) {
                const fileBuffer = fs.readFileSync(absolutePath);
                const extension = path.extname(filePath).substring(1).toLowerCase();
                const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
                return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
            } else {
                console.error(`File not found at absolute path: ${absolutePath}`);
            }
        } catch (error) {
            console.error('Error converting image to base64:', error);
        }
        return filePath; // Fallback to original
    }

    /**
     * Generate standard @page CSS for backgrounds and margins
     */
    public static getBackgroundCSS(company: any, useLetterhead: boolean): string {
        if (!useLetterhead) {
            return `
            @page { margin: 40px; }
            body { margin: 0; padding: 0; }
            `;
        }

        const isLetterheadPDF = company.letterhead?.toLowerCase().endsWith('.pdf');
        const isContinuationPDF = company.continuationSheet?.toLowerCase().endsWith('.pdf');

        const letterheadBase64 = !isLetterheadPDF ? this.getImageBase64(company.letterhead) : undefined;
        const continuationBase64 = !isContinuationPDF ? this.getImageBase64(company.continuationSheet) : undefined;

        const marginTop = company.pdfMarginTop || 180;
        const contTop = company.pdfContinuationTop || 80;
        const marginBottom = company.pdfMarginBottom || 80;
        const marginLeft = company.pdfMarginLeft || 40;
        const marginRight = company.pdfMarginRight || 40;

        return `
        @page {
            margin: ${contTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px;
            ${continuationBase64 ? `background-image: url('${continuationBase64}'); background-size: 100% 100%;` : ''}
        }
        @page:first {
            margin-top: ${marginTop}px;
            ${letterheadBase64 ? `background-image: url('${letterheadBase64}'); background-size: 100% 100%;` : ''}
        }
        body { 
            margin: 0;
            padding: 0;
            background: transparent !important;
        }
        `;
    }

    /**
     * Generate HTML template for Quotations/Invoices
     */
    private static generateHTML(data: PDFData, type: 'QUOTATION' | 'INVOICE', isSigned: boolean = false): string {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat(data.currency === 'INR' ? 'en-IN' : 'en-US', {
                style: 'currency',
                currency: data.currency,
                minimumFractionDigits: 2
            }).format(amount);
        };

        const formatDate = (date: Date) => {
            return new Date(date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const formatDateTime = (date: Date) => {
            return new Date(date).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        };

        const number = type === 'QUOTATION' ? data.quotationNumber : data.invoiceNumber;
        const mainDate = type === 'QUOTATION' ? data.quotationDate : data.invoiceDate;
        const subDate = type === 'QUOTATION' ? data.validUntil : data.dueDate;
        const subDateLabel = type === 'QUOTATION' ? 'Valid Till' : 'Due Date';
        const recipient = data.client || data.lead;

        const backgroundCSS = this.getBackgroundCSS(data.company, !!data.useLetterhead);

        // Aggregate Tax Breakdown if not provided
        if ((!data.taxBreakdown || data.taxBreakdown.length === 0) && data.items) {
            const tempBreakdown: Record<string, { name: string; percentage: number; amount: number }> = {};
            data.items.forEach(item => {
                // Check for appliedTaxes (database relation or hydrated)
                const appliedTaxes = (item as any).appliedTaxes;
                if (appliedTaxes && Array.isArray(appliedTaxes)) {
                    appliedTaxes.forEach((tax: any) => {
                        const key = `${tax.name}_${Number(tax.percentage)}`;
                        if (!tempBreakdown[key]) {
                            tempBreakdown[key] = {
                                name: tax.name,
                                percentage: Number(tax.percentage),
                                amount: 0
                            };
                        }
                        tempBreakdown[key].amount += Number(tax.amount);
                    });
                }
                // Fallback for legacy items without appliedTaxes array but with single tax
                else if (Number((item as any).tax) > 0) {
                    // This handles legacy items that weren't hydrated OR explicitly passed with just rate
                    // Ideally, controllers should have hydrated, but this is a fail-safe
                    const rate = Number((item as any).tax);
                    // Note: We don't have tax name here easily unless we guess 'Tax'
                    const key = `Tax_${rate}`;
                    if (!tempBreakdown[key]) {
                        tempBreakdown[key] = {
                            name: 'Tax',
                            percentage: rate,
                            amount: 0
                        };
                    }
                    // Estimate amount if not present? Or assume caller passed accurate total tax?
                    // Calculating amount per item here is complex without original logic.
                    // Skipping amount agg for pure legacy fallback to rely on total tax only if breakdown fails.
                }
            });

            data.taxBreakdown = Object.values(tempBreakdown);
        }

        // Calculate Total Item Discount if not provided
        let totalItemDiscount = 0;
        if (data.items) {
            data.items.forEach(item => {
                const quantity = Number(item.quantity || 0);
                const rate = Number(item.unitPrice || item.rate || 0);
                const discountPercent = Number(item.discount || 0);
                const itemTotal = quantity * rate;
                const discountAmount = (itemTotal * discountPercent) / 100;
                totalItemDiscount += discountAmount;
            });
        }
        (data as any).totalItemDiscount = totalItemDiscount;

        const logoBase64 = this.getImageBase64(data.company.logo);
        const signatureBase64 = this.getImageBase64(data.company.digitalSignature);
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            font-size: 13px;
        }
        ${backgroundCSS}
        
        /* HEADER SECTION (Company Info Only) */
        .header {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 2px solid ${type === 'QUOTATION' ? '#2563eb' : '#059669'};
            /* Hide if letterhead is used */
            display: ${data.useLetterhead ? 'none' : 'block'};
        }
        
        .company-info {
            width: 100%;
        }
        .company-logo {
            max-width: 180px;
            max-height: 70px;
            margin-bottom: 10px;
        }
        .company-details {
            font-size: 12px;
            color: #555;
            line-height: 1.5;
        }

        /* INFO ROW (Split Layout) */
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            gap: 30px;
        }

        /* BILLED TO SECTION (Left) */
        .billed-to {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
        }
        .section-title {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            display: inline-block;
        }
        .billed-to-details {
            font-size: 13px;
            line-height: 1.5;
            color: #334155;
        }
        .recipient-name {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 4px;
        }

        /* DOCUMENT DETAILS (Right) */
        .document-info {
            width: 300px;
            text-align: right;
            padding-top: 5px;
        }
        .document-title {
            font-size: 32px;
            font-weight: 900;
            color: ${type === 'QUOTATION' ? '#2563eb' : '#059669'};
            text-transform: uppercase;
            margin-bottom: 15px;
            line-height: 1;
            letter-spacing: 0.5px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }
        .meta-table td {
            text-align: right;
            padding: 4px 0;
            font-size: 13px;
        }
        .meta-label {
            color: #64748b;
            font-size: 12px;
            padding-right: 15px !important;
            font-weight: 500;
        }
        .meta-value {
            color: #0f172a;
            font-weight: bold;
        }

        /* TABLE STYLES */
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        table.items-table thead {
            background: ${type === 'QUOTATION' ? '#2563eb' : '#059669'};
            color: white;
        }
        table.items-table th {
            padding: 10px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        table.items-table td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
            vertical-align: top;
        }
        /* Column Widths */
        .col-desc { width: auto; }
        .col-hsn { width: 80px; }
        .col-qty { width: 50px; text-align: center; }
        .col-uom { width: 50px; text-align: center; }
        .col-rate { width: 100px; text-align: right; }
        .col-disc { width: 60px; text-align: right; }
        .col-amt { width: 110px; text-align: right; }

        /* TOTALS SECTION */
        .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
        }
        .totals-box {
            width: 350px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 13px;
            color: #475569;
        }
        .totals-row.subtotal {
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 5px;
            color: #0f172a;
            font-weight: 600;
        }
        .totals-row.grand-total {
            border-top: 2px solid ${type === 'QUOTATION' ? '#2563eb' : '#059669'};
            padding-top: 12px;
            margin-top: 8px;
            font-size: 16px;
            font-weight: bold;
            color: ${type === 'QUOTATION' ? '#2563eb' : '#059669'};
        }

        /* UTILS */
        .notes {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid #e5e7eb;
        }
        .notes h3 {
            font-size: 12px;
            margin-bottom: 8px;
            color: #475569;
            text-transform: uppercase;
            font-weight: bold;
        }
        .notes p {
            font-size: 11px;
            color: #64748b;
            white-space: pre-wrap;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <!-- HEADER (Company Info) -->
    <div class="header">
        <div class="company-info">
            ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="${data.company.name}">` : `<h2 style="margin-bottom:10px;">${data.company.name}</h2>`}
            <div class="company-details">
                ${data.company.address ? `${data.company.address}<br>` : ''}
                ${data.company.city && data.company.state ? `${data.company.city}, ${data.company.state} - ${data.company.pincode || ''}<br>` : ''}
                ${data.company.email ? `E: ${data.company.email}` : ''} ${data.company.phone ? `| P: ${data.company.phone}` : ''}<br>
                ${data.company.gstin ? `GSTIN: ${data.company.gstin}` : ''}
            </div>
        </div>
    </div>

    <!-- INFO ROW: Billed To (Left) | Invoice Details (Right) -->
    <div class="info-row">
        <!-- BILLED TO -->
        <div class="billed-to">
            <div class="section-title">Billed To</div>
            ${recipient ? `
            <div class="billed-to-details">
                <div class="recipient-name">${recipient.name}</div>
                ${recipient.company ? `${recipient.company}<br>` : ''}
                ${recipient.address ? `${recipient.address}<br>` : ''}
                ${recipient.city && recipient.state ? `${recipient.city}, ${recipient.state} - ${recipient.pincode || ''}<br>` : ''}
                ${recipient.country ? `${recipient.country}<br>` : ''}
                
                <div style="margin-top: 8px;"></div>
                ${recipient.gstin ? `<strong>GSTIN:</strong> ${recipient.gstin}<br>` : ''}
                ${recipient.pan ? `<strong>PAN:</strong> ${recipient.pan}<br>` : ''}
                ${recipient.tan ? `<strong>TAN:</strong> ${recipient.tan}<br>` : ''}
                
                <div style="margin-top: 8px;"></div>
                ${recipient.email ? `E: ${recipient.email}<br>` : ''}
                ${recipient.phone || recipient.mobile ? `P: ${recipient.phone || recipient.mobile}` : ''}
            </div>
            ` : ''}
        </div>

        <!-- DOCUMENT DETAILS -->
        <div class="document-info">
            <div class="document-title">${type}</div>
            <table class="meta-table">
                <tr>
                    <td class="meta-label">Number:</td>
                    <td class="meta-value">${number}</td>
                </tr>
                <tr>
                    <td class="meta-label">Date:</td>
                    <td class="meta-value">${mainDate ? formatDate(mainDate) : '-'}</td>
                </tr>
                ${subDate ? `
                <tr>
                    <td class="meta-label">${subDateLabel}:</td>
                    <td class="meta-value">${formatDate(subDate)}</td>
                </tr>
                ` : ''}
            </table>
        </div>
    </div>

    ${type === 'QUOTATION' && data.title ? `
    <div style="margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px;">
        <h2 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 5px;">${data.title}</h2>
    </div>
    ` : ''}

    ${type === 'QUOTATION' && data.description ? `
    <div style="margin-bottom: 30px;">
        <h3 style="font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 10px; letter-spacing: 0.5px; font-weight: bold;">Scope of Work / Introduction</h3>
        <div style="font-size: 12px; line-height: 1.6; color: #374151;">
            ${data.description} <!-- Rich HTML Content -->
        </div>
    </div>
    ` : ''}

    <table class="items-table">
        <thead>
            <tr>
                <th class="col-desc">Specification</th>
                <th class="col-hsn">HSN/SAC</th>
                <th class="col-qty">Qty</th>
                <th class="col-uom">UoM</th>
                <th class="col-rate">Rate</th>
                <th class="col-disc">Disc %</th>
                <th class="col-amt">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => {
            const rate = Number(item.unitPrice || item.rate || 0);
            const discount = Number(item.discount || 0);
            const quantity = Number(item.quantity || 0);
            const grossAmount = quantity * rate;
            const netAmount = grossAmount * (1 - discount / 100);
            return `
                <tr>
                    <td>
                        <div style="font-weight: bold; color: #111;">${item.description}</div>
                    </td>
                    <td style="color: #64748b;">${item.hsnSacCode || '-'}</td>
                    <td style="text-align: center;">${quantity}</td>
                    <td style="text-align: center;">${item.unit || '-'}</td>
                    <td style="text-align: right;">${formatCurrency(rate)}</td>
                    <td style="text-align: right; color: #ef4444;">${discount > 0 ? `${discount}%` : '-'}</td>
                    <td style="text-align: right; font-weight: 500;">${formatCurrency(netAmount)}</td>
                </tr>
                `;
        }).join('')}
        </tbody>
    </table>

    <div class="totals-container">
        <div class="totals-box">
            <div class="totals-row subtotal">
                <span>Subtotal</span>
                <span>${formatCurrency(Number(data.subtotal))}</span>
            </div>
            ${(data as any).totalItemDiscount > 0 ? `
            <div class="totals-row">
                <span>Total Discount</span>
                <span style="color: #ef4444;">-${formatCurrency((data as any).totalItemDiscount)}</span>
            </div>
            <div class="totals-row" style="border-top: 1px dashed #cbd5e1; padding-top: 8px;">
                <span style="color: #1e293b; font-weight: bold;">Taxable Value</span>
                <span style="color: #1e293b; font-weight: bold;">${formatCurrency(Number(data.subtotal) - (data as any).totalItemDiscount)}</span>
            </div>
            ` : ''}
            
            ${Number(data.tax) > 0 ? `
            <div class="totals-row" style="margin-top: 5px;">
                <span>Total Tax</span>
                <span>${formatCurrency(Number(data.tax))}</span>
            </div>
            ${data.taxBreakdown ? data.taxBreakdown.map(t => `
            <div class="totals-row" style="padding: 2px 0; font-size: 11px;">
                <span style="color: #64748b; padding-left: 10px;">${t.name} (${t.percentage}%)</span>
                <span style="color: #64748b;">${formatCurrency(t.amount)}</span>
            </div>
            `).join('') : ''}
            ` : ''}
            
            ${Number(data.discount) > 0 ? `
            <div class="totals-row">
                <span style="color: #ef4444;">Extra Discount</span>
                <span style="color: #ef4444;">-${formatCurrency(Number(data.discount))}</span>
            </div>
            ` : ''}
            
            <div class="totals-row grand-total">
                <span>Grand Total</span>
                <span>${formatCurrency(Number(data.total))}</span>
            </div>
        </div>
    </div>

    ${data.notes ? `
    <div class="notes">
        <h3>Remarks / Notes</h3>
        <p>${data.notes}</p>
    </div>
    ` : ''}

    ${data.paymentTerms ? `
    <div class="notes" style="margin-top: 15px;">
        <h3 style="color: #4b5563;">Payment Terms</h3>
        <p style="font-size: 11px;">${data.paymentTerms}</p>
    </div>
    ` : ''}

    ${data.deliveryTerms ? `
    <div class="notes" style="margin-top: 15px;">
        <h3 style="color: #4b5563;">Delivery / Fulfillment Terms</h3>
        <p style="font-size: 11px;">${data.deliveryTerms}</p>
    </div>
    ` : ''}

    ${data.terms ? `
    <div class="notes" style="margin-top: 15px;">
        <h3 style="color: #4b5563;">Contractual Terms</h3>
        <p style="font-size: 11px;">${data.terms}</p>
    </div>
    ` : ''}

    ${data.clientSignature ? `
    <div style="margin-top: 60px; page-break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 60%; vertical-align: top; padding-right: 20px;">
                    <div style="border-left: 4px solid #10b981; padding-left: 15px;">
                        <h3 style="color: #10b981; font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Accepted & Agreed</h3>
                        <div style="margin-bottom: 12px;">
                            <img src="${data.clientSignature}" style="max-height: 60px; display: block;" alt="Signature">
                        </div>
                        <div style="font-size: 11px; color: #374151; line-height: 1.6;">
                            <div><strong>${data.clientName}</strong></div>
                            <div style="color: #6b7280;">${data.clientAcceptedAt ? formatDateTime(data.clientAcceptedAt) : ''}</div>
                            ${data.signatureToken ? `<div style="font-family: monospace; color: #9ca3af; font-size: 9px; margin-top: 4px;">ID: ${data.signatureToken}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td style="width: 40%; vertical-align: top; text-align: right;">
                    ${signatureBase64 ? `
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        <div style="font-size: 11px; font-weight: bold; color: #374151; margin-bottom: 5px;">For ${data.company.name}</div>
                        <img src="${signatureBase64}" style="max-height: 50px; margin-bottom: 8px;">
                        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 5px; width: 150px; text-align: center;">
                            Authorized Signatory
                        </div>
                    </div>
                    ` : ''}
                </td>
            </tr>
        </table>
    </div>
    ` : `
    ${signatureBase64 ? `
    <div style="margin-top: 60px; text-align: right;">
        <div style="display: inline-block; text-align: center;">
            <div style="font-size: 11px; font-weight: bold; color: #374151; margin-bottom: 5px; text-align: right;">For ${data.company.name}</div>
            <img src="${signatureBase64}" style="max-height: 60px; display: block; margin-bottom: 5px;">
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; border-top: 1px solid #eee; padding-top: 5px;">
                Authorized Signatory
            </div>
        </div>
    </div>
    ` : ''}
    `}

    ${(type === 'INVOICE' && data.includeBankDetails !== false && data.company.bankName && data.company.bankAccountNumber) ? `
    <div style="margin-top: 40px; page-break-inside: avoid; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
        <h3 style="font-size: 11px; text-transform: uppercase; color: #475569; margin-bottom: 8px; letter-spacing: 0.5px; font-weight: bold;">Bank Details for Payment</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
            <tr>
                <td style="padding: 4px 0; font-size: 11px; color: #64748b; width: 120px;">Bank Name:</td>
                <td style="padding: 4px 0; font-size: 11px; font-weight: bold; color: #334155;">${data.company.bankName}</td>
                <td style="padding: 4px 0; font-size: 11px; color: #64748b; width: 120px;">Account Holder:</td>
                <td style="padding: 4px 0; font-size: 11px; font-weight: bold; color: #334155;">${data.company.bankAccountName || data.company.name}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0; font-size: 11px; color: #64748b;">Account Number:</td>
                <td style="padding: 4px 0; font-size: 11px; font-weight: bold; color: #334155;">${data.company.bankAccountNumber}</td>
                <td style="padding: 4px 0; font-size: 11px; color: #64748b;">IFSC / SWIFT:</td>
                <td style="padding: 4px 0; font-size: 11px; font-weight: bold; color: #334155;">${data.company.bankIfscCode || '-'}</td>
            </tr>
            ${data.company.bankBranch ? `
            <tr>
                <td style="padding: 4px 0; font-size: 11px; color: #64748b;">Branch:</td>
                <td colspan="3" style="padding: 4px 0; font-size: 11px; font-weight: bold; color: #334155;">${data.company.bankBranch}</td>
            </tr>
            ` : ''}
        </table>
    </div>
    ` : ''}


    <div class="footer">
        This is a computer-generated document and does not require a physical signature.
    </div>
</body>
</html>
        `;
    }

    private static async convertHTMLToPDF(html: string): Promise<Buffer> {
        try {
            const formData = new FormData();
            formData.append('files', Buffer.from(html), {
                filename: 'index.html',
                contentType: 'text/html'
            });

            const response = await axios.post(
                `${GOTENBERG_URL}/forms/chromium/convert/html`,
                formData,
                {
                    headers: formData.getHeaders(),
                    responseType: 'arraybuffer',
                    timeout: 30000
                }
            );

            return Buffer.from(response.data);
        } catch (error: any) {
            console.error('Gotenberg PDF conversion error:', error.message);
            throw new Error('Failed to generate PDF');
        }
    }

    private static async overlayBackdrop(contentPdf: Buffer, backdropPath: string | undefined, continuationPath: string | undefined): Promise<Buffer> {
        if (!backdropPath && !continuationPath) return contentPdf;

        try {
            const mainPdfDoc = await PDFDocument.load(contentPdf);
            const overlayPages = mainPdfDoc.getPages();

            const getBackdropDoc = async (p: string) => {
                const relativePath = p.startsWith('/') ? p.substring(1) : p;
                const absolutePath = path.join(__dirname, '../../', relativePath);
                if (fs.existsSync(absolutePath)) {
                    return await PDFDocument.load(fs.readFileSync(absolutePath));
                }
                return null;
            };

            const backdropPdf = backdropPath && backdropPath.toLowerCase().endsWith('.pdf') ? await getBackdropDoc(backdropPath) : null;
            const continuationPdf = continuationPath && continuationPath.toLowerCase().endsWith('.pdf') ? await getBackdropDoc(continuationPath) : null;

            if (!backdropPdf && !continuationPdf) return contentPdf;

            const finalPdfDoc = await PDFDocument.create();

            for (let i = 0; i < overlayPages.length; i++) {
                const isFirstPage = i === 0;
                const template = isFirstPage ? (backdropPdf || continuationPdf) : (continuationPdf || backdropPdf);

                if (template) {
                    const [templatePage] = await finalPdfDoc.copyPages(template, [0]);
                    const [contentPage] = await finalPdfDoc.copyPages(mainPdfDoc, [i]);

                    const newNode = finalPdfDoc.addPage(templatePage);
                    const embeddedContent = await finalPdfDoc.embedPage(contentPage);

                    newNode.drawPage(embeddedContent, {
                        x: 0,
                        y: 0,
                        width: newNode.getWidth(),
                        height: newNode.getHeight(),
                    });
                } else {
                    const [contentPage] = await finalPdfDoc.copyPages(mainPdfDoc, [i]);
                    finalPdfDoc.addPage(contentPage);
                }
            }

            return Buffer.from(await finalPdfDoc.save());
        } catch (error) {
            console.error('Overlay backdrop error:', error);
            return contentPdf;
        }
    }

    static async generateQuotationPDF(data: any): Promise<Buffer> {
        const html = this.generateHTML(data, 'QUOTATION', false);
        const contentPdf = await this.convertHTMLToPDF(html);
        if (data.useLetterhead) {
            return this.overlayBackdrop(contentPdf, data.company.letterhead, data.company.continuationSheet);
        }
        return contentPdf;
    }

    static async generateInvoicePDF(data: any): Promise<Buffer> {
        const html = this.generateHTML(data, 'INVOICE', false);
        const contentPdf = await this.convertHTMLToPDF(html);
        if (data.useLetterhead) {
            return this.overlayBackdrop(contentPdf, data.company.letterhead, data.company.continuationSheet);
        }
        return contentPdf;
    }

    static async generateSignedQuotationPDF(data: any): Promise<Buffer> {
        const html = this.generateHTML(data, 'QUOTATION', true);
        const contentPdf = await this.convertHTMLToPDF(html);
        if (data.useLetterhead) {
            return this.overlayBackdrop(contentPdf, data.company.letterhead, data.company.continuationSheet);
        }
        return contentPdf;
    }

    /**
     * Generic PDF Generation from HTML Template
     */
    static async generateGenericPDF(templateHtml: string, data: any): Promise<Buffer> {
        // 1. Process Variables
        let processedHtml = templateHtml;

        // Common Replacements
        const replacements: Record<string, string> = {
            '[DATE]': new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            '[CURRENT_DATE]': new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            '[COMPANY_NAME]': data.company?.name || '',
            '[COMPANY_ADDRESS]': data.company?.address || '',
            '[EMPLOYEE_NAME]': data.employee?.firstName ? `${data.employee.firstName} ${data.employee.lastName || ''}` : '',
            '[EMPLOYEE_ID]': data.employee?.employeeId || '',
            '[DESIGNATION]': data.employee?.position?.title || '',
            '[DEPARTMENT]': data.employee?.department?.name || '',
            '[JOINING_DATE]': data.employee?.dateOfJoining ? new Date(data.employee.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
            '[SALARY]': data.employee?.salary ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: data.company?.currency || 'INR' }).format(Number(data.employee.salary)) : '',
            '[CTC_ANNUAL]': data.employee?.salary ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: data.company?.currency || 'INR' }).format(Number(data.employee.salary)) : '',
            '[SIGNATURE]': data.company?.digitalSignature ? `<img src="${data.company.digitalSignature}" style="max-height: 60px; display: block;" alt="Authorized Signatory" />` : '',
            '[COMPANY_SIGNATURE]': data.company?.digitalSignature ? `<img src="${data.company.digitalSignature}" style="max-height: 60px; display: block;" alt="Authorized Signatory" />` : '',
        };

        // Apply replacements
        Object.entries(replacements).forEach(([key, value]) => {
            // Case-insensitive replacement
            processedHtml = processedHtml.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), value);
        });

        // 2. Wrap in Standard Layout if not present
        if (!processedHtml.includes('<html')) {
            const backgroundCSS = this.getBackgroundCSS(data.company, data.useLetterhead);
            processedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
                    ${backgroundCSS}
                </style>
            </head>
            <body>
                ${processedHtml}
            </body>
            </html>`;
        }

        // 3. Convert to PDF
        const contentPdf = await this.convertHTMLToPDF(processedHtml);

        // 4. Overlay Letterhead if requested
        if (data.useLetterhead && data.company) {
            return this.overlayBackdrop(contentPdf, data.company.letterhead, data.company.continuationSheet);
        }

        return contentPdf;
    }

    private static generateContractHTML(data: any): string {
        const logoBase64 = this.getImageBase64(data.company.logo);
        const signatureBase64 = this.getImageBase64(data.company.digitalSignature);
        const clientSignatureBase64 = this.getImageBase64(data.clientSignature);
        const companyAuthSignatureBase64 = this.getImageBase64(data.companySignature);
        const backgroundCSS = this.getBackgroundCSS(data.company, !!data.useLetterhead);


        const formatDate = (date: any) => {
            if (!date) return '-';
            return new Date(date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const formatCurrency = (amount: any) => {
            const num = Number(amount);
            if (isNaN(num)) return amount;
            return new Intl.NumberFormat(data.currency === 'INR' ? 'en-IN' : 'en-US', {
                style: 'currency',
                currency: data.currency || 'INR',
                minimumFractionDigits: 2
            }).format(num);
        };

        // Check if signatures are embedded in content via variables
        const hasEmbeddedCompanySig = (data.content || '').toLowerCase().includes('[company_signature]');
        const hasEmbeddedClientSig = (data.content || '').toLowerCase().includes('[client_signature]');

        // Perform Variable Replacement
        let processedContent = (data.content || '');

        // System / Contract Variables
        processedContent = processedContent
            .replace(/\[COMPANY_SIGNATURE\]/gi, signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 60px; vertical-align: middle;">` : '')
            .replace(/\[CLIENT_SIGNATURE\]/gi, clientSignatureBase64 ? `<img src="${clientSignatureBase64}" style="max-height: 60px; vertical-align: middle;">` : '')
            .replace(/\[DATE\]/gi, formatDate(data.date))
            .replace(/\[CURRENT_DATE\]/gi, formatDate(new Date()))
            .replace(/\[CONTRACT_ID\]/gi, data.id || '')
            .replace(/\[CONTRACT_VALUE\]/gi, data.contractValue ? data.contractValue.toString() : '0')
            .replace(/\[CURRENCY\]/gi, data.currency || 'INR')
            .replace(/\[VALID_FROM\]/gi, data.validFrom ? formatDate(data.validFrom) : '')
            .replace(/\[VALID_UNTIL\]/gi, data.validUntil ? formatDate(data.validUntil) : '')
            .replace(/\[TOTAL_AMOUNT\]/gi, data.contractValue ? `${data.currency || 'INR'} ${data.contractValue}` : '');

        // Client Variables
        if (data.client) {
            processedContent = processedContent
                .replace(/\[CLIENT_NAME\]/gi, data.client.name || '')
                .replace(/\[CLIENT_COMPANY\]/gi, data.client.companyName || data.client.name || '')
                .replace(/\[CLIENT_EMAIL\]/gi, data.client.email || '')
                .replace(/\[CLIENT_PHONE\]/gi, data.client.phone || '')
                .replace(/\[CLIENT_ADDRESS\]/gi, data.client.address || '')
                .replace(/\[CLIENT_CITY\]/gi, data.client.city || '')
                .replace(/\[CLIENT_STATE\]/gi, data.client.state || '')
                .replace(/\[CLIENT_GSTIN\]/gi, data.client.gstin || '')
                .replace(/\[CLIENT_PAN\]/gi, data.client.pan || '')
                .replace(/\[CLIENT_WEBSITE\]/gi, data.client.website || '')
                .replace(/\[CLIENT_TAX_NAME\]/gi, data.client.taxName || '');
        }

        // Company Variables
        if (data.company) {
            processedContent = processedContent
                .replace(/\[COMPANY_NAME\]/gi, data.company.name || '')
                .replace(/\[COMPANY_LEGAL_NAME\]/gi, data.company.legalName || data.company.name || '')
                .replace(/\[COMPANY_EMAIL\]/gi, data.company.email || '')
                .replace(/\[COMPANY_PHONE\]/gi, data.company.phone || '')
                .replace(/\[COMPANY_ADDRESS\]/gi, data.company.address || '')
                .replace(/\[COMPANY_GSTIN\]/gi, data.company.gstin || '')
                .replace(/\[COMPANY_PAN\]/gi, data.company.pan || '');
        }

        // Project Variables
        if (data.project) {
            processedContent = processedContent
                .replace(/\[PROJECT_NAME\]/gi, data.project.name || '')
                .replace(/\[PROJECT_DESCRIPTION\]/gi, data.project.description || '')
                .replace(/\[PROJECT_START_DATE\]/gi, data.project.startDate ? formatDate(data.project.startDate) : '')
                .replace(/\[PROJECT_END_DATE\]/gi, data.project.endDate ? formatDate(data.project.endDate) : '');
        }


        return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'Times New Roman', Times, serif;
        color: #1a1a1a;
        line-height: 1.8;
        font-size: 14px;
    }
    ${backgroundCSS}
    .header {
        display: ${data.useLetterhead ? 'none' : 'block'};
        text-align: center;
        margin-bottom: 50px;
        border-bottom: 2px solid #000;
        padding-bottom: 20px;
    }
    .company-logo {
        max-height: 80px;
        margin-bottom: 15px;
    }
    .title {
        font-size: 24px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
    }
    .meta {
        font-size: 12px;
        color: #666;
    }
    .content {
        text-align: justify;
        min-height: 400px;
        margin-bottom: 50px;
    }
    .signatures {
        display: flex;
        justify-content: space-between;
        page-break-inside: avoid;
        margin-top: 60px;
    }
    .signature-block {
        width: 45%;
    }
    .sign-area {
        border-bottom: 1px solid #000;
        height: 100px;
        margin-bottom: 10px;
        display: flex;
        align-items: flex-end;
        position: relative;
    }
    .sign-img {
        max-height: 90px;
        max-width: 100%;
        display: block;
        margin: 0 auto;
    }
    .sign-label {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 11px;
    }
    .footer {
        display: ${data.useLetterhead ? 'none' : 'block'};
        margin-top: 50px;
        text-align: center;
        font-size: 10px;
        color: #999;
        border-top: 1px solid #eee;
        padding-top: 10px;
    }
</style>
</head>
<body>
<div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" class="company-logo">` : ''}
    <div class="title">${data.title}</div>
    <div class="meta">Agreement Date: ${formatDate(data.date)}</div>
</div>

<div class="content">
    ${processedContent}
</div>

${(!hasEmbeddedCompanySig || !hasEmbeddedClientSig) ? `
<div class="signatures">
    ${!hasEmbeddedCompanySig ? `
    <div class="signature-block">
        <div class="sign-area">
            ${(signatureBase64 || companyAuthSignatureBase64) ? `<img src="${signatureBase64 || companyAuthSignatureBase64}" class="sign-img">` : ''}
        </div>
        <div class="sign-label">For ${data.company.name}</div>
        <div style="font-size: 11px; color: #666; margin-top: 5px;">
            ${data.companySignedAt ? `Digitally Signed by Authorized Signatory<br>Date: ${new Date(data.companySignedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Authorized Signatory'}
        </div>
    </div>

    <div class="signature-block">
        <div class="sign-area">
             ${clientSignatureBase64 ? `<img src="${clientSignatureBase64}" class="sign-img">` : ''}
        </div>
        <div class="sign-label">For ${data.client.name}</div>
        ${data.signedAt ? `<div style="font-size: 11px; color: #666; margin-top: 5px;">Digitally Signed<br>IP: ${data.signerIp}<br>Date: ${new Date(data.signedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>` : ''}
    </div>
    ` : '<div></div>'}
</div>
` : ''}

<div class="footer">
    Contract ID: ${data.id} • Generated by Applizor ERP
</div>
</body>
</html>
        `;
    }

    static async generateContractPDF(data: any): Promise<Buffer> {
        const html = this.generateContractHTML(data);
        const contentPdf = await this.convertHTMLToPDF(html);
        if (data.useLetterhead) {
            return this.overlayBackdrop(contentPdf, data.company.letterhead, data.company.continuationSheet);
        }
        return contentPdf;
    }

    /**
     * Generate HTML template for Payslips
     */
    private static generatePayslipHTML(data: any, company: any, useLetterhead: boolean): string {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat(company.currency === 'USD' ? 'en-US' : 'en-IN', {
                style: 'currency',
                currency: company.currency || 'INR',
                minimumFractionDigits: 2
            }).format(amount);
        };

        const formatDate = (date: Date) => {
            return new Date(date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long'
            });
        };

        const css = this.getBackgroundCSS(company, useLetterhead);

        const earnings = Object.entries(data.earningsBreakdown || {}).map(([key, val]) => ({ name: key, amount: Number(val) }));
        const deductions = Object.entries(data.deductionsBreakdown || {}).map(([key, val]) => ({ name: key, amount: Number(val) }));

        // Pad arrays to equal length for side-by-side table
        const maxLength = Math.max(earnings.length, deductions.length);
        const rows = Array.from({ length: maxLength }, (_, i) => ({
            earning: earnings[i] || { name: '', amount: '' },
            deduction: deductions[i] || { name: '', amount: '' }
        }));

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                ${css}
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                body { font-family: 'Inter', -apple-system, sans-serif; }
                .payslip-container { max-width: 800px; margin: 0 auto; color: #0f172a; }
                
                .header-section { display: ${useLetterhead ? 'none' : 'flex'}; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
                .header-title { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.025em; line-height: 1; }
                .sub-title { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; tracking: 0.1em; margin-top: 5px; }
                
                .emp-details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
                .emp-item { display: flex; flex-direction: column; gap: 4px; }
                .emp-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .emp-value { font-size: 12px; font-weight: 700; color: #0f172a; }

                table.salary-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
                table.salary-table th { background: #0f172a; color: white; padding: 12px 15px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                table.salary-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 11px; font-weight: 600; }
                table.salary-table tr:last-child td { border-bottom: 0; }
                
                .amount { text-align: right; font-variant-numeric: tabular-nums; }
                .text-rose { color: #e11d48; }
                .text-emerald { color: #059669; }

                .summary-section { display: flex; justify-content: flex-end; gap: 40px; margin-top: 20px; }
                .net-pay-card { background: #0f172a; color: white; padding: 25px 35px; border-radius: 12px; text-align: right; min-width: 250px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
                .net-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; }
                .net-amount { font-size: 32px; font-weight: 900; margin-top: 5px; line-height: 1; }

                .footer { font-size: 10px; text-align: center; color: #94a3b8; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            </style>
        </head>
        <body>
            <div class="payslip-container">
            <div class="header-section">
                <div>
                    <div class="header-title">REMUNERATION MANIFEST</div>
                    <div class="sub-title">PERIOD: ${formatDate(new Date(data.year, data.month - 1, 1)).toUpperCase()}</div>
                </div>
                <div style="text-align: right;">
                    <div class="emp-value" style="font-size: 16px;">${company.name}</div>
                    <div class="sub-title">${company.city || ''} | REGISTRY: ${company.gstin || '-'}</div>
                </div>
            </div>

            <div class="emp-details-grid">
                <div class="emp-item">
                    <span class="emp-label">Personnel Name</span>
                    <span class="emp-value">${data.employee.firstName} ${data.employee.lastName}</span>
                </div>
                <div class="emp-item">
                    <span class="emp-label">Resource ID</span>
                    <span class="emp-value">${data.employee.employeeId}</span>
                </div>
                <div class="emp-item">
                    <span class="emp-label">Department</span>
                    <span class="emp-value">${data.employee.department?.name || 'GENERIC OPS'}</span>
                </div>
                <div class="emp-item">
                    <span class="emp-label">Designation</span>
                    <span class="emp-value">${data.employee.position?.title || 'GENERAL STAFF'}</span>
                </div>
                <div class="emp-item">
                    <span class="emp-label">Account Number</span>
                    <span class="emp-value">${data.employee.accountNumber || 'NOT DISCLOSED'}</span>
                </div>
                <div class="emp-item">
                    <span class="emp-label">Statutory PAN</span>
                    <span class="emp-value">${data.employee.panNumber || 'NOT FILED'}</span>
                </div>
            </div>

            <table class="salary-table">
                <thead>
                    <tr>
                        <th width="35%">Earnings Protocol</th>
                        <th width="15%" class="amount">Value</th>
                        <th width="35%">Deduction Protocol</th>
                        <th width="15%" class="amount">Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                    <tr>
                        <td>${row.earning.name.toUpperCase()}</td>
                        <td class="amount text-emerald">${row.earning.amount ? formatCurrency(Number(row.earning.amount)) : ''}</td>
                        <td style="color: #64748b;">${row.deduction.name.toUpperCase()}</td>
                        <td class="amount text-rose">${row.deduction.amount ? `-${formatCurrency(Number(row.deduction.amount))}` : ''}</td>
                    </tr>
                    `).join('')}
                    
                    <tr style="background: #f8fafc; font-weight: 800; color: #0f172a;">
                        <td>TOTAL GROSS DISBURSEMENT</td>
                        <td class="amount text-emerald">${formatCurrency(data.grossSalary)}</td>
                        <td>TOTAL STATUTORY RETENTION</td>
                        <td class="amount text-rose">-${formatCurrency(data.deductions)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="summary-section">
                <div class="net-pay-card">
                    <div class="net-label">Net Take Home</div>
                    <div class="net-amount">${formatCurrency(data.netSalary)}</div>
                </div>
            </div>

            <div class="footer">
                THIS IS A DIGITALLY AUDITED PAYROLL MANIFEST • GENERATED BY APPLIZOR ERP CORE • [${new Date().toISOString()}]
            </div>
            </div>
        </body>
        </html>
        `;
    }

    public static async generatePayslip(payroll: any, company: any): Promise<Buffer> {
        const useLetterhead = !!company.letterhead;
        const html = this.generatePayslipHTML(payroll, company, useLetterhead);
        const contentPdf = await this.convertHTMLToPDF(html);

        if (useLetterhead) {
            return this.overlayBackdrop(contentPdf, company.letterhead, company.continuationSheet);
        }
        return contentPdf;
    }
}
