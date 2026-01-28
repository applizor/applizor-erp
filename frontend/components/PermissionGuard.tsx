import React from 'react';
import { usePermission, PermissionModule, PermissionAction } from '../hooks/usePermission';

interface PermissionGuardProps {
    module: PermissionModule | string;
    action: PermissionAction;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    module,
    action,
    children,
    fallback = null
}) => {
    const { can } = usePermission();

    if (can(module, action)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
