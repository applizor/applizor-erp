import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { PDFService } from './pdf.service';
import axios from 'axios';

// --- Microsoft Graph API Helpers ---

const getMicrosoftAccessToken = async () => {
    try {
        const params = new URLSearchParams();
        params.append('client_id', process.env.MICROSOFT_CLIENT_ID!);
        params.append('client_secret', process.env.MICROSOFT_CLIENT_SECRET!);
        params.append('refresh_token', process.env.MICROSOFT_REFRESH_TOKEN!);
        params.append('grant_type', 'refresh_token');
        params.append('scope', 'https://graph.microsoft.com/.default');

        const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
        const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

        const response = await axios.post(tokenEndpoint, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return response.data.access_token;
    } catch (error: any) {
        console.error('❌ Failed to refresh Microsoft Token:', error.response?.data || error.message);
        return null;
    }
};

const sendViaMicrosoftGraph = async (to: string, subject: string, html: string, attachments: any[] = [], fromOverride?: string) => {
    const accessToken = await getMicrosoftAccessToken();
    if (!accessToken) {
        throw new Error('Could not retrieve access token for Microsoft Graph');
    }

    const fromAddress = fromOverride || process.env.EMAIL_INFO || process.env.EMAIL_FROM || process.env.SMTP_USER;

    // Convert Attachments to Graph API Format (Base64)
    const graphAttachments = attachments.map(att => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.filename,
        contentBytes: att.content.toString('base64'),
        contentType: 'application/pdf' // Assuming PDF for now, but could be dynamic
    }));

    const emailData = {
        message: {
            subject: subject,
            body: {
                contentType: "HTML",
                content: html
            },
            toRecipients: [
                { emailAddress: { address: to } }
            ],
            // Graph API /me/sendMail uses the authenticated user by default.
            // If "Send As" permissions are set, we can specify 'from'. 
            from: {
                emailAddress: { address: fromAddress }
            },
            attachments: graphAttachments
        },
        saveToSentItems: "true"
    };

    // Use /me/sendMail endpoint 
    // (Ensure the authenticated user has "Send As" rights for shared mailboxes)
    try {
        await axios.post('https://graph.microsoft.com/v1.0/me/sendMail', emailData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Email sent via Microsoft Graph API from ${fromAddress} to ${to}`);
        return { messageId: `graph-${Date.now()}` };
    } catch (error: any) {
        console.error('❌ Graph API Send Failed:', error.response?.data || error.message);
        throw error;
    }
};

// --- Legacy SMTP Transporter (Gmail / Fallback) ---
const createTransporter = () => {
    // Only use SMTP for non-Microsoft providers
    if (process.env.SMTP_SERVICE_PROVIDER === 'MICROSOFT') {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const transporter = createTransporter();

export const sendEmail = async (to: string, subject: string, html: string, attachments?: any[], fromOverride?: string) => {
    try {
        // MICROSOFT GRAPH PATH
        if (process.env.SMTP_SERVICE_PROVIDER === 'MICROSOFT') {
            return await sendViaMicrosoftGraph(to, subject, html, attachments, fromOverride);
        }

        // GMAIL / SMTP PATH
        if (!transporter) throw new Error('SMTP Transporter not initialized');

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
        // Fallback to mock behavior
        console.log('⚠️ Email sending failed. Falling back to MOCK mode.');
        return { messageId: `mock-${Date.now()}` };
    }
};

export const sendInvoiceEmail = async (to: string, invoiceData: any, pdfBuffer?: Buffer, isReminder?: boolean, publicUrl?: string) => {
    // Respect client notification preference
    if (invoiceData.client && invoiceData.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${invoiceData.client.name} has notifications disabled. Skipping invoice email.`);
        return { messageId: 'skipped-pref' };
    }

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

    // Use Accounts Email for Billing
    const from = process.env.EMAIL_ACCOUNTS;
    return sendEmail(to, subject, html, attachments, from);
};

