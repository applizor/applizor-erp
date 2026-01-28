'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Eye, Edit, Trash2, LayoutGrid, ChevronRight, ArrowLeft, ArrowRight, Activity, Filter, FileText, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import { LeadListSkeleton } from '@/components/leads/LeadListSkeleton';
import { LeadEmptyState } from '@/components/leads/LeadEmptyState';
import { LeadFilterBar } from '@/components/leads/LeadFilterBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useCurrency } from '@/context/CurrencyContext';
import PageHeader from '@/components/ui/PageHeader';

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
            toast.success('Opportunity purged from registry');
            setDeleteDialog({ isOpen: false, leadId: null, leadName: '' });
            fetchLeads(pagination.page, search, filters);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Purge protocol failed');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            won: 'ent-badge-success',
            lost: 'ent-badge-danger',
            proposal: 'ent-badge-warning',
            qualified: 'ent-badge-primary',
            negotiation: 'ent-badge-warning',
        };
        return statusMap[status] || 'ent-badge-info';
    };

    const getPriorityBadge = (priority: string) => {
        return priority === 'high' || priority === 'urgent' ? 'ent-badge-danger' : 'ent-badge-primary';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            {/* Header */}
            <PageHeader
                title="Opportunity Pipeline"
                subtitle="Revenue Acquisition Stream > Registry Management"
                icon={TrendingUp}
                actions={
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex bg-gray-100 p-1 rounded-md font-black text-[9px] uppercase tracking-widest">
                            <Link
                                href="/leads/kanban"
                                className="px-4 py-2 text-gray-400 hover:text-gray-600 rounded-md flex items-center gap-2 transition-all"
                            >
                                Board View
                            </Link>
                            <button className="px-4 py-2 bg-white text-primary-600 shadow-sm rounded-md flex items-center gap-2 border border-gray-200">
                                Ledger
                            </button>
                        </div>
                        <PermissionGuard module="Lead" action="create">
                            <Link
                                href="/leads/create"
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={14} /> Acquire Lead
                            </Link>
                        </PermissionGuard>
                    </div>
                }
            />

            {/* Global Search & Filtration */}
            <div className="mx-2 space-y-4">
                <div className="ent-card p-4 border-primary-100/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="QUERY BY IDENTITY, COMPANY, OR CONTACT PROTOCOL..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ent-input w-full pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest"
                        />
                    </div>
                </div>

                <div className="bg-white/50 rounded-md p-1">
                    <LeadFilterBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                </div>
            </div>

            {/* Content Engine */}
            <div className="mx-2">
                {loading ? (
                    <LeadListSkeleton />
                ) : leads.length === 0 ? (
                    <LeadEmptyState />
                ) : (
                    <div className="ent-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="ent-table">
                                <thead>
                                    <tr>
                                        <th>Prospect Identity</th>
                                        <th>Contact Protocol</th>
                                        <th>Corporate Entity</th>
                                        <th>Pipeline Stage</th>
                                        <th>Priority</th>
                                        <th>Origin</th>
                                        <th>Valuation</th>
                                        <th className="text-right">Action Protocol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr key={lead.id}>
                                            <td className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-500 border border-gray-200 uppercase">
                                                    {lead.name?.charAt(0).toUpperCase() || 'L'}
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-black text-gray-900 uppercase leading-none">
                                                        {lead.name}
                                                    </div>
                                                    {lead.jobTitle && (
                                                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{lead.jobTitle}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-[10px] font-black text-gray-600 lowercase">{lead.email || '-'}</div>
                                                <div className="text-[9px] font-bold text-gray-400 mt-0.5">{lead.phone || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{lead.company || '-'}</div>
                                            </td>
                                            <td>
                                                <span className={`ent-badge ${getStatusBadge(lead.status)}`}>
                                                    {lead.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`ent-badge ${getPriorityBadge(lead.priority)}`}>
                                                    {lead.priority?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{lead.source || 'ORGANIC'}</div>
                                            </td>
                                            <td>
                                                <div className="text-[12px] font-black text-gray-900 tracking-tight">
                                                    {lead.value ? formatCurrency(parseFloat(lead.value)) : '-'}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-2 px-2">
                                                    <Link
                                                        href={`/leads/${lead.id}`}
                                                        className="p-2 text-gray-400 hover:text-primary-600 transition-all rounded-md hover:bg-gray-50"
                                                        title="Discovery"
                                                    >
                                                        <Eye size={14} />
                                                    </Link>
                                                    <PermissionGuard module="Lead" action="update">
                                                        <Link
                                                            href={`/leads/${lead.id}/edit`}
                                                            className="p-2 text-gray-400 hover:text-primary-600 transition-all rounded-md hover:bg-gray-50"
                                                            title="Edit Intel"
                                                        >
                                                            <Edit size={14} />
                                                        </Link>
                                                    </PermissionGuard>
                                                    <PermissionGuard module="Lead" action="delete">
                                                        <button
                                                            onClick={() => handleDeleteClick(lead)}
                                                            className="p-2 text-gray-400 hover:text-rose-600 transition-all rounded-md hover:bg-gray-50"
                                                            title="Terminate"
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

                        {/* Pagination Engine */}
                        {pagination.totalPages > 1 && (
                            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Displaying <span className="text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> Identified Entities
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="p-2 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <div className="px-4 py-1.5 bg-white border border-gray-200 rounded-md text-[10px] font-black text-gray-900 uppercase">
                                        Page {pagination.page} / {pagination.totalPages}
                                    </div>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="p-2 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                                    >
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <ConfirmDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog({ isOpen: false, leadId: null, leadName: '' })}
                    onConfirm={handleDeleteConfirm}
                    title="Confirm Opportunity Purge"
                    message={`Are you sure you want to terminate intellectual record for "${deleteDialog.leadName}"? This protocol is irreversible.`}
                    confirmText="Confirm Delete"
                    type="danger"
                    isLoading={deleting}
                />
            </div>
        </div>
    );
}
