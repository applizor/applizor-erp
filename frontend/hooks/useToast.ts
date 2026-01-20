'use client';

import { useToastContext } from '@/contexts/ToastContext';

export function useToast() {
    const { showToast } = useToastContext();

    return {
        success: (message: string) => showToast('success', message),
        error: (message: string) => showToast('error', message),
        warning: (message: string) => showToast('warning', message),
        info: (message: string) => showToast('info', message),
    };
}
