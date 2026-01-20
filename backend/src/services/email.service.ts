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
