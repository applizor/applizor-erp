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
        if (error.response?.data?.error === 'invalid_grant') {
            console.error('💡 TIP: The refresh token might be expired or invalid for this Redirect URI. Please re-authorize.');
        }
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

// ─── SHARED STYLES ──────────────────────────────────────────────────────────
const EMAIL_SHARED_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #EEF2F7; color: #1e293b; -webkit-font-smoothing: antialiased; }
    .email-wrapper { background-color: #EEF2F7; padding: 32px 16px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    /* TOPBAR */
    .topbar { background-color: #001C30; padding: 14px 32px; display: flex; align-items: center; justify-content: space-between; }
    .topbar-brand { font-size: 11px; font-weight: 900; color: rgba(255,255,255,0.5); letter-spacing: 0.2em; text-transform: uppercase; }
    .topbar-name { font-size: 13px; font-weight: 800; color: #ffffff; letter-spacing: 0.05em; }
    /* HERO */
    .hero { padding: 36px 32px 28px; position: relative; overflow: hidden; }
    .hero-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 22px; }
    .hero-label { font-size: 9px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 6px; opacity: 0.65; }
    .hero-title { font-size: 22px; font-weight: 900; line-height: 1.2; letter-spacing: -0.02em; }
    .hero-sub { font-size: 13px; font-weight: 500; margin-top: 6px; opacity: 0.75; }
    /* BODY */
    .email-body { padding: 0 32px 28px; }
    .greeting { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px; }
    /* DATA CARD */
    .data-card { border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0; margin: 0 0 20px; }
    .data-card-header { padding: 10px 16px; font-size: 9px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; }
    .data-row { display: flex; align-items: center; padding: 10px 16px; border-bottom: 1px solid #F1F5F9; }
    .data-row:last-child { border-bottom: none; }
    .data-key { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; width: 130px; flex-shrink: 0; }
    .data-val { font-size: 13px; font-weight: 600; color: #1E293B; flex: 1; }
    /* QUOTE BLOCK */
    .quote-block { border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 14px; line-height: 1.7; font-style: italic; }
    /* AMOUNT BLOCK */
    .amount-block { border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px; }
    .amount-label { font-size: 9px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 4px; }
    .amount-value { font-size: 32px; font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
    .amount-currency { font-size: 16px; font-weight: 700; vertical-align: super; margin-right: 2px; }
    /* CTA BUTTON */
    .cta-wrap { text-align: center; padding: 4px 0 8px; }
    .cta-btn { display: inline-block; padding: 13px 32px; border-radius: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; color: #ffffff !important; }
    /* BADGES */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
    .badge-todo { background-color: #F1F5F9; color: #475569; }
    .badge-in-progress, .badge-doing { background-color: #E0F2FE; color: #0369A1; }
    .badge-done, .badge-completed { background-color: #DCFCE7; color: #15803D; }
    .badge-high { background-color: #FEE2E2; color: #B91C1C; }
    .badge-medium { background-color: #FEF3C7; color: #92400E; }
    .badge-low { background-color: #F0FDF4; color: #15803D; }
    .badge-review { background-color: #F5F3FF; color: #7C3AED; }
    .badge-approved { background-color: #DCFCE7; color: #15803D; }
    .badge-rejected, .badge-declined { background-color: #FEE2E2; color: #B91C1C; }
    .badge-pending { background-color: #FEF3C7; color: #92400E; }
    /* STATUS PILL (large) */
    .status-pill { display: inline-block; padding: 6px 18px; border-radius: 50px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
    /* DIVIDER */
    .divider { height: 1px; background-color: #F1F5F9; margin: 20px 0; }
    /* FOOTER */
    .email-footer { background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; }
    .footer-brand { font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px; }
    .footer-text { font-size: 11px; color: #CBD5E1; line-height: 1.6; }
    .footer-link { color: #94A3B8; text-decoration: none; }
`;

// ─── THEME CONFIGS ───────────────────────────────────────────────────────────
type EmailTheme = {
    heroBg: string;
    heroText: string;
    heroLabel: string;
    iconBg: string;
    icon: string;
    cardHeaderBg: string;
    cardHeaderText: string;
    ctaBg: string;
    accentBorder: string;
};

const THEMES: Record<string, EmailTheme> = {
    task:       { heroBg: 'linear-gradient(135deg, #001C30 0%, #003A5C 100%)', heroText: '#ffffff', heroLabel: '#7DD3FC', iconBg: 'rgba(125,211,252,0.15)', icon: '✔', cardHeaderBg: '#F0F9FF', cardHeaderText: '#0369A1', ctaBg: '#0284C7', accentBorder: '#38BDF8' },
    reminder:   { heroBg: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 100%)', heroText: '#ffffff', heroLabel: '#FED7AA', iconBg: 'rgba(254,215,170,0.2)', icon: '⏰', cardHeaderBg: '#FFF7ED', cardHeaderText: '#9A3412', ctaBg: '#EA580C', accentBorder: '#FB923C' },
    mention:    { heroBg: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)', heroText: '#ffffff', heroLabel: '#DDD6FE', iconBg: 'rgba(221,214,254,0.2)', icon: '@', cardHeaderBg: '#F5F3FF', cardHeaderText: '#6D28D9', ctaBg: '#7C3AED', accentBorder: '#A78BFA' },
    invoice:    { heroBg: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)', heroText: '#ffffff', heroLabel: '#6EE7B7', iconBg: 'rgba(110,231,183,0.15)', icon: '₹', cardHeaderBg: '#ECFDF5', cardHeaderText: '#065F46', ctaBg: '#059669', accentBorder: '#34D399' },
    quotation:  { heroBg: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)', heroText: '#ffffff', heroLabel: '#BFDBFE', iconBg: 'rgba(191,219,254,0.15)', icon: '📋', cardHeaderBg: '#EFF6FF', cardHeaderText: '#1E40AF', ctaBg: '#2563EB', accentBorder: '#60A5FA' },
    contract:   { heroBg: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)', heroText: '#ffffff', heroLabel: '#E7E5E4', iconBg: 'rgba(231,229,228,0.15)', icon: '📝', cardHeaderBg: '#FAFAF9', cardHeaderText: '#292524', ctaBg: '#44403C', accentBorder: '#A8A29E' },
    leave:      { heroBg: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', heroText: '#ffffff', heroLabel: '#BAE6FD', iconBg: 'rgba(186,230,253,0.15)', icon: '🌴', cardHeaderBg: '#F0F9FF', cardHeaderText: '#0C4A6E', ctaBg: '#0369A1', accentBorder: '#38BDF8' },
    hr:         { heroBg: 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)', heroText: '#ffffff', heroLabel: '#C7D2FE', iconBg: 'rgba(199,210,254,0.15)', icon: '👤', cardHeaderBg: '#EEF2FF', cardHeaderText: '#3730A3', ctaBg: '#4F46E5', accentBorder: '#818CF8' },
    payslip:    { heroBg: 'linear-gradient(135deg, #14532D 0%, #166534 100%)', heroText: '#ffffff', heroLabel: '#BBF7D0', iconBg: 'rgba(187,247,208,0.15)', icon: '💰', cardHeaderBg: '#F0FDF4', cardHeaderText: '#14532D', ctaBg: '#16A34A', accentBorder: '#4ADE80' },
    support:    { heroBg: 'linear-gradient(135deg, #7E1D1D 0%, #991B1B 100%)', heroText: '#ffffff', heroLabel: '#FCA5A5', iconBg: 'rgba(252,165,165,0.15)', icon: '🎫', cardHeaderBg: '#FEF2F2', cardHeaderText: '#991B1B', ctaBg: '#DC2626', accentBorder: '#F87171' },
    crm:        { heroBg: 'linear-gradient(135deg, #1A3A1F 0%, #166534 100%)', heroText: '#ffffff', heroLabel: '#BBF7D0', iconBg: 'rgba(187,247,208,0.15)', icon: '🎯', cardHeaderBg: '#F0FDF4', cardHeaderText: '#15803D', ctaBg: '#16A34A', accentBorder: '#4ADE80' },
    asset:      { heroBg: 'linear-gradient(135deg, #1c1c42 0%, #2d2d6e 100%)', heroText: '#ffffff', heroLabel: '#C4B5FD', iconBg: 'rgba(196,181,253,0.15)', icon: '🖥', cardHeaderBg: '#F5F3FF', cardHeaderText: '#5B21B6', ctaBg: '#7C3AED', accentBorder: '#A78BFA' },
    document:   { heroBg: 'linear-gradient(135deg, #0F2B44 0%, #164E63 100%)', heroText: '#ffffff', heroLabel: '#A5F3FC', iconBg: 'rgba(165,243,252,0.15)', icon: '📄', cardHeaderBg: '#ECFEFF', cardHeaderText: '#155E75', ctaBg: '#0891B2', accentBorder: '#22D3EE' },
    interview:  { heroBg: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)', heroText: '#ffffff', heroLabel: '#D1D5DB', iconBg: 'rgba(209,213,219,0.15)', icon: '🤝', cardHeaderBg: '#F9FAFB', cardHeaderText: '#374151', ctaBg: '#374151', accentBorder: '#9CA3AF' },
    performance:{ heroBg: 'linear-gradient(135deg, #3B0F0F 0%, #7F1D1D 100%)', heroText: '#ffffff', heroLabel: '#FECACA', iconBg: 'rgba(254,202,202,0.15)', icon: '⭐', cardHeaderBg: '#FEF2F2', cardHeaderText: '#991B1B', ctaBg: '#B91C1C', accentBorder: '#F87171' },
    exit:       { heroBg: 'linear-gradient(135deg, #27272A 0%, #3F3F46 100%)', heroText: '#ffffff', heroLabel: '#D4D4D8', iconBg: 'rgba(212,212,216,0.15)', icon: '👋', cardHeaderBg: '#FAFAFA', cardHeaderText: '#3F3F46', ctaBg: '#52525B', accentBorder: '#A1A1AA' },
    default:    { heroBg: 'linear-gradient(135deg, #001C30 0%, #002D4D 100%)', heroText: '#ffffff', heroLabel: '#94A3B8', iconBg: 'rgba(148,163,184,0.15)', icon: '✉', cardHeaderBg: '#F8FAFC', cardHeaderText: '#475569', ctaBg: '#475569', accentBorder: '#94A3B8' },
};

// ─── PREMIUM BASE TEMPLATE ───────────────────────────────────────────────────
const getBaseTemplate = (
    title: string,
    content: string,
    companyName: string,
    actionLabel?: string,
    actionUrl?: string,
    opts?: { themeKey?: string; heroLabel?: string; heroSub?: string }
) => {
    const themeKey = opts?.themeKey || 'default';
    const t = THEMES[themeKey] || THEMES['default'];
    const heroLabel = opts?.heroLabel || 'Notification';
    const heroSub = opts?.heroSub || '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title} — ${companyName}</title>
  <style>${EMAIL_SHARED_STYLES}</style>
</head>
<body>
<div class="email-wrapper">
  <div class="email-container">

    <!-- TOPBAR -->
    <div class="topbar">
      <span class="topbar-brand">Applizor ERP</span>
      <span class="topbar-name">${companyName}</span>
    </div>

    <!-- HERO -->
    <div class="hero" style="background: ${t.heroBg};">
      <div class="hero-icon" style="background: ${t.iconBg};">
        <span style="font-size:20px;">${t.icon}</span>
      </div>
      <div class="hero-label" style="color: ${t.heroLabel};">${heroLabel}</div>
      <div class="hero-title" style="color: ${t.heroText};">${title}</div>
      ${heroSub ? `<div class="hero-sub" style="color: ${t.heroText};">${heroSub}</div>` : ''}
    </div>

    <!-- BODY -->
    <div class="email-body">
      ${content}
      ${actionLabel && actionUrl ? `
      <div class="cta-wrap" style="margin-top: 24px;">
        <a href="${actionUrl}" class="cta-btn" style="background: ${t.ctaBg};">${actionLabel} &rarr;</a>
      </div>` : ''}
    </div>

    <!-- FOOTER -->
    <div class="email-footer">
      <div class="footer-brand">${companyName}</div>
      <div class="footer-text">
        &copy; ${new Date().getFullYear()} ${companyName}. Powered by <strong>Applizor ERP</strong>.<br>
        This is an automated notification — please do not reply to this email.
      </div>
    </div>

  </div>
</div>
</body>
</html>`;
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

    } catch (error: any) {
        console.error('❌ Error sending email:', error.response?.data || error.message);
        if (error.stack) console.error(error.stack);

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
    const title = isReminder ? 'Payment Reminder' : `${typeLabel} Received`;
    const subject = isReminder
        ? `Reminder: ${typeLabel} #${invoiceData.invoiceNumber} is due — ${companyName}`
        : `${typeLabel} #${invoiceData.invoiceNumber} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${invoiceData.client?.name || 'Valued Client'}</strong>,</p>
          <p class="greeting">${isReminder ? 'This is a friendly payment reminder. The following invoice is currently due. Please arrange payment at your earliest convenience.' : 'We are sharing your invoice details below. A PDF copy is attached for your records.'}</p>
        </div>
        <div class="amount-block" style="background: ${isReminder ? '#FFF7ED' : '#ECFDF5'}; border: 1px solid ${isReminder ? '#FED7AA' : '#A7F3D0'};">
          <div class="amount-label" style="color: ${isReminder ? '#9A3412' : '#065F46'};">Amount ${isReminder ? 'Due' : 'Total'}</div>
          <div class="amount-value" style="color: ${isReminder ? '#7C2D12' : '#064E3B'};">
            <span class="amount-currency">${invoiceData.currency}</span>${Number(invoiceData.total).toLocaleString()}
          </div>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: ${isReminder ? '#FFF7ED' : '#ECFDF5'}; color: ${isReminder ? '#9A3412' : '#065F46'};">${typeLabel} Details</div>
          <div class="data-row"><span class="data-key">${typeLabel} No.</span><span class="data-val">#${invoiceData.invoiceNumber}</span></div>
          <div class="data-row"><span class="data-key">Due Date</span><span class="data-val" style="color: ${isReminder ? '#DC2626' : 'inherit'}; font-weight: ${isReminder ? '800' : '600'};">${new Date(invoiceData.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          ${invoiceData.description ? `<div class="data-row"><span class="data-key">Description</span><span class="data-val">${invoiceData.description}</span></div>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748B; margin-top: 8px;">Thank you for choosing <strong>${companyName}</strong>. We value your business.</p>
    `;

    const html = getBaseTemplate(title, content, companyName, publicUrl ? `View & Pay ${typeLabel}` : undefined, publicUrl, {
        themeKey: isReminder ? 'reminder' : 'invoice',
        heroLabel: isReminder ? 'Payment Reminder' : 'Finance',
        heroSub: `${typeLabel} #${invoiceData.invoiceNumber}`
    });

    const attachments = pdfBuffer ? [{
        filename: `${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer
    }] : [];

    const from = process.env.EMAIL_ACCOUNTS;
    return sendEmail(to, subject, html, attachments, from);
};

// Send Quotation Email to Client
export const sendQuotationToClient = async (quotationData: any, publicUrl: string) => {
    if (quotationData.client && quotationData.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${quotationData.client.name} has notifications disabled. Skipping quotation email.`);
        return { messageId: 'skipped-pref' };
    }

    const companyName = await getCompanyName(quotationData.companyId);
    const clientName = quotationData.lead?.name || quotationData.client?.name || 'Valued Client';
    const subject = `Quotation #${quotationData.quotationNumber} from ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${clientName}</strong>,</p>
          <p class="greeting">We are pleased to present our formal quotation. Our team has carefully mapped out your requirements to ensure the highest quality of service. Please review the details below.</p>
        </div>
        <div class="amount-block" style="background: #EFF6FF; border: 1px solid #BFDBFE;">
          <div class="amount-label" style="color: #1E40AF;">Total Estimate</div>
          <div class="amount-value" style="color: #1E3A5F;">
            <span class="amount-currency">${quotationData.currency}</span>${Number(quotationData.total).toLocaleString()}
          </div>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #EFF6FF; color: #1E40AF;">Quotation Summary</div>
          <div class="data-row"><span class="data-key">Quotation No.</span><span class="data-val">#${quotationData.quotationNumber}</span></div>
          <div class="data-row"><span class="data-key">Prepared For</span><span class="data-val">${clientName}</span></div>
          <div class="data-row"><span class="data-key">Prepared By</span><span class="data-val">${companyName}</span></div>
          ${quotationData.validUntil ? `<div class="data-row"><span class="data-key">Valid Until</span><span class="data-val">${new Date(quotationData.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748B;">You can review the full breakdown and accept this quotation digitally using the button below.</p>
    `;

    const html = getBaseTemplate('Formal Quotation', content, companyName, 'Review & Accept Quotation', publicUrl, {
        themeKey: 'quotation',
        heroLabel: 'Proposal',
        heroSub: `Quotation #${quotationData.quotationNumber}`
    });
    return sendEmail(quotationData.lead?.email || quotationData.client?.email, subject, html);
};

// Send Contract Notification to Client
export const sendContractNotification = async (contract: any, publicUrl: string) => {
    if (contract.client && contract.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${contract.client.name} has notifications disabled. Skipping contract email.`);
        return { messageId: 'skipped-pref' };
    }

    const companyName = await getCompanyName(contract.companyId);
    const subject = `Action Required: Contract for Review — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Hello <strong>${contract.client.name}</strong>,</p>
          <p class="greeting">A formal service agreement has been prepared for you. Please review the terms carefully and provide your digital signature at your earliest convenience.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FAFAF9; color: #292524;">Contract Details</div>
          <div class="data-row"><span class="data-key">Document Title</span><span class="data-val">${contract.title}</span></div>
          <div class="data-row"><span class="data-key">Prepared By</span><span class="data-val">${companyName}</span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-pending">Awaiting Signature</span></span></div>
          <div class="data-row"><span class="data-key">Date Issued</span><span class="data-val">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
        </div>
        <p style="font-size: 13px; color: #64748B;">Use the secure link below to read the full document and apply your digital signature. No downloads required.</p>
    `;

    const html = getBaseTemplate('Contract for Review & Signature', content, companyName, 'View & Sign Contract', publicUrl, {
        themeKey: 'contract',
        heroLabel: 'Legal Document',
        heroSub: contract.title
    });
    return sendEmail(contract.client.email, subject, html);
};

// Send Notification to Company when Client signs
export const sendContractSignedNotificationToCompany = async (contract: any) => {
    const companyName = await getCompanyName(contract.companyId);
    const subject = `✅ Contract Signed: ${contract.title} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Great news! The contract <strong>${contract.title}</strong> has been digitally signed by the client. All records have been captured and the signed document is available in your dashboard.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FAFAF9; color: #292524;">Signing Details</div>
          <div class="data-row"><span class="data-key">Document</span><span class="data-val">${contract.title}</span></div>
          <div class="data-row"><span class="data-key">Signed By</span><span class="data-val">${contract.signerName || contract.client.name}</span></div>
          <div class="data-row"><span class="data-key">Signed At</span><span class="data-val">${new Date(contract.signedAt).toLocaleString('en-IN')}</span></div>
          <div class="data-row"><span class="data-key">IP Address</span><span class="data-val" style="font-family: monospace; font-size: 12px;">${contract.signerIp}</span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-approved">Signed</span></span></div>
        </div>
        <p style="font-size: 13px; color: #64748B;">You can now download the final signed PDF from your contracts dashboard.</p>
    `;

    const html = getBaseTemplate('Contract Signed', content, companyName, 'View Signed Contract', `${process.env.FRONTEND_URL}/dashboard/contracts/${contract.id}`, {
        themeKey: 'contract',
        heroLabel: 'Contract Update',
        heroSub: contract.title
    });
    const companyEmail = contract.company?.email || process.env.SMTP_USER;
    if (!companyEmail) return;

    return sendEmail(companyEmail, subject, html);
};

// Send Acceptance Confirmation to Client
export const sendQuotationAcceptanceToClient = async (quotationData: any) => {
    if (quotationData.client && quotationData.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${quotationData.clientName} has notifications disabled. Skipping acceptance email.`);
        return { messageId: 'skipped-pref' };
    }

    const companyName = await getCompanyName(quotationData.companyId);
    const subject = `Quotation Accepted — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${quotationData.clientName}</strong>,</p>
          <p class="greeting">Thank you for accepting our quotation. We have received your digital confirmation and our team will reach out shortly to discuss the next steps.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #ECFDF5; color: #065F46;">Acceptance Summary</div>
          <div class="data-row"><span class="data-key">Quotation No.</span><span class="data-val">#${quotationData.quotationNumber}</span></div>
          <div class="data-row"><span class="data-key">Accepted On</span><span class="data-val">${new Date(quotationData.clientAcceptedAt).toLocaleString('en-IN')}</span></div>
          <div class="data-row"><span class="data-key">Total Amount</span><span class="data-val" style="font-weight: 800; color: #065F46;">${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-approved">Accepted</span></span></div>
        </div>
        <p style="font-size: 13px; color: #64748B;">It is a pleasure doing business with you. Our team will be in touch very soon.</p>
    `;

    const html = getBaseTemplate('Quotation Accepted', content, companyName, undefined, undefined, {
        themeKey: 'quotation',
        heroLabel: 'Confirmation',
        heroSub: `Quotation #${quotationData.quotationNumber}`
    });
    return sendEmail(quotationData.clientEmail, subject, html);
};

// Send Acceptance Notification to Company
export const sendQuotationAcceptanceToCompany = async (quotationData: any) => {
    const companyName = await getCompanyName(quotationData.companyId);
    const subject = `🎉 Quotation Accepted by ${quotationData.clientName} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting"><strong>${quotationData.clientName}</strong> has officially accepted quotation <strong>#${quotationData.quotationNumber}</strong>. Time to get started!</p>
        </div>
        <div class="amount-block" style="background: #EFF6FF; border: 1px solid #BFDBFE;">
          <div class="amount-label" style="color: #1E40AF;">Deal Value</div>
          <div class="amount-value" style="color: #1E3A5F;"><span class="amount-currency">${quotationData.currency}</span>${Number(quotationData.total).toLocaleString()}</div>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #EFF6FF; color: #1E40AF;">Deal Details</div>
          <div class="data-row"><span class="data-key">Client</span><span class="data-val">${quotationData.clientName}</span></div>
          <div class="data-row"><span class="data-key">Quotation No.</span><span class="data-val">#${quotationData.quotationNumber}</span></div>
          <div class="data-row"><span class="data-key">Accepted On</span><span class="data-val">${new Date(quotationData.clientAcceptedAt).toLocaleString('en-IN')}</span></div>
          ${quotationData.clientComments ? `<div class="data-row"><span class="data-key">Client Note</span><span class="data-val" style="font-style: italic;">"${quotationData.clientComments}"</span></div>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748B;">The accepted quotation is now available in your CRM for final processing and invoice generation.</p>
    `;

    const html = getBaseTemplate('Quotation Accepted!', content, companyName, 'Process Quotation', `${process.env.FRONTEND_URL}/dashboard/quotations/${quotationData.id}`, {
        themeKey: 'quotation',
        heroLabel: 'Sales Win 🎉',
        heroSub: `${quotationData.clientName} accepted the proposal`
    });
    const companyEmail = quotationData.company?.email || process.env.SMTP_USER;
    if (!companyEmail) return;

    return sendEmail(companyEmail, subject, html);
};

// Send Rejection Notification to Company
export const sendQuotationRejectionToCompany = async (quotationData: any) => {
    const companyName = await getCompanyName(quotationData.companyId);
    const subject = `Quotation Declined by ${quotationData.clientName} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Quotation <strong>#${quotationData.quotationNumber}</strong> has been declined by <strong>${quotationData.clientName}</strong>. We recommend following up to understand their concerns.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FEF2F2; color: #991B1B;">Rejection Details</div>
          <div class="data-row"><span class="data-key">Client</span><span class="data-val">${quotationData.clientName}</span></div>
          <div class="data-row"><span class="data-key">Quotation No.</span><span class="data-val">#${quotationData.quotationNumber}</span></div>
          <div class="data-row"><span class="data-key">Declined On</span><span class="data-val">${new Date(quotationData.clientRejectedAt).toLocaleString('en-IN')}</span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-rejected">Declined</span></span></div>
          ${quotationData.clientComments ? `<div class="data-row"><span class="data-key">Reason</span><span class="data-val" style="font-style: italic; color: #DC2626;">"${quotationData.clientComments}"</span></div>` : `<div class="data-row"><span class="data-key">Reason</span><span class="data-val" style="color: #94A3B8; font-style: italic;">No reason provided</span></div>`}
        </div>
        <p style="font-size: 13px; color: #64748B;">Consider revising the quote or scheduling a follow-up call to address their concerns.</p>
    `;

    const html = getBaseTemplate('Quotation Declined', content, companyName, 'View Quotation', `${process.env.FRONTEND_URL}/dashboard/quotations/${quotationData.id}`, {
        themeKey: 'support',
        heroLabel: 'Sales Update',
        heroSub: `Declined by ${quotationData.clientName}`
    });
    const companyEmail = quotationData.company?.email || process.env.SMTP_USER;
    if (!companyEmail) return;

    return sendEmail(companyEmail, subject, html);
};

// Send Quotation Reminder
export const sendQuotationReminder = async (quotationData: any, publicUrl: string) => {
    if (quotationData.client && quotationData.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${quotationData.clientName} has notifications disabled. Skipping reminder email.`);
        return { messageId: 'skipped-pref' };
    }

    const companyName = await getCompanyName(quotationData.companyId);
    const clientName = quotationData.lead?.name || 'Valued Client';
    const subject = `Friendly Reminder: Quotation #${quotationData.quotationNumber} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${clientName}</strong>,</p>
          <p class="greeting">This is a gentle reminder about the proposal we sent on <strong>${new Date(quotationData.quotationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>. We would love to hear your thoughts and move forward together.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FFF7ED; color: #9A3412;">Proposal Details</div>
          <div class="data-row"><span class="data-key">Proposal No.</span><span class="data-val">#${quotationData.quotationNumber}</span></div>
          <div class="data-row"><span class="data-key">Total Value</span><span class="data-val" style="font-weight: 800;">${quotationData.currency} ${Number(quotationData.total).toLocaleString()}</span></div>
          ${quotationData.validUntil ? `<div class="data-row"><span class="data-key">Expires On</span><span class="data-val" style="color: #DC2626; font-weight: 700;">${new Date(quotationData.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748B;">We are keen to partner with you. You can review and accept the proposal using the button below.</p>
    `;

    const html = getBaseTemplate('Proposal Reminder', content, companyName, 'View Proposal', publicUrl, {
        themeKey: 'reminder',
        heroLabel: 'Follow-up',
        heroSub: `Quotation #${quotationData.quotationNumber} is awaiting your response`
    });
    return sendEmail(quotationData.lead?.email || quotationData.clientEmail, subject, html);
};
// --- Task Notifications ---

export const notifyTaskAssigned = async (to: string, task: any, project: any) => {
    const companyName = await getCompanyName(project.companyId);
    const subject = `You've been assigned: ${task.title} — ${companyName}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">You have been assigned to a new task in <strong>${project.name}</strong>. Please review the details and start working on it at your earliest convenience.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #EFF6FF; color: #1E40AF;">Task Details</div>
          <div class="data-row"><span class="data-key">Task Title</span><span class="data-val">${task.title}</span></div>
          <div class="data-row"><span class="data-key">Project</span><span class="data-val">${project.name}</span></div>
          <div class="data-row"><span class="data-key">Priority</span><span class="data-val"><span class="badge badge-${(task.priority || 'medium').toLowerCase()}">${task.priority || 'Medium'}</span></span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-pending">${task.status || 'To Do'}</span></span></div>
          ${task.dueDate ? `<div class="data-row"><span class="data-key">Due Date</span><span class="data-val" style="color: #DC2626; font-weight: 700;">${new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
        </div>
        ${task.description ? `<div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-top: 12px; font-size: 13px; color: #475569; line-height: 1.6;">${task.description.replace(/<[^>]*>?/g, '')}</div>` : ''}
    `;

    const html = getBaseTemplate('New Task Assignment', content, companyName, 'View Task', taskUrl, {
        themeKey: 'task',
        heroLabel: 'Task Assigned',
        heroSub: project.name
    });
    return sendEmail(to, subject, html);
};

export const notifyTaskUpdated = async (assignee: any, task: any, project: any, changes: string[]) => {
    const companyName = await getCompanyName(project.companyId);
    const subject = `Task Updated: ${task.title} — ${companyName}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Hello <strong>${assignee.firstName}</strong>, there have been updates to a task you are assigned to in <strong>${project.name}</strong>.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #EFF6FF; color: #1E40AF;">Update Summary</div>
          <div class="data-row"><span class="data-key">Task</span><span class="data-val">${task.title}</span></div>
          <div class="data-row"><span class="data-key">Project</span><span class="data-val">${project.name}</span></div>
          <div class="data-row"><span class="data-key">Current Status</span><span class="data-val"><span class="badge badge-pending">${task.status}</span></span></div>
          <div class="data-row"><span class="data-key">What Changed</span><span class="data-val" style="color: #1E40AF;">${changes.join(', ')}</span></div>
        </div>
    `;

    const html = getBaseTemplate('Task Updated', content, companyName, 'View Task', taskUrl, {
        themeKey: 'task',
        heroLabel: 'Task Update',
        heroSub: project.name
    });
    return sendEmail(assignee.email, subject, html);
};

export const notifyNewTask = async (to: string, task: any, project: any) => {
    const companyName = await getCompanyName(project.companyId);
    const subject = `New Task: ${task.title} — ${companyName}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">A new task has been added to <strong>${project.name}</strong>.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #EFF6FF; color: #1E40AF;">Task Details</div>
          <div class="data-row"><span class="data-key">Title</span><span class="data-val">${task.title}</span></div>
          <div class="data-row"><span class="data-key">Created By</span><span class="data-val">${task.createdBy?.name || 'System'}</span></div>
          <div class="data-row"><span class="data-key">Priority</span><span class="data-val"><span class="badge badge-${(task.priority || 'medium').toLowerCase()}">${task.priority || 'Medium'}</span></span></div>
          ${task.dueDate ? `<div class="data-row"><span class="data-key">Due Date</span><span class="data-val">${new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
        </div>
    `;

    const html = getBaseTemplate('New Task Created', content, companyName, 'View Task', taskUrl, {
        themeKey: 'task',
        heroLabel: 'New Task',
        heroSub: project.name
    });
    return sendEmail(to, subject, html);
};

export const notifyMention = async (recipient: { email: string, firstName: string }, author: string, task: any, project: any, commentContent: string) => {
    const companyName = await getCompanyName(project.companyId);
    const subject = `${author} mentioned you in ${project.name} — ${companyName}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const commentUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Hello <strong>${recipient.firstName}</strong>, you were mentioned in a comment by <strong>${author}</strong> on task <strong>${task.title}</strong>.</p>
        </div>
        <div style="background: #F5F3FF; border-left: 4px solid #7C3AED; border-radius: 0 8px 8px 0; padding: 16px 18px; margin: 16px 0;">
          <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #7C3AED; margin: 0 0 8px 0;">Comment</p>
          <p style="font-style: italic; color: #1E293B; margin: 0; font-size: 13px; line-height: 1.7;">"${commentContent.replace(/<[^>]*>?/g, '')}"</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #F5F3FF; color: #6D28D9;">Context</div>
          <div class="data-row"><span class="data-key">Task</span><span class="data-val">${task.title}</span></div>
          <div class="data-row"><span class="data-key">Project</span><span class="data-val">${project.name}</span></div>
          <div class="data-row"><span class="data-key">Mentioned By</span><span class="data-val">${author}</span></div>
        </div>
    `;

    const html = getBaseTemplate('You Were Mentioned', content, companyName, 'Reply to Comment', commentUrl, {
        themeKey: 'mention',
        heroLabel: 'Mention',
        heroSub: `${author} tagged you in ${project.name}`
    });
    return sendEmail(recipient.email, subject, html);
};

export const notifyTaskReminder = async (to: string, task: any, project: any, daysRemaining: number) => {
    const companyName = await getCompanyName(project.companyId);
    const isOverdue = daysRemaining < 0;
    const subject = isOverdue
        ? `⚠️ Overdue Task: "${task.title}" — ${companyName}`
        : `Reminder: "${task.title}" is due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} — ${companyName}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const taskUrl = `${frontendUrl}/projects/${project.id}/tasks?taskId=${task.id}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">${isOverdue ? `This task is <strong style="color: #DC2626;">overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}</strong>. Please update its status or reach out to your team lead.` : `This task is due in <strong>${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}</strong>. Please make sure to complete it on time.`}</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FFF7ED; color: #9A3412;">Task Reminder</div>
          <div class="data-row"><span class="data-key">Task</span><span class="data-val">${task.title}</span></div>
          <div class="data-row"><span class="data-key">Project</span><span class="data-val">${project.name}</span></div>
          <div class="data-row"><span class="data-key">Due Date</span><span class="data-val" style="color: #DC2626; font-weight: 800;">${new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <div class="data-row"><span class="data-key">Priority</span><span class="data-val"><span class="badge badge-${(task.priority || 'medium').toLowerCase()}">${task.priority}</span></span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-pending">${task.status}</span></span></div>
        </div>
    `;

    const html = getBaseTemplate('Task Reminder', content, companyName, 'View Task', taskUrl, {
        themeKey: 'reminder',
        heroLabel: isOverdue ? 'Task Overdue ⚠️' : 'Due Soon',
        heroSub: task.title
    });
    return sendEmail(to, subject, html);
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
        companyId?: string;
    }
) => {
    const companyName = await getCompanyName(details.companyId);
    const subject = `Interview Invitation: Round ${details.round} (${details.type}) — ${companyName}`;
    const dateStr = new Date(details.scheduledAt).toLocaleString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${details.candidateName}</strong>,</p>
          <p class="greeting">We are pleased to invite you to an interview. Please find the details below and ensure you are available at the scheduled time.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #F0FDF4; color: #166534;">Interview Details</div>
          <div class="data-row"><span class="data-key">Round</span><span class="data-val">Round ${details.round} — ${details.type}</span></div>
          <div class="data-row"><span class="data-key">Scheduled For</span><span class="data-val" style="font-weight: 800; color: #166534;">${dateStr}</span></div>
          <div class="data-row"><span class="data-key">Interviewer</span><span class="data-val">${details.interviewer}</span></div>
          ${details.meetingLink ? `<div class="data-row"><span class="data-key">Meeting Link</span><span class="data-val"><a href="${details.meetingLink}" style="color: #1D4ED8; text-decoration: none; font-weight: 700;">Join Meeting</a></span></div>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748B;">Please ensure you are available 5 minutes before the scheduled start time. We look forward to speaking with you.</p>
    `;

    const html = getBaseTemplate('Interview Invitation', content, companyName, details.meetingLink ? 'Join Meeting' : undefined, details.meetingLink, {
        themeKey: 'hr',
        heroLabel: 'Recruitment',
        heroSub: `Round ${details.round} Interview`
    });
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
        companyId?: string;
    },
    pdfBuffer: Buffer
) => {
    const companyName = await getCompanyName(details.companyId);
    const subject = `Payslip for ${details.monthName} ${details.year} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${details.employeeName}</strong>,</p>
          <p class="greeting">Your payslip for <strong>${details.monthName} ${details.year}</strong> has been generated. Please find the detailed breakdown attached to this email.</p>
        </div>
        <div class="amount-block" style="background: #F0FDF4; border: 1px solid #BBF7D0;">
          <div class="amount-label" style="color: #166534;">Net Salary</div>
          <div class="amount-value" style="color: #14532D;"><span class="amount-currency">${details.currency}</span>${details.netSalary.toLocaleString()}</div>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #F0FDF4; color: #166534;">Pay Period Details</div>
          <div class="data-row"><span class="data-key">Employee</span><span class="data-val">${details.employeeName}</span></div>
          <div class="data-row"><span class="data-key">Pay Period</span><span class="data-val">${details.monthName} ${details.year}</span></div>
          <div class="data-row"><span class="data-key">Net Payable</span><span class="data-val" style="font-weight: 800; color: #166534;">${details.currency} ${details.netSalary.toLocaleString()}</span></div>
        </div>
        <p style="font-size: 13px; color: #64748B;">Please review the attached PDF for a detailed breakdown of your earnings and deductions. Contact HR if you have any queries.</p>
    `;

    const html = getBaseTemplate('Payslip Generated', content, companyName, undefined, undefined, {
        themeKey: 'payslip',
        heroLabel: 'Payroll',
        heroSub: `${details.monthName} ${details.year} Payslip`
    });
    const attachments = [{
        filename: `Payslip_${details.monthName}_${details.year}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
    }];

    return sendEmail(to, subject, html, attachments);
};

// --- Leave Notifications ---

export const notifyLeaveRequested = async (leave: any, employee: any, managerEmail: string) => {
    const companyName = await getCompanyName(employee.companyId);
    const empName = `${employee.firstName} ${employee.lastName}`;
    const subject = `Leave Request from ${empName} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting"><strong>${empName}</strong> has submitted a new leave request that requires your review and approval.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #ECFDF5; color: #065F46;">Leave Request Details</div>
          <div class="data-row"><span class="data-key">Employee</span><span class="data-val">${empName}</span></div>
          <div class="data-row"><span class="data-key">Leave Type</span><span class="data-val">${leave.leaveType?.name || 'Leave'}</span></div>
          <div class="data-row"><span class="data-key">From</span><span class="data-val">${new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <div class="data-row"><span class="data-key">To</span><span class="data-val">${new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <div class="data-row"><span class="data-key">Total Days</span><span class="data-val" style="font-weight: 800;">${leave.days} day${leave.days > 1 ? 's' : ''}</span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-pending">Pending Approval</span></span></div>
          ${leave.reason ? `<div class="data-row"><span class="data-key">Reason</span><span class="data-val" style="font-style: italic;">"${leave.reason}"</span></div>` : ''}
        </div>
    `;

    const html = getBaseTemplate('Leave Request', content, companyName, 'Review Request', `${process.env.FRONTEND_URL}/dashboard/leave`, {
        themeKey: 'leave',
        heroLabel: 'Leave Request',
        heroSub: `${empName} · ${leave.leaveType?.name || 'Leave'}`
    });
    return sendEmail(managerEmail, subject, html);
};

export const notifyLeaveStatusUpdate = async (leave: any, employee: any) => {
    const companyName = await getCompanyName(employee.companyId);
    const isApproved = leave.status === 'approved';
    const subject = `Leave Request ${isApproved ? 'Approved ✅' : 'Rejected'} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${employee.firstName}</strong>, your leave request has been <strong style="color: ${isApproved ? '#065F46' : '#991B1B'}; text-transform: uppercase;">${leave.status}</strong>.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: ${isApproved ? '#ECFDF5' : '#FEF2F2'}; color: ${isApproved ? '#065F46' : '#991B1B'};">Leave Details</div>
          <div class="data-row"><span class="data-key">Leave Type</span><span class="data-val">${leave.leaveType?.name || 'Leave'}</span></div>
          <div class="data-row"><span class="data-key">From</span><span class="data-val">${new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <div class="data-row"><span class="data-key">To</span><span class="data-val">${new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge ${isApproved ? 'badge-approved' : 'badge-rejected'}">${leave.status}</span></span></div>
          ${leave.rejectionReason ? `<div class="data-row"><span class="data-key">Note</span><span class="data-val" style="font-style: italic; color: #DC2626;">"${leave.rejectionReason}"</span></div>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748B;">${isApproved ? 'Your leave has been approved. Please ensure your work is handed over before your leave begins.' : 'We understand this may be inconvenient. Please contact your manager for more details or to discuss alternatives.'}</p>
    `;

    const html = getBaseTemplate(`Leave ${isApproved ? 'Approved' : 'Rejected'}`, content, companyName, undefined, undefined, {
        themeKey: isApproved ? 'leave' : 'support',
        heroLabel: 'Leave Update',
        heroSub: isApproved ? 'Your leave has been approved' : 'Your leave was not approved'
    });
    return sendEmail(employee.email, subject, html);
};

// --- Support Notifications ---

export const notifyNewTicket = async (ticket: any, creatorName: string, supportEmail: string) => {
    const companyName = await getCompanyName(ticket.companyId);
    const subject = `New Ticket #${ticket.id.slice(0, 8)}: ${ticket.subject} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">A new support ticket has been submitted by <strong>${creatorName}</strong> and requires your attention.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FFF7ED; color: #9A3412;">Ticket Details</div>
          <div class="data-row"><span class="data-key">Ticket ID</span><span class="data-val" style="font-family: monospace;">#${ticket.id.slice(0, 8)}</span></div>
          <div class="data-row"><span class="data-key">Subject</span><span class="data-val">${ticket.subject}</span></div>
          <div class="data-row"><span class="data-key">Submitted By</span><span class="data-val">${creatorName}</span></div>
          <div class="data-row"><span class="data-key">Priority</span><span class="data-val"><span class="badge badge-${(ticket.priority || 'medium').toLowerCase()}">${ticket.priority}</span></span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-pending">Open</span></span></div>
        </div>
        ${ticket.description ? `<div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 14px; margin-top: 12px; font-size: 13px; color: #92400E; line-height: 1.6;">${ticket.description.replace(/<[^>]*>?/g, '')}</div>` : ''}
    `;

    const html = getBaseTemplate('New Support Ticket', content, companyName, 'View Ticket', `${process.env.FRONTEND_URL}/dashboard/helpdesk/${ticket.id}`, {
        themeKey: 'support',
        heroLabel: 'Support',
        heroSub: `Ticket #${ticket.id.slice(0, 8)}`
    });
    return sendEmail(supportEmail, subject, html);
};

export const notifyTicketReply = async (ticket: any, reply: any, recipientEmail: string) => {
    const companyName = await getCompanyName(ticket.companyId);
    const userName = reply.user?.firstName || reply.client?.name || 'Support';
    const subject = `New Reply on Ticket #${ticket.id.slice(0, 8)} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting"><strong>${userName}</strong> has replied to your support ticket <strong>#${ticket.id.slice(0, 8)}</strong>.</p>
        </div>
        <div style="background: #F0F9FF; border-left: 4px solid #0EA5E9; border-radius: 0 8px 8px 0; padding: 16px 18px; margin: 16px 0;">
          <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #0369A1; margin: 0 0 8px 0;">Reply from ${userName}</p>
          <p style="color: #0C4A6E; margin: 0; font-size: 13px; line-height: 1.7;">${reply.message.replace(/<[^>]*>?/g, '')}</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FFF7ED; color: #9A3412;">Ticket Details</div>
          <div class="data-row"><span class="data-key">Ticket ID</span><span class="data-val" style="font-family: monospace;">#${ticket.id.slice(0, 8)}</span></div>
          <div class="data-row"><span class="data-key">Subject</span><span class="data-val">${ticket.subject}</span></div>
        </div>
    `;

    const html = getBaseTemplate('Ticket Reply', content, companyName, 'View Ticket', `${process.env.FRONTEND_URL}/dashboard/helpdesk/${ticket.id}`, {
        themeKey: 'support',
        heroLabel: 'Support Update',
        heroSub: `Ticket #${ticket.id.slice(0, 8)}`
    });
    return sendEmail(recipientEmail, subject, html);
};

// --- CRM & Asset Notifications ---

export const notifyLeadAssigned = async (lead: any, assignee: any) => {
    const companyName = await getCompanyName(lead.companyId);
    const subject = `New Lead Assigned: ${lead.name} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Hello <strong>${assignee.firstName}</strong>, a new lead has been assigned to you for follow-up. Please reach out at the earliest opportunity.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FAF5FF; color: #6D28D9;">Lead Details</div>
          <div class="data-row"><span class="data-key">Lead Name</span><span class="data-val">${lead.name}</span></div>
          <div class="data-row"><span class="data-key">Company</span><span class="data-val">${lead.company || '—'}</span></div>
          <div class="data-row"><span class="data-key">Contact</span><span class="data-val">${lead.email || lead.phone || '—'}</span></div>
          ${lead.source ? `<div class="data-row"><span class="data-key">Source</span><span class="data-val">${lead.source}</span></div>` : ''}
          ${lead.status ? `<div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge badge-pending">${lead.status}</span></span></div>` : ''}
        </div>
    `;

    const html = getBaseTemplate('New Lead Assignment', content, companyName, 'View Lead', `${process.env.FRONTEND_URL}/dashboard/crm/leads/${lead.id}`, {
        themeKey: 'crm',
        heroLabel: 'CRM',
        heroSub: `New lead: ${lead.name}`
    });
    return sendEmail(assignee.email, subject, html);
};

export const notifyAssetAssigned = async (asset: any, employee: any) => {
    const companyName = await getCompanyName(asset.companyId);
    const subject = `Asset Assigned to You — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${employee.firstName}</strong>, a corporate asset has been assigned to your profile. Please ensure proper care and adherence to company asset policies.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #ECFDF5; color: #065F46;">Asset Details</div>
          <div class="data-row"><span class="data-key">Asset Name</span><span class="data-val">${asset.name}</span></div>
          ${asset.serialNumber ? `<div class="data-row"><span class="data-key">Serial No.</span><span class="data-val" style="font-family: monospace;">${asset.serialNumber}</span></div>` : ''}
          ${asset.category ? `<div class="data-row"><span class="data-key">Category</span><span class="data-val">${asset.category}</span></div>` : ''}
          <div class="data-row"><span class="data-key">Date Assigned</span><span class="data-val">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          <div class="data-row"><span class="data-key">Condition</span><span class="data-val"><span class="badge badge-approved">${asset.condition || 'Good'}</span></span></div>
        </div>
        <p style="font-size: 13px; color: #64748B;">Please acknowledge receipt and report any damage or malfunction to your HR department immediately.</p>
    `;

    const html = getBaseTemplate('Asset Assigned', content, companyName, undefined, undefined, {
        themeKey: 'asset',
        heroLabel: 'Asset Management',
        heroSub: asset.name
    });
    return sendEmail(employee.email, subject, html);
};

// --- Performance & HR Notifications ---

export const notifyPerformanceReview = async (review: any, employee: any) => {
    const companyName = await getCompanyName(review.companyId || employee.companyId);
    const subject = `Your Performance Review is Ready — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${employee.firstName}</strong>, your latest performance review has been finalized and published. Please take some time to review the feedback shared by your manager.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #F5F3FF; color: #6D28D9;">Review Summary</div>
          <div class="data-row"><span class="data-key">Employee</span><span class="data-val">${employee.firstName} ${employee.lastName}</span></div>
          <div class="data-row"><span class="data-key">Final Rating</span><span class="data-val" style="font-weight: 800; font-size: 14px; color: #6D28D9;">${review.rating} / 5 ⭐</span></div>
          <div class="data-row"><span class="data-key">Review Date</span><span class="data-val">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          ${review.period ? `<div class="data-row"><span class="data-key">Period</span><span class="data-val">${review.period}</span></div>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748B;">Log in to your dashboard to view the detailed feedback, goals, and manager comments from this review cycle.</p>
    `;

    const html = getBaseTemplate('Performance Review', content, companyName, 'View Review', `${process.env.FRONTEND_URL}/dashboard/performance`, {
        themeKey: 'hr',
        heroLabel: 'Performance',
        heroSub: `${employee.firstName}'s Review is Ready`
    });
    return sendEmail(employee.email, subject, html);
};

export const notifyExitInitiated = async (employee: any, exitDate: Date) => {
    const companyName = await getCompanyName(employee.companyId);
    const subject = `Exit Process Initiated — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Dear <strong>${employee.firstName}</strong>, the formal exit process has been initiated for your profile. Please review the details and contact HR for clearance procedures.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #FEF2F2; color: #991B1B;">Exit Details</div>
          <div class="data-row"><span class="data-key">Employee</span><span class="data-val">${employee.firstName} ${employee.lastName}</span></div>
          <div class="data-row"><span class="data-key">Last Working Day</span><span class="data-val" style="font-weight: 800; color: #991B1B;">${new Date(exitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
        </div>
        <p style="font-size: 13px; color: #64748B;">Please coordinate with HR for handover documentation, asset returns, and clearance formalities before your last working day.</p>
    `;

    const html = getBaseTemplate('Exit Process Update', content, companyName, undefined, undefined, {
        themeKey: 'hr',
        heroLabel: 'HR Update',
        heroSub: 'Exit Process Initiated'
    });
    return sendEmail(employee.email, subject, html);
};

// --- Document Notifications ---

export const notifyDocumentStatus = async (document: any, recipientEmail: string, status: string, reason?: string) => {
    // Respect client notification preference if document belongs to a client
    if (document.client && document.client.receiveNotifications === false) {
        console.log(`ℹ️ Client ${document.client.name} has notifications disabled. Skipping document status email.`);
        return { messageId: 'skipped-pref' };
    }

    const companyName = await getCompanyName(document.companyId);
    const isApproved = status === 'approved';
    const subject = `Document ${isApproved ? 'Approved ✅' : 'Rejected'}: ${document.name} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting">Your document <strong>"${document.name}"</strong> has been reviewed and <strong style="color: ${isApproved ? '#065F46' : '#991B1B'}; text-transform: uppercase;">${status}</strong>.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: ${isApproved ? '#ECFDF5' : '#FEF2F2'}; color: ${isApproved ? '#065F46' : '#991B1B'};">Document Status</div>
          <div class="data-row"><span class="data-key">Document</span><span class="data-val">${document.name}</span></div>
          <div class="data-row"><span class="data-key">Status</span><span class="data-val"><span class="badge ${isApproved ? 'badge-approved' : 'badge-rejected'}">${status.toUpperCase()}</span></span></div>
          ${document.type ? `<div class="data-row"><span class="data-key">Type</span><span class="data-val">${document.type}</span></div>` : ''}
          ${reason ? `<div class="data-row"><span class="data-key">Reason</span><span class="data-val" style="font-style: italic; color: #DC2626;">"${reason}"</span></div>` : ''}
        </div>
        <p style="font-size: 13px; color: #64748B;">${isApproved ? 'Your document has been approved and is now ready for use.' : 'Please review the reason and resubmit the document with necessary corrections.'}</p>
    `;

    const html = getBaseTemplate(`Document ${isApproved ? 'Approved' : 'Rejected'}`, content, companyName, 'View Document', `${process.env.FRONTEND_URL}/dashboard/documents/${document.id}`, {
        themeKey: isApproved ? 'contract' : 'support',
        heroLabel: 'Document Status',
        heroSub: document.name
    });
    return sendEmail(recipientEmail, subject, html);
};

export const notifyDocumentUploaded = async (document: any, uploaderName: string, recipientEmail: string) => {
    const companyName = await getCompanyName(document.companyId);
    const subject = `New Document Uploaded: ${document.name} — ${companyName}`;

    const content = `
        <div style="padding-top: 24px;">
          <p class="greeting"><strong>${uploaderName}</strong> has uploaded a new document that requires your review.</p>
        </div>
        <div class="data-card">
          <div class="data-card-header" style="background: #EFF6FF; color: #1E40AF;">Document Details</div>
          <div class="data-row"><span class="data-key">Document</span><span class="data-val">${document.name}</span></div>
          <div class="data-row"><span class="data-key">Type</span><span class="data-val">${document.type}</span></div>
          <div class="data-row"><span class="data-key">Uploaded By</span><span class="data-val">${uploaderName}</span></div>
          <div class="data-row"><span class="data-key">Uploaded On</span><span class="data-val">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
        </div>
        <p style="font-size: 13px; color: #64748B;">Please review the document at your earliest convenience and approve or request changes as needed.</p>
    `;

    const html = getBaseTemplate('New Document Upload', content, companyName, 'View Document', `${process.env.FRONTEND_URL}/dashboard/documents/${document.id}`, {
        themeKey: 'contract',
        heroLabel: 'Documents',
        heroSub: `${uploaderName} uploaded a file`
    });
    return sendEmail(recipientEmail, subject, html);
};
