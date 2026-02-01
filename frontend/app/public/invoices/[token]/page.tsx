'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle2, Download, Info, ShieldCheck, ArrowLeft, CreditCard, Send, Clock } from 'lucide-react';

export default function PublicInvoiceDetails({ params }: { params: { token: string } }) {
    const router = useRouter();
    const [invoice, setInvoice] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Use the public endpoint
        api.get(`/invoices/public/${params.token}`)
            .then((res: any) => {
                setInvoice(res.data.invoice);
            })
            .catch((err: any) => {
                console.error(err);
                setError(err.response?.data?.error || err.message || 'Failed to load invoice');
            })
            .finally(() => setLoading(false));
    }, [params.token]);

    // ... handleDownloadPdf ...

    // ... formatCurrency ...

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-red-100 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Invoice</h2>
                <p className="text-sm text-gray-600 mb-6">
                    {error}
                </p>
                <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
                    Token: {params.token}
                </div>
            </div>
        </div>
    );

    if (!invoice) return null;

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get(`/invoices/public/${params.token}/download`, {
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
            alert('Failed to download PDF. Please try again.');
        }
    };

    const formatCurrency = (amount: number | string | null | undefined) => {
        const currency = invoice?.currency || 'INR';
        const symbol = currency === 'INR' ? '₹' : '$';

        if (amount === null || amount === undefined || amount === '') return `${symbol}0.00`;
        const num = Number(amount);
        if (isNaN(num)) return `${symbol}0.00`;

        return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(num);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
        </div>
    );

    if (!invoice) return <div className="p-8 text-center text-red-600 font-bold">Invoice not found or access denied</div>;

    const getStatusColor = (status: string) => {
        if (status === 'paid') return 'text-emerald-800 bg-emerald-100 border-emerald-200';
        if (status === 'overdue') return 'text-rose-800 bg-rose-100 border-rose-200';
        if (status === 'sent') return 'text-amber-800 bg-amber-100 border-amber-200';
        return 'text-slate-800 bg-slate-100 border-slate-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 animate-fade-in">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Status Banner */}
                {invoice.status === 'paid' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex items-center shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mr-3" />
                        <div>
                            <p className="font-bold text-emerald-900">Invoice Paid</p>
                            <p className="text-sm text-emerald-700">
                                This invoice has been fully settled. Thank you for your business.
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 text-slate-900">
                    {/* Header */}
                    <div className="px-8 py-10 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-6 bg-slate-50/30">
                        <div>
                            {invoice.company?.logo ? (
                                <img
                                    src={invoice.company.logo.startsWith('http')
                                        ? invoice.company.logo
                                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${invoice.company.logo}`
                                    }
                                    alt={invoice.company.name}
                                    className="h-14 w-auto mb-4 object-contain"
                                />
                            ) : (
                                <div className="text-2xl font-black text-primary-600 mb-2 uppercase tracking-tight">
                                    {invoice.company?.name || 'COMPANY NAME'}
                                </div>
                            )}
                            <div className="text-sm text-slate-600 font-medium leading-relaxed">
                                {invoice.company?.address && <>{invoice.company.address}<br /></>}
                                {invoice.company?.city && invoice.company?.state && (
                                    <>{invoice.company.city}, {invoice.company.state} - {invoice.company.pincode || ''}<br /></>
                                )}
                                <div className="flex gap-4 mt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {invoice.company?.email && <span>{invoice.company.email}</span>}
                                    {invoice.company?.phone && <span>{invoice.company.phone}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">INVOICE</h1>
                            <div className="space-y-1 text-sm bg-white p-4 rounded-lg border border-slate-100 shadow-sm inline-block text-left min-w-[200px]">
                                <div className="flex justify-between gap-4">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Number</span>
                                    <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Date</span>
                                    <span className="font-medium text-slate-700">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between gap-4 pt-2 mt-2 border-t border-slate-100">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Due Date</span>
                                    <span className={`font-medium ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' ? 'text-rose-600' : 'text-slate-700'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="text-right pt-2 mt-1">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billed To */}
                    <div className="px-8 py-8 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Billed To</h3>
                            <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                                <p className="text-lg font-black text-slate-900 mb-1">{invoice.client?.name || 'Client Name'}</p>
                                {invoice.client?.company && <p className="text-sm font-bold text-slate-600 mb-3">{invoice.client.company}</p>}
                                <div className="space-y-1">
                                    {invoice.client?.email && (
                                        <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                            <span className="w-16 uppercase tracking-wider text-[10px] font-bold">Email</span>
                                            {invoice.client.email}
                                        </p>
                                    )}
                                    {invoice.client?.phone && (
                                        <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                            <span className="w-16 uppercase tracking-wider text-[10px] font-bold">Phone</span>
                                            {invoice.client.phone}
                                        </p>
                                    )}
                                    {invoice.client?.address && (
                                        <p className="text-xs font-medium text-slate-500 flex items-start gap-2 pt-1">
                                            <span className="w-16 uppercase tracking-wider text-[10px] font-bold mt-0.5">Address</span>
                                            <span>{invoice.client.address}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end items-end">
                            <div className="bg-primary-50 rounded-lg p-6 border border-primary-100 text-right w-full md:w-auto min-w-[240px]">
                                <p className="text-[10px] font-black text-primary-700 uppercase tracking-[0.2em] mb-1">Total Due</p>
                                <p className="text-3xl font-black text-primary-900 tracking-tight">
                                    {formatCurrency(Number(invoice.total))}
                                </p>
                                <div className="mt-2 pt-2 border-t border-primary-200 space-y-1">
                                    <div className="flex justify-between text-xs text-primary-700">
                                        <span>Paid:</span>
                                        <span className="font-bold text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-primary-700">
                                        <span>Balance:</span>
                                        <span className={`font-bold ${Number(invoice.total) - Number(invoice.paidAmount) > 0 ? 'text-rose-600' : 'text-primary-900'}`}>
                                            {formatCurrency(Number(invoice.total) - Number(invoice.paidAmount))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border-b border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Description / HSN/SAC</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Qty</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Rate</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Disc %</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoice.items.map((item: any, index: number) => (
                                    <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-slate-900">{item.description}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
                                                {item.hsnSacCode ? `Code: ${item.hsnSacCode}` : ''}
                                                {item.unit ? `${item.hsnSacCode ? ' | ' : ''}Unit: ${item.unit}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-slate-600 text-center">{Number(item.quantity)}</td>
                                        <td className="px-8 py-5 text-sm font-medium text-slate-600 text-right">{formatCurrency(item.rate)}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-rose-500 text-right">{Number(item.discount) > 0 ? `${Number(item.discount)}%` : '--'}</td>
                                        <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/50">
                                <tr>
                                    <td colSpan={4} className="px-8 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Subtotal:</td>
                                    <td className="px-8 py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(invoice.subtotal)}</td>
                                </tr>
                                {(() => {
                                    const itemDiscounts = (invoice.items || []).reduce((acc: number, item: any) => {
                                        const gross = Number(item.quantity) * Number(item.rate);
                                        return acc + (gross * (Number(item.discount || 0) / 100));
                                    }, 0);

                                    if (itemDiscounts > 0) {
                                        return (
                                            <>
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-3 text-right text-[10px] font-black text-rose-500 uppercase tracking-widest">Item Discounts:</td>
                                                    <td className="px-8 py-3 text-right text-sm font-bold text-rose-600">-{formatCurrency(itemDiscounts)}</td>
                                                </tr>
                                                <tr className="border-t border-dashed border-slate-200">
                                                    <td colSpan={4} className="px-8 py-3 text-right text-[10px] font-black text-slate-900 uppercase tracking-widest">Taxable Amount:</td>
                                                    <td className="px-8 py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(Number(invoice.subtotal) - itemDiscounts)}</td>
                                                </tr>
                                            </>
                                        );
                                    }
                                    return null;
                                })()}
                                {/* Detailed Tax Breakdown */}
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
                                            <tr>
                                                <td colSpan={4} className="px-8 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tax:</td>
                                                <td className="px-8 py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(invoice.tax)}</td>
                                            </tr>
                                            {Object.entries(taxBreakdown).map(([key, amount]) => (
                                                <tr key={key}>
                                                    <td colSpan={4} className="px-8 py-1.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pl-16">
                                                        <span className="border-r border-slate-200 pr-2">{key}:</span>
                                                    </td>
                                                    <td className="px-8 py-1.5 text-right text-xs font-bold text-slate-500 italic">{formatCurrency(amount as number)}</td>
                                                </tr>
                                            ))}
                                        </>
                                    );
                                })()}
                                {Number(invoice.discount) > 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-3 text-right text-[10px] font-black text-rose-500 uppercase tracking-widest">Total Discount:</td>
                                        <td className="px-8 py-3 text-right text-sm font-bold text-rose-600">-{formatCurrency(invoice.discount)}</td>
                                    </tr>
                                )}
                                <tr className="bg-slate-100 border-t-2 border-slate-200">
                                    <td colSpan={4} className="px-8 py-5 text-right text-xs font-black text-slate-900 uppercase tracking-widest">Total Valuation:</td>
                                    <td className="px-8 py-5 text-right text-xl font-black text-primary-700">{formatCurrency(invoice.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Footer / Notes */}
                    {(invoice.notes || invoice.terms) && (
                        <div className="px-8 py-8 bg-slate-50/30 grid grid-cols-1 md:grid-cols-2 gap-10">
                            {invoice.notes && (
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <Info size={12} /> Notes
                                    </h3>
                                    <div className="p-4 bg-white border border-slate-100 rounded-lg text-xs font-medium text-slate-600 leading-relaxed italic">
                                        {invoice.notes}
                                    </div>
                                </div>
                            )}
                            {invoice.terms && (
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <ShieldCheck size={12} /> Terms & Conditions
                                    </h3>
                                    <div className="p-4 bg-white border border-slate-100 rounded-lg text-xs font-medium text-slate-600 leading-relaxed">
                                        {invoice.terms}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-slate-400 text-xs font-medium">
                            {invoice.company?.name} &copy; {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
