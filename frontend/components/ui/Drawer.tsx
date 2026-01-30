'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!mounted) return null;

    const drawerContent = (
        <>
            {/* Backdrop: Absolute maximum z-index to cover everything */}
            <div
                className={`fixed inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ zIndex: 999998 }}
                onClick={onClose}
            />

            {/* Drawer Panel: Absolute maximum z-index and solid white background */}
            <div
                className={`fixed inset-y-0 right-0 w-full md:w-[95vw] lg:w-[90vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out font-sans ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ zIndex: 999999 }}
            >
                <div className="flex flex-col h-full relative bg-white">
                    {/* Header: High-Density Enterprise Style */}
                    <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white shadow-sm z-20">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Enterprise Studio / Alpha v2</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-md border border-transparent hover:border-slate-200 transition-all active:scale-95"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden bg-white">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(drawerContent, document.body);
};

