'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { clientsApi } from '@/lib/api/clients';
import { invoicesApi } from '@/lib/api/invoices';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateInvoicePage() {
    const toast = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [fetchingClients, setFetchingClients] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const response = await clientsApi.getAll({ limit: 100 });
            setClients(response.clients || []);
        } catch (error) {
            console.error('Failed to load clients');
            toast.error('Could not load clients list');
        } finally {
            setFetchingClients(false);
        }
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            await invoicesApi.create(values);
            toast.success(`${values.type === 'quotation' ? 'Quotation' : 'Invoice'} created successfully!`);
            router.push('/invoices');
            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create document');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header Section */}
                <div className="mb-8">
                    <Link
                        href="/invoices"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors mb-4 group"
                    >
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Invoices
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create New Document</h1>
                            <p className="mt-1 text-sm text-gray-500">Draft professional invoices and quotations for your clients</p>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                {fetchingClients ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-gray-500 font-medium">Loading dependencies...</p>
                    </div>
                ) : (
                    <InvoiceForm clients={clients} onSubmit={handleSubmit} loading={loading} />
                )}
            </div>
        </div>
    );
}
