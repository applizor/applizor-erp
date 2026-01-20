import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createJobOpening: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getJobOpenings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getJobOpeningById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateJobOpening: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPublicJobOpenings: (req: Request, res: Response) => Promise<void>;
export declare const deleteJobOpening: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=job-opening.controller.d.ts.map