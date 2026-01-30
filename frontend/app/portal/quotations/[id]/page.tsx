'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle2, FileText, ArrowLeft, Download, Info, ShieldCheck } from 'lucide-react';

export default function QuotationDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/portal/quotations/${params.id}`)
            .then((res: any) => {
                setQuotation(res.data.quotation);
            })
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, [params.id]);

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get(`/portal/quotations/${params.id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation-${quotation.quotationNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('PDF download failed', error);
        }
    };

    if (loading) return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-slate-100 rounded mb-4"></div>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                    <div className="h-96 bg-slate-100 rounded-lg w-full"></div>
                </div>
                <div className="w-full md:w-80 space-y-6">
                    <div className="h-32 bg-slate-100 rounded-lg w-full"></div>
                </div>
            </div>
        </div>
    );

    if (!quotation) return <div>Quotation not found</div>;

    const getStatusColor = (status: string) => {
        if (status === 'accepted') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (status === 'rejected') return 'text-rose-600 bg-rose-50 border-rose-200';
        if (status === 'expired') return 'text-slate-600 bg-slate-50 border-slate-200';
        return 'text-amber-600 bg-amber-50 border-amber-200';
    };

    return (
        <div className="animate-fade-in space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
            >
                <ArrowLeft size={16} className="mr-1" />
                Back to Quotations
            </button>

            <div className="flex flex-col md:flex-row gap-6">

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    <div className="ent-card p-0 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                    QUOTATION
                                </h1>
                                <p className="text-sm font-medium text-slate-500 mt-1">
                                    #{quotation.quotationNumber}
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest border ${getStatusColor(quotation.status)}`}>
                                {quotation.status}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-6 grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Prepared For</h3>
                                <p className="text-sm font-bold text-slate-900">{quotation.lead?.name || 'Client'}</p>
                                <p className="text-xs text-slate-500 mt-1">{quotation.lead?.company}</p>
                                <p className="text-xs text-slate-500">{quotation.lead?.email}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dates</h3>
                                <p className="text-sm text-slate-700">
                                    <span className="text-slate-400 mr-2">Date:</span>
                                    {new Date(quotation.quotationDate).toLocaleDateString()}
                                </p>
                                {quotation.validUntil && (
                                    <p className="text-sm text-slate-700">
                                        <span className="text-slate-400 mr-2">Valid Until:</span>
                                        {new Date(quotation.validUntil).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border-t border-slate-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Description</th>
                                        <th className="px-6 py-3 text-center">Qty</th>
                                        <th className="px-6 py-3 text-right">Price</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quotation.items.map((item: any, i: number) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4 font-medium text-slate-900">{item.description}</td>
                                            <td className="px-6 py-4 text-center text-slate-600">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(item.unitPrice))}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(item.quantity * item.unitPrice))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="p-6 bg-slate-50/30 border-t border-slate-100">
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Subtotal</span>
                                        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(quotation.subtotal))}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                                        <span>Total</span>
                                        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(quotation.total))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="w-full md:w-80 space-y-6">
                    <div className="ent-card p-6 space-y-4">
                        <button
                            onClick={handleDownloadPdf}
                            className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                        >
                            <Download size={18} className="mr-2" />
                            Download PDF
                        </button>
                    </div>

                    {(quotation.notes || quotation.terms) && (
                        <div className="ent-card p-6 space-y-4 text-sm text-slate-600">
                            {quotation.notes && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">Notes</h4>
                                    <p>{quotation.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
