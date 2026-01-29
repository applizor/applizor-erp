import React from 'react';
import { Filter, X } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface QuotationFilterBarProps {
    filters: {
        status: string;
        clientId: string;
    };
    clients: Array<{ id: string; name: string }>;
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
}

export function QuotationFilterBar({ filters, clients, onFilterChange, onClearFilters }: QuotationFilterBarProps) {
    const hasActiveFilters = filters.status !== '' || filters.clientId !== '';

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center text-sm font-medium text-gray-700">
                    <Filter size={16} className="mr-2" />
                    Filters:
                </div>

                <CustomSelect
                    value={filters.status}
                    onChange={(val) => onFilterChange('status', val)}
                    options={[
                        { label: 'All Status', value: '' },
                        { label: 'Draft', value: 'draft' },
                        { label: 'Sent', value: 'sent' },
                        { label: 'Accepted', value: 'accepted' },
                        { label: 'Rejected', value: 'rejected' },
                        { label: 'Expired', value: 'expired' }
                    ]}
                    placeholder="All Status"
                    className="w-[180px]"
                />

                <CustomSelect
                    value={filters.clientId}
                    onChange={(val) => onFilterChange('clientId', val)}
                    options={[
                        { label: 'All Clients', value: '' },
                        ...clients.map(client => ({ label: client.name, value: client.id }))
                    ]}
                    placeholder="All Clients"
                    className="w-[200px]"
                />

                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <X size={14} className="mr-1" />
                        Clear Filters
                    </button>
                )}

                {hasActiveFilters && (
                    <div className="text-sm text-gray-500">
                        {Object.values(filters).filter(v => v !== '').length} filter(s) active
                    </div>
                )}
            </div>
        </div>
    );
}
