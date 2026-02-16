'use client';

import * as React from 'react';
import { cn } from '@/lib/utils'; // Assuming cn exists, usually does in shadcn/ui projects. If not, I'll allow simple class concatenation. 
// I'll assume cn might not exist and use simple join or check first.
// Actually, let's check for lib/utils first.

// Simple implementation context
const DropdownMenuContext = React.createContext<{
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({ open: false, setOpen: () => { } });

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block text-left">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    );
};

export const DropdownMenuTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext);

    // Cloning child to attach onClick if asChild is true
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                const existingOnClick = (children as any).props.onClick;
                if (existingOnClick) existingOnClick(e);
                setOpen(!open);
            }
        });
    }

    return (
        <button onClick={() => setOpen(!open)} className="inline-flex justify-center w-full">
            {children}
        </button>
    );
};

export const DropdownMenuContent = ({
    align = 'center',
    children,
    className
}: {
    align?: 'start' | 'end' | 'center';
    children: React.ReactNode;
    className?: string;
}) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open, setOpen]);

    if (!open) return null;

    const alignmentClasses = {
        start: 'left-0',
        end: 'right-0',
        center: 'left-1/2 transform -translate-x-1/2',
    };

    return (
        <div
            ref={ref}
            className={`absolute z-50 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClasses[align]} ${className || ''}`}
        >
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                {children}
            </div>
        </div>
    );
};

export const DropdownMenuItem = ({
    children,
    onClick,
    className
}: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}) => {
    const { setOpen } = React.useContext(DropdownMenuContext);

    const handleClick = () => {
        if (onClick) onClick();
        setOpen(false);
    };

    return (
        <div
            onClick={handleClick}
            className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer ${className || ''}`}
            role="menuitem"
        >
            {children}
        </div>
    );
};

export const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {children}
        </div>
    );
};

export const DropdownMenuSeparator = () => {
    return <div className="border-t border-gray-100 my-1"></div>;
};
