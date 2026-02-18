import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { PDFService } from './pdf.service';
import axios from 'axios';
import prisma from '../prisma/client';

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

// Helper to get company name
const getCompanyName = async (companyId?: string) => {
    if (companyId) {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        if (company?.name) return company.name;
    }

    // Fallback to finding first company (System Default)
    const defaultCompany = await prisma.company.findFirst({
        select: { name: true }
    });

    return defaultCompany?.name || process.env.COMPANY_NAME || 'Applizor Softech LLP';
};

const getBaseTemplate = (title: string, content: string, companyName: string, actionLabel?: string, actionUrl?: string) => {
    const primaryColor = '#001C30'; // Petrol Blue
    const accentColor = '#4F46E5'; // Indigo
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background-color: ${primaryColor}; padding: 40px 20px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
            .content { padding: 40px; }
            .content h2 { color: ${primaryColor}; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
            .content p { font-size: 16px; margin-bottom: 20px; color: #475569; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { background-color: ${accentColor}; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; }
            .footer { padding: 30px; text-align: center; color: #94a3b8; font-size: 12px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 5px 0; }
            .highlight-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .meta-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
            .meta-label { font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; }
            .meta-value { font-weight: 700; color: #0f172a; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1>${companyName}</h1>
                </div>
                <div class="content">
                    <h2>${title}</h2>
                    ${content}
                    ${actionLabel && actionUrl ? `
                    <div class="button-container">
                        <a href="${actionUrl}" class="button">${actionLabel}</a>
                    </div>` : ''}
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                    <p>Designed for excellence in workspace management.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

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

    const companyName = await getCompanyName(invoiceData.companyId);
    const typeLabel = invoiceData.type === 'quotation' ? 'Quotation' : 'Invoice';
    const title = isReminder ? `Payment Reminder: ${typeLabel} #${invoiceData.invoiceNumber}` : `New ${typeLabel} Received`;
    const subject = isReminder
        ? `Reminder: ${typeLabel} #${invoiceData.invoiceNumber} is due`
        : `${typeLabel} #${invoiceData.invoiceNumber} from ${companyName}`;

    const content = `
        <p>Dear ${invoiceData.client?.name || 'Valued Client'},</p>
        <p>${isReminder ? 'This is a friendly reminder that your payment is currently due.' : 'Please find your digital invoice details below for your records.'}</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">${typeLabel} No:</span> <span class="meta-value">#${invoiceData.invoiceNumber}</span></div>
            <div class="meta-item"><span class="meta-label">Total Amount:</span> <span class="meta-value">${invoiceData.currency} ${invoiceData.total.toLocaleString()}</span></div>
            <div class="meta-item"><span class="meta-label">Due Date:</span> <span class="meta-value">${new Date(invoiceData.dueDate).toLocaleDateString()}</span></div>
        </div>
        <p>Thank you for choosing ${companyName} for your business needs.</p>
    `;

    const html = getBaseTemplate(title, content, companyName, publicUrl ? `View & Pay ${typeLabel}` : undefined, publicUrl);

    const attachments = pdfBuffer ? [{
        filename: `${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer
    }] : [];

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

    const companyName = await getCompanyName(quotationData.companyId);
    const subject = `Quotation #${quotationData.quotationNumber} from ${companyName}`;
    const content = `
        <p>Dear ${quotationData.lead?.name || quotationData.client?.name || 'Valued Client'},</p>
        <p>We are pleased to present our formal quotation for your consideration. Our team has carefully mapped out the requirements to ensure the highest quality of service.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Quotation No:</span> <span class="meta-value">#${quotationData.quotationNumber}</span></div>
            <div class="meta-item"><span class="meta-label">Total Estimate:</span> <span class="meta-value">${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</span></div>
            ${quotationData.validUntil ? `<div class="meta-item"><span class="meta-label">Valid Until:</span> <span class="meta-value">${new Date(quotationData.validUntil).toLocaleDateString()}</span></div>` : ''}
        </div>
        <p>You can review the full breakdown, download the document, and accept this quotation digitally by clicking the button below.</p>
    `;

    const html = getBaseTemplate("Formal Quotation", content, companyName, "View Quotation", publicUrl);
    return sendEmail(quotationData.lead?.email || quotationData.client?.email, subject, html);
};

// Send Contract Notification to Client
export const sendContractNotification = async (contract: any, publicUrl: string) => {
    // Respect client notification preference
    if (contract.client && contract.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${contract.client.name} has notifications disabled. Skipping contract email.`);
        return { messageId: 'skipped-pref' };
    }

    const companyName = await getCompanyName(contract.companyId);
    const subject = `New Contract: ${contract.title} from ${companyName}`;
    const content = `
        <p>Hello ${contract.client.name},</p>
        <p>A new service agreement or contract titled <strong>${contract.title}</strong> is ready for your review and digital signature.</p>
        <div class="highlight-box">
            <p><strong>Document:</strong> ${contract.title}</p>
            <p><strong>Status:</strong> Pending Signature</p>
        </div>
        <p>Please review the terms and provide your digital signature using the secure link below.</p>
    `;

    const html = getBaseTemplate("Contract for Review", content, companyName, "View & Sign Contract", publicUrl);
    return sendEmail(contract.client.email, subject, html);
};

// Send Notification to Company when Client signs
export const sendContractSignedNotificationToCompany = async (contract: any) => {
    const subject = `Contract Signed: ${contract.title} by ${contract.signerName || contract.client.name}`;
    const companyName = await getCompanyName(contract.companyId);

    const content = `
        <p>Excellent news! The contract <strong>${contract.title}</strong> has been digitally signed.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Signatory:</span> <span class="meta-value">${contract.signerName || contract.client.name}</span></div>
            <div class="meta-item"><span class="meta-label">Signed At:</span> <span class="meta-value">${new Date(contract.signedAt).toLocaleString()}</span></div>
            <div class="meta-item"><span class="meta-label">IP Address:</span> <span class="meta-value">${contract.signerIp}</span></div>
        </div>
        <p>You can now view the signed contract and download the final PDF from your dashboard.</p>
    `;

    const html = getBaseTemplate("Contract Signed", content, companyName, "View Signed Contract", `${process.env.FRONTEND_URL}/dashboard/contracts/${contract.id}`);
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

    const companyName = await getCompanyName(quotationData.companyId);
    const subject = `Quotation #${quotationData.quotationNumber} - Accepted`;
    const content = `
        <p>Dear ${quotationData.clientName},</p>
        <p>Thank you for accepting our quotation. We have received your digital confirmation and our team is now ready to proceed with the next steps.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Quotation No:</span> <span class="meta-value">#${quotationData.quotationNumber}</span></div>
            <div class="meta-item"><span class="meta-label">Accepted On:</span> <span class="meta-value">${new Date(quotationData.clientAcceptedAt).toLocaleString()}</span></div>
            <div class="meta-item"><span class="meta-label">Total Amount:</span> <span class="meta-value">${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</span></div>
        </div>
        <p>It is a pleasure doing business with you.</p>
    `;

    const html = getBaseTemplate("Quotation Accepted", content, companyName);
    return sendEmail(quotationData.clientEmail, subject, html);
};

// Send Acceptance Notification to Company
export const sendQuotationAcceptanceToCompany = async (quotationData: any) => {
    const subject = `✓ Quotation #${quotationData.quotationNumber} Accepted by ${quotationData.clientName}`;
    const companyName = await getCompanyName(quotationData.companyId);

    const content = `
        <p>Excellent progress! <strong>${quotationData.clientName}</strong> has officially accepted quotation <strong>#${quotationData.quotationNumber}</strong>.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Client:</span> <span class="meta-value">${quotationData.clientName}</span></div>
            <div class="meta-item"><span class="meta-label">Total Amount:</span> <span class="meta-value">${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</span></div>
            <div class="meta-item"><span class="meta-label">Accepted On:</span> <span class="meta-value">${new Date(quotationData.clientAcceptedAt).toLocaleString()}</span></div>
            ${quotationData.clientComments ? `<p style="font-style: italic; font-size: 14px; margin-top: 10px;">"${quotationData.clientComments}"</p>` : ''}
        </div>
        <p>The signed quotation is now available in your CRM system for final processing.</p>
    `;

    const html = getBaseTemplate("Quotation Accepted!", content, companyName, "Process Quotation", `${process.env.FRONTEND_URL}/dashboard/quotations/${quotationData.id}`);
    const companyEmail = quotationData.company?.email || process.env.SMTP_USER;
    if (!companyEmail) return;

    return sendEmail(companyEmail, subject, html);
};

// Send Rejection Notification to Company
export const sendQuotationRejectionToCompany = async (quotationData: any) => {
    const subject = `✗ Quotation #${quotationData.quotationNumber} Declined by ${quotationData.clientName}`;
    const companyName = await getCompanyName(quotationData.companyId);

    const content = `
        <p>Quotation <strong>#${quotationData.quotationNumber}</strong> has been declined by the client.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Client:</span> <span class="meta-value">${quotationData.clientName}</span></div>
            <div class="meta-item"><span class="meta-label">Declined On:</span> <span class="meta-value">${new Date(quotationData.clientRejectedAt).toLocaleString()}</span></div>
            ${quotationData.clientComments ? `<p style="font-style: italic; font-size: 14px; margin-top: 10px; color: #e11d48;">Reason: "${quotationData.clientComments}"</p>` : '<p style="font-style: italic; font-size: 14px; margin-top: 10px;">No specific reason provided.</p>'}
        </div>
        <p>We recommend following up with the client to address any concerns or provide a revised estimate.</p>
    `;

    const html = getBaseTemplate("Quotation Declined", content, companyName, "View Quotation Details", `${process.env.FRONTEND_URL}/dashboard/quotations/${quotationData.id}`);
    const companyEmail = quotationData.company?.email || process.env.SMTP_USER;
    if (!companyEmail) return;

    return sendEmail(companyEmail, subject, html);
};

// Send Quotation Reminder
export const sendQuotationReminder = async (quotationData: any, publicUrl: string) => {
    // Respect client notification preference
    if (quotationData.client && quotationData.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${quotationData.clientName} has notifications disabled. Skipping reminder email.`);
        return { messageId: 'skipped-pref' };
    }

    const companyName = await getCompanyName(quotationData.companyId);
    const subject = `Reminder: Quotation #${quotationData.quotationNumber} from ${companyName}`;
    const content = `
        <p>Dear ${quotationData.lead?.name || 'Valued Client'},</p>
        <p>This is a gentle reminder regarding the proposal we sent to you on ${new Date(quotationData.quotationDate).toLocaleDateString()}.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Proposal No:</span> <span class="meta-value">#${quotationData.quotationNumber}</span></div>
            <div class="meta-item"><span class="meta-label">Estimated Total:</span> <span class="meta-value">${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</span></div>
            ${quotationData.validUntil ? `<div class="meta-item"><span class="meta-label">Expiry Date:</span> <span class="meta-value">${new Date(quotationData.validUntil).toLocaleDateString()}</span></div>` : ''}
        </div>
        <p>We are keen to partner with you. You can review the proposal details and accept digitally by clicking the button below.</p>
    `;

    const html = getBaseTemplate("Proposal Reminder", content, companyName, "View Proposal", publicUrl);
    return sendEmail(quotationData.lead?.email || quotationData.clientEmail, subject, html);
};
// --- Task Notifications ---

export const notifyTaskAssigned = async (to: string, task: any, project: any) => {
    const subject = `Task Assigned: ${task.title}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;
    const companyName = await getCompanyName(project.companyId);

    const content = `
        <p>You have been assigned to a new task in the project <strong>${project.name}</strong>.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Task Title:</span> <span class="meta-value">${task.title}</span></div>
            <div class="meta-item"><span class="meta-label">Project:</span> <span class="meta-value">${project.name}</span></div>
            ${task.priority ? `<div class="meta-item"><span class="meta-label">Priority:</span> <span class="meta-value">${task.priority}</span></div>` : ''}
            ${task.dueDate ? `<div class="meta-item"><span class="meta-label">Due Date:</span> <span class="meta-value">${new Date(task.dueDate).toLocaleDateString()}</span></div>` : ''}
        </div>
        ${task.description ? `<p style="font-size: 14px; color: #64748b;">Description: ${task.description.replace(/<[^>]*>?/g, '')}</p>` : ''}
    `;

    const html = getBaseTemplate("New Task Assignment", content, companyName, "View Task", taskUrl);
    return sendEmail(to, subject, html);
};

export const notifyTaskUpdated = async (assignee: any, task: any, project: any, changes: string[]) => {
    const subject = `[${project.name}] Update on: ${task.title}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;
    const companyName = await getCompanyName(project.companyId);

    const content = `
        <p>Hello <strong>${assignee.firstName}</strong>,</p>
        <p>There have been updates to a task you are assigned to in <strong>${project.name}</strong>.</p>
        <div class="highlight-box">
            <p><strong>Recent Changes:</strong> ${changes.join(', ')}</p>
            <div class="meta-item"><span class="meta-label">Task:</span> <span class="meta-value">${task.title}</span></div>
            <div class="meta-item"><span class="meta-label">Status:</span> <span class="meta-value">${task.status}</span></div>
        </div>
    `;

    const html = getBaseTemplate("Task Updated", content, companyName, "View Task", taskUrl);
    return sendEmail(assignee.email, subject, html);
};

export const notifyNewTask = async (to: string, task: any, project: any) => {
    const subject = `New Task Created: ${task.title}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;
    const companyName = await getCompanyName(project.companyId);

    const content = `
        <p>A new task has been added to the project <strong>${project.name}</strong>.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Title:</span> <span class="meta-value">${task.title}</span></div>
            <div class="meta-item"><span class="meta-label">Created By:</span> <span class="meta-value">${task.createdBy?.name || 'System'}</span></div>
            ${task.priority ? `<div class="meta-item"><span class="meta-label">Priority:</span> <span class="meta-value">${task.priority}</span></div>` : ''}
        </div>
        <p>Stay updated with the latest project developments on your dashboard.</p>
    `;

    const html = getBaseTemplate("Task Created", content, companyName, "View Dashboard", taskUrl);
    return sendEmail(to, subject, html);
};

export const notifyMention = async (recipient: { email: string, firstName: string }, author: string, task: any, project: any, commentContent: string) => {
    const subject = `${author} mentioned you in ${project.name}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const commentUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;
    const companyName = await getCompanyName(project.companyId);

    const content = `
        <p>Hello <strong>${recipient.firstName}</strong>,</p>
        <p><strong>${author}</strong> has mentioned you in a comment regarding the task <strong>${task.title}</strong>.</p>
        <div class="highlight-box">
            <p style="font-style: italic; color: #475569;">"${commentContent.replace(/<[^>]*>?/g, '')}"</p>
        </div>
    `;

    const html = getBaseTemplate("New Mention", content, companyName, "View Comment", commentUrl);
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
        companyId?: string; // Add optional companyId
    }
) => {
    const subject = `Interview Invitation: Round ${details.round} - ${details.type}`;
    const dateStr = new Date(details.scheduledAt).toLocaleString();
    const companyName = await getCompanyName(details.companyId);

    const content = `
        <p>Dear <strong>${details.candidateName}</strong>,</p>
        <p>We are pleased to invite you to an interview for the following position.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Interview Round:</span> <span class="meta-value">${details.round} (${details.type})</span></div>
            <div class="meta-item"><span class="meta-label">Scheduled For:</span> <span class="meta-value">${dateStr}</span></div>
            <div class="meta-item"><span class="meta-label">Interviewer:</span> <span class="meta-value">${details.interviewer}</span></div>
        </div>
        ${details.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${details.meetingLink}">${details.meetingLink}</a></p>` : ''}
        <p>Please ensure you are available 5 minutes prior to the scheduled time.</p>
    `;

    const html = getBaseTemplate("Interview Invitation", content, companyName);
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
        companyId?: string; // Added optional companyId
    },
    pdfBuffer: Buffer
) => {
    const subject = `Payslip for ${details.monthName} ${details.year}`;
    const companyName = await getCompanyName(details.companyId);

    const content = `
        <p>Dear <strong>${details.employeeName}</strong>,</p>
        <p>Your digital payslip for the month of <strong>${details.monthName} ${details.year}</strong> has been generated and is attached to this email.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Net Payable:</span> <span class="meta-value">${details.currency} ${details.netSalary.toLocaleString()}</span></div>
            <div class="meta-item"><span class="meta-label">Pay Period:</span> <span class="meta-value">${details.monthName} ${details.year}</span></div>
        </div>
        <p>Please review the attachment for a detailed breakdown of your earnings and deductions.</p>
    `;

    const html = getBaseTemplate("Payslip Generated", content, companyName);
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
    const companyName = await getCompanyName(employee.companyId);

    const content = `
        <p><strong>${employee.firstName} ${employee.lastName}</strong> has submitted a new leave request.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Leave Type:</span> <span class="meta-value">${leave.leaveType?.name || 'Leave'}</span></div>
            <div class="meta-item"><span class="meta-label">Duration:</span> <span class="meta-value">${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}</span></div>
            <div class="meta-item"><span class="meta-label">Total Days:</span> <span class="meta-value">${leave.days}</span></div>
            ${leave.reason ? `<p style="margin-top: 10px; font-style: italic;">Reason: "${leave.reason}"</p>` : ''}
        </div>
    `;

    const html = getBaseTemplate("Leave Request", content, companyName, "View Request", `${process.env.FRONTEND_URL}/dashboard/leave`);
    return sendEmail(managerEmail, subject, html);
};

export const notifyLeaveStatusUpdate = async (leave: any, employee: any) => {
    const subject = `Leave Request ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}`;
    const statusColor = leave.status === 'approved' ? '#10b981' : '#ef4444';
    const companyName = await getCompanyName(employee.companyId);

    const content = `
        <p>Dear ${employee.firstName},</p>
        <p>Your leave request has been <strong style="color: ${statusColor}; text-transform: uppercase;">${leave.status}</strong>.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Dates:</span> <span class="meta-value">${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}</span></div>
            ${leave.rejectionReason ? `<p style="margin-top: 10px; font-style: italic; color: #ef4444;">Note: "${leave.rejectionReason}"</p>` : ''}
        </div>
    `;

    const html = getBaseTemplate("Leave Update", content, companyName);
    return sendEmail(employee.email, subject, html);
};

// --- Support Notifications ---

export const notifyNewTicket = async (ticket: any, creatorName: string, supportEmail: string) => {
    const subject = `[Ticket #${ticket.id.slice(0, 8)}] New Ticket: ${ticket.subject}`;
    const companyName = await getCompanyName(ticket.companyId);

    const content = `
        <p>A new support ticket has been created by <strong>${creatorName}</strong>.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Ticket ID:</span> <span class="meta-value">#${ticket.id.slice(0, 8)}</span></div>
            <div class="meta-item"><span class="meta-label">Priority:</span> <span class="meta-value">${ticket.priority}</span></div>
            <div class="meta-item"><span class="meta-label">Subject:</span> <span class="meta-value">${ticket.subject}</span></div>
            <p style="margin-top: 15px; font-size: 14px;">${ticket.description.replace(/<[^>]*>?/g, '')}</p>
        </div>
    `;

    const html = getBaseTemplate("New Support Ticket", content, companyName, "View Ticket", `${process.env.FRONTEND_URL}/dashboard/helpdesk/${ticket.id}`);
    return sendEmail(supportEmail, subject, html);
};

export const notifyTicketReply = async (ticket: any, reply: any, recipientEmail: string) => {
    const subject = `[Ticket #${ticket.id.slice(0, 8)}] Update: ${ticket.subject}`;
    const userName = reply.user?.firstName || 'Support';
    const companyName = await getCompanyName(ticket.companyId);

    const content = `
        <p>There is a new reply on your ticket <strong>#${ticket.id.slice(0, 8)}</strong> from <strong>${userName}</strong>.</p>
        <div class="highlight-box" style="border-left: 4px solid #001C30;">
            <p style="margin: 0;">${reply.message.replace(/<[^>]*>?/g, '')}</p>
        </div>
    `;

    const html = getBaseTemplate("Ticket Reply", content, companyName, "View Ticket", `${process.env.FRONTEND_URL}/dashboard/helpdesk/${ticket.id}`);
    return sendEmail(recipientEmail, subject, html);
};

// --- CRM & Asset Notifications ---

export const notifyLeadAssigned = async (lead: any, assignee: any) => {
    const subject = `New Lead Assigned: ${lead.name}`;
    const companyName = await getCompanyName(lead.companyId);

    const content = `
        <p>Hello ${assignee.firstName},</p>
        <p>A new lead has been assigned to you for follow-up.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Lead Name:</span> <span class="meta-value">${lead.name}</span></div>
            <div class="meta-item"><span class="meta-label">Company:</span> <span class="meta-value">${lead.company || 'N/A'}</span></div>
            <div class="meta-item"><span class="meta-label">Contact:</span> <span class="meta-value">${lead.email || lead.phone || 'N/A'}</span></div>
        </div>
    `;

    const html = getBaseTemplate("New Lead Assignment", content, companyName, "View Lead", `${process.env.FRONTEND_URL}/dashboard/crm/leads/${lead.id}`);
    return sendEmail(assignee.email, subject, html);
};

export const notifyAssetAssigned = async (asset: any, employee: any) => {
    const subject = `Asset Assigned: ${asset.name}`;
    const companyName = await getCompanyName(asset.companyId);

    const content = `
        <p>Dear ${employee.firstName},</p>
        <p>The following corporate asset has been assigned to your profile. Please ensure proper care and adherence to company asset policies.</p>
        <div class="highlight-box" style="background-color: #f0fdf4; border: 1px solid #bbf7d0;">
            <div class="meta-item"><span class="meta-label">Asset:</span> <span class="meta-value">${asset.name}</span></div>
            <div class="meta-item"><span class="meta-label">Serial No:</span> <span class="meta-value">${asset.serialNumber || 'N/A'}</span></div>
            <div class="meta-item"><span class="meta-label">Date Assigned:</span> <span class="meta-value">${new Date().toLocaleDateString()}</span></div>
        </div>
    `;

    const html = getBaseTemplate("Asset Assignment", content, companyName);
    return sendEmail(employee.email, subject, html);
};

// --- Performance & HR Notifications ---

export const notifyPerformanceReview = async (review: any, employee: any) => {
    const subject = `Performance Review Completed`;
    const companyName = await getCompanyName(review.companyId || employee.companyId);

    const content = `
        <p>Dear ${employee.firstName},</p>
        <p>Your latest performance review has been finalized and published.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Final Rating:</span> <span class="meta-value">${review.rating} / 5</span></div>
            <div class="meta-item"><span class="meta-label">Review Date:</span> <span class="meta-value">${new Date().toLocaleDateString()}</span></div>
        </div>
        <p>You can view the detailed feedback and manager's notes on your performance dashboard.</p>
    `;

    const html = getBaseTemplate("Performance Review", content, companyName, "View Review", `${process.env.FRONTEND_URL}/dashboard/performance`);
    return sendEmail(employee.email, subject, html);
};

export const notifyExitInitiated = async (employee: any, exitDate: Date) => {
    const subject = `Exit Process Initiated`;
    const companyName = await getCompanyName(employee.companyId);

    const content = `
        <p>Dear ${employee.firstName},</p>
        <p>The formal exit process has been initiated for your profile in the system.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Last Working Day:</span> <span class="meta-value">${new Date(exitDate).toLocaleDateString()}</span></div>
        </div>
        <p>Please contact HR for clearance procedures and handover documentation.</p>
    `;

    const html = getBaseTemplate("Exit Process Update", content, companyName);
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
    const companyName = await getCompanyName(document.companyId);
    const statusColor = status === 'approved' ? '#10b981' : '#ef4444';

    const content = `
        <p>Your document "<strong>${document.name}</strong>" has been <strong>${status.toUpperCase()}</strong>.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Status:</span> <span class="meta-value" style="color: ${statusColor};">${status.toUpperCase()}</span></div>
            ${reason ? `<div class="meta-item" style="border: none;"><span class="meta-label">Reason:</span> <span class="meta-value">${reason}</span></div>` : ''}
        </div>
    `;

    const html = getBaseTemplate("Document Status Update", content, companyName, "View Documents", `${process.env.FRONTEND_URL}/dashboard/documents`);
    return sendEmail(recipientEmail, subject, html);
};

export const notifyDocumentUploaded = async (document: any, uploaderName: string, recipientEmail: string) => {
    const subject = `New Document Uploaded by ${uploaderName}`;
    const companyName = await getCompanyName(document.companyId);

    const content = `
        <p><strong>${uploaderName}</strong> has uploaded a new document for your review.</p>
        <div class="highlight-box">
            <div class="meta-item"><span class="meta-label">Document:</span> <span class="meta-value">${document.name}</span></div>
            <div class="meta-item"><span class="meta-label">Type:</span> <span class="meta-value">${document.type}</span></div>
            <div class="meta-item"><span class="meta-label">Uploaded On:</span> <span class="meta-value">${new Date().toLocaleDateString()}</span></div>
        </div>
    `;

    const html = getBaseTemplate("New Document Upload", content, companyName, "View Documents", `${process.env.FRONTEND_URL}/dashboard/documents`);
    return sendEmail(recipientEmail, subject, html);
};
