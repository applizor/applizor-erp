'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Download, Mail, DollarSign,
    Clock, CheckCircle, AlertCircle, FileText,
    Share2, Trash2, Printer, Receipt, Info, ShieldCheck, Link as LinkIcon,
    Globe, Activity, Copy, RefreshCw, XCircle, CreditCard
} from 'lucide-react';
import { invoicesApi } from '@/lib/api/invoices';
import { useToast } from '@/hooks/useToast';
import { useCurrency } from '@/context/CurrencyContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InvoiceActivityLog } from '@/components/invoices/InvoiceActivityLog';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
    const toast = useToast();
    const router = useRouter();
    const { formatCurrency } = useCurrency();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({ amount: 0, method: 'bank-transfer' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [useLetterhead, setUseLetterhead] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [generatingLink, setGeneratingLink] = useState(false);

    useEffect(() => {
        loadInvoice();
    }, [params.id]);

    const loadInvoice = async () => {
        try {
            setLoading(true);
            const data = await invoicesApi.getById(params.id);
            setInvoice(data.invoice);
            setPaymentData(prev => ({ ...prev, amount: Number(data.invoice.total) - Number(data.invoice.paidAmount) }));
        } catch (error) {
            toast.error('Failed to load document details');
            router.push('/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        try {
            setActionLoading(true);
            setActionLoading(true);
            await invoicesApi.sendEmail(params.id, { useLetterhead });
            toast.success('Document transmitted successfully');
            loadInvoice();
        } catch (error) {
            toast.error('Transmission sequence failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (invoice?.publicToken) {
            const url = `${window.location.origin}/public/invoices/${invoice.publicToken}`;
            navigator.clipboard.writeText(url);
            toast.success('Public link copied to clipboard');
        } else {
            // Legacy/Fallback
            const url = `${window.location.protocol}//${window.location.host}/public/invoices/${params.id}`;
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard');
        }
    };

    const handleGenerateLink = async () => {
        try {
            setGeneratingLink(true);
            await invoicesApi.generatePublicLink(params.id);
            toast.success('Public link generated successfully');
            loadInvoice();
        } catch (error) {
            toast.error('Failed to generate public link');
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleRevokeLink = async () => {
        try {
            setActionLoading(true);
            await invoicesApi.revokePublicLink(params.id);
            toast.success('Public link revoked');
            loadInvoice();
        } catch (error) {
            toast.error('Failed to revoke link');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const blob = await invoicesApi.generatePDF(params.id, useLetterhead);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${invoice.invoiceNumber}.pdf`;
            a.click();
            toast.success('Transfer complete');
        } catch (error) {
            toast.error('Transfer failed');
        }
    };

    const handleRecordPayment = async () => {
        try {
            setActionLoading(true);
            await invoicesApi.recordPayment(params.id, {
                amount: Number(paymentData.amount),
                paymentMethod: paymentData.method
            });
            toast.success('Liquidation recorded');
            setShowPaymentModal(false);
            loadInvoice();
        } catch (error) {
            toast.error('Liquidation registry failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConvertToInvoice = async () => {
        try {
            setActionLoading(true);
            const data = await invoicesApi.convertQuotation(params.id);
            toast.success('Converted to Tax Invoice');
            router.push(`/invoices/${data.invoice.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Conversion sequence failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setActionLoading(true);
            await invoicesApi.delete(params.id);
            toast.success('Document purged from registry');
            router.push('/invoices');
        } catch (error) {
            toast.error('Purge sequence failed');
        } finally {
            setActionLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm('Are you sure you want to delete this payment record? This will update the invoice balance.')) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/payments/${paymentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Payment record deleted');
                loadInvoice(); // Reload to update balance and status
            } else {
                throw new Error('Failed to delete payment');
            }
        } catch (error) {
            toast.error('Could not delete payment record');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
        </div>
    );

    const isPaid = invoice.status === 'paid';

    const isQuotation = invoice.type === 'quotation';

    // Calculate Financials & Tax Breakdown
    const { taxBreakdown, subtotal, totalTax, totalItemDiscount } = (() => {
        const breakdown: Record<string, number> = {};
        let calculatedSubtotal = 0;
        let calculatedItemDiscount = 0;

        invoice.items.forEach((item: any) => {
            const quantity = Number(item.quantity) || 0;
            const rate = Number(item.rate) || 0;
            const itemGross = quantity * rate;
            const discountPercent = Number(item.discount || 0);
            const itemDiscAmount = itemGross * (discountPercent / 100);
            const taxableAmount = itemGross - itemDiscAmount;

            calculatedSubtotal += itemGross;
            calculatedItemDiscount += itemDiscAmount;

            if (item.appliedTaxes && item.appliedTaxes.length > 0) {
                item.appliedTaxes.forEach((tax: any) => {
                    const key = `${tax.name} @${Number(tax.percentage)}%`;
                    breakdown[key] = (breakdown[key] || 0) + Number(tax.amount);
                });
            } else if (Number(item.taxRate) > 0) {
                // Fallback
                const taxAmount = taxableAmount * (Number(item.taxRate) / 100);
                const key = `Tax @${Number(item.taxRate)}%`;
                breakdown[key] = (breakdown[key] || 0) + taxAmount;
            }
        });

        const totalTaxCalc = Object.values(breakdown).reduce((a, b) => a + b, 0);
        return {
            taxBreakdown: breakdown,
            subtotal: calculatedSubtotal,
            totalTax: totalTaxCalc,
            totalItemDiscount: calculatedItemDiscount
        };
    })();

    return (
        <div className="space-y-6">
            {/* Header: Navigation & Dynamic Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/invoices"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                        title="Return to Ledger"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">{invoice.invoiceNumber}</h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {invoice.status}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                            {invoice.type === 'quotation' ? 'Commercial Quotation' : 'Standard Tax Invoice'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <input
                            type="checkbox"
                            id="useLetterhead"
                            checked={useLetterhead}
                            onChange={(e) => setUseLetterhead(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <label htmlFor="useLetterhead" className="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer select-none">Letterhead</label>
                    </div>

                    {!invoice.isPublicEnabled ? (
                        <button
                            onClick={handleGenerateLink}
                            disabled={generatingLink}
                            className="flex-1 lg:flex-none px-3 py-1.5 bg-primary-600 text-white border border-primary-700 rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            <Globe size={14} /> {generatingLink ? 'Linking...' : 'Public Link'}
                        </button>
                    ) : (
                        <button onClick={handleCopyLink} className="flex-1 lg:flex-none px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 flex items-center justify-center gap-2 transition-all shadow-sm">
                            <LinkIcon size={14} /> Link Active
                        </button>
                    )}

                    <button onClick={handleDownloadPDF} className="flex-1 lg:flex-none px-3 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-2 transition-all">
                        <Download size={14} /> Export
                    </button>
                    <button onClick={handleSendEmail} disabled={actionLoading} className="flex-1 lg:flex-none px-3 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-2 transition-all">
                        <Mail size={14} /> {actionLoading ? 'Sending...' : 'Transmit'}
                    </button>
                    {isQuotation && invoice.status !== 'accepted' && (
                        <button onClick={handleConvertToInvoice} disabled={actionLoading} className="flex-1 lg:flex-none px-4 py-1.5 bg-primary-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/10">
                            <Receipt size={14} /> {actionLoading ? 'Processing...' : 'Generate Invoice'}
                        </button>
                    )}
                    {!isPaid && !isQuotation && (
                        <button onClick={() => setShowPaymentModal(true)} className="flex-1 lg:flex-none px-4 py-1.5 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10">
                            <DollarSign size={14} /> Settle Balance
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200 w-fit">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'details'
                        ? 'bg-white text-primary-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Details
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'activity'
                        ? 'bg-white text-primary-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Activity size={12} />
                    Activity Log
                </button>
            </div>

            {activeTab === 'activity' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <InvoiceActivityLog invoiceId={params.id} />
                    </div>
                    <div className="space-y-6">
                        {/* Analytics Summary */}
                        <div className="ent-card p-6">
                            <h3 className="text-[10px] font-black text-gray-900 mb-6 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-50 pb-2">
                                <Activity size={14} className="text-primary-600" /> Engagement Stats
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Views</p>
                                    <p className="text-2xl font-black text-gray-900">{invoice.viewCount || 0}</p>
                                </div>
                                {invoice.lastViewedAt && (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Viewed</p>
                                        <p className="text-xs font-bold text-gray-900">{new Date(invoice.lastViewedAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="ent-card p-0 overflow-hidden bg-white">
                            <div className="p-8">
                                {/* Branding & Entity Context */}
                                <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-gray-100 pb-8 mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-primary-900 rounded-lg flex items-center justify-center shadow-lg">
                                            <FileText size={28} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Identifier</p>
                                            <h2 className="text-xl font-black text-gray-900 mt-1 uppercase tracking-tighter">{invoice.invoiceNumber}</h2>
                                        </div>
                                    </div>
                                    <div className="flex gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Origination</p>
                                            <p className="text-xs font-bold text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Maturity</p>
                                            <p className={`text-xs font-bold ${new Date(invoice.dueDate) < new Date() && !isPaid ? 'text-rose-600' : 'text-gray-900'}`}>
                                                {new Date(invoice.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Consignee & Valuation Matrix */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-2">Consignee Intelligence</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-lg font-black text-gray-900 leading-tight">{invoice.client.name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Reg No: {invoice.client.registrationNumber || 'System-Generated'}</p>
                                            </div>
                                            <div className="space-y-2 pt-1">
                                                <p className="text-[11px] font-bold text-gray-600 flex items-center gap-2"><Mail size={14} className="text-gray-300" /> {invoice.client.email}</p>
                                                <p className="text-[11px] font-bold text-gray-600 flex items-center gap-2"><Printer size={14} className="text-gray-300" /> {invoice.client.phone || '--'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-lg p-6 border border-gray-100 flex flex-col justify-between">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-right">Payment Summary</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">Total Invoice Value</span>
                                                <span className="text-xs font-black text-gray-900">{formatCurrency(invoice.total)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Paid Amount</span>
                                                <span className="text-xs font-black text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                                            </div>
                                            <div className="pt-3 border-t border-gray-200/50 flex justify-between items-end">
                                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">Balance Due</span>
                                                <span className={`text-2xl font-black tracking-tight ${Number(invoice.total) - Number(invoice.paidAmount) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {formatCurrency(Number(invoice.total) - Number(invoice.paidAmount))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Itemized Specification */}
                                <div className="mb-10">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-2 text-right">Resource Ledger</h3>
                                    <div className="overflow-x-auto">
                                        <table className="ent-table">
                                            <thead>
                                                <tr>
                                                    <th className="text-[10px] uppercase tracking-widest">Specification</th>
                                                    <th className="text-[10px] uppercase tracking-widest">HSN/SAC</th>
                                                    <th className="text-center text-[10px] uppercase tracking-widest">Qty</th>
                                                    <th className="text-center text-[10px] uppercase tracking-widest">UoM</th>
                                                    <th className="text-right text-[10px] uppercase tracking-widest">Unit Rate</th>
                                                    <th className="text-right text-[10px] uppercase tracking-widest">Disc %</th>
                                                    <th className="text-right text-[10px] uppercase tracking-widest">Net Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 border-b border-gray-50">
                                                {invoice.items.map((item: any) => (
                                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-4 font-bold text-gray-900 text-xs text-left">{item.description}</td>
                                                        <td className="py-4 text-xs font-mono text-gray-500">{item.hsnSacCode || '--'}</td>
                                                        <td className="py-4 text-center font-black text-gray-600 text-xs">{Number(item.quantity)}</td>
                                                        <td className="py-4 text-center font-bold text-gray-500 text-xs">{item.unit || '--'}</td>
                                                        <td className="py-4 text-right font-bold text-gray-600 text-xs">{formatCurrency(item.rate)}</td>
                                                        <td className="py-4 text-right font-bold text-rose-500 text-xs">{Number(item.discount) > 0 ? `${Number(item.discount)}%` : '--'}</td>
                                                        <td className="py-4 text-right font-black text-gray-900 text-xs">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gray-50/30">
                                                    <td colSpan={6} className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregated Valuation Total</td>
                                                    <td className="py-4 text-right font-black text-lg text-primary-600">{formatCurrency(invoice.total)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Detailed Financial Summary */}
                                <div className="flex justify-end mb-10 pt-6 border-t border-gray-100">
                                    <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span className="font-medium text-xs uppercase tracking-wider text-gray-500">Subtotal:</span>
                                            <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                                        </div>

                                        {(() => {
                                            const itemDiscounts = invoice.items.reduce((acc: number, item: any) => {
                                                const gross = Number(item.quantity) * Number(item.rate);
                                                return acc + (gross * (Number(item.discount || 0) / 100));
                                            }, 0);

                                            if (itemDiscounts > 0) {
                                                return (
                                                    <>
                                                        <div className="flex justify-between text-sm text-gray-600">
                                                            <span className="font-medium text-rose-600 text-xs uppercase tracking-wider">Item Discounts:</span>
                                                            <span className="font-bold text-rose-600">-{formatCurrency(itemDiscounts)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm text-gray-900 border-t border-dashed border-gray-300 pt-1 mt-1">
                                                            <span className="font-black text-xs uppercase tracking-wider">Taxable Amount:</span>
                                                            <span className="font-black">{formatCurrency(subtotal - itemDiscounts)}</span>
                                                        </div>
                                                    </>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {(() => {
                                            const hasTax = totalTax > 0 || Object.keys(taxBreakdown).length > 0;
                                            if (!hasTax) return null;

                                            return (
                                                <>
                                                    <div className="flex justify-between text-sm text-gray-600">
                                                        <span className="font-medium text-xs uppercase tracking-wider text-gray-500">Total Tax:</span>
                                                        <span className="font-bold text-emerald-600">{formatCurrency(totalTax)}</span>
                                                    </div>
                                                    <div className="pl-4 border-l-2 border-emerald-100 space-y-1 py-1 bg-emerald-50/30 rounded-r ml-1">
                                                        {Object.entries(taxBreakdown).map(([key, amount]) => (
                                                            <div key={key} className="flex justify-between text-[10px] font-bold text-emerald-700">
                                                                <span className="italic">{key}:</span>
                                                                <span>{formatCurrency(amount as number)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            );
                                        })()}

                                        {Number(invoice.discount) > 0 && (
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span className="font-medium text-xs uppercase tracking-wider text-gray-500">Additional Discount:</span>
                                                <span className="font-bold text-rose-600">-{formatCurrency(invoice.discount)}</span>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-center text-gray-900 mt-2">
                                            <span className="text-sm font-black uppercase tracking-widest">Total Valuation:</span>
                                            <span className="text-xl font-black">{formatCurrency(invoice.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment History */}
                                {invoice.payments && invoice.payments.length > 0 && (
                                    <div className="mb-10">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-2">Payment Records</h3>
                                        <div className="overflow-x-auto">
                                            <table className="ent-table">
                                                <thead>
                                                    <tr>
                                                        <th className="text-[10px] uppercase tracking-widest">Date</th>
                                                        <th className="text-[10px] uppercase tracking-widest">Method</th>
                                                        <th className="text-[10px] uppercase tracking-widest">Transaction ID</th>
                                                        <th className="text-right text-[10px] uppercase tracking-widest">Amount</th>
                                                        <th className="w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 border-b border-gray-50">
                                                    {invoice.payments.map((payment: any) => (
                                                        <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="py-4 font-bold text-gray-900 text-xs">
                                                                {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td className="py-4 text-xs font-bold text-gray-600 uppercase">{payment.paymentMethod?.replace('-', ' ')}</td>
                                                            <td className="py-4 text-xs font-mono text-gray-500">{payment.transactionId || '--'}</td>
                                                            <td className="py-4 text-right font-black text-emerald-600 text-xs">{formatCurrency(payment.amount)}</td>
                                                            <td className="py-4 text-center">
                                                                <button
                                                                    onClick={() => handleDeletePayment(payment.id)}
                                                                    disabled={actionLoading}
                                                                    className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                                    title="Delete Payment Record"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Supplemental Memoranda */}
                                {(invoice.notes || invoice.terms) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-gray-100">
                                        {invoice.notes && (
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Info size={12} className="text-primary-500" />
                                                    Directives
                                                </h4>
                                                <p className="text-[11px] font-medium text-gray-600 bg-gray-50 p-3 rounded leading-relaxed border-l-2 border-primary-500 italic">
                                                    {invoice.notes}
                                                </p>
                                            </div>
                                        )}
                                        {invoice.terms && (
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldCheck size={12} className="text-gray-400" />
                                                    Commercial Terms
                                                </h4>
                                                <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">
                                                    {invoice.terms}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vertical Sidebar Context */}
                    <div className="space-y-6">
                        {/* Immutable Audit Log */}
                        <div className="ent-card p-6 border-gray-100">
                            <h3 className="text-[10px] font-black text-gray-900 mb-6 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-50 pb-2">
                                <Clock size={14} className="text-primary-600" /> Persistent Audit Trail
                            </h3>
                            <div className="space-y-6 relative ml-2 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                                <div className="relative pl-6">
                                    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-primary-600 ring-4 ring-primary-50" />
                                    <div>
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Last Update</p>
                                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{new Date(invoice.updatedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="relative pl-6">
                                    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-gray-200 ring-4 ring-white" />
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Initial Commitment</p>
                                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{new Date(invoice.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Digital Portal Intelligence */}

                        {/* Administrative Protocol Override */}
                        <div className="pt-2">
                            {invoice.isPublicEnabled && (
                                <button
                                    onClick={handleRevokeLink}
                                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors py-2 border border-rose-100 rounded mb-4"
                                >
                                    <XCircle size={12} /> Revoke Public Access
                                </button>
                            )}
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-gray-300 hover:text-rose-500 uppercase tracking-widest transition-colors py-2 group"
                            >
                                <Trash2 size={12} className="group-hover:rotate-12 transition-transform" /> Delete Document
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Settlement Interface */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Registry Settlement</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Liquidated Valuation</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400 text-xs">{invoice.currency}</div>
                                    <input
                                        type="number"
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                        className="ent-input w-full pl-10 font-black text-lg p-3"
                                    />
                                </div>
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Settlement Mechanism</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['bank-transfer', 'cash', 'upi', 'cheque'].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentData({ ...paymentData, method })}
                                            className={`py-2 px-3 rounded border text-[10px] font-black uppercase tracking-widest transition-all ${paymentData.method === method ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'}`}
                                        >
                                            {method.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex gap-2 justify-end">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                            >
                                Revert
                            </button>
                            <button
                                onClick={handleRecordPayment}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-primary-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-lg shadow-primary-900/10"
                            >
                                {actionLoading ? 'Committing...' : 'Finalize Settlement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Confirm Document Purge"
                message="This action will permanently remove this commercial record from the enterprise registry. This process is irreversible."
                type="danger"
                confirmText="Confirm Delete"
            />
        </div>
    );
}
