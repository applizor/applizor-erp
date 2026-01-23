import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createTemplate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTemplates: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTemplate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteTemplate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const sendMockEmail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=email-template.controller.d.ts.map