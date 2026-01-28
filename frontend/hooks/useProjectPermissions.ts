import { useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

export type ProjectRole = 'manager' | 'member' | 'viewer';

export type ProjectPermissionModule = 'tasks' | 'milestones' | 'financials' | 'settings' | 'team';
export type ProjectPermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const useProjectPermissions = (project: any) => {
    const { user } = useAuth();

    const { role, permissions } = useMemo(() => {
        if (!project || !user) return { role: null, permissions: null };

        // 1. Determine Role
        let effectiveRole: ProjectRole = 'viewer'; // Default

        // Check if Global Admin
        if (user.roles?.some((r: string) => r.toLowerCase() === 'admin')) {
            effectiveRole = 'manager';
        } else {
            // Check Project Member List
            const memberRecord = project.members?.find(
                (m: any) => m.employee?.userId === user.id || m.userId === user.id
            );

            if (memberRecord) {
                effectiveRole = (memberRecord.role as ProjectRole) || 'member';
            } else {
                effectiveRole = 'viewer';
            }
        }

        // 2. Get Permissions Matrix
        const matrix = project.settings?.permissions || {
            member: {
                tasks: { view: true, create: true, edit: true, delete: false },
                milestones: { view: true, create: false, edit: false, delete: false },
                financials: { view: false, create: false, edit: false, delete: false },
                settings: { view: false, edit: false },
                team: { view: true, edit: false }
            },
            viewer: {
                tasks: { view: true, create: false, edit: false, delete: false },
                milestones: { view: true, create: false, edit: false, delete: false },
                financials: { view: false, create: false, edit: false, delete: false },
                settings: { view: false, edit: false },
                team: { view: true, edit: false }
            }
        };

        return { role: effectiveRole, permissions: matrix };
    }, [project, user]);

    const can = useCallback((module: ProjectPermissionModule, action: ProjectPermissionAction): boolean => {
        if (!role || !permissions) return false;

        // Managers always have full access
        if (role === 'manager') return true;

        // Check specific permission
        const rolePermissions = (permissions as any)[role];
        if (!rolePermissions) return false;

        const modulePermissions = (rolePermissions as any)[module];
        if (!modulePermissions) return false;

        return !!(modulePermissions as any)[action];
    }, [role, permissions]);

    return { role, can };
};
