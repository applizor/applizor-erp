import React from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

interface LeadFilterBarProps {
    filters: {
        status: string;
        source: string;
        priority: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
}

export function LeadFilterBar({ filters, onFilterChange, onClearFilters }: LeadFilterBarProps) {
    const hasActiveFilters = filters.status !== '' || filters.source !== '' || filters.priority !== '';

    return (
        <div className="ent-card p-3 flex flex-col md:flex-row items-center gap-3 bg-white/80 backdrop-blur border-primary-100/50">
            <div className="flex items-center gap-2 px-2 border-r border-gray-100 min-w-max">
                <Filter size={14} className="text-primary-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">FILTERS</span>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                <div className="relative">
                    <select
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        className="ent-input w-full py-1.5 text-[10px] font-bold uppercase tracking-wide appearance-none"
                    >
                        <option value="">Status: All</option>
                        <option value="new">Raw Inquiry</option>
                        <option value="contacted">Discovery</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="won">Secured</option>
                        <option value="lost">Shelved</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                    <select
                        value={filters.priority}
                        onChange={(e) => onFilterChange('priority', e.target.value)}
                        className="ent-input w-full py-1.5 text-[10px] font-bold uppercase tracking-wide appearance-none"
                    >
                        <option value="">Priority: All</option>
                        <option value="low">Low</option>
                        <option value="medium">Standard</option>
                        <option value="high">Critical</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                    <select
                        value={filters.source}
                        onChange={(e) => onFilterChange('source', e.target.value)}
                        className="ent-input w-full py-1.5 text-[10px] font-bold uppercase tracking-wide appearance-none"
                    >
                        <option value="">Source: All</option>
                        <option value="website">Web Portal</option>
                        <option value="referral">Referral</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="cold_call">Cold Protocol</option>
                        <option value="other">Misc.</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {hasActiveFilters && (
                <button
                    onClick={onClearFilters}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                    <X size={12} />
                    Reset
                </button>
            )}
        </div>
    );
}
