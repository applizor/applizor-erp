import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createTemplate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTemplates: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateTemplate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTemplate: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=document-template.controller.d.ts.map