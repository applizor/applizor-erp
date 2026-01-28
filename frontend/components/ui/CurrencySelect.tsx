import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CurrencySelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const CurrencySelect = ({ value, onChange, className = '' }: CurrencySelectProps) => {
    return (
        <div className={`relative ${className}`}>
            <select
                value={value || 'INR'}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded px-3 py-2 pr-8 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer uppercase tracking-wider"
            >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
    );
};
