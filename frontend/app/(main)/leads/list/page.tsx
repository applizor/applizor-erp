'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import { LeadListSkeleton } from '@/components/leads/LeadListSkeleton';
import { LeadEmptyState } from '@/components/leads/LeadEmptyState';
import { LeadFilterBar } from '@/components/leads/LeadFilterBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useCurrency } from '@/context/CurrencyContext';

export default function LeadsListPage() {
    const router = useRouter();
    const toast = useToast();
    const { can } = usePermission();
    const { formatCurrency } = useCurrency();

    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ status: '', source: '', priority: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; leadId: string | null; leadName: string }>({
        isOpen: false,
        leadId: null,
        leadName: ''
    });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLeads(pagination.page, search, filters);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [pagination.page, search, filters]);

    const fetchLeads = async (page: number, searchQuery: string, currentFilters: typeof filters) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.limit,
                search: searchQuery,
                ...currentFilters
            };
            const response = await api.get('/leads', { params });
            setLeads(response.data.leads || []);
            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch leads');
            toast.error('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleClearFilters = () => {
        setFilters({ status: '', source: '', priority: '' });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleDeleteClick = (lead: any) => {
        setDeleteDialog({
            isOpen: true,
            leadId: lead.id,
            leadName: lead.name
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.leadId) return;

        setDeleting(true);
        try {
            await api.delete(`/leads/${deleteDialog.leadId}`);
            toast.success('Lead deleted successfully');
            setDeleteDialog({ isOpen: false, leadId: null, leadName: '' });
            fetchLeads(pagination.page, search, filters);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete lead');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            new: 'bg-blue-100 text-blue-800',
            contacted: 'bg-purple-100 text-purple-800',
            qualified: 'bg-green-100 text-green-800',
            proposal: 'bg-yellow-100 text-yellow-800',
            negotiation: 'bg-orange-100 text-orange-800',
            won: 'bg-green-100 text-green-800',
            lost: 'bg-red-100 text-red-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-blue-100 text-blue-800',
            high: 'bg-red-100 text-red-800'
        };
        return styles[priority] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your sales pipeline
                        {!loading && leads.length > 0 && (
                            <span className="ml-2 text-primary-600 font-medium">
                                ({pagination.total} total)
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/leads/kanban"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Kanban View
                    </Link>
                    <PermissionGuard module="Lead" action="create">
                        <Link
                            href="/leads/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                        >
                            <Plus size={18} className="mr-2" />
                            New Lead
                        </Link>
                    </PermissionGuard>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search leads by name, email, company or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
            </div>

            {/* Filters */}
            <LeadFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            {/* Content */}
            {loading ? (
                <LeadListSkeleton />
            ) : leads.length === 0 ? (
                <LeadEmptyState />
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Priority
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Value
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <span className="text-primary-600 font-semibold text-sm">
                                                        {lead.name?.charAt(0).toUpperCase() || 'L'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                                                    {lead.jobTitle && (
                                                        <div className="text-xs text-gray-500">{lead.jobTitle}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{lead.email || '-'}</div>
                                            <div className="text-sm text-gray-500">{lead.phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{lead.company || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(lead.priority)}`}>
                                                {lead.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {lead.source || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {lead.value ? formatCurrency(parseFloat(lead.value)) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/leads/${lead.id}`}
                                                    className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <PermissionGuard module="Lead" action="update">
                                                    <Link
                                                        href={`/leads/${lead.id}/edit`}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                </PermissionGuard>
                                                <PermissionGuard module="Lead" action="delete">
                                                    <button
                                                        onClick={() => handleDeleteClick(lead)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                                        </span> of{' '}
                                        <span className="font-medium">{pagination.total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.page === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, leadId: null, leadName: '' })}
                onConfirm={handleDeleteConfirm}
                title="Delete Lead"
                message={`Are you sure you want to delete "${deleteDialog.leadName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={deleting}
            />
        </div>
    );
}