// Send Quotation Email to Client
export const sendQuotationToClient = async (quotationData: any, publicUrl: string) => {
    // Respect client notification preference
    if (quotationData.client && quotationData.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${quotationData.client.name} has notifications disabled. Skipping quotation email.`);
        return { messageId: 'skipped-pref' };
    }

    const subject = `Quotation #${quotationData.quotationNumber} from ${process.env.COMPANY_NAME || 'Applizor'}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Quotation</h1>
            </div>
            <div class="content">
                <p>Dear ${quotationData.lead?.name || quotationData.client?.name || 'Valued Client'},</p>
                <p>We are pleased to send you our quotation <strong>#${quotationData.quotationNumber}</strong>.</p>
                
                <div class="details">
                    <p><strong>Total Amount:</strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p>
                    ${quotationData.validUntil ? `<p><strong>Valid Until:</strong> ${new Date(quotationData.validUntil).toLocaleDateString()}</p>` : ''}
                </div>

                <p>You can view, download, and accept this quotation online by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${publicUrl}" class="button">View Quotation</a>
                </div>

                <p>If you have any questions, please feel free to reply to this email.</p>
                
                <p>Best regards,<br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this message directly.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail(quotationData.lead?.email || quotationData.client?.email, subject, html);
};

// Send Contract Notification to Client
export const sendContractNotification = async (contract: any, publicUrl: string) => {
    // Respect client notification preference
    if (contract.client && contract.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${contract.client.name} has notifications disabled. Skipping contract email.`);
        return { messageId: 'skipped-pref' };
    }

    const subject = `New Contract: ${contract.title} from ${process.env.COMPANY_NAME || 'Applizor'} `;

    const html = `
    < div style = "font-family: Arial, sans-serif;" >
        <h2>Hello ${contract.client.name}, </h2>
            < p > You have a new contract < strong > ${contract.title} </strong> ready for review and signature.</p >
                <p>Please click the link below to view and sign the contract online: </p>
                    < div style = "margin: 20px 0;" >
                        <a href="${publicUrl}" style = "background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;" > View & Sign Contract </a>
                            </div>
                            < p > If you have any questions, please contact us.</p>
                                < br />
                                <p>Best regards, <br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p >
                                    </div>
                                        `;

    return sendEmail(contract.client.email, subject, html);
};

// Send Notification to Company when Client signs
export const sendContractSignedNotificationToCompany = async (contract: any) => {
    const subject = `Contract Signed: ${contract.title} by ${contract.signerName || contract.client.name} `;

    const html = `
    < div style = "font-family: Arial, sans-serif;" >
        <h2>Excellent News! </h2>
            < p > The contract < strong > ${contract.title} </strong> has been digitally signed by <strong>${contract.signerName || contract.client.name}</strong >.</p>
                < div style = "margin: 20px 0; padding: 15px; border-left: 4px solid #10B981; background: #F0FDF4;" >
                    <p><strong>Signatory: </strong> ${contract.signerName || contract.client.name}</p >
                        <p><strong>Signed At: </strong> ${new Date(contract.signedAt).toLocaleString()}</p >
                            <p><strong>IP Address: </strong> ${contract.signerIp}</p >
                                </div>
                                < p > You can now view the signed contract and download the final PDF from your dashboard.</p>
                                    < br />
                                    <p>Best regards, <br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p >
                                        </div>
                                            `;

    const companyEmail = contract.company?.email || process.env.SMTP_USER;
    if (!companyEmail) return;

    return sendEmail(companyEmail, subject, html);
};

// Send Acceptance Confirmation to Client
export const sendQuotationAcceptanceToClient = async (quotationData: any) => {
    // Respect client notification preference
    if (quotationData.client && quotationData.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${quotationData.clientName} has notifications disabled. Skipping acceptance email.`);
        return { messageId: 'skipped-pref' };
    }

    const subject = `Quotation #${quotationData.quotationNumber} - Accepted`;

    const html = `
    < !DOCTYPE html >
        <html>
        <head>
        <style>
        body { font - family: Arial, sans - serif; line - height: 1.6; color: #333; }
                .container { max - width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear - gradient(135deg, #10b981 0 %, #059669 100 %); color: white; padding: 30px; text - align: center; border - radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border - radius: 0 0 10px 10px; }
                .success - icon { font - size: 48px; margin - bottom: 10px; }
                .details { background: white; padding: 20px; border - radius: 5px; margin: 20px 0; }
                .footer { text - align: center; margin - top: 30px; color: #666; font - size: 12px; }
</style>
    </head>
    < body >
    <div class="container" >
        <div class="header" >
            <div class="success-icon" >✓</div>
                < h1 > Quotation Accepted! </h1>
                    </div>
                    < div class="content" >
                        <p>Dear ${quotationData.clientName}, </p>
                            < p > Thank you for accepting our quotation.We have received your confirmation.</p>

                                < div class="details" >
                                    <p><strong>Quotation Number: </strong> ${quotationData.quotationNumber}</p >
                                        <p><strong>Accepted On: </strong> ${new Date(quotationData.clientAcceptedAt).toLocaleString()}</p >
                                            <p><strong>Total Amount: </strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p >
                                                </div>

                                                < p > Your signed quotation has been saved and our team will contact you shortly to proceed with the next steps.</p>

                                                    < p > Thank you for choosing ${process.env.COMPANY_NAME || 'Applizor'}! </p>

                                                        < p > Best regards, <br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p >
                                                            </div>
                                                            < div class="footer" >
                                                                <p>This is an automated email.Please do not reply to this message.</p>
                                                                    </div>
                                                                    </div>
                                                                    </body>
                                                                    </html>
                                                                        `;

    return sendEmail(quotationData.clientEmail, subject, html);
};

