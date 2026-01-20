'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building2, FileText, Calendar } from 'lucide-react';
import { clientsApi } from '@/lib/api/clients';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ClientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const { can } = usePermission();
    const [client, setClient] = useState<any>(null);
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
            const response = await clientsApi.getById(id);
            // Backend returns { client: {...} }
            setClient(response.client || response);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to load client');
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
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!client) {
        return null;
    }

    const getClientTypeBadge = (type: string) => {
        const styles = {
            customer: 'bg-blue-100 text-blue-800',
            vendor: 'bg-purple-100 text-purple-800',
            partner: 'bg-green-100 text-green-800'
        };
        return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    const getStatusBadge = (status: string) => {
        return status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/clients"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Clients
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-2xl">
                                {client.name?.charAt(0).toUpperCase() || 'C'}
                            </span>
                        </div>
                        <div className="ml-4">
                            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getClientTypeBadge(client.clientType)}`}>
                                    {client.clientType}
                                </span>
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(client.status)}`}>
                                    {client.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <PermissionGuard module="Client" action="update">
                            <Link
                                href={`/clients/${client.id}/edit`}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <Edit size={16} className="mr-2" />
                                Edit
                            </Link>
                        </PermissionGuard>
                        <PermissionGuard module="Client" action="delete">
                            <button
                                onClick={() => setDeleteDialog(true)}
                                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </button>
                        </PermissionGuard>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Mail className="mr-2 text-primary-600" size={20} />
                            Contact Information
                        </h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{client.email || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                <dd className="mt-1 text-sm text-gray-900">{client.phone || '-'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Address */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <MapPin className="mr-2 text-primary-600" size={20} />
                            Address
                        </h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Street Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{client.address || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">City</dt>
                                <dd className="mt-1 text-sm text-gray-900">{client.city || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">State</dt>
                                <dd className="mt-1 text-sm text-gray-900">{client.state || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Country</dt>
                                <dd className="mt-1 text-sm text-gray-900">{client.country || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Pincode</dt>
                                <dd className="mt-1 text-sm text-gray-900">{client.pincode || '-'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Business Details */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Building2 className="mr-2 text-primary-600" size={20} />
                            Business Details
                        </h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">GSTIN</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">{client.gstin || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">PAN</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">{client.pan || '-'}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total Quotations</span>
                                <span className="text-lg font-semibold text-gray-900">0</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total Invoices</span>
                                <span className="text-lg font-semibold text-gray-900">0</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Outstanding</span>
                                <span className="text-lg font-semibold text-green-600">₹0</span>
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Calendar className="mr-2 text-primary-600" size={20} />
                            Information
                        </h2>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(client.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(client.updatedAt).toLocaleDateString('en-IN', {
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
