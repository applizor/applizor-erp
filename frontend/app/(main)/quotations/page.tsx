'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Eye, Trash2, FileText, Download, Briefcase } from 'lucide-react';
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
        <div className="animate-fade-in pb-20 space-y-6">
            {/* Standardized Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Proposal Ledger</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">Executive management of strategic quotations and business proposals.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <PermissionGuard module="Lead" action="create">
                        <Link
                            href="/quotations/create"
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={14} /> Draft Proposal
                        </Link>
                    </PermissionGuard>
                </div>
            </div>

            {/* Global Search & Filtration Area */}
            <div className="space-y-6 px-1">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 glass p-1.5 rounded-md border border-slate-100/50 shadow-sm focus-within:border-primary-500/50 transition-all">
                        <div className="relative flex items-center">
                            <Search size={16} className="absolute left-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Query by document serial or client identity..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-slate-900 text-xs font-bold placeholder:text-slate-300 placeholder:font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <QuotationFilterBar
                    filters={filters}
                    clients={clients}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />

                {/* Content Engine */}
                <div>
                    {loading ? (
                        <QuotationListSkeleton />
                    ) : quotations.length === 0 ? (
                        <QuotationEmptyState />
                    ) : (
                        <div className="ent-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="ent-table">
                                    <thead>
                                        <tr>
                                            <th>Serial ID</th>
                                            <th>Counterparty</th>
                                            <th>Issuance</th>
                                            <th>Expiration</th>
                                            <th>Financial Value</th>
                                            <th>Exposure</th>
                                            <th>Lifecycle State</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {quotations.map((quotation) => (
                                            <tr key={quotation.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-xs font-black text-slate-900 tracking-tight">
                                                        {quotation.quotationNumber}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-xs font-black text-slate-700">
                                                        {quotation.lead?.name || quotation.client?.name || '-'}
                                                    </div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {quotation.lead ? 'Lead Entity' : 'Client Registry'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-500">
                                                    {new Date(quotation.quotationDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-500">
                                                    {new Date(quotation.validUntil).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-black text-slate-900 tracking-tighter">
                                                    {formatCurrency(quotation.total)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-500">
                                                    <div className="flex items-center" title={quotation.lastViewedAt ? `Last viewed: ${new Date(quotation.lastViewedAt).toLocaleString()}` : 'No exposure recorded'}>
                                                        <Eye size={14} className="mr-1.5 text-slate-300 group-hover:text-primary-500 transition-colors" />
                                                        <span className="font-black text-slate-600">{quotation.viewCount || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`ent-badge ${getStatusBadge(quotation.status)}`}>
                                                        {quotation.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/quotations/${quotation.id}`}
                                                            className="p-1.5 bg-white border border-slate-100 text-primary-600 hover:text-white hover:bg-primary-600 rounded-md transition-all shadow-sm"
                                                            title="Strategic Intelligence"
                                                        >
                                                            <Eye size={14} />
                                                        </Link>
                                                        <PermissionGuard module="Quotation" action="delete">
                                                            <button
                                                                onClick={() => handleDeleteClick(quotation)}
                                                                className="p-1.5 bg-white border border-slate-100 text-rose-500 hover:text-white hover:bg-rose-500 rounded-md transition-all shadow-sm"
                                                                title="Purge Entry"
                                                            >
                                                                <Trash2 size={14} />
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
            </div>
        </div>
    );
}
