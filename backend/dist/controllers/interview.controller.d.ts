import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const scheduleInterview: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCandidateInterviews: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateFeedback: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getScorecard: (req: AuthRequest, res: Response) => Promise<void>;
export declare const cancelInterview: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=interview.controller.d.ts.map