// Send Acceptance Notification to Company
export const sendQuotationAcceptanceToCompany = async (quotationData: any) => {
    const subject = `✓ Quotation #${quotationData.quotationNumber} Accepted by ${quotationData.clientName} `;

    const html = `
    < !DOCTYPE html >
        <html>
        <head>
        <style>
        body { font - family: Arial, sans - serif; line - height: 1.6; color: #333; }
                .container { max - width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear - gradient(135deg, #10b981 0 %, #059669 100 %); color: white; padding: 30px; text - align: center; border - radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border - radius: 0 0 10px 10px; }
                .success - icon { font - size: 48px; margin - bottom: 10px; }
                .details { background: white; padding: 20px; border - radius: 5px; margin: 20px 0; }
</style>
    </head>
    < body >
    <div class="container" >
        <div class="header" >
            <div class="success-icon" >🎉</div>
                < h1 > Quotation Accepted! </h1>
                    </div>
                    < div class="content" >
                        <p><strong>${quotationData.clientName} </strong> has accepted quotation <strong>#${quotationData.quotationNumber}</strong >.</p>

                            < div class="details" >
                                <h3>Client Information: </h3>
                                    < p > <strong>Name: </strong> ${quotationData.clientName}</p >
                                        <p><strong>Email: </strong> ${quotationData.clientEmail}</p >
                                            <p><strong>Accepted On: </strong> ${new Date(quotationData.clientAcceptedAt).toLocaleString()}</p >
                                                ${quotationData.clientComments ? `<p><strong>Comments:</strong> ${quotationData.clientComments}</p>` : ''}

<h3 style="margin-top: 20px;" > Quotation Details: </h3>
    < p > <strong>Quotation Number: </strong> ${quotationData.quotationNumber}</p >
        <p><strong>Total Amount: </strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p >
            </div>

            < p > The signed quotation is available in your CRM system.</p>

                < p > <strong>Next Steps: </strong></p >
                    <ul>
                    <li>Review the signed quotation in CRM </li>
                        < li > Contact the client to proceed </li>
                            < li > Convert to invoice when ready </li>
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
    const subject = `✗ Quotation #${quotationData.quotationNumber} Declined by ${quotationData.clientName} `;

    const html = `
    < !DOCTYPE html >
        <html>
        <head>
        <style>
        body { font - family: Arial, sans - serif; line - height: 1.6; color: #333; }
                .container { max - width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear - gradient(135deg, #ef4444 0 %, #dc2626 100 %); color: white; padding: 30px; text - align: center; border - radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border - radius: 0 0 10px 10px; }
                .icon { font - size: 48px; margin - bottom: 10px; }
                .details { background: white; padding: 20px; border - radius: 5px; margin: 20px 0; }
</style>
    </head>
    < body >
    <div class="container" >
        <div class="header" >
            <div class="icon" > ℹ️ </div>
                < h1 > Quotation Declined </h1>
                    </div>
                    < div class="content" >
                        <p><strong>${quotationData.clientName} </strong> has declined quotation <strong>#${quotationData.quotationNumber}</strong >.</p>

                            < div class="details" >
                                <h3>Client Information: </h3>
                                    < p > <strong>Name: </strong> ${quotationData.clientName}</p >
                                        <p><strong>Email: </strong> ${quotationData.clientEmail}</p >
                                            <p><strong>Declined On: </strong> ${new Date(quotationData.clientRejectedAt).toLocaleString()}</p >
                                                ${quotationData.clientComments ? `<p><strong>Reason:</strong> ${quotationData.clientComments}</p>` : '<p><em>No reason provided</em></p>'}

<h3 style="margin-top: 20px;" > Quotation Details: </h3>
    < p > <strong>Quotation Number: </strong> ${quotationData.quotationNumber}</p >
        <p><strong>Total Amount: </strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p >
            </div>

            < p > <strong>Suggested Actions: </strong></p >
                <ul>
                <li>Review the client's feedback</li>
                    < li > Consider reaching out to understand concerns </li>
                        < li > Prepare a revised quotation if appropriate </li>
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
    // Respect client notification preference
    if (quotationData.client && quotationData.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${quotationData.clientName} has notifications disabled. Skipping reminder email.`);
        return { messageId: 'skipped-pref' };
    }

    const subject = `Reminder: Quotation #${quotationData.quotationNumber} from ${process.env.COMPANY_NAME || 'Applizor'} `;

    const html = `
    < !DOCTYPE html >
        <html>
        <head>
        <style>
        body { font - family: Arial, sans - serif; line - height: 1.6; color: #333; }
                .container { max - width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear - gradient(135deg, #f59e0b 0 %, #d97706 100 %); color: white; padding: 30px; text - align: center; border - radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border - radius: 0 0 10px 10px; }
                .button { display: inline - block; padding: 12px 30px; background: #f59e0b; color: white; text - decoration: none; border - radius: 5px; margin: 10px 5px; }
                .details { background: white; padding: 20px; border - radius: 5px; margin: 20px 0; }
                .footer { text - align: center; margin - top: 30px; color: #666; font - size: 12px; }
</style>
    </head>
    < body >
    <div class="container" >
        <div class="header" >
            <h1>Quotation Reminder </h1>
                </div>
                < div class="content" >
                    <p>Dear ${quotationData.lead?.name || 'Valued Client'}, </p>
                        < p > This is a gentle reminder regarding the quotation we sent on ${new Date(quotationData.quotationDate).toLocaleDateString()}.</p>

                            < div class="details" >
                                <p><strong>Quotation Number: </strong> ${quotationData.quotationNumber}</p >
                                    ${quotationData.validUntil ? `<p><strong>Valid Until:</strong> ${new Date(quotationData.validUntil).toLocaleDateString()}</p>` : ''}
<p><strong>Total Amount: </strong> ${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</p >
    </div>

    < p > We wanted to ensure you didn't miss it. You can view or accept the quotation using the link below:</p>

        < div style = "text-align: center; margin: 30px 0;" >
            <a href="${publicUrl}" class="button" > View Quotation </a>
                </div>

                < p > If you have any questions or need modifications, please feel free to reply to this email.</p>

                    < p > Best regards, <br/>${process.env.COMPANY_NAME || 'Applizor'} Team</p >
                        </div>
                        < div class="footer" >
                            <p>This is an automated reminder.Please do not reply to this message directly.</p>
                                </div>
                                </div>
                                </body>
                                </html>
                                    `;

    return sendEmail(quotationData.lead?.email || quotationData.clientEmail, subject, html);
};
// --- Task Notifications ---

