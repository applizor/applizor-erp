import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createBranch: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBranches: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateBranch: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteBranch: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=branch.controller.d.ts.map