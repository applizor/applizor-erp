export declare const sendEmail: (to: string, subject: string, html: string, attachments?: any[]) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export declare const sendInvoiceEmail: (to: string, invoiceData: any, pdfBuffer?: Buffer) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
//# sourceMappingURL=email.service.d.ts.map