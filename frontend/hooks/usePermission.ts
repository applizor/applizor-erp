import { useAuth, User } from '@/lib/auth';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export type PermissionModule =
    | 'Dashboard'
    | 'Company'
    | 'User'
    | 'Role'
    | 'Client'
    | 'Lead'
    | 'LeadActivity'
    | 'Quotation'
    | 'QuotationTemplate'
    | 'Invoice'
    | 'Payment'
    | 'Subscription'
    | 'Department'
    | 'Position'
    | 'Employee'
    | 'Attendance'
    | 'Leave'
    | 'LeaveType'
    | 'LeaveBalance'
    | 'Payroll'
    | 'Asset'
    | 'Holiday'
    | 'Shift'
    | 'ShiftRoster'
    | 'Project'
    | 'ProjectTask'
    | 'Recruitment'
    | 'Timesheet' // Phase 9
    | 'Document'
    | 'Accounting';

export const usePermission = () => {
    const { user } = useAuth();

    const can = (module: PermissionModule | string, action: PermissionAction): boolean => {
        if (!user) return false;

        // Admin override
        if (user.roles?.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'administrator')) {
            return true;
        }

        // If no permissions object, deny (unless admin)
        if (!user.permissions) return false;

        const perm = user.permissions[module];
        if (!perm) return false;

        // Map action to level field
        let level = 'none';
        switch (action) {
            case 'create': level = perm.createLevel; break;
            case 'read': level = perm.readLevel; break;
            case 'update': level = perm.updateLevel; break;
            case 'delete': level = perm.deleteLevel; break;
        }

        // 'none' means strictly no access
        return level !== 'none' && level !== undefined;
    };

    // Helper for specific scopes if needed in UI (e.g. show "My" vs "All")
    const getScope = (module: PermissionModule | string, action: PermissionAction): 'all' | 'added' | 'owned' | 'none' => {
        if (!user || !user.permissions || !user.permissions[module]) return 'none';

        // Admin override - implicitly 'all'
        if (user.roles?.some(r => r.toLowerCase() === 'admin')) {
            return 'all';
        }

        const perm = user.permissions[module];
        let level = 'none';
        switch (action) {
            case 'create': level = perm.createLevel; break;
            case 'read': level = perm.readLevel; break;
            case 'update': level = perm.updateLevel; break;
            case 'delete': level = perm.deleteLevel; break;
        }
        return level as any;
    };

    return { can, getScope, user };
};
