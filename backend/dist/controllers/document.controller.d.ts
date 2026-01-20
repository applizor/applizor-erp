import { Request, Response } from 'express';
export declare const generateDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export declare const generateFromTemplate: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=document.controller.d.ts.map