import { useCallback } from 'react';

export const useCurrency = () => {
    const formatCurrency = useCallback((amount: number | string | undefined | null, currency: string = 'INR') => {
        if (amount === undefined || amount === null) return '-';
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(value)) return '-';

        try {
            return new Intl.NumberFormat('en-US', { // Changed to US for standard formatting, or keep IN but handle robustness
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(value);
        } catch (e) {
            return `${currency} ${value}`;
        }
    }, []);

    return { formatCurrency };
};
