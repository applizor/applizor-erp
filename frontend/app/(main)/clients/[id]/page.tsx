'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building2, FileText, Calendar } from 'lucide-react';
import { clientsApi } from '@/lib/api/clients';
import { quotationsApi } from '@/lib/api/quotations';
import { invoicesApi } from '@/lib/api/invoices';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { useCurrency } from '@/context/CurrencyContext';
import { ClientQuotationsDialog } from '@/components/clients/ClientQuotationsDialog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

export default function ClientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const { can } = usePermission();
    const { formatCurrency } = useCurrency();
    const [client, setClient] = useState<any>(null);
    const [stats, setStats] = useState({
        quotationsCount: 0,
        invoicesCount: 0,
        outstandingBalance: 0
    });
    const [quotationsList, setQuotationsList] = useState<any[]>([]);
    const [showQuotationsDialog, setShowQuotationsDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadClient(params.id as string);
        }
    }, [params.id]);

    const loadClient = async (id: string) => {
        try {
            setLoading(true);
            const [clientRes, quotationsRes, invoicesRes] = await Promise.all([
                clientsApi.getById(id),
                quotationsApi.getAll({ clientId: id, limit: 1000 }).catch(() => ({ quotations: [] })),
                invoicesApi.getAll({ clientId: id, limit: 1000 }).catch(() => ({ invoices: [] }))
            ]);

            // Backend returns { client: {...} }
            setClient(clientRes.client || clientRes);

            // Calculate Metrics
            const quotations = quotationsRes.quotations || [];
            setQuotationsList(quotations);
            const invoices = invoicesRes.invoices || [];

            const outstanding = invoices.reduce((sum: number, inv: any) => {
                if (inv.status !== 'paid' && inv.status !== 'void' && inv.status !== 'cancelled') {
                    return sum + (inv.total - (inv.paidAmount || 0));
                }
                return sum;
            }, 0);

            setStats({
                quotationsCount: quotations.length,
                invoicesCount: invoices.length,
                outstandingBalance: outstanding
            });

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to load client data');
            router.push('/clients');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!client) return;

        setDeleting(true);
        try {
            await clientsApi.delete(client.id);
            toast.success('Client deleted successfully');
            router.push('/clients');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete client');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProfileSkeleton />
            </div>
        );
    }

    if (!client) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary-900 rounded-md shadow-xl shadow-primary-900/20 relative overflow-hidden w-16 h-16 flex items-center justify-center">
                        {client.profilePicture ? (
                            <img
                                src={`${SERVER_URL}${client.profilePicture}`}
                                alt={client.name}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white font-black text-2xl">
                                {client.name?.charAt(0).toUpperCase() || 'C'}
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/clients"
                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 transition-colors flex items-center gap-1"
                            >
                                <ArrowLeft size={10} /> Registry
                            </Link>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">{client.name}</h1>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`ent-badge ${client.clientType === 'customer' ? 'ent-badge-primary' : 'ent-badge-neutral'}`}>
                                {client.clientType}
                            </span>
                            <span className={`ent-badge ${client.status === 'active' ? 'ent-badge-success' : 'ent-badge-danger'}`}>
                                {client.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <PermissionGuard module="Client" action="update">
                        <Link
                            href={`/clients/${client.id}/edit`}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:text-primary-600 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Edit size={14} /> Modify
                        </Link>
                    </PermissionGuard>
                    <PermissionGuard module="Client" action="delete">
                        <button
                            onClick={() => setDeleteDialog(true)}
                            className="px-4 py-2 bg-white border border-rose-100 text-rose-600 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Trash2 size={14} /> Purge
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact Information */}
                    <div className="ent-card p-6">
                        <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                            <Mail className="w-4 h-4 text-primary-600" />
                            Communication Protocols
                        </h2>
                        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="ent-form-group">
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Digital Address</dt>
                                <dd className="text-sm font-bold text-gray-900">{client.email || '-'}</dd>
                            </div>
                            <div className="ent-form-group">
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Telephony</dt>
                                <dd className="text-sm font-bold text-gray-900 font-mono">{client.phone || '-'}</dd>
                            </div>
                            <div className="ent-form-group">
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Mobile</dt>
                                <dd className="text-sm font-bold text-gray-900 font-mono">{client.mobile || '-'}</dd>
                            </div>
                            <div className="ent-form-group">
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Website</dt>
                                <dd className="text-sm font-bold text-primary-600">
                                    {client.website ? (
                                        <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                            {client.website}
                                        </a>
                                    ) : '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Address */}
                    <div className="ent-card p-6">
                        <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                            <MapPin className="w-4 h-4 text-primary-600" />
                            Geographic Coordinates
                        </h2>
                        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="sm:col-span-4 lg:col-span-4">
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Street Location</dt>
                                <dd className="text-sm font-bold text-gray-900">{client.address || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">City / Metro</dt>
                                <dd className="text-sm font-bold text-gray-900">{client.city || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">State / Province</dt>
                                <dd className="text-sm font-bold text-gray-900">{client.state || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Nation</dt>
                                <dd className="text-sm font-bold text-gray-900">{client.country || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Postal Code</dt>
                                <dd className="text-sm font-bold text-gray-900 font-mono">{client.pincode || '-'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Business Details */}
                    <div className="ent-card p-6">
                        <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                            <Building2 className="w-4 h-4 text-primary-600" />
                            Fiscal Identity
                        </h2>
                        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Company Name</dt>
                                <dd className="text-sm font-bold text-gray-900">{client.companyName || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Tax Name</dt>
                                <dd className="text-sm font-bold text-gray-900">{client.taxName || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">GSTIN Identifier</dt>
                                <dd className="text-sm font-bold text-gray-900 font-mono bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 inline-block">{client.gstin || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">PAN Reference</dt>
                                <dd className="text-sm font-bold text-gray-900 font-mono bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 inline-block">{client.pan || 'N/A'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Notes */}
                    {client.notes && (
                        <div className="ent-card p-6">
                            <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                Internal Notes
                            </h2>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.notes}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="ent-card p-6">
                        <h2 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-tight">Performance Metrics</h2>
                        <div className="space-y-4">
                            <div
                                onClick={() => setShowQuotationsDialog(true)}
                                className="flex items-center justify-between p-3 bg-primary-50/50 rounded-md border border-primary-100 cursor-pointer hover:bg-primary-50 transition-colors group"
                            >
                                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest group-hover:text-primary-700 transition-colors">Quotations Generated</span>
                                <span className="text-lg font-black text-gray-900 group-hover:text-primary-900 transition-colors">{stats.quotationsCount}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-violet-50/50 rounded-md border border-violet-100">
                                <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Invoices Issued</span>
                                <span className="text-lg font-black text-gray-900">{stats.invoicesCount}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-md border border-emerald-100">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Outstanding Balance</span>
                                <span className="text-lg font-black text-emerald-700">{formatCurrency(stats.outstandingBalance)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Company Logo */}
                    {client.companyLogo && (
                        <div className="ent-card p-6 flex flex-col items-center justify-center">
                            <h2 className="text-sm font-black text-gray-900 mb-4 w-full uppercase tracking-tight">Organization Identity</h2>
                            <div className="w-full relative flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                                <img
                                    src={`${SERVER_URL}${client.companyLogo}`}
                                    alt="Company Logo"
                                    className="max-w-full max-h-32 object-contain"
                                />
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="ent-card p-6">
                        <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            System Metadata
                        </h2>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Record Inception</dt>
                                <dd className="text-xs font-bold text-gray-900 font-mono">
                                    {new Date(client.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Last Modification</dt>
                                <dd className="text-xs font-bold text-gray-900 font-mono">
                                    {new Date(client.updatedAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Client Quotations Dialog */}
            <ClientQuotationsDialog
                isOpen={showQuotationsDialog}
                onClose={() => setShowQuotationsDialog(false)}
                quotations={quotationsList}
                clientName={client.name}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Delete Client"
                message={`Are you sure you want to delete "${client.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={deleting}
            />
        </div>
    );
}