export const notifyTaskAssigned = async (task: any, assignee: any, project: any) => {
    const subject = `[${project.name}] Task Assigned: ${task.title} `;

    // Determine priority color
    const priorityColor = task.priority === 'urgent' ? '#e11d48' :
        task.priority === 'high' ? '#ea580c' :
            task.priority === 'medium' ? '#ca8a04' : '#65a30d';

    const html = `
    < div style = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;" >
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;" >
            <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;" >
                <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;" > New Task Assignment </h2>
                    < p style = "margin: 5px 0 0; color: #64748b; font-size: 14px;" > Project: ${project.name} </p>
                        </div>

                        < div style = "padding: 24px;" >
                            <p style="margin-top: 0;" > Hello < strong > ${assignee.firstName} </strong>,</p >
                                <p>You have been assigned to the following task: </p>

                                    < div style = "background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;" >
                                        <div style="display: flex; align-items: center; margin-bottom: 12px;" >
                                            <span style="font-size: 16px; font-weight: 600; color: #0f172a;" > ${task.title} </span>
                                                < span style = "margin-left: auto; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background-color: ${priorityColor}20; color: ${priorityColor}; border: 1px solid ${priorityColor}40;" >
                                                    ${task.priority}
</span>
    </div>
    < div style = "color: #475569; font-size: 14px; margin-bottom: 16px;" >
        ${task.description ? task.description.replace(/<[^>]*>?/g, '').substring(0, 150) + (task.description.length > 150 ? '...' : '') : 'No description provided.'}
</div>
    < div style = "display: flex; gap: 24px; font-size: 13px; color: #64748b;" >
        <div>
        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;" > Status </span>
            < span style = "font-weight: 500; color: #334155;" > ${task.status.replace('-', ' ')} </span>
                </div>
                < div >
                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;" > Due Date </span>
                    < span style = "font-weight: 500; color: #334155;" > ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'} </span>
                        </div>
                        < div >
                        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;" > Type </span>
                            < span style = "font-weight: 500; color: #334155;" > ${task.type} </span>
                                </div>
                                </div>
                                </div>

                                < a href = "${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks" style = "display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 20px; text-decoration: none; border-radius: 6px;" > View Task </a>
                                    </div>

                                    < div style = "background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;" >
                                        Sent via Applizor ERP
                                            </div>
                                            </div>
                                            </div>
                                                `;

    return sendEmail(assignee.email, subject, html);
};

