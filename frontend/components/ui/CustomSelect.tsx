"use client"

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SelectOption {
    label: string;
    value: string;
    description?: string;
    icon?: React.ReactNode;
}

interface CustomSelectProps {
    options: SelectOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    searchable?: boolean;
    className?: string;
    align?: 'left' | 'right';
    portal?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    error,
    disabled = false,
    searchable = true,
    className = '',
    align = 'left',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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

        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };

        const handleResize = () => {
            if (isOpen) setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen, searchable]);

    const handleToggle = () => {
        if (!disabled) {
            if (!isOpen && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDropdownStyle({
                    position: 'absolute',
                    top: rect.bottom + window.scrollY + 4,
                    left: align === 'right' ? (rect.right + window.scrollX) : (rect.left + window.scrollX),
                    width: Math.max(rect.width, 240), // Standard min-width
                    transform: align === 'right' ? 'translateX(-100%)' : 'none',
                    zIndex: 9999,
                });
            }
            setIsOpen(!isOpen);
        }
    };

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="ent-label mb-1.5 block">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`
                    flex items-center justify-between w-full h-10 px-3 py-2
                    bg-white border rounded-md text-xs font-bold transition-all duration-200
                    ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-slate-200'}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-slate-300'}
                    ${error ? 'border-red-500' : ''}
                    text-slate-900
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && selectedOption.icon}
                    <span className={!selectedOption ? 'text-slate-400 font-medium' : ''}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={dropdownStyle}
                    className="bg-white border border-slate-200 rounded-md shadow-xl animate-in fade-in zoom-in duration-150 origin-top overflow-hidden"
                >
                    {searchable && (
                        <div className="p-2 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white">
                            <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full text-[11px] font-medium placeholder:text-slate-400 focus:outline-none bg-transparent"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchTerm && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                                    className="p-1 hover:bg-slate-100 rounded-full"
                                >
                                    <X className="w-3 h-3 text-slate-400" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        flex items-center justify-between w-full px-3 py-2 text-left transition-colors
                                        ${value === option.value ? 'bg-primary-50 text-primary-900' : 'text-slate-700 hover:bg-slate-50'}
                                    `}
                                >
                                    <div className="flex flex-col gap-0.5 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            {option.icon && option.icon}
                                            <span className="text-[11px] font-black uppercase tracking-tight truncate">
                                                {option.label}
                                            </span>
                                        </div>
                                        {option.description && (
                                            <span className="text-[9px] text-slate-400 font-medium truncate">
                                                {option.description}
                                            </span>
                                        )}
                                    </div>
                                    {value === option.value && (
                                        <Check className="w-3.5 h-3.5 text-primary-600 shrink-0 ml-2" />
                                    )}
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
