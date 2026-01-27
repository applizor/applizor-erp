import { useMemo } from 'react';
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
            // Note: Project member structure varies, checking both potential paths
            const memberRecord = project.members?.find(
                (m: any) => m.employee?.userId === user.id || m.userId === user.id || m.employeeId === user.employeeId
            );

            if (memberRecord) {
                effectiveRole = (memberRecord.role as ProjectRole) || 'member';
            } else {
                // Not a member? If they can see the page (e.g. public link or simple view), effectively a viewer
                // But for strict control, we might want to return 'none'
                effectiveRole = 'viewer';
            }
        }

        // 2. Get Permissions Matrix
        // If no settings/permissions exist, use defaults
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

    const can = (module: ProjectPermissionModule, action: ProjectPermissionAction): boolean => {
        if (!role || !permissions) return false;

        // Managers always have full access
        if (role === 'manager') return true;

        // Check specific permission
        // Safety check for undefined modules/roles in legacy data
        const rolePermissions = permissions[role];
        if (!rolePermissions) return false;

        const modulePermissions = rolePermissions[module];
        if (!modulePermissions) return false;

        return !!modulePermissions[action];
    };

    return { role, can };
};
