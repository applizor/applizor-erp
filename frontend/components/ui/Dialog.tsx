
'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
}

export const Dialog: React.FC<DialogProps> = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'md'
}) => {
    const [visible, setVisible] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        if (isOpen) {
            setVisible(true);
            // Delay activating so the initial hidden state paints, then transition in
            timeout = setTimeout(() => setActive(true), 10);
            document.body.style.overflow = 'hidden';
        } else {
            setActive(false);
            // Keep mounted for the exit animation, then unmount
            timeout = setTimeout(() => setVisible(false), 300);
            document.body.style.overflow = 'unset';
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => {
            clearTimeout(timeout);
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!visible) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        'full': 'max-w-[95vw]'
    };

    return (
        <div className={`fixed inset-0 z-[10000] overflow-y-auto bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex min-h-full items-center justify-center p-4 md:p-6" onClick={onClose}>
                {/* Modal Content */}
                <div
                    className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-md shadow-2xl ring-1 ring-gray-200 transform transition-all duration-300 ease-out ${active ? 'modal-enter-active' : 'modal-enter'}`}
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
