import * as React from "react";

interface SwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Switch({ checked, onCheckedChange, disabled = false, className = "", size = 'md' }: SwitchProps) {
    const sizes = {
        sm: {
            width: 'w-7',
            height: 'h-4',
            dot: 'w-3 h-3',
            translate: 'translate-x-3'
        },
        md: {
            width: 'w-10', // slightly wider for better "pill" look
            height: 'h-6',
            dot: 'w-4 h-4',
            translate: 'translate-x-4'
        },
        lg: {
            width: 'w-12',
            height: 'h-7',
            dot: 'w-5 h-5',
            translate: 'translate-x-5'
        }
    };

    const currentSize = sizes[size];

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onCheckedChange(!checked)}
            className={`
                relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                ${checked ? 'bg-primary-600' : 'bg-slate-200'}
                ${currentSize.width} ${currentSize.height}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
        >
            <span
                className={`
                    bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-spring
                    ${currentSize.dot}
                    ${checked ? `${size === 'sm' ? 'translate-x-3.5' : size === 'md' ? 'translate-x-5' : 'translate-x-6'}` : 'translate-x-0.5'}
                `}
            />
        </button>
    );
}
