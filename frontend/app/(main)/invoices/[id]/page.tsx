'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Download, Mail, DollarSign,
    Clock, CheckCircle, AlertCircle, FileText,
    Share2, Trash2, Printer, Receipt, Info, ShieldCheck
} from 'lucide-react';
import { invoicesApi } from '@/lib/api/invoices';
import { useToast } from '@/hooks/useToast';
import { useCurrency } from '@/context/CurrencyContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
            await invoicesApi.sendEmail(params.id);
            toast.success('Document transmitted successfully');
            loadInvoice();
        } catch (error) {
            toast.error('Transmission sequence failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const blob = await invoicesApi.generatePDF(params.id);
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
        </div>
    );

    const isPaid = invoice.status === 'paid';
    const isQuotation = invoice.type === 'quotation';

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
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-right">Valuation Balance</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Gross Assignment</span>
                                            <span className="text-xs font-black text-gray-900">{formatCurrency(invoice.total)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Liquidated Amount</span>
                                            <span className="text-xs font-black text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200/50 flex justify-between items-end">
                                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">Outstanding Balance</span>
                                            <span className="text-2xl font-black text-primary-600 tracking-tight">{formatCurrency(Number(invoice.total) - Number(invoice.paidAmount))}</span>
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
                                                <th className="text-center text-[10px] uppercase tracking-widest">Units</th>
                                                <th className="text-right text-[10px] uppercase tracking-widest">Unit Rate</th>
                                                <th className="text-right text-[10px] uppercase tracking-widest">Net Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 border-b border-gray-50">
                                            {invoice.items.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 font-bold text-gray-900 text-xs">{item.description}</td>
                                                    <td className="py-4 text-center font-black text-gray-600 text-xs">{Number(item.quantity)}</td>
                                                    <td className="py-4 text-right font-bold text-gray-600 text-xs">{formatCurrency(item.rate)}</td>
                                                    <td className="py-4 text-right font-black text-gray-900 text-xs">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50/30">
                                                <td colSpan={3} className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregated Valuation Total</td>
                                                <td className="py-4 text-right font-black text-lg text-primary-600">{formatCurrency(invoice.total)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

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
                    <div className="bg-gray-900 rounded-lg p-6 shadow-xl space-y-4">
                        <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Share2 size={14} className="text-primary-400" /> Network Portal
                        </h3>
                        <p className="text-gray-400 text-[10px] font-bold leading-relaxed">
                            Access credentials for the secure client environment. Synchronized across enterprise nodes.
                        </p>
                        <button className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-black rounded text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary-900/50">
                            Synchronize Portal
                        </button>
                    </div>

                    {/* Administrative Protocol Override */}
                    <div className="pt-2">
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-gray-300 hover:text-rose-500 uppercase tracking-widest transition-colors py-2 group"
                        >
                            <Trash2 size={12} className="group-hover:rotate-12 transition-transform" /> Delete Document
                        </button>
                    </div>
                </div>
            </div>

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
                confirmLabel="Confirm Delete"
            />
        </div>
    );
}
