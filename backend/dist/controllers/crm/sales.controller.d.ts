import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const createSalesTarget: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSalesTargets: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=sales.controller.d.ts.map