import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createOffer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOffer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateOfferStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=offer.controller.d.ts.map