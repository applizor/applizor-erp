export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export type PermissionLevel = 'all' | 'added' | 'owned' | 'both' | 'none' | string;
export declare class PermissionService {
    /**
     * Checks if a user has basic permission for an action (ignoring scope for now).
     * Returns true if they have any level > 'none'.
     */
    static hasBasicPermission(user: any, module: string, action: PermissionAction): boolean;
    /**
     * Resolves the effective scope for a user's action on a module.
     * Combine multiple roles to get the widest access.
     */
    static getPermissionScope(user: any, module: string, action: PermissionAction): {
        all: boolean;
        owned: boolean;
        added: boolean;
    };
    /**
     * Generates a Prisma WhereInput compatible object for filtering.
     * Handles "Added" scope using Raw Query to bypass stale schema if needed.
     */
    static getScopedWhereClause(user: any, module: string, action: PermissionAction, entityTable?: string, // Table name for Raw Query
    createdByIdField?: string, // Field name in DB
    ownerIdField?: string): Promise<any>;
}
//# sourceMappingURL=permission.service.d.ts.map