'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { clientsApi } from '@/lib/api/clients';
import { invoicesApi } from '@/lib/api/invoices';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { ArrowLeft, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
    const toast = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clientsRes, invoiceRes] = await Promise.all([
                clientsApi.getAll({ limit: 100 }),
                invoicesApi.getById(params.id)
            ]);
            setClients(clientsRes.clients || []);
            setClients(clientsRes.clients || []);

            // Transform data for form
            const invoice = invoiceRes.invoice;
            const formattedData = {
                ...invoice,
                invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
                dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
                items: invoice.items.map((item: any) => ({
                    description: item.description,
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    unit: item.unit || '',
                    taxRateIds: item.appliedTaxes ? item.appliedTaxes.map((t: any) => t.taxRateId) : [],
                    discount: Number(item.discount || 0),
                    hsnSacCode: item.hsnSacCode || ''
                })),
                discount: Number(invoice.discount || 0),
                clientId: invoice.clientId || '',
                projectId: invoice.projectId || '', // Handle null projectId
                type: invoice.type || 'invoice',
                currency: invoice.currency || 'USD',
                notes: invoice.notes || '',
                terms: invoice.terms || '',
                isRecurring: Boolean(invoice.isRecurring),
                recurringInterval: invoice.recurringInterval || 'monthly',
                recurringStartDate: invoice.recurringStartDate ? new Date(invoice.recurringStartDate).toISOString().split('T')[0] : '',
                recurringEndDate: invoice.recurringEndDate ? new Date(invoice.recurringEndDate).toISOString().split('T')[0] : ''
            };

            setInitialData(formattedData);
        } catch (error) {
            console.error('Failed to load data', error);
            toast.error('Could not load invoice data');
            router.push('/invoices');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            await invoicesApi.update(params.id, values);
            toast.success('Invoice updated successfully');
            router.push('/invoices');
            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading invoice data...</p>
            </div>
        );
    }

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
                            Edit Invoice
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Modifying Invoice {initialData?.invoiceNumber}</p>
                    </div>
                </div>
            </div>

            {/* Principal Interface */}
            <div className="ent-card p-6">
                <InvoiceForm
                    clients={clients}
                    onSubmit={handleSubmit}
                    loading={loading}
                    initialData={initialData}
                />
            </div>
        </div>
    );
}
