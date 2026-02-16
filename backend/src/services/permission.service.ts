
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export type PermissionLevel = 'all' | 'added' | 'owned' | 'both' | 'none' | string;

export class PermissionService {

    /**
     * Checks if a user has basic permission for an action (ignoring scope for now).
     * Returns true if they have any level > 'none'.
     */
    static hasBasicPermission(user: any, module: string, action: PermissionAction): boolean {
        if (!user) return false;

        // Client Portal Bypass for NewsCMS (check FIRST before roles)
        if (user.type === 'client' && module === 'NewsCMS') {
            return true;
        }

        if (!user.roles) return false;

        // Super Admin Bypass
        const isSuperAdmin = user.roles?.some((r: any) =>
            r.role.name === 'Super Admin' || r.role.name === 'Admin' || r.role.isSystem
        );
        if (isSuperAdmin) return true;

        // Check Roles
        for (const userRole of user.roles) {
            const perms = userRole.role.permissions || [];
            const modulePerm = perms.find((p: any) => p.module === module);

            if (modulePerm) {
                let level = 'none';
                if (action === 'create') level = modulePerm.createLevel;
                if (action === 'read') level = modulePerm.readLevel;
                if (action === 'update') level = modulePerm.updateLevel;
                if (action === 'delete') level = modulePerm.deleteLevel;

                if (level && level !== 'none') return true;
            }
        }

        return false;
    }

    /**
     * Resolves the effective scope for a user's action on a module.
     * Combine multiple roles to get the widest access.
     */
    static getPermissionScope(user: any, module: string, action: PermissionAction) {
        let canViewAll = false;
        let canViewOwned = false;
        let canViewAdded = false;

        if (!user || !user.roles) return { all: false, owned: false, added: false };

        // Super Admin
        const isSuperAdmin = user.roles.some((r: any) =>
            r.role.name === 'Super Admin' || r.role.name === 'Admin' || r.role.isSystem // Assuming isSystem check fix
        );
        if (isSuperAdmin) return { all: true, owned: true, added: true };

        user.roles.forEach((ur: any) => {
            const perms = ur.role.permissions || [];
            const p = perms.find((perm: any) => perm.module === module);
            if (p) {
                let level = 'none';
                if (action === 'create') level = p.createLevel;
                if (action === 'read') level = p.readLevel;
                if (action === 'update') level = p.updateLevel;
                if (action === 'delete') level = p.deleteLevel;

                if (level === 'all') canViewAll = true;
                if (level === 'both' || level === 'added_owned') { canViewOwned = true; canViewAdded = true; }
                if (level === 'owned') canViewOwned = true;
                if (level === 'added') canViewAdded = true;
            }
        });

        return { all: canViewAll, owned: canViewOwned, added: canViewAdded };
    }

    /**
     * Generates a Prisma WhereInput compatible object for filtering.
     * Handles "Added" scope using Raw Query to bypass stale schema if needed.
     */
    static async getScopedWhereClause(
        user: any,
        module: string,
        action: PermissionAction,
        entityTable: string = 'Employee', // Table name for Raw Query
        createdByIdField: string = 'createdById', // Field name in DB
        ownerIdField: string = 'userId' // Field name for 'Owned' check
    ): Promise<any> {
        const scope = this.getPermissionScope(user, module, action);

        if (scope.all) {
            return {}; // No filter needed (except companyId which is usually outside)
        }

        if (!scope.owned && !scope.added) {
            return { id: '00000000-0000-0000-0000-000000000000' }; // Block access
        }

        const orConditions: any[] = [];

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
                const results: any[] = await prisma.$queryRawUnsafe(query, user.id);
                const ids = results.map(r => r.id);

                if (ids.length > 0) {
                    orConditions.push({ id: { in: ids } });
                }
            } catch (e) {
                console.warn(`PermissionService: Failed raw query for ${entityTable}`, e);
            }
        }

        if (orConditions.length === 0) {
            return { id: '00000000-0000-0000-0000-000000000000' }; // Block
        }

        return { OR: orConditions };
    }
    static async checkProjectAccess(userId: string, projectId: string, action: 'view' | 'edit' | 'delete'): Promise<boolean> {
        // 1. Super Admin / Admin Check
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } }
        });
        if (this.hasBasicPermission(user, 'Projects', 'update')) return true;

        // 2. Fetch Employee Profile
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return false;

        // 3. Project Member Check
        const membership = await prisma.projectMember.findUnique({
            where: { projectId_employeeId: { projectId, employeeId: employee.id } }
        });

        if (!membership) return false;

        if (action === 'view') return true;
        if (action === 'edit') return ['manager', 'admin', 'member'].includes(membership.role); // Added 'member'
        if (action === 'delete') return membership.role === 'manager';

        return false;
    }
}
