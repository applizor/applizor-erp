import axios from 'axios';
import FormData from 'form-data';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://gotenberg:3000';

interface QuotationData {
    quotationNumber: string;
    quotationDate: Date;
    validUntil?: Date;
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
    lead?: {
        name: string;
        company?: string;
        email?: string;
        phone?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
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
     * Generate quotation HTML template
     */
    private static generateQuotationHTML(data: QuotationData, isSigned: boolean = false): string {
        const formatCurrency = (amount: number) => {
            const symbol = data.currency === 'INR' ? '₹' : '$';
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
            border-bottom: 3px solid #2563eb;
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
        .quotation-info {
            text-align: right;
        }
        .quotation-title {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .quotation-meta {
            font-size: 13px;
            color: #666;
            line-height: 1.8;
        }
        .quotation-meta strong {
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
            background: #1e40af;
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
            border-top: 2px solid #1e40af;
            padding-top: 12px;
            margin-top: 8px;
            font-size: 18px;
            font-weight: bold;
            color: #059669;
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
            color: #1e40af;
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
        .signature-section h3 {
            color: #065f46;
            margin-bottom: 20px;
            font-size: 16px;
        }
        .signature-box {
            border: 2px solid #d1d5db;
            border-radius: 4px;
            padding: 15px;
            background: white;
            margin-bottom: 10px;
        }
        .signature-box img {
            max-width: 300px;
            max-height: 100px;
        }
        .signature-details {
            font-size: 12px;
            color: #666;
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
        <div class="quotation-info">
            <div class="quotation-title">QUOTATION</div>
            <div class="quotation-meta">
                <strong>Number:</strong> ${data.quotationNumber}<br>
                <strong>Date:</strong> ${formatDate(data.quotationDate)}<br>
                ${data.validUntil ? `<strong>Valid Till:</strong> ${formatDate(data.validUntil)}<br>` : ''}
            </div>
        </div>
    </div>

    ${data.lead ? `
    <div class="billed-to">
        <h3>Billed To</h3>
        <div class="billed-to-details">
            <strong>${data.lead.name}</strong><br>
            ${data.lead.company ? `${data.lead.company}<br>` : ''}
            ${data.lead.email ? `${data.lead.email}<br>` : ''}
            ${data.lead.phone ? `${data.lead.phone}` : ''}
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
                    <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
                    <td style="text-align: right;">${formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-row subtotal">
            <span>Subtotal:</span>
            <span>${formatCurrency(data.subtotal)}</span>
        </div>
        ${data.tax > 0 ? `
        <div class="totals-row">
            <span>Tax:</span>
            <span>${formatCurrency(data.tax)}</span>
        </div>
        ` : ''}
        ${data.discount > 0 ? `
        <div class="totals-row">
            <span>Discount:</span>
            <span>-${formatCurrency(data.discount)}</span>
        </div>
        ` : ''}
        <div class="totals-row total">
            <span>Total:</span>
            <span>${formatCurrency(data.total)}</span>
        </div>
    </div>

    ${data.notes ? `
    <div class="notes">
        <h3>Terms and Conditions</h3>
        <p>${data.notes}</p>
    </div>
    ` : ''}

    ${isSigned && data.clientSignature ? `
    <div class="signature-section">
        <h3>✓ Client Acceptance</h3>
        <div class="signature-box">
            <img src="${data.clientSignature}" alt="Client Signature">
        </div>
        <div class="signature-details">
            Signed by <strong>${data.clientName}</strong> on ${formatDate(data.clientAcceptedAt!)}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        This is a computer-generated quotation and does not require a physical signature.
    </div>
</body>
</html>
        `;
    }

    /**
     * Convert HTML to PDF using Gotenberg
     */
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

    /**
     * Generate regular quotation PDF
     */
    static async generateQuotationPDF(data: QuotationData): Promise<Buffer> {
        const html = this.generateQuotationHTML(data, false);
        return this.convertHTMLToPDF(html);
    }

    /**
     * Generate signed quotation PDF (with client signature)
     */
    static async generateSignedQuotationPDF(data: QuotationData): Promise<Buffer> {
        if (!data.clientSignature || !data.clientAcceptedAt) {
            throw new Error('Quotation has not been accepted by client');
        }
        const html = this.generateQuotationHTML(data, true);
        return this.convertHTMLToPDF(html);
    }
}
