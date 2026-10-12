"use client"

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface MultiSelectOption {
    label: string;
    value: string;
    description?: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    align?: 'left' | 'right';
}

const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
    );
};

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    value = [],
    onChange,
    placeholder = 'Select options',
    label,
    error,
    disabled = false,
    className = '',
    align = 'left',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOptions = options.filter(opt => value.includes(opt.value));

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const updatePosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        // If trigger is scrolled completely out of viewport, close dropdown
        if (rect.bottom < -50 || rect.top > window.innerHeight + 50) {
            setIsOpen(false);
            return;
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const measuredHeight = dropdownRef.current ? dropdownRef.current.offsetHeight : 0;
        const dropdownHeight = measuredHeight > 0 ? measuredHeight : 240;

        const targetWidth = Math.max(rect.width, 240);
        const finalWidth = Math.min(targetWidth, viewportWidth - 16);

        // Vertical collision: flip above if not enough room below and more room above
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const showAbove = spaceBelow < Math.min(dropdownHeight + 8, 260) && spaceAbove > spaceBelow;

        const top = showAbove
            ? Math.max(8, rect.top - dropdownHeight - 4)
            : rect.bottom + 4;

        const maxHeight = showAbove
            ? Math.min(260, Math.max(120, spaceAbove - 16))
            : Math.min(260, Math.max(120, spaceBelow - 16));

        let left = align === 'right' ? rect.right - finalWidth : rect.left;

        if (left + finalWidth > viewportWidth - 8) {
            left = viewportWidth - finalWidth - 8;
        }
        if (left < 8) {
            left = 8;
        }

        setDropdownStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${finalWidth}px`,
            maxHeight: `${maxHeight}px`,
            zIndex: 99999,
        });
    };

    useEffect(() => {
        if (!isOpen) return;

        updatePosition();
        const animId = requestAnimationFrame(updatePosition);

        const handleScroll = (event: Event) => {
            // Do not close or reposition if user is scrolling inside the dropdown options list
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            updatePosition();
        };

        const handleResize = () => {
            updatePosition();
        };

        const handleOutsideAction = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleOutsideAction);
        document.addEventListener('touchstart', handleOutsideAction, { passive: true });

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleOutsideAction);
            document.removeEventListener('touchstart', handleOutsideAction);
        };
    }, [isOpen, align]);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            // Only auto-focus on non-touch devices to avoid virtual keyboard flash on mobile
            if (!isTouchDevice()) {
                searchInputRef.current.focus();
            }
        }
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            if (!isOpen) {
                updatePosition();
            }
            setIsOpen(prev => !prev);
        }
    };

    const handleOptionToggle = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleRemove = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="ent-label mb-1.5 block">
                    {label}
                </label>
            )}

            <div
                onClick={handleToggle}
                className={`
                    flex items-center justify-between w-full min-h-[40px] px-3 py-1.5
                    bg-white border rounded-md transition-all duration-200 cursor-pointer
                    ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-slate-200'}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'}
                    ${error ? 'border-red-500' : ''}
                `}
            >
                <div className="flex flex-wrap gap-1.5 items-center flex-1 pr-2">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(option => (
                            <span
                                key={option.value}
                                className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-[10px] font-black uppercase text-slate-700 rounded-md border border-slate-200 group hover:bg-slate-200 hover:text-slate-900 transition-colors"
                            >
                                {option.label}
                                <button
                                    type="button"
                                    onClick={(e) => handleRemove(e, option.value)}
                                    className="p-0.5 hover:bg-slate-300 rounded-full transition-colors"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </span>
                        ))
                    ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                            {placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="bg-white border border-slate-200 rounded-md shadow-xl animate-in fade-in zoom-in duration-150 origin-top overflow-hidden flex flex-col"
                >
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white shrink-0">
                        <Search className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="w-full text-[11px] font-medium placeholder:text-slate-400 focus:outline-none bg-transparent"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                                className="p-1 hover:bg-slate-100 rounded-full shrink-0"
                            >
                                <X className="w-3 h-3 text-slate-400" />
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200 flex-1 overscroll-contain">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleOptionToggle(option.value)}
                                    className={`
                                        flex items-center justify-between w-full px-3 py-2 text-left transition-colors cursor-pointer
                                        ${value.includes(option.value) ? 'bg-primary-50' : 'hover:bg-slate-50'}
                                    `}
                                >
                                    <div className="flex flex-col gap-0.5 pointer-events-none text-left">
                                        <span className={`text-[11px] font-black uppercase tracking-tight ${value.includes(option.value) ? 'text-primary-900' : 'text-slate-700'}`}>
                                            {option.label}
                                        </span>
                                        {option.description && (
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                {option.description}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`
                                        w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ml-2
                                        ${value.includes(option.value) ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-300'}
                                    `}>
                                        {value.includes(option.value) && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                No results found
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {error && <span className="text-[10px] text-red-500 font-bold mt-1 block">{error}</span>}
        </div>
    );
};
