import { useCallback } from 'react';

export const useCurrency = () => {
    const formatCurrency = useCallback((amount: number | string, currency: string = 'INR') => {
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(value)) return '-';

        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value);
    }, []);

    return { formatCurrency };
};
