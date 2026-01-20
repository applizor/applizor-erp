import React from 'react';
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
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                </select>

                <select
                    value={filters.source}
                    onChange={(e) => onFilterChange('source', e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                    <option value="">All Sources</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social-media">Social Media</option>
                    <option value="cold-call">Cold Call</option>
                    <option value="email">Email</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                </select>

                <select
                    value={filters.priority}
                    onChange={(e) => onFilterChange('priority', e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
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
