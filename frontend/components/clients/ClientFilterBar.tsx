import React from 'react';
import { Filter, X } from 'lucide-react';

interface ClientFilterBarProps {
    filters: {
        clientType: string;
        status: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
}

export function ClientFilterBar({ filters, onFilterChange, onClearFilters }: ClientFilterBarProps) {
    const hasActiveFilters = filters.clientType !== '' || filters.status !== '';

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center text-sm font-medium text-gray-700">
                    <Filter size={16} className="mr-2" />
                    Filters:
                </div>

                <select
                    value={filters.clientType}
                    onChange={(e) => onFilterChange('clientType', e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                    <option value="">All Types</option>
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="partner">Partner</option>
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

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
