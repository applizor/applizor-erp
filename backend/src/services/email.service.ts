import nodemailer from 'nodemailer';

// Configure transporter
// In production, these should come from environment variables or database settings
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string, attachments?: any[]) => {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.COMPANY_NAME || 'Applizor ERP'}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            attachments
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export const sendInvoiceEmail = async (to: string, invoiceData: any, pdfBuffer?: Buffer) => {
    const subject = `${invoiceData.type === 'quotation' ? 'Quotation' : 'Invoice'} #${invoiceData.invoiceNumber} from ${process.env.COMPANY_NAME || 'Us'}`;
    const html = `
        <div style="font-family: Arial, sans-serif;">
            <h2>Hello,</h2>
            <p>Please find attached the ${invoiceData.type} <strong>${invoiceData.invoiceNumber}</strong>.</p>
            <p><strong>Total Amount:</strong> ${invoiceData.currency} ${invoiceData.total}</p>
            <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
            <br/>
            <p>Thank you for your business!</p>
        </div>
    `;

    const attachments = pdfBuffer ? [{
        filename: `${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer
    }] : [];

    return sendEmail(to, subject, html, attachments);
};

// Send Quotation to Client with Public Link
export const sendQuotationToClient = async (quotationData: any, publicUrl: string) => {
    const subject = `Quotation #${quotationData.quotationNumber} from ${process.env.COMPANY_NAME || 'Applizor'}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Quotation from ${process.env.COMPANY_NAME || 'Applizor'}</h1>
                </div>
                <div class="content">
                    <p>Dear ${quotationData.lead?.name || 'Valued Client'},</p>
                    <p>We are pleased to share our quotation with you. Please review the details below:</p>
                    
                    <div class="details">
                        <p><strong>Quotation Number:</strong> ${quotationData.quotationNumber}</p>
                        <p><strong>Date:</strong> ${new Date(quotationData.quotationDate).toLocaleDateString()}</p>
                        ${quotationData.validUntil ? `<p><strong>Valid Until:</strong> ${new Date(quotationData.validUntil).toLocaleDateString()}</p>` : ''}
                        <p><strong>Total Amount:</strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p>
                    </div>
                    
                    <p>You can view the complete quotation and accept it online by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${publicUrl}" class="button">View Quotation</a>
                    </div>
                    
                    <p>From the quotation page, you can:</p>
                    <ul>
                        <li>Review all items and pricing details</li>
                        <li>Download the quotation as PDF</li>
                        <li>Accept the quotation with your digital signature</li>
                        <li>Download the signed copy after acceptance</li>
                    </ul>
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Best regards,<br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(quotationData.lead?.email || quotationData.clientEmail, subject, html);
};

// Send Acceptance Confirmation to Client
export const sendQuotationAcceptanceToClient = async (quotationData: any) => {
    const subject = `Quotation #${quotationData.quotationNumber} - Accepted`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-icon { font-size: 48px; margin-bottom: 10px; }
                .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="success-icon">✓</div>
                    <h1>Quotation Accepted!</h1>
                </div>
                <div class="content">
                    <p>Dear ${quotationData.clientName},</p>
                    <p>Thank you for accepting our quotation. We have received your confirmation.</p>
                    
                    <div class="details">
                        <p><strong>Quotation Number:</strong> ${quotationData.quotationNumber}</p>
                        <p><strong>Accepted On:</strong> ${new Date(quotationData.clientAcceptedAt).toLocaleString()}</p>
                        <p><strong>Total Amount:</strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p>
                    </div>
                    
                    <p>Your signed quotation has been saved and our team will contact you shortly to proceed with the next steps.</p>
                    
                    <p>Thank you for choosing ${process.env.COMPANY_NAME || 'Applizor'}!</p>
                    
                    <p>Best regards,<br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(quotationData.clientEmail, subject, html);
};

// Send Acceptance Notification to Company
export const sendQuotationAcceptanceToCompany = async (quotationData: any) => {
    const subject = `✓ Quotation #${quotationData.quotationNumber} Accepted by ${quotationData.clientName}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-icon { font-size: 48px; margin-bottom: 10px; }
                .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="success-icon">🎉</div>
                    <h1>Quotation Accepted!</h1>
                </div>
                <div class="content">
                    <p><strong>${quotationData.clientName}</strong> has accepted quotation <strong>#${quotationData.quotationNumber}</strong>.</p>
                    
                    <div class="details">
                        <h3>Client Information:</h3>
                        <p><strong>Name:</strong> ${quotationData.clientName}</p>
                        <p><strong>Email:</strong> ${quotationData.clientEmail}</p>
                        <p><strong>Accepted On:</strong> ${new Date(quotationData.clientAcceptedAt).toLocaleString()}</p>
                        ${quotationData.clientComments ? `<p><strong>Comments:</strong> ${quotationData.clientComments}</p>` : ''}
                        
                        <h3 style="margin-top: 20px;">Quotation Details:</h3>
                        <p><strong>Quotation Number:</strong> ${quotationData.quotationNumber}</p>
                        <p><strong>Total Amount:</strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p>
                    </div>
                    
                    <p>The signed quotation is available in your CRM system.</p>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Review the signed quotation in CRM</li>
                        <li>Contact the client to proceed</li>
                        <li>Convert to invoice when ready</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `;

    // Send to company email from quotation data
    const companyEmail = quotationData.company?.email || process.env.SMTP_USER;
    console.log('🔍 Company notification email:', {
        companyEmailFromDB: quotationData.company?.email,
        smtpUser: process.env.SMTP_USER,
        selectedEmail: companyEmail
    });

    if (!companyEmail) {
        console.error('No company email found for notification');
        return;
    }

    return sendEmail(companyEmail, subject, html);
};

// Send Rejection Notification to Company
export const sendQuotationRejectionToCompany = async (quotationData: any) => {
    const subject = `✗ Quotation #${quotationData.quotationNumber} Declined by ${quotationData.clientName}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .icon { font-size: 48px; margin-bottom: 10px; }
                .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">ℹ️</div>
                    <h1>Quotation Declined</h1>
                </div>
                <div class="content">
                    <p><strong>${quotationData.clientName}</strong> has declined quotation <strong>#${quotationData.quotationNumber}</strong>.</p>
                    
                    <div class="details">
                        <h3>Client Information:</h3>
                        <p><strong>Name:</strong> ${quotationData.clientName}</p>
                        <p><strong>Email:</strong> ${quotationData.clientEmail}</p>
                        <p><strong>Declined On:</strong> ${new Date(quotationData.clientRejectedAt).toLocaleString()}</p>
                        ${quotationData.clientComments ? `<p><strong>Reason:</strong> ${quotationData.clientComments}</p>` : '<p><em>No reason provided</em></p>'}
                        
                        <h3 style="margin-top: 20px;">Quotation Details:</h3>
                        <p><strong>Quotation Number:</strong> ${quotationData.quotationNumber}</p>
                        <p><strong>Total Amount:</strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p>
                    </div>
                    
                    <p><strong>Suggested Actions:</strong></p>
                    <ul>
                        <li>Review the client's feedback</li>
                        <li>Consider reaching out to understand concerns</li>
                        <li>Prepare a revised quotation if appropriate</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `;

    // Send to company email from quotation data
    const companyEmail = quotationData.company?.email || process.env.SMTP_USER;
    console.log('🔍 Rejection notification email:', {
        companyEmailFromDB: quotationData.company?.email,
        smtpUser: process.env.SMTP_USER,
        selectedEmail: companyEmail
    });

    if (!companyEmail) {
        console.error('No company email found for notification');
        return;
    }

    return sendEmail(companyEmail, subject, html);
};
