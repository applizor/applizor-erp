'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { clientsApi } from '@/lib/api/clients';
import { invoicesApi } from '@/lib/api/invoices';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { ArrowLeft, Receipt, FileText } from 'lucide-react';
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
            toast.error('Could not load client registry');
        } finally {
            setFetchingClients(false);
        }
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            await invoicesApi.create(values);
            toast.success(`${values.type === 'quotation' ? 'Quotation' : 'Invoice'} committed to registry.`);
            router.push('/invoices');
            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Transaction commitment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Contextual Navigation */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        href="/invoices"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                        title="Return to Ledger"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 leading-none">
                            <Receipt className="w-5 h-5 text-primary-600" />
                            Document Generation
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Initiating new commercial transaction record</p>
                    </div>
                </div>
            </div>

            {/* Principal Interface */}
            <div className="ent-card p-6">
                {fetchingClients ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing dependency data...</p>
                    </div>
                ) : (
                    <InvoiceForm clients={clients} onSubmit={handleSubmit} loading={loading} />
                )}
            </div>
        </div>
    );
}
