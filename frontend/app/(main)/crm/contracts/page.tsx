'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Search, Filter, FileText, Calendar, User, MoreVertical, Edit, Trash, Eye, Download, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/lib/auth';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function ContractsList() {
    const { user } = useAuth();
    const toast = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [contracts, setContracts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Delete Dialog State
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const res = await api.get('/contracts');
            setContracts(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load contracts');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteDialog({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.id) return;
        try {
            await api.delete(`/contracts/${deleteDialog.id}`);
            toast.success('Contract deleted');
            fetchContracts();
        } catch (error) {
            toast.error('Failed to delete contract');
        } finally {
            setDeleteDialog({ isOpen: false, id: null });
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            draft: 'ent-badge ent-badge-neutral',
            sent: 'ent-badge ent-badge-info',
            viewed: 'ent-badge ent-badge-warning',
            signed: 'ent-badge ent-badge-success',
            expired: 'ent-badge ent-badge-danger',
            cancelled: 'ent-badge bg-gray-100 text-gray-400 border-gray-200'
        };
        return (
            <span className={styles[status] || styles.draft}>
                {status}
            </span>
        );
    };

    const filteredContracts = contracts.filter(c => {
        const matchesSearch =
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.client.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in my-6">
            <PageHeader
                title="Contracts & Agreements"
                subtitle="Manage legal documents and client agreements"
                icon={FileText}
                actions={
                    <div className="flex gap-2">
                        <Link
                            href="/crm/contracts/templates"
                            className="ent-button-secondary gap-2"
                        >
                            <LayoutTemplate size={16} />
                            Templates
                        </Link>
                        <Link
                            href="/crm/contracts/create"
                            className="ent-button-primary"
                        >
                            <Plus size={16} className="mr-2" />
                            Create Contract
                        </Link>
                    </div>
                }
            />

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Contract"
                message="Are you sure you want to delete this contract? This action cannot be undone."
                confirmText="Delete Contract"
                type="danger"
            />

            {/* Filters */}
            <div className="ent-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="SEARCH CONTRACTS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ent-input pl-9"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    {['all', 'draft', 'sent', 'signed', 'expired'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th>Contract Title</th>
                                <th>Client Name</th>
                                <th>Created Date</th>
                                <th>Current Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        No contracts found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map((contract) => (
                                    <tr key={contract.id} className="group">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center text-primary-600">
                                                    <FileText size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{contract.title}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                        BY {contract.creator.firstName}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <p className="font-bold text-slate-900">{contract.client.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{contract.client.company?.name || 'INDIVIDUAL'}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 font-bold text-slate-500">
                                                <Calendar size={12} />
                                                {new Date(contract.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(contract.status)}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {contract.status === 'signed' && (
                                                    <a
                                                        href={`${process.env.NEXT_PUBLIC_API_URL}/contracts/${contract.id}/pdf`}
                                                        target="_blank"
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                        title="Download Signed PDF"
                                                    >
                                                        <Download size={14} />
                                                    </a>
                                                )}
                                                <Link
                                                    href={`/crm/contracts/${contract.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={14} />
                                                </Link>
                                                {contract.status === 'draft' && (
                                                    <Link
                                                        href={`/crm/contracts/${contract.id}/edit`}
                                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={14} />
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteClick(contract.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
