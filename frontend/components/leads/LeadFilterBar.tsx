import { CustomSelect } from '@/components/ui/CustomSelect';
import { Filter, X } from 'lucide-react';

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
                    <CustomSelect
                        value={filters.status}
                        onChange={(val) => onFilterChange('status', val)}
                        options={[
                            { label: 'Status: All', value: '' },
                            { label: 'Raw Inquiry', value: 'new' },
                            { label: 'Discovery', value: 'contacted' },
                            { label: 'Qualified', value: 'qualified' },
                            { label: 'Proposal', value: 'proposal' },
                            { label: 'Negotiation', value: 'negotiation' },
                            { label: 'Secured', value: 'won' },
                            { label: 'Shelved', value: 'lost' }
                        ]}
                        placeholder="Status: All"
                        className="w-full"
                    />
                </div>

                <div className="relative">
                    <CustomSelect
                        value={filters.priority}
                        onChange={(val) => onFilterChange('priority', val)}
                        options={[
                            { label: 'Priority: All', value: '' },
                            { label: 'Low', value: 'low' },
                            { label: 'Standard', value: 'medium' },
                            { label: 'Critical', value: 'high' }
                        ]}
                        placeholder="Priority: All"
                        className="w-full"
                    />
                </div>

                <div className="relative">
                    <CustomSelect
                        value={filters.source}
                        onChange={(val) => onFilterChange('source', val)}
                        options={[
                            { label: 'Source: All', value: '' },
                            { label: 'Web Portal', value: 'website' },
                            { label: 'Referral', value: 'referral' },
                            { label: 'LinkedIn', value: 'linkedin' },
                            { label: 'Cold Protocol', value: 'cold_call' },
                            { label: 'Misc.', value: 'other' }
                        ]}
                        placeholder="Source: All"
                        className="w-full"
                    />
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