export const notifyTaskUpdated = async (task: any, assignee: any, project: any, changes: string[]) => {
    const subject = `[${project.name}] Update on: ${task.title} `;

    const html = `
    < div style = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;" >
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;" >
            <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;" >
                <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;" > Task Updated </h2>
                    < p style = "margin: 5px 0 0; color: #64748b; font-size: 14px;" > Project: ${project.name} </p>
                        </div>

                        < div style = "padding: 24px;" >
                            <p style="margin-top: 0;" > Hello < strong > ${assignee.firstName} </strong>,</p >
                                <p>There have been updates to a task you are assigned to: </p>

                                    < div style = "background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 6px; padding: 12px; margin: 20px 0;" >
                                        <strong>Changes: </strong> ${changes.join(', ')}
                                            </div>

                                            < div style = "background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;" >
                                                <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 4px;" > ${task.title} </div>
                                                    < div style = "font-size: 13px; color: #64748b;" > Current Status: <span style="color: #0f172a; font-weight: 500;" > ${task.status} </span></div >
                                                        </div>

                                                        < a href = "${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks" style = "display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 20px; text-decoration: none; border-radius: 6px;" > View Task </a>
                                                            </div>
                                                            </div>
                                                            </div>
                                                                `;

    return sendEmail(assignee.email, subject, html);
};

