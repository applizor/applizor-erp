import React from 'react';
import { Filter, X } from 'lucide-react';

interface InvoiceFilterBarProps {
    filters: {
        status: string;
        clientId: string;
    };
    clients: Array<{ id: string; name: string }>;
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
}

export function InvoiceFilterBar({ filters, clients, onFilterChange, onClearFilters }: InvoiceFilterBarProps) {
    const hasActiveFilters = filters.status !== '' || filters.clientId !== '';

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center text-sm font-medium text-gray-700">
                    <Filter size={16} className="mr-2" />
                    Filters:
                </div>

                <select
                    value={filters.status}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partially Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <select
                    value={filters.clientId}
                    onChange={(e) => onFilterChange('clientId', e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                    <option value="">All Clients</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
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
