import { Request } from 'express';
interface AuditLogData {
    action: string;
    module: string;
    entityType?: string;
    entityId?: string;
    details?: string;
    changes?: any;
}
export declare const logAction: (req: Request | any, // Allow simplified objects if needed
data: AuditLogData) => Promise<void>;
export {};
//# sourceMappingURL=audit.service.d.ts.map