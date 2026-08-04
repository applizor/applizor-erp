import { ButtonHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
    icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'default', isLoading, icon: Icon, children, disabled, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center font-black uppercase tracking-widest rounded-lg disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed transition-[background-color,border-color,box-shadow,transform,opacity,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985]";

        const sizes = {
            default: 'text-[10px] px-4 py-2.5',
            sm: 'text-[9px] px-3 py-2',
            lg: 'text-xs px-6 py-3',
            icon: 'h-9 w-9 p-0'
        };

        const variants = {
            primary: 'ent-button-primary',
            secondary: 'ent-button-secondary',
            danger: 'ent-button-danger',
            outline: 'border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-900',
            ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        };

        const variantClass = variants[variant];
        const sizeClass = sizes[size];
        const spinnerColor = variant === 'primary' ? 'border-white/30 border-t-white' : 'border-slate-300 border-t-primary-600';

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variantClass} ${sizeClass} ${className} ${isLoading ? 'cursor-wait opacity-80' : ''}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <div className={`mr-2 h-4 w-4 animate-spin rounded-full border-2 ${spinnerColor}`} />
                )}
                {!isLoading && Icon && <Icon className="mr-2 h-4 w-4" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
