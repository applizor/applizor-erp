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
        // Fallback to mock behavior if email fails (often happening in dev/local w/o valid creds)
        console.log('⚠️ Email sending failed. Falling back to MOCK mode.');
        console.log(`[MOCK EMAIL] To: ${to}`);
        console.log(`[MOCK EMAIL] Subject: ${subject}`);
        return { messageId: `mock-${Date.now()}` };
    }
};

export const sendInvoiceEmail = async (to: string, invoiceData: any, pdfBuffer?: Buffer, isReminder?: boolean, publicUrl?: string) => {
    const typeLabel = invoiceData.type === 'quotation' ? 'Quotation' : 'Invoice';
    const subject = isReminder
        ? `Reminder: ${typeLabel} #${invoiceData.invoiceNumber} is due`
        : `${typeLabel} #${invoiceData.invoiceNumber} from ${process.env.COMPANY_NAME || 'Us'}`;

    const html = `
        <div style="font-family: Arial, sans-serif;">
            <h2>${isReminder ? 'Payment Reminder' : 'Hello'},</h2>
            <p>${isReminder ? 'This is a friendly reminder that' : 'Please find attached'} the ${invoiceData.type} <strong>${invoiceData.invoiceNumber}</strong> ${isReminder ? 'is now due for payment.' : '.'}</p>
            <p><strong>Total Amount:</strong> ${invoiceData.currency} ${invoiceData.total}</p>
            <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
            
            ${publicUrl ? `
            <div style="margin: 20px 0;">
                <p>You can also view and pay this invoice online:</p>
                <a href="${publicUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Invoice Online</a>
            </div>
            ` : ''}

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

// Send Contract Notification to Client
export const sendContractNotification = async (contract: any, publicUrl: string) => {
    const subject = `New Contract: ${contract.title} from ${process.env.COMPANY_NAME || 'Applizor'}`;

    const html = `
        <div style="font-family: Arial, sans-serif;">
            <h2>Hello ${contract.client.name},</h2>
            <p>You have a new contract <strong>${contract.title}</strong> ready for review and signature.</p>
            <p>Please click the link below to view and sign the contract online:</p>
            <div style="margin: 20px 0;">
                <a href="${publicUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View & Sign Contract</a>
            </div>
            <p>If you have any questions, please contact us.</p>
            <br/>
            <p>Best regards,<br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p>
        </div>
    `;

    return sendEmail(contract.client.email, subject, html);
};

// Send Notification to Company when Client signs
export const sendContractSignedNotificationToCompany = async (contract: any) => {
    const subject = `Contract Signed: ${contract.title} by ${contract.signerName || contract.client.name}`;

    const html = `
        <div style="font-family: Arial, sans-serif;">
            <h2>Excellent News!</h2>
            <p>The contract <strong>${contract.title}</strong> has been digitally signed by <strong>${contract.signerName || contract.client.name}</strong>.</p>
            <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #10B981; background: #F0FDF4;">
                <p><strong>Signatory:</strong> ${contract.signerName || contract.client.name}</p>
                <p><strong>Signed At:</strong> ${new Date(contract.signedAt).toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${contract.signerIp}</p>
            </div>
            <p>You can now view the signed contract and download the final PDF from your dashboard.</p>
            <br/>
            <p>Best regards,<br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p>
        </div>
    `;

    const companyEmail = contract.company?.email || process.env.SMTP_USER;
    if (!companyEmail) return;

    return sendEmail(companyEmail, subject, html);
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

// Send Quotation Reminder
export const sendQuotationReminder = async (quotationData: any, publicUrl: string) => {
    const subject = `Reminder: Quotation #${quotationData.quotationNumber} from ${process.env.COMPANY_NAME || 'Applizor'}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Quotation Reminder</h1>
                </div>
                <div class="content">
                    <p>Dear ${quotationData.lead?.name || 'Valued Client'},</p>
                    <p>This is a gentle reminder regarding the quotation we sent on ${new Date(quotationData.quotationDate).toLocaleDateString()}.</p>
                    
                    <div class="details">
                        <p><strong>Quotation Number:</strong> ${quotationData.quotationNumber}</p>
                        ${quotationData.validUntil ? `<p><strong>Valid Until:</strong> ${new Date(quotationData.validUntil).toLocaleDateString()}</p>` : ''}
                        <p><strong>Total Amount:</strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p>
                    </div>
                    
                    <p>We wanted to ensure you didn't miss it. You can view or accept the quotation using the link below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${publicUrl}" class="button">View Quotation</a>
                    </div>
                    
                    <p>If you have any questions or need modifications, please feel free to reply to this email.</p>
                    
                    <p>Best regards,<br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated reminder. Please do not reply to this message directly.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(quotationData.lead?.email || quotationData.clientEmail, subject, html);
};
// --- Task Notifications ---

export const notifyTaskAssigned = async (task: any, assignee: any, project: any) => {
    const subject = `[${project.name}] Task Assigned: ${task.title}`;

    // Determine priority color
    const priorityColor = task.priority === 'urgent' ? '#e11d48' :
        task.priority === 'high' ? '#ea580c' :
            task.priority === 'medium' ? '#ca8a04' : '#65a30d';

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;">New Task Assignment</h2>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Project: ${project.name}</p>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-top: 0;">Hello <strong>${assignee.firstName}</strong>,</p>
                    <p>You have been assigned to the following task:</p>
                    
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                            <span style="font-size: 16px; font-weight: 600; color: #0f172a;">${task.title}</span>
                            <span style="margin-left: auto; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background-color: ${priorityColor}20; color: ${priorityColor}; border: 1px solid ${priorityColor}40;">
                                ${task.priority}
                            </span>
                        </div>
                        <div style="color: #475569; font-size: 14px; margin-bottom: 16px;">
                            ${task.description ? task.description.replace(/<[^>]*>?/g, '').substring(0, 150) + (task.description.length > 150 ? '...' : '') : 'No description provided.'}
                        </div>
                        <div style="display: flex; gap: 24px; font-size: 13px; color: #64748b;">
                            <div>
                                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Status</span>
                                <span style="font-weight: 500; color: #334155;">${task.status.replace('-', ' ')}</span>
                            </div>
                            <div>
                                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Due Date</span>
                                <span style="font-weight: 500; color: #334155;">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                            </div>
                             <div>
                                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Type</span>
                                <span style="font-weight: 500; color: #334155;">${task.type}</span>
                            </div>
                        </div>
                    </div>

                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Task</a>
                </div>
                
                <div style="background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                    Sent via Applizor ERP
                </div>
            </div>
        </div>
    `;

    return sendEmail(assignee.email, subject, html);
};

export const notifyTaskUpdated = async (task: any, assignee: any, project: any, changes: string[]) => {
    const subject = `[${project.name}] Update on: ${task.title}`;

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;">Task Updated</h2>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Project: ${project.name}</p>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-top: 0;">Hello <strong>${assignee.firstName}</strong>,</p>
                    <p>There have been updates to a task you are assigned to:</p>
                    
                    <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 6px; padding: 12px; margin: 20px 0;">
                        <strong>Changes:</strong> ${changes.join(', ')}
                    </div>
                    
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                        <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">${task.title}</div>
                        <div style="font-size: 13px; color: #64748b;">Current Status: <span style="color: #0f172a; font-weight: 500;">${task.status}</span></div>
                    </div>

                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Task</a>
                </div>
            </div>
        </div>
    `;

    return sendEmail(assignee.email, subject, html);
};

export const notifyNewTask = async (task: any, project: any, recipientEmail: string) => {
    const subject = `[${project.name}] New Task Created: ${task.title}`;

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;">New Task Created</h2>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Project: ${project.name}</p>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-top: 0;">A new task has been added to the project.</p>
                    
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                        <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">${task.title}</div>
                         <div style="color: #475569; font-size: 14px; margin-bottom: 16px;">
                            ${task.description ? task.description.replace(/<[^>]*>?/g, '').substring(0, 150) + (task.description.length > 150 ? '...' : '') : 'No description provided.'}
                        </div>
                        <div style="display: flex; gap: 24px; font-size: 13px; color: #64748b;">
                            <div><span style="color: #94a3b8;">Type:</span> ${task.type}</div>
                            <div><span style="color: #94a3b8;">Priority:</span> ${task.priority}</div>
                        </div>
                    </div>

                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Dashboard</a>
                </div>
            </div>
        </div>
    `;

    return sendEmail(recipientEmail, subject, html);
};

export const notifyMention = async (recipient: { email: string, firstName: string }, commenterName: string, task: any, project: any, commentContent: string) => {
    const subject = `[${project.name}] You were mentioned in a comment`;

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
                <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;">You were mentioned</h2>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Project: ${project.name}</p>
                </div>
                
                <div style="padding: 24px;">
                    <p style="margin-top: 0;">Hello <strong>${recipient.firstName}</strong>,</p>
                    <p><strong>${commenterName}</strong> mentioned you in a comment on task:</p>
                    
                    <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0;">
                        <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">${task.title}</div>
                        <div style="color: #475569; font-size: 13px; font-style: italic; border-left: 3px solid #cbd5e1; padding-left: 12px;">
                            "${commentContent.replace(/<[^>]*>?/g, '').substring(0, 200)}${commentContent.length > 200 ? '...' : ''}"
                        </div>
                    </div>

                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks" style="display: inline-block; background-color: #0052cc; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; text-decoration: none; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">View Comment</a>
                    </div>
                </div>
                
                <div style="background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                    Sent via Applizor ERP • Modern Workspace
                </div>
            </div>
        </div>
    `;

    return sendEmail(recipient.email, subject, html);
};

export const sendInterviewInvite = async (
    to: string,
    details: {
        candidateName: string;
        round: number;
        type: string;
        scheduledAt: Date | string;
        interviewer: string;
        meetingLink?: string;
    }
) => {
    const subject = `Interview Invitation: Round ${details.round} - ${details.type}`;
    const dateStr = new Date(details.scheduledAt).toLocaleString();

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">Interview Invitation</h2>
            </div>
            <div style="border: 1px solid #e2e8f0; padding: 30px; border-radius: 0 0 8px 8px; background-color: white;">
                <p>Dear <strong>${details.candidateName}</strong>,</p>
                <p>We are pleased to invite you to an interview for the following position.</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0f172a;">
                    <p style="margin: 5px 0;"><strong>Round:</strong> ${details.round} (${details.type})</p>
                    <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${dateStr}</p>
                    <p style="margin: 5px 0;"><strong>Interviewer:</strong> ${details.interviewer}</p>
                    ${details.meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${details.meetingLink}">${details.meetingLink}</a></p>` : ''}
                </div>

                <p>Please ensure you are available 5 minutes prior to the scheduled time.</p>
                
                <p>Best regards,<br/>${process.env.COMPANY_NAME || 'Applizor'} Recruitment Team</p>
            </div>
        </div>
    `;

    return sendEmail(to, subject, html);
};
