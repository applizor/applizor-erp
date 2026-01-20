"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PermissionService {
    /**
     * Checks if a user has basic permission for an action (ignoring scope for now).
     * Returns true if they have any level > 'none'.
     */
    static hasBasicPermission(user, module, action) {
        if (!user || !user.roles)
            return false;
        // Super Admin Bypass
        const isSuperAdmin = user.roles.some((r) => r.role.name === 'Super Admin' || r.role.name === 'Admin' || r.role.isSystem);
        if (isSuperAdmin)
            return true;
        // Check Roles
        for (const userRole of user.roles) {
            const perms = userRole.role.permissions || [];
            const modulePerm = perms.find((p) => p.module === module);
            if (modulePerm) {
                let level = 'none';
                if (action === 'create')
                    level = modulePerm.createLevel;
                if (action === 'read')
                    level = modulePerm.readLevel;
                if (action === 'update')
                    level = modulePerm.updateLevel;
                if (action === 'delete')
                    level = modulePerm.deleteLevel;
                if (level && level !== 'none')
                    return true;
            }
        }
        return false;
    }
    /**
     * Resolves the effective scope for a user's action on a module.
     * Combine multiple roles to get the widest access.
     */
    static getPermissionScope(user, module, action) {
        let canViewAll = false;
        let canViewOwned = false;
        let canViewAdded = false;
        if (!user || !user.roles)
            return { all: false, owned: false, added: false };
        // Super Admin
        const isSuperAdmin = user.roles.some((r) => r.role.name === 'Super Admin' || r.role.name === 'Admin' || r.role.isSystem // Assuming isSystem check fix
        );
        if (isSuperAdmin)
            return { all: true, owned: true, added: true };
        user.roles.forEach((ur) => {
            const perms = ur.role.permissions || [];
            const p = perms.find((perm) => perm.module === module);
            if (p) {
                let level = 'none';
                if (action === 'create')
                    level = p.createLevel;
                if (action === 'read')
                    level = p.readLevel;
                if (action === 'update')
                    level = p.updateLevel;
                if (action === 'delete')
                    level = p.deleteLevel;
                if (level === 'all')
                    canViewAll = true;
                if (level === 'both' || level === 'added_owned') {
                    canViewOwned = true;
                    canViewAdded = true;
                }
                if (level === 'owned')
                    canViewOwned = true;
                if (level === 'added')
                    canViewAdded = true;
            }
        });
        return { all: canViewAll, owned: canViewOwned, added: canViewAdded };
    }
    /**
     * Generates a Prisma WhereInput compatible object for filtering.
     * Handles "Added" scope using Raw Query to bypass stale schema if needed.
     */
    static async getScopedWhereClause(user, module, action, entityTable = 'Employee', // Table name for Raw Query
    createdByIdField = 'createdById', // Field name in DB
    ownerIdField = 'userId' // Field name for 'Owned' check
    ) {
        const scope = this.getPermissionScope(user, module, action);
        if (scope.all) {
            return {}; // No filter needed (except companyId which is usually outside)
        }
        if (!scope.owned && !scope.added) {
            return { id: '00000000-0000-0000-0000-000000000000' }; // Block access
        }
        const orConditions = [];
        // 1. Owned
        if (scope.owned) {
            if (ownerIdField) {
                orConditions.push({ [ownerIdField]: user.id });
            }
        }
        // 2. Added
        if (scope.added) {
            try {
                // Raw query to get IDs
                // We use queryRawUnsafe because table name is dynamic-ish (though usually fixed per call)
                // BE CAREFUL with SQL Injection if entityTable comes from user input. Here it comes from code.
                const query = `SELECT id FROM "${entityTable}" WHERE "${createdByIdField}" = $1`;
                const results = await prisma.$queryRawUnsafe(query, user.id);
                const ids = results.map(r => r.id);
                if (ids.length > 0) {
                    orConditions.push({ id: { in: ids } });
                }
            }
            catch (e) {
                console.warn(`PermissionService: Failed raw query for ${entityTable}`, e);
            }
        }
        if (orConditions.length === 0) {
            return { id: '00000000-0000-0000-0000-000000000000' }; // Block
        }
        return { OR: orConditions };
    }
}
exports.PermissionService = PermissionService;
//# sourceMappingURL=permission.service.js.map