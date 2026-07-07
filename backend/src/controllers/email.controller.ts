import { Request, Response } from 'express';
import { sendEmail } from '../services/email.service';

/** Generic email API — uses the same sendEmail service as invoice/quotation/notifications */
export const sendGenericEmail = async (req: Request, res: Response) => {
    try {
        const { to, cc, bcc, subject, body, from, isHtml = true } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({ error: 'to, subject, and body are required' });
        }

        const attachments: any[] = [];
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach(file => {
                attachments.push({
                    filename: file.originalname,
                    content: file.buffer
                });
            });
        } else if (req.body.attachments && Array.isArray(req.body.attachments)) {
            req.body.attachments.forEach((att: any) => {
                attachments.push({
                    filename: att.filename,
                    content: att.content,
                    path: att.path,
                    contentType: att.contentType
                });
            });
        }

        // Same sender as invoice emails (EMAIL_ACCOUNTS shared mailbox)
        const resolvedFrom = from || process.env.EMAIL_ACCOUNTS || process.env.EMAIL_INFO || process.env.EMAIL_FROM || process.env.SMTP_USER;

        const companyId = (req as any).user?.companyId;
        const department = req.body.department;

        const info = await sendEmail(
            to,
            subject,
            body,
            attachments.length > 0 ? attachments : undefined,
            resolvedFrom,
            cc,
            bcc,
            isHtml,
            companyId,
            department
        );

        const messageId = (info as any)?.messageId;
        if (!messageId || String(messageId).startsWith('mock-')) {
            return res.status(502).json({
                success: false,
                error: 'Email transport failed — message was NOT delivered',
                details: 'SMTP/Microsoft Graph rejected or is not configured on the server'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            from: (info as any)?.from || resolvedFrom,
            to,
            messageId
        });
    } catch (error: any) {
        console.error('Email API Error:', error.response?.data || error.message || error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send email',
            details: error.response?.data?.error?.message || error.message
        });
    }
};
