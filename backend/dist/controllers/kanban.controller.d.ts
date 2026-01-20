import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getKanbanBoard: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCandidateStage: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=kanban.controller.d.ts.map