import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Create a new invoice
 */
export declare const createInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get list of invoices with pagination and filters
 */
export declare const getInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get a single invoice by ID
 */
export declare const getInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Generate Invoice PDF
 */
export declare const generateInvoicePDF: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Record a payment for an invoice
 */
export declare const recordPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get invoice statistics for dashboard
 */
export declare const getInvoiceStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Send invoice via email
 */
export declare const sendInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update invoice status manually
 */
export declare const updateInvoiceStatus: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Batch update invoice status
 */
export declare const batchUpdateStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Batch send invoices via email
 */
export declare const batchSendInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Convert quotation to invoice
 */
/**
 * Update an invoice
 */
export declare const updateInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Convert quotation to invoice
 */
export declare const convertQuotation: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get public invoice details by ID
 */
export declare const getPublicInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get public invoice PDF by ID
 */
export declare const getPublicInvoicePdf: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Generate Public Link for Invoice
 */
export declare const generatePublicLink: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Revoke Public Link
 */
export declare const revokePublicLink: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get Activity Log for an Invoice
 */
export declare const getActivityLog: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=invoice.controller.d.ts.map