export const notifyNewTask = async (task: any, project: any, recipientEmail: string) => {
    const subject = `[${project.name}] New Task Created: ${task.title} `;

    const html = `
    < div style = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;" >
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;" >
            <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;" >
                <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;" > New Task Created </h2>
                    < p style = "margin: 5px 0 0; color: #64748b; font-size: 14px;" > Project: ${project.name} </p>
                        </div>

                        < div style = "padding: 24px;" >
                            <p style="margin-top: 0;" > A new task has been added to the project.</p>

                                < div style = "background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;" >
                                    <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px;" > ${task.title} </div>
                                        < div style = "color: #475569; font-size: 14px; margin-bottom: 16px;" >
                                            ${task.description ? task.description.replace(/<[^>]*>?/g, '').substring(0, 150) + (task.description.length > 150 ? '...' : '') : 'No description provided.'}
</div>
    < div style = "display: flex; gap: 24px; font-size: 13px; color: #64748b;" >
        <div><span style="color: #94a3b8;" > Type: </span> ${task.type}</div >
            <div><span style="color: #94a3b8;" > Priority: </span> ${task.priority}</div >
                </div>
                </div>

                < a href = "${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks" style = "display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 20px; text-decoration: none; border-radius: 6px;" > View Dashboard </a>
                    </div>
                    </div>
                    </div>
                        `;

    return sendEmail(recipientEmail, subject, html);
};

export const notifyMention = async (recipient: { email: string, firstName: string }, commenterName: string, task: any, project: any, commentContent: string) => {
    const subject = `[${project.name}] You were mentioned in a comment`;

    const html = `
    < div style = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;" >
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;" >
            <div style="background-color: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;" >
                <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;" > You were mentioned </h2>
                    < p style = "margin: 5px 0 0; color: #64748b; font-size: 14px;" > Project: ${project.name} </p>
                        </div>

                        < div style = "padding: 24px;" >
                            <p style="margin-top: 0;" > Hello < strong > ${recipient.firstName} </strong>,</p >
                                <p><strong>${commenterName} </strong> mentioned you in a comment on task:</p >

                                    <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0;" >
                                        <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;" > ${task.title} </div>
                                            < div style = "color: #475569; font-size: 13px; font-style: italic; border-left: 3px solid #cbd5e1; padding-left: 12px;" >
                                                "${commentContent.replace(/<[^>]*>?/g, '').substring(0, 200)}${commentContent.length > 200 ? '...' : ''}"
                                                </div>
                                                </div>

                                                < div style = "text-align: center;" >
                                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${project.id}/tasks" style = "display: inline-block; background-color: #0052cc; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 24px; text-decoration: none; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" > View Comment </a>
                                                        </div>
                                                        </div>

                                                        < div style = "background-color: #f8fafc; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;" >
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
    const subject = `Interview Invitation: Round ${details.round} - ${details.type} `;
    const dateStr = new Date(details.scheduledAt).toLocaleString();

    const html = `
    < div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;" >
        <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;" >
            <h2 style="color: white; margin: 0;" > Interview Invitation </h2>
                </div>
                < div style = "border: 1px solid #e2e8f0; padding: 30px; border-radius: 0 0 8px 8px; background-color: white;" >
                    <p>Dear < strong > ${details.candidateName} </strong>,</p >
                        <p>We are pleased to invite you to an interview for the following position.</p>

                            < div style = "background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0f172a;" >
                                <p style="margin: 5px 0;" > <strong>Round: </strong> ${details.round} (${details.type})</p >
                                    <p style="margin: 5px 0;" > <strong>Date & Time: </strong> ${dateStr}</p >
                                        <p style="margin: 5px 0;" > <strong>Interviewer: </strong> ${details.interviewer}</p >
                                            ${details.meetingLink ? `<p style="margin: 5px 0;"><strong>Meeting Link:</strong> <a href="${details.meetingLink}">${details.meetingLink}</a></p>` : ''}
</div>

    < p > Please ensure you are available 5 minutes prior to the scheduled time.</p>

        < p > Best regards, <br/>${process.env.COMPANY_NAME || 'Applizor'} Recruitment Team</p >
            </div>
            </div>
                `;

    return sendEmail(to, subject, html);
};
// Send Payslip Email
export const sendPayslipEmail = async (
    to: string,
    details: {
        employeeName: string;
        monthName: string;
        year: number;
        netSalary: number;
        currency: string;
    },
    pdfBuffer: Buffer
) => {
    const subject = `Payslip for ${details.monthName} ${details.year} `;

    const html = `
    < div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;" >
        <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;" >
            <h2 style="color: white; margin: 0;" > Payslip Generated </h2>
                </div>
                < div style = "border: 1px solid #e2e8f0; padding: 30px; border-radius: 0 0 8px 8px; background-color: white;" >
                    <p>Dear < strong > ${details.employeeName} </strong>,</p >
                        <p>Your payslip for the month of < strong > ${details.monthName} ${details.year} </strong> is ready.</p >

                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0f172a;" >
                                <p style="margin: 5px 0;" > <strong>Net Pay: </strong> ${details.currency} ${details.netSalary.toLocaleString()}</p >
                                    <p style="margin: 5px 0;" > <strong>Period: </strong> ${details.monthName} ${details.year}</p >
                                        </div>

                                        < p > Please find the payslip attached to this email.</p>

                                            < p > Best regards, <br/>${process.env.COMPANY_NAME || 'Applizor'} HR Team</p >
                                                </div>
                                                </div>
                                                    `;

    const attachments = [{
        filename: `Payslip_${details.monthName}_${details.year}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
    }];

    return sendEmail(to, subject, html, attachments);
};

