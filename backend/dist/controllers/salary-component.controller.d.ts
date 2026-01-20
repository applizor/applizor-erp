import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getComponents: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createComponent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateComponent: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteComponent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=salary-component.controller.d.ts.map