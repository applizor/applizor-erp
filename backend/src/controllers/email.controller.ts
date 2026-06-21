import { Request, Response } from 'express';
import { sendEmail } from '../services/email.service';

export const sendGenericEmail = async (req: Request, res: Response) => {
    try {
        const { to, cc, bcc, subject, body, from, isHtml = true } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({ error: 'to, subject, and body are required' });
        }

        // Attachments can be sent via multer if needed, but for simple AI integration,
        // we'll accept base64 or file paths in the body (if supported), or just no attachments for now unless passed.
        // If files are uploaded via multipart/form-data:
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

        const resolvedFrom = from || process.env.EMAIL_INFO || process.env.EMAIL_FROM || process.env.SMTP_USER || 'not-configured';

        const info = await sendEmail(
            to,
            subject,
            body,
            attachments.length > 0 ? attachments : undefined,
            from,
            cc,
            bcc,
            isHtml
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
            from: resolvedFrom,
            to,
            messageId: (info as any)?.messageId || messageId
        });
    } catch (error: any) {
        console.error('Email API Error:', error);
        return res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
};
