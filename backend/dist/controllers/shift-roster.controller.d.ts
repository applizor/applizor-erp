import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getRoster: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateRoster: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=shift-roster.controller.d.ts.map