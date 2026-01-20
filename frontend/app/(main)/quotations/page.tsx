'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Eye, Trash2, FileText, Download } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { useCurrency } from '@/context/CurrencyContext';
import { quotationsApi } from '@/lib/api/quotations';
import { PermissionGuard } from '@/components/PermissionGuard';
import { QuotationListSkeleton } from '@/components/quotations/QuotationListSkeleton';
import { QuotationEmptyState } from '@/components/quotations/QuotationEmptyState';
import { QuotationFilterBar } from '@/components/quotations/QuotationFilterBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function QuotationsPage() {
    const router = useRouter();
    const toast = useToast();
    const { can } = usePermission();
    const { formatCurrency } = useCurrency();

    const [quotations, setQuotations] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ status: '', clientId: '' });
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; quotationId: string | null; quotationNumber: string }>({
        isOpen: false,
        quotationId: null,
        quotationNumber: ''
    });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadQuotations();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, filters]);

    const loadClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data.clients || []);
        } catch (error) {
            console.error('Failed to load clients');
        }
    };

    const loadQuotations = async () => {
        try {
            setLoading(true);
            const params: any = { search };
            if (filters.status) params.status = filters.status;
            if (filters.clientId) params.clientId = filters.clientId;

            const data = await quotationsApi.getAll(params);
            setQuotations(data.quotations || []);
        } catch (error) {
            console.error('Failed to load quotations', error);
            toast.error('Failed to load quotations');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ status: '', clientId: '' });
    };

    const handleDeleteClick = (quotation: any) => {
        setDeleteDialog({
            isOpen: true,
            quotationId: quotation.id,
            quotationNumber: quotation.quotationNumber
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.quotationId) return;

        setDeleting(true);
        try {
            await quotationsApi.delete(deleteDialog.quotationId);
            toast.success('Quotation deleted successfully');
            setDeleteDialog({ isOpen: false, quotationId: null, quotationNumber: '' });
            loadQuotations();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete quotation');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            sent: 'bg-blue-100 text-blue-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            expired: 'bg-orange-100 text-orange-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your quotations and proposals
                        {!loading && quotations.length > 0 && (
                            <span className="ml-2 text-primary-600 font-medium">
                                ({quotations.length} total)
                            </span>
                        )}
                    </p>
                </div>
                <PermissionGuard module="Quotation" action="create">
                    <Link
                        href="/quotations/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={18} className="mr-2" />
                        New Quotation
                    </Link>
                </PermissionGuard>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search quotations by number, client name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
            </div>

            {/* Filters */}
            <QuotationFilterBar
                filters={filters}
                clients={clients}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            {/* Content */}
            {loading ? (
                <QuotationListSkeleton />
            ) : quotations.length === 0 ? (
                <QuotationEmptyState />
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quotation #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lead/Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Valid Until
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {quotations.map((quotation) => (
                                    <tr
                                        key={quotation.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {quotation.quotationNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {quotation.lead?.name || quotation.client?.name || '-'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {quotation.lead ? 'Lead' : 'Client'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(quotation.quotationDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(quotation.validUntil).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(quotation.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(quotation.status)}`}>
                                                {quotation.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/quotations/${quotation.id}`}
                                                    className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <PermissionGuard module="Quotation" action="delete">
                                                    <button
                                                        onClick={() => handleDeleteClick(quotation)}
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
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, quotationId: null, quotationNumber: '' })}
                onConfirm={handleDeleteConfirm}
                title="Delete Quotation"
                message={`Are you sure you want to delete quotation "${deleteDialog.quotationNumber}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={deleting}
            />
        </div>
    );
}
