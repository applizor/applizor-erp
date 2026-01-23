import { Response } from 'express';
import { ClientAuthRequest } from '../middleware/client.auth';
export declare const getDashboardStats: (req: ClientAuthRequest, res: Response) => Promise<void>;
export declare const getMyInvoices: (req: ClientAuthRequest, res: Response) => Promise<void>;
export declare const getMyProjects: (req: ClientAuthRequest, res: Response) => Promise<void>;
export declare const getInvoiceDetails: (req: ClientAuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getInvoicePdf: (req: ClientAuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const exportInvoices: (req: ClientAuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=portal.controller.d.ts.map