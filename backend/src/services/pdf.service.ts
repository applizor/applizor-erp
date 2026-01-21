import axios from 'axios';
import FormData from 'form-data';

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
    };
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
    // For signed PDF
    clientSignature?: string;
    clientName?: string;
    clientAcceptedAt?: Date;
}

export class PDFService {
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

        const number = type === 'QUOTATION' ? data.quotationNumber : data.invoiceNumber;
        const mainDate = type === 'QUOTATION' ? data.quotationDate : data.invoiceDate;
        const subDate = type === 'QUOTATION' ? data.validUntil : data.dueDate;
        const subDateLabel = type === 'QUOTATION' ? 'Valid Till' : 'Due Date';
        const recipient = data.client || data.lead;

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
            padding: 40px;
        }
        .header {
            display: flex;
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
            ${data.company.logo ? `<img src="${data.company.logo}" class="company-logo" alt="${data.company.name}">` : `<h2>${data.company.name}</h2>`}
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

    ${isSigned && data.clientSignature ? `
    <div class="signature-section">
        <h3 style="color: #065f46; margin-bottom: 15px;">✓ Client Acceptance</h3>
        <div style="border: 2px solid #d1d5db; padding: 15px; background: white; border-radius: 4px; display: inline-block;">
            <img src="${data.clientSignature}" style="max-height: 80px;" alt="Signature">
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 10px;">
            Signed by <strong>${data.clientName}</strong> on ${data.clientAcceptedAt ? formatDate(data.clientAcceptedAt) : ''}
        </div>
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

    static async generateQuotationPDF(data: any): Promise<Buffer> {
        const html = this.generateHTML(data, 'QUOTATION', false);
        return this.convertHTMLToPDF(html);
    }

    static async generateInvoicePDF(data: any): Promise<Buffer> {
        const html = this.generateHTML(data, 'INVOICE', false);
        return this.convertHTMLToPDF(html);
    }

    static async generateSignedQuotationPDF(data: any): Promise<Buffer> {
        const html = this.generateHTML(data, 'QUOTATION', true);
        return this.convertHTMLToPDF(html);
    }
}
