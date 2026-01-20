'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface CurrencyContextType {
    currency: string;
    symbol: string;
    formatCurrency: (amount: number | string | null | undefined) => string;
    refreshCurrency: () => Promise<void>;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(true);

    const refreshCurrency = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await api.get('/company');
                if (res.data?.company?.currency) {
                    setCurrency(res.data.company.currency);
                }
            }
        } catch (error) {
            console.error('Failed to fetch currency settings', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshCurrency();
    }, []);

    const symbol = currency === 'INR' ? '₹' : '$';

    const formatCurrency = (amount: number | string | null | undefined) => {
        if (amount === null || amount === undefined || amount === '') return `${symbol}0.00`;
        const num = Number(amount);
        if (isNaN(num)) return `${symbol}0.00`;

        return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(num);
    };

    return (
        <CurrencyContext.Provider value={{ currency, symbol, formatCurrency, refreshCurrency, loading }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
