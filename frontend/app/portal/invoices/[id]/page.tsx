'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FileText, ArrowLeft, Download, CheckCircle2, Clock, Send, Calendar, CreditCard } from 'lucide-react';

export default function InvoiceDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [invoice, setInvoice] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Portal uses the authenticated route that returns timeline and extra details
        api.get(`/portal/invoices/${params.id}`)
            .then((res: any) => {
                setInvoice(res.data.invoice);
                setTimeline(res.data.timeline || []);
            })
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, [params.id]);

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get(`/portal/invoices/${params.id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`);
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
                    <div className="h-64 bg-slate-100 rounded-lg w-full"></div>
                </div>
            </div>
        </div>
    );

    if (!invoice) return <div>Invoice not found</div>;

    const getStatusColor = (status: string) => {
        if (status === 'paid') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (status === 'overdue') return 'text-rose-600 bg-rose-50 border-rose-200';
        if (status === 'sent') return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    return (
        <div className="animate-fade-in space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
            >
                <ArrowLeft size={16} className="mr-1" />
                Back to Invoices
            </button>

            <div className="flex flex-col md:flex-row gap-6">

                {/* Main Invoice Content */}
                <div className="flex-1 space-y-6">
                    <div className="ent-card p-0 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                    INVOICE
                                </h1>
                                <p className="text-sm font-medium text-slate-500 mt-1">
                                    #{invoice.invoiceNumber}
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest border ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-6 grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Billed To</h3>
                                <p className="text-sm font-bold text-slate-900">{invoice.client?.name || 'Client'}</p>
                                <p className="text-xs text-slate-500 mt-1">{invoice.client?.company}</p>
                                <p className="text-xs text-slate-500">{invoice.client?.email}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dates</h3>
                                <p className="text-sm text-slate-700">
                                    <span className="text-slate-400 mr-2">Issue Date:</span>
                                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-slate-700">
                                    <span className="text-slate-400 mr-2">Due Date:</span>
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border-t border-slate-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Description / HSN/SAC</th>
                                        <th className="px-6 py-3 text-center">Qty</th>
                                        <th className="px-6 py-3 text-right">Price</th>
                                        <th className="px-6 py-3 text-right">Disc %</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{item.description}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                    {item.hsnSacCode ? `Code: ${item.hsnSacCode}` : ''}
                                                    {item.unit ? `${item.hsnSacCode ? ' | ' : ''}Unit: ${item.unit}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-600">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(item.rate))}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-rose-500">
                                                {Number(item.discount) > 0 ? `${Number(item.discount)}%` : '--'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(item.amount))}
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
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Gross Subtotal:</span>
                                        <span className="font-bold">{new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(invoice.subtotal))}</span>
                                    </div>

                                    {(() => {
                                        const formatter = new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' });
                                        const itemDiscounts = (invoice.items || []).reduce((acc: number, item: any) => {
                                            const gross = Number(item.quantity) * Number(item.rate);
                                            return acc + (gross * (Number(item.discount || 0) / 100));
                                        }, 0);

                                        if (itemDiscounts > 0) {
                                            return (
                                                <>
                                                    <div className="flex justify-between text-sm text-rose-600">
                                                        <span className="font-bold uppercase tracking-widest text-[9px]">Item Discounts:</span>
                                                        <span className="font-bold">-{formatter.format(itemDiscounts)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-slate-900 border-t border-dashed border-slate-200 pt-1 mt-1 pb-1">
                                                        <span className="font-black uppercase tracking-widest text-[9px]">Taxable Amount:</span>
                                                        <span className="font-black">{formatter.format(Number(invoice.subtotal) - itemDiscounts)}</span>
                                                    </div>
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {(() => {
                                        const taxBreakdown: Record<string, number> = {};
                                        (invoice.items || []).forEach((item: any) => {
                                            const appliedTaxes = item.appliedTaxes;
                                            if (appliedTaxes && appliedTaxes.length > 0) {
                                                appliedTaxes.forEach((tax: any) => {
                                                    const key = `${tax.name} @${Number(tax.percentage)}%`;
                                                    taxBreakdown[key] = (taxBreakdown[key] || 0) + Number(tax.amount);
                                                });
                                            } else if (Number(item.taxRate || item.tax) > 0) {
                                                const rate = Number(item.taxRate || item.tax);
                                                const amount = (Number(item.quantity) * Number(item.rate) * rate) / 100;
                                                const key = `Tax @${rate}%`;
                                                taxBreakdown[key] = (taxBreakdown[key] || 0) + amount;
                                            }
                                        });

                                        const hasTax = Number(invoice.tax) > 0 || Object.keys(taxBreakdown).length > 0;
                                        if (!hasTax) return null;

                                        return (
                                            <>
                                                <div className="flex justify-between text-sm text-slate-600">
                                                    <span>Total Tax:</span>
                                                    <span>{new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(invoice.tax))}</span>
                                                </div>
                                                {Object.entries(taxBreakdown).map(([key, amount]) => (
                                                    <div key={key} className="flex justify-between text-[11px] text-slate-500 pl-4 border-l-2 border-slate-100 ml-1">
                                                        <span>{key}:</span>
                                                        <span>
                                                            {new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(amount as number)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </>
                                        );
                                    })()}

                                    {Number(invoice.discount) > 0 && (
                                        <div className="flex justify-between text-sm text-rose-600">
                                            <span className="font-bold uppercase tracking-widest text-[9px]">Total Discount:</span>
                                            <span className="font-bold">-{new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(invoice.discount))}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                                        <span>Total:</span>
                                        <span>{new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(invoice.total))}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-emerald-600 font-bold pt-1">
                                        <span>Paid:</span>
                                        <span>{new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(invoice.paidAmount))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-rose-600 pt-2 border-t border-slate-100">
                                        <span>Balance Due:</span>
                                        <span>{new Intl.NumberFormat(invoice.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(invoice.total - invoice.paidAmount))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment History Table */}
                        {invoice.payments && invoice.payments.length > 0 && (
                            <div className="p-6 border-t border-slate-100 bg-slate-50/20">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment Records</h3>
                                <table className="w-full text-left text-xs">
                                    <thead className="text-slate-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="pb-2">Date</th>
                                            <th className="pb-2">Method</th>
                                            <th className="pb-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoice.payments.map((p: any) => (
                                            <tr key={p.id}>
                                                <td className="py-2 font-medium text-slate-900">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                                <td className="py-2 text-slate-600 uppercase">{p.paymentMethod?.replace('-', ' ')}</td>
                                                <td className="py-2 text-right font-bold text-emerald-600">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(Number(p.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Actions & Timeline */}
                <div className="w-full md:w-80 space-y-6">

                    {/* Actions Card */}
                    <div className="ent-card p-6 space-y-4">
                        <button
                            onClick={handleDownloadPdf}
                            className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                        >
                            <Download size={18} className="mr-2" />
                            Download PDF
                        </button>
                    </div>

                    {/* Timeline Card */}
                    <div className="ent-card p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                            Payment Activity
                        </h3>
                        <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
                            {timeline.map((event: any, idx: number) => (
                                <div key={idx} className="relative flex items-start gap-4">
                                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 ${event.completed
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-600'
                                        : 'bg-white border-slate-200 text-slate-300'
                                        }`}>
                                        {event.status === 'Paid' ? <CreditCard size={12} /> :
                                            event.status === 'Sent' ? <Send size={12} /> :
                                                <Clock size={12} />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${event.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                                            Invoice {event.status}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {event.date ? new Date(event.date).toLocaleString() : 'Pending'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
