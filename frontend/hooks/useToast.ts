'use client';

import { useToastContext } from '@/contexts/ToastContext';
import { useMemo } from 'react';

export function useToast() {
    const { showToast } = useToastContext();

    return useMemo(() => ({
        success: (message: string) => showToast('success', message),
        error: (message: string) => showToast('error', message),
        warning: (message: string) => showToast('warning', message),
        info: (message: string) => showToast('info', message),
        notification: (message: string) => showToast('notification', message),
    }), [showToast]);
}
