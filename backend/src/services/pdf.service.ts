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
    };
    useLetterhead?: boolean;
    client?: {
        name: string;
        company?: string;
        email?: string;
        phone?: string;
    };
    lead?: {
        name: string;
        company?: string;
        email?: string;
        phone?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice?: number;
        rate?: number;
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
}

export class PDFService {
    /**
     * Convert local file path to base64 data URI
     */
    private static getImageBase64(filePath: string | undefined): string | undefined {
        if (!filePath) return undefined;

        // If it's already a base64 or external URL, return as is
        if (filePath.startsWith('data:') || filePath.startsWith('http')) return filePath;

        try {
            // Assume uploads are in the relative ../uploads directory from this file's location
            // which is backend/src/services/pdf.service.ts
            // Strip leading slash if present to make it a relative path for joining
            const relativeFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            const absolutePath = path.join(__dirname, '../../', relativeFilePath);
            if (fs.existsSync(absolutePath)) {
                const fileBuffer = fs.readFileSync(absolutePath);
                const extension = path.extname(filePath).substring(1);
                const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
                return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
            }
        } catch (error) {
            console.error('Error converting image to base64:', error);
        }
        return filePath; // Fallback to original
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

        const logoBase64 = this.getImageBase64(data.company.logo);
        const signatureBase64 = this.getImageBase64(data.company.digitalSignature);
        const isLetterheadPDF = data.useLetterhead && data.company.letterhead?.toLowerCase().endsWith('.pdf');
        const isContinuationPDF = data.useLetterhead && data.company.continuationSheet?.toLowerCase().endsWith('.pdf');

        const letterheadBase64 = data.useLetterhead && !isLetterheadPDF ? this.getImageBase64(data.company.letterhead) : undefined;
        const continuationBase64 = data.useLetterhead && !isContinuationPDF ? this.getImageBase64(data.company.continuationSheet) : undefined;

        const marginTop = data.useLetterhead ? (data.company.pdfMarginTop || 180) : 40;
        const contTop = data.useLetterhead ? (data.company.pdfContinuationTop || 80) : 40;
        const marginBottom = data.useLetterhead ? (data.company.pdfMarginBottom || 80) : 40;
        const marginLeft = data.useLetterhead ? (data.company.pdfMarginLeft || 40) : 40;
        const marginRight = data.useLetterhead ? (data.company.pdfMarginRight || 40) : 40;

        const backgroundCSS = data.useLetterhead ? `
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
        ` : `
        @page {
            margin: 40px;
        }
        body { 
            margin: 0;
            padding: 0;
        }
        `;

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
        }
        ${backgroundCSS}
        .header {
            display: ${data.useLetterhead ? 'none' : 'flex'};
            justify-content: space-between;
            align-items: start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid ${type === 'QUOTATION' ? '#2563eb' : '#059669'};
        }
        .company-info {
            flex: 1;
        }
        .company-logo {
            max-width: 200px;
            max-height: 80px;
            margin-bottom: 15px;
        }
        .company-details {
            font-size: 12px;
            color: #666;
            line-height: 1.8;
        }
        .document-info {
            text-align: right;
        }
        .document-title {
            font-size: 32px;
            font-weight: bold;
            color: ${type === 'QUOTATION' ? '#1e40af' : '#065f46'};
            margin-bottom: 10px;
        }
        .document-meta {
            font-size: 13px;
            color: #666;
            line-height: 1.8;
        }
        .document-meta strong {
            color: #333;
        }
        .billed-to {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .billed-to h3 {
            font-size: 11px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
        }
        .billed-to-details {
            font-size: 14px;
            line-height: 1.8;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        thead {
            background: ${type === 'QUOTATION' ? '#1e40af' : '#065f46'};
            color: white;
        }
        th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        th:last-child, td:last-child {
            text-align: right;
        }
        tbody tr {
            border-bottom: 1px solid #e5e7eb;
        }
        tbody tr:hover {
            background: #f9fafb;
        }
        td {
            padding: 12px;
            font-size: 13px;
        }
        .totals {
            margin-left: auto;
            width: 300px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        .totals-row.subtotal {
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
        }
        .totals-row.total {
            border-top: 2px solid ${type === 'QUOTATION' ? '#1e40af' : '#065f46'};
            padding-top: 12px;
            margin-top: 8px;
            font-size: 18px;
            font-weight: bold;
            color: ${type === 'QUOTATION' ? '#1e40af' : '#065f46'};
        }
        .notes {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .notes h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: ${type === 'QUOTATION' ? '#1e40af' : '#065f46'};
        }
        .notes p {
            font-size: 12px;
            color: #666;
            white-space: pre-wrap;
        }
        .signature-section {
            margin-top: 50px;
            padding: 30px;
            border: 2px solid #10b981;
            border-radius: 8px;
            background: #f0fdf4;
        }
        .footer {
            display: ${data.useLetterhead ? 'none' : 'block'};
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" alt="${data.company.name}">` : `<h2>${data.company.name}</h2>`}
            <div class="company-details">
                ${data.company.address ? `${data.company.address}<br>` : ''}
                ${data.company.city && data.company.state ? `${data.company.city}, ${data.company.state} - ${data.company.pincode || ''}<br>` : ''}
                ${data.company.email ? `Email: ${data.company.email}` : ''} ${data.company.phone ? `| Phone: ${data.company.phone}` : ''}<br>
                ${data.company.gstin ? `GSTIN: ${data.company.gstin}` : ''}
            </div>
        </div>
        <div class="document-info">
            <div class="document-title">${type}</div>
            <div class="document-meta">
                <strong>Number:</strong> ${number}<br>
                <strong>Date:</strong> ${mainDate ? formatDate(mainDate) : '-'}<br>
                ${subDate ? `<strong>${subDateLabel}:</strong> ${formatDate(subDate)}<br>` : ''}
            </div>
        </div>
    </div>

    ${recipient ? `
    <div class="billed-to">
        <h3>Billed To</h3>
        <div class="billed-to-details">
            <strong>${recipient.name}</strong><br>
            ${recipient.company ? `${recipient.company}<br>` : ''}
            ${recipient.email ? `${recipient.email}<br>` : ''}
            ${recipient.phone ? `${recipient.phone}` : ''}
        </div>
    </div>
    ` : ''}

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

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${formatCurrency(item.unitPrice || item.rate || 0)}</td>
                    <td style="text-align: right;">${formatCurrency(item.quantity * (item.unitPrice || item.rate || 0))}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-row subtotal">
            <span>Subtotal:</span>
            <span>${formatCurrency(Number(data.subtotal))}</span>
        </div>
        ${Number(data.tax) > 0 ? `
        <div class="totals-row">
            <span>Tax:</span>
            <span>${formatCurrency(Number(data.tax))}</span>
        </div>
        ` : ''}
        ${Number(data.discount) > 0 ? `
        <div class="totals-row">
            <span>Discount:</span>
            <span>-${formatCurrency(Number(data.discount))}</span>
        </div>
        ` : ''}
        <div class="totals-row total">
            <span>Total:</span>
            <span>${formatCurrency(Number(data.total))}</span>
        </div>
    </div>

    ${data.notes ? `
    <div class="notes">
        <h3>Notes & Terms</h3>
        <p>${data.notes}</p>
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

    private static generateContractHTML(data: any): string {
        const logoBase64 = this.getImageBase64(data.company.logo);
        const signatureBase64 = this.getImageBase64(data.company.digitalSignature);
        const clientSignatureBase64 = this.getImageBase64(data.clientSignature);
        const companyAuthSignatureBase64 = this.getImageBase64(data.companySignature);
        const isLetterheadPDF = data.useLetterhead && data.company.letterhead?.toLowerCase().endsWith('.pdf');
        const isContinuationPDF = data.useLetterhead && data.company.continuationSheet?.toLowerCase().endsWith('.pdf');

        const letterheadBase64 = data.useLetterhead && !isLetterheadPDF ? this.getImageBase64(data.company.letterhead) : undefined;
        const continuationBase64 = data.useLetterhead && !isContinuationPDF ? this.getImageBase64(data.company.continuationSheet) : undefined;

        const marginTop = data.useLetterhead ? (data.company.pdfMarginTop || 180) : 40;
        const contTop = data.useLetterhead ? (data.company.pdfContinuationTop || 80) : 40;
        const marginBottom = data.useLetterhead ? (data.company.pdfMarginBottom || 80) : 40;
        const marginLeft = data.useLetterhead ? (data.company.pdfMarginLeft || 40) : 40;
        const marginRight = data.useLetterhead ? (data.company.pdfMarginRight || 40) : 40;

        const backgroundCSS = data.useLetterhead ? `
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
    ` : `
    @page {
        margin: 40px 60px;
    }
    body { 
        margin: 0;
        padding: 0;
    }
    `;


        // Check if signatures are embedded in content via variables
        const hasEmbeddedCompanySig = (data.content || '').includes('[COMPANY_SIGNATURE]');
        const hasEmbeddedClientSig = (data.content || '').includes('[CLIENT_SIGNATURE]');

        // Perform Variable Replacement
        const processedContent = (data.content || '')
            .replace(/\[COMPANY_SIGNATURE\]/g, signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 60px; vertical-align: middle;">` : '')
            .replace(/\[CLIENT_SIGNATURE\]/g, clientSignatureBase64 ? `<img src="${clientSignatureBase64}" style="max-height: 60px; vertical-align: middle;">` : '')
            .replace(/\[CLIENT_NAME\]/g, data.client.name || '')
            .replace(/\[COMPANY_NAME\]/g, data.company.name || '')
            .replace(/\[DATE\]/g, new Date(data.date).toLocaleDateString())
            .replace(/\[PROJECT_NAME\]/g, data.project?.name || '')
            .replace(/\[TOTAL_AMOUNT\]/g, data.total ? `${data.currency} ${data.total}` : '');


        return `
            <!DOCTYPE html>
                <html>
                <head>
                <meta charset="UTF-8" >
                    <style>
        * { margin: 0; padding: 0; box- sizing: border - box;
    }
        body {
    font - family: 'Times New Roman', Times, serif;
    color: #1a1a1a;
    line - height: 1.8;
    font - size: 14px;
}
        ${backgroundCSS}
        .header {
    display: ${data.useLetterhead ? 'none' : 'block'};
    text - align: center;
    margin - bottom: 50px;
    border - bottom: 2px solid #000;
    padding - bottom: 20px;
}
        .company - logo {
    max - height: 80px;
    margin - bottom: 15px;
}
        .title {
    font - size: 24px;
    font - weight: bold;
    text - transform: uppercase;
    letter - spacing: 1px;
    margin - bottom: 10px;
}
        .meta {
    font - size: 12px;
    color: #666;
}
        .content {
    text - align: justify;
    min - height: 400px;
    margin - bottom: 50px;
}
        .signatures {
    display: flex;
    justify - content: space - between;
    page -break-inside: avoid;
    margin - top: 60px;
}
        .signature - block {
    width: 45 %;
}
        .sign - area {
    border - bottom: 1px solid #000;
    height: 100px;
    margin - bottom: 10px;
    display: flex;
    align - items: flex - end;
    position: relative;
}
        .sign - img {
    max - height: 90px;
    max - width: 100 %;
    display: block;
    margin: 0 auto;
}
        .sign - label {
    font - weight: bold;
    text - transform: uppercase;
    font - size: 11px;
}
        .footer {
    display: ${data.useLetterhead ? 'none' : 'block'};
    margin - top: 50px;
    text - align: center;
    font - size: 10px;
    color: #999;
    border - top: 1px solid #eee;
    padding - top: 10px;
}
</style>
    </head>
    < body >
    <div class="header" >
        ${logoBase64 ? `<img src="${logoBase64}" class="company-logo">` : ''}
<div class="title" > ${data.title} </div>
    < div class="meta" > Agreement Date: ${new Date(data.date).toLocaleDateString()} </div>
        </div>

        < div class="content" >
            ${processedContent}
</div>

    ${(!hasEmbeddedCompanySig || !hasEmbeddedClientSig) ? `
    <div class="signatures">
        ${!hasEmbeddedCompanySig ? `
        <div class="signature-block">
            <div class="sign-area">
                ${companyAuthSignatureBase64 ? `<img src="${companyAuthSignatureBase64}" class="sign-img">` : ''}
            </div>
            <div class="sign-label">For ${data.company.name}</div>
            <div style="font-size: 12px; color: #666;">
                ${data.companySignedAt ? `Authorized Signatory<br>Date: ${new Date(data.companySignedAt).toLocaleString()}` : 'Authorized Signatory'}
            </div>
        </div>
        ` : '<div></div>'}

        ${!hasEmbeddedClientSig ? `
        <div class="signature-block">
            <div class="sign-area">
                ${clientSignatureBase64 ? `<img src="${clientSignatureBase64}" class="sign-img">` : ''}
            </div>
            <div class="sign-label">For ${data.client.name}</div>
            ${data.signedAt ? `<div style="font-size: 10px; color: #666;">Digitally Signed<br>IP: ${data.signerIp}<br>Date: ${new Date(data.signedAt).toLocaleString()}</div>` : ''}
        </div>
        ` : '<div></div>'}
    </div>
    ` : ''
            }

<div class="footer" >
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
}