// --- Leave Notifications ---

export const notifyLeaveRequested = async (leave: any, employee: any, managerEmail: string) => {
    const subject = `Leave Request: ${employee.firstName} ${employee.lastName}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Leave Request</h2>
        <p><strong>${employee.firstName} ${employee.lastName}</strong> has requested leave.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
            <p><strong>Type:</strong> ${leave.leaveType?.name || 'Leave'}</p>
            <p><strong>Dates:</strong> ${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}</p>
            <p><strong>Days:</strong> ${leave.days}</p>
            <p><strong>Reason:</strong> ${leave.reason}</p>
        </div>
        <p>Please log in to the portal to approve or reject this request.</p>
        <br/>
        <a href="${process.env.FRONTEND_URL}/dashboard/leave" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a>
    </div>`;
    return sendEmail(managerEmail, subject, html);
};

export const notifyLeaveStatusUpdate = async (leave: any, employee: any) => {
    const subject = `Leave Request ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}`;
    const color = leave.status === 'approved' ? '#10b981' : '#ef4444';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Leave Request Update</h2>
        <p>Dear ${employee.firstName},</p>
        <p>Your leave request has been <span style="color: ${color}; font-weight: bold;">${leave.status.toUpperCase()}</span>.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
            <p><strong>Dates:</strong> ${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}</p>
            ${leave.rejectionReason ? `<p><strong>Reason:</strong> ${leave.rejectionReason}</p>` : ''}
        </div>
    </div>`;
    return sendEmail(employee.email, subject, html);
};

// --- Ticket Notifications ---

export const notifyNewTicket = async (ticket: any, creatorName: string, supportEmail: string) => {
    const subject = `[Ticket #${ticket.id.slice(0, 8)}] New Ticket: ${ticket.subject}`;
    const html = `
    <div style="font-family: Arial, sans-serif;">
        <h2>New Ticket Created</h2>
        <p><strong>Created By:</strong> ${creatorName}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px;">
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p>${ticket.description}</p>
        </div>
        <br/>
        <a href="${process.env.FRONTEND_URL}/dashboard/helpdesk/${ticket.id}">View Ticket</a>
    </div>`;
    return sendEmail(supportEmail, subject, html);
};

export const notifyTicketReply = async (ticket: any, reply: any, recipientEmail: string) => {
    const subject = `[Ticket #${ticket.id.slice(0, 8)}] Update: ${ticket.subject}`;
    const html = `
    <div style="font-family: Arial, sans-serif;">
        <h3>New Reply on Ticket #${ticket.id.slice(0, 8)}</h3>
        <div style="border-left: 3px solid #0f172a; padding-left: 15px;">
            <p><strong>${reply.user?.firstName || 'Support'}:</strong></p>
            <p>${reply.message}</p>
        </div>
        <br/>
        <a href="${process.env.FRONTEND_URL}/dashboard/helpdesk/${ticket.id}">View Ticket</a>
    </div>`;
    return sendEmail(recipientEmail, subject, html);
};

// --- CRM & Asset Notifications ---

export const notifyLeadAssigned = async (lead: any, assignee: any) => {
    const subject = `New Lead Assigned: ${lead.name}`;
    const html = `
    <div style="font-family: Arial, sans-serif;">
        <h2>New Lead Assignment</h2>
        <p>Hello ${assignee.firstName},</p>
        <p>You have been assigned a new lead.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
            <p><strong>Name:</strong> ${lead.name}</p>
            <p><strong>Company:</strong> ${lead.company}</p>
            <p><strong>Email:</strong> ${lead.email}</p>
            <p><strong>Phone:</strong> ${lead.phone}</p>
        </div>
        <br/>
        <a href="${process.env.FRONTEND_URL}/dashboard/crm/leads/${lead.id}">View Lead</a>
    </div>`;
    return sendEmail(assignee.email, subject, html);
};

export const notifyAssetAssigned = async (asset: any, employee: any) => {
    const subject = `Asset Assigned: ${asset.name}`;
    const html = `
    <div style="font-family: Arial, sans-serif;">
        <h2>Asset Assignment</h2>
        <p>Dear ${employee.firstName},</p>
        <p>The following asset has been assigned to you:</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; border: 1px solid #bbf7d0;">
            <p><strong>Asset:</strong> ${asset.name}</p>
            <p><strong>Serial Number:</strong> ${asset.serialNumber}</p>
            <p><strong>Type:</strong> ${asset.type}</p>
            <p><strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
    </div>`;
    return sendEmail(employee.email, subject, html);
};

// --- Performance & HR Notifications ---

export const notifyPerformanceReview = async (review: any, employee: any) => {
    const subject = `Performance Review Completed`;
    const html = `
    <div style="font-family: Arial, sans-serif;">
        <h2>Performance Review</h2>
        <p>Dear ${employee.firstName},</p>
        <p>Your performance review has been completed.</p>
        <p><strong>Rating:</strong> ${review.rating}/5</p>
        <br/>
        <a href="${process.env.FRONTEND_URL}/dashboard/performance">View Review</a>
    </div>`;
    return sendEmail(employee.email, subject, html);
};

export const notifyExitInitiated = async (employee: any, exitDate: Date) => {
    const subject = `Exit Process Initiated`;
    const html = `
    <div style="font-family: Arial, sans-serif;">
        <h2>Exit Process Initiated</h2>
        <p>Dear ${employee.firstName},</p>
        <p>Your exit process has been initiated.</p>
        <p><strong>Last Working Day:</strong> ${new Date(exitDate).toLocaleDateString()}</p>
        <p>Please contact HR for further details regarding clearance and handover.</p>
    </div>`;
    return sendEmail(employee.email, subject, html);
};

// --- Document Notifications ---

export const notifyDocumentStatus = async (document: any, recipientEmail: string, status: string, reason?: string) => {
    // Respect client notification preference if document belongs to a client
    if (document.client && document.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${document.client.name} has notifications disabled. Skipping document status email.`);
        return { messageId: 'skipped-pref' };
    }

    const subject = `Document ${status === 'approved' ? 'Approved' : 'Rejected'}: ${document.name}`;
    const color = status === 'approved' ? '#10b981' : '#ef4444';
    const html = `
    <div style="font-family: Arial, sans-serif;">
        <h2>Document Update</h2>
        <p>Your document "<strong>${document.name}</strong>" has been <span style="color: ${color}; font-weight: bold;">${status.toUpperCase()}</span>.</p>
        ${reason ? `<div style="background-color: #fef2f2; padding: 10px; border-left: 3px solid #ef4444;"><p><strong>Reason:</strong> ${reason}</p></div>` : ''}
    </div>`;
    return sendEmail(recipientEmail, subject, html);
};

export const notifyDocumentUploaded = async (document: any, uploaderName: string, recipientEmail: string) => {
    const subject = `New Document Uploaded by ${uploaderName}`;
    const html = `
    <div style="font-family: Arial, sans-serif;">
        <h2>New Document Upload</h2>
        <p><strong>${uploaderName}</strong> has uploaded a new document.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
            <p><strong>Document:</strong> ${document.name}</p>
            <p><strong>Type:</strong> ${document.type}</p>
        </div>
        <br/>
        <a href="${process.env.FRONTEND_URL}/dashboard/documents">View Document</a>
    </div>`;
    return sendEmail(recipientEmail, subject, html);
};
