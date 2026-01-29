import React from 'react';
import { CustomSelect } from './CustomSelect';

interface CurrencySelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const CurrencySelect = ({ value, onChange, className = '' }: CurrencySelectProps) => {
    const options = [
        { label: 'INR (₹)', value: 'INR' },
        { label: 'USD ($)', value: 'USD' },
        { label: 'EUR (€)', value: 'EUR' },
        { label: 'GBP (£)', value: 'GBP' },
        { label: 'AED (د.إ)', value: 'AED' }
    ];

    return (
        <CustomSelect
            options={options}
            value={value || 'INR'}
            onChange={onChange}
            className={className}
        />
    );
};
