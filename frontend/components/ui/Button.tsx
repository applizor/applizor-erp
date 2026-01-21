import { ButtonHTMLAttributes, forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { LucideIcon } from 'lucide-react';


// Actually, let's stick to template literals to be safe.

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    isLoading?: boolean;
    icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', isLoading, icon: Icon, children, disabled, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

        const variants = {
            primary: 'ent-button-primary', // defined in globals.css
            secondary: 'ent-button-secondary', // defined in globals.css
            danger: 'ent-button-danger', // defined in globals.css
            outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
            ghost: 'bg-transparent text-slate-600 hover:bg-slate-100'
        };

        // Note: ent-button-* classes include the base styles mostly, but let's rely on them.
        // If variant is primary/secondary/danger, we rely on the global class.
        // If outline/ghost, we use the classes above + baseStyles manually if needed? 
        // Actually ent-button primary/secondary/danger are fully self contained in globals.css now.

        const variantClass = variants[variant];

        // Spinner color logic
        const spinnerColor = variant === 'primary' ? 'border-white/30 border-t-white' : 'border-slate-300 border-t-indigo-600';

        return (
            <button
                ref={ref}
                className={`${variantClass} ${className} ${isLoading ? 'cursor-wait opacity-80' : ''}`}
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
