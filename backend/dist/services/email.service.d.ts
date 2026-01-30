export declare const sendEmail: (to: string, subject: string, html: string, attachments?: any[]) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const sendInvoiceEmail: (to: string, invoiceData: any, pdfBuffer?: Buffer, isReminder?: boolean, publicUrl?: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const sendQuotationToClient: (quotationData: any, publicUrl: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const sendContractNotification: (contract: any, publicUrl: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const sendContractSignedNotificationToCompany: (contract: any) => Promise<{
    messageId: string;
} | undefined>;
export declare const sendQuotationAcceptanceToClient: (quotationData: any) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const sendQuotationAcceptanceToCompany: (quotationData: any) => Promise<{
    messageId: string;
} | undefined>;
export declare const sendQuotationRejectionToCompany: (quotationData: any) => Promise<{
    messageId: string;
} | undefined>;
export declare const sendQuotationReminder: (quotationData: any, publicUrl: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const notifyTaskAssigned: (task: any, assignee: any, project: any) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const notifyTaskUpdated: (task: any, assignee: any, project: any, changes: string[]) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const notifyNewTask: (task: any, project: any, recipientEmail: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
export declare const notifyMention: (recipient: {
    email: string;
    firstName: string;
}, commenterName: string, task: any, project: any, commentContent: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo | {
    messageId: string;
}>;
//# sourceMappingURL=email.service.d.ts.map