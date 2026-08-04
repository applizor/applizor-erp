import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { }

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={`ent-input h-10 ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
