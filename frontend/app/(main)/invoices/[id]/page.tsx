'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Download, Mail, DollarSign,
    Clock, CheckCircle, AlertCircle, FileText,
    Share2, MoreHorizontal, Printer, Trash2
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
            toast.success('Invoice sent to client successfully');
            loadInvoice();
        } catch (error) {
            toast.error('Failed to send email');
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
            a.download = `${invoice.type}-${invoice.invoiceNumber}.pdf`;
            a.click();
        } catch (error) {
            toast.error('Could not generate PDF');
        }
    };

    const handleRecordPayment = async () => {
        try {
            setActionLoading(true);
            await invoicesApi.recordPayment(params.id, {
                amount: Number(paymentData.amount),
                paymentMethod: paymentData.method
            });
            toast.success('Payment recorded successfully');
            setShowPaymentModal(false);
            loadInvoice();
        } catch (error) {
            toast.error('Failed to record payment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConvertToInvoice = async () => {
        try {
            setActionLoading(true);
            const data = await invoicesApi.convertQuotation(params.id);
            toast.success('Successfully converted to Invoice');
            router.push(`/invoices/${data.invoice.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Conversion failed');
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            {/* Navigation & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <Link href="/invoices" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-primary-600 transition-all group">
                    <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Documents List
                </Link>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={handleDownloadPDF} className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                        <Download size={16} className="mr-2" /> Download
                    </button>
                    <button onClick={handleSendEmail} disabled={actionLoading} className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                        <Mail size={16} className="mr-2" /> {actionLoading ? 'Sending...' : 'Send'}
                    </button>
                    {isQuotation && invoice.status !== 'accepted' && (
                        <button
                            onClick={handleConvertToInvoice}
                            disabled={actionLoading}
                            className="flex-1 md:flex-none inline-flex justify-center items-center px-6 py-2 rounded-xl bg-primary-600 text-sm font-bold text-white hover:bg-primary-700 shadow-lg shadow-primary-100 transition-all transform hover:-translate-y-0.5"
                        >
                            <FileText size={16} className="mr-2" /> {actionLoading ? 'Converting...' : 'Convert to Invoice'}
                        </button>
                    )}
                    {!isPaid && !isQuotation && (
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 rounded-xl bg-primary-600 text-sm font-bold text-white hover:bg-primary-700 shadow-lg shadow-primary-100 transition-all transform hover:-translate-y-0.5"
                        >
                            <DollarSign size={16} className="mr-2" /> Record Payment
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Document Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className={`h-2 ${isPaid ? 'bg-emerald-500' : 'bg-primary-500'}`} />
                        <div className="p-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-50 pb-8 mb-8">
                                <div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3 ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-100 text-primary-700'}`}>
                                        {invoice.status} • {invoice.type}
                                    </span>
                                    <h1 className="text-3xl font-black text-gray-900 leading-tight">#{invoice.invoiceNumber}</h1>
                                    <p className="text-gray-500 font-medium mt-1">Issued on {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</p>
                                    <p className={`text-lg font-bold ${new Date(invoice.dueDate) < new Date() && !isPaid ? 'text-rose-600' : 'text-gray-900'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Billed To</h3>
                                    <p className="text-lg font-black text-gray-900">{invoice.client.name}</p>
                                    <div className="space-y-1 mt-2">
                                        <p className="text-sm text-gray-600 flex items-center gap-2"><Mail size={14} /> {invoice.client.email}</p>
                                        {invoice.client.phone && <p className="text-sm text-gray-600 flex items-center gap-2">📞 {invoice.client.phone}</p>}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-2xl">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Summary</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Total Amount</span>
                                            <span className="font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Paid to date</span>
                                            <span className="font-bold text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                                        </div>
                                        <div className="pt-2 border-t border-gray-200 flex justify-between">
                                            <span className="font-bold text-gray-900">Remaining</span>
                                            <span className="font-black text-primary-600 text-lg">{formatCurrency(Number(invoice.total) - Number(invoice.paidAmount))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-10">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-50 text-left">
                                            <th className="py-4 text-xs font-bold text-gray-400 uppercase">Item Description</th>
                                            <th className="py-4 text-center text-xs font-bold text-gray-400 uppercase w-24">Qty</th>
                                            <th className="py-4 text-right text-xs font-bold text-gray-400 uppercase w-32">Rate</th>
                                            <th className="py-4 text-right text-xs font-bold text-gray-400 uppercase w-32">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {invoice.items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="py-5 font-medium text-gray-900 text-sm">{item.description}</td>
                                                <td className="py-5 text-center text-sm text-gray-600">{Number(item.quantity)}</td>
                                                <td className="py-5 text-right text-sm text-gray-600">{formatCurrency(item.rate)}</td>
                                                <td className="py-5 text-right font-bold text-gray-900 text-sm">{formatCurrency(item.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Notes */}
                            {(invoice.notes || invoice.terms) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-8">
                                    {invoice.notes && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</h4>
                                            <p className="text-sm text-gray-600 italic">"{invoice.notes}"</p>
                                        </div>
                                    )}
                                    {invoice.terms && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Terms</h4>
                                            <p className="text-sm text-gray-600">{invoice.terms}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Activity & History */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Clock size={20} className="text-primary-600" /> Activity Log
                        </h3>
                        <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                            <div className="relative pl-8">
                                <div className="absolute left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                <p className="text-xs font-bold text-gray-900">Payment Recorded</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(invoice.updatedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="relative pl-8">
                                <div className="absolute left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                                <p className="text-xs font-bold text-gray-900">Document Created</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Share2 size={80} className="text-white" />
                        </div>
                        <h3 className="text-white font-black mb-4">Client Portal</h3>
                        <p className="text-gray-400 text-xs mb-6">Clients can view and pay this invoice online via a unique secure link.</p>
                        <button className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95">
                            Copy Payment Link
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-gray-100">
                            <h3 className="text-xl font-black text-gray-900">Record Payment</h3>
                            <p className="text-gray-500 text-sm mt-1">Found funds for invoice {invoice.invoiceNumber}</p>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount Received</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{invoice.currency}</div>
                                    <input
                                        type="number"
                                        value={paymentData.amount}
                                        onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-primary-500 font-bold text-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Payment Mode</label>
                                <select
                                    value={paymentData.method}
                                    onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-primary-500 font-medium"
                                >
                                    <option value="bank-transfer">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI / Digital</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-gray-50 flex gap-4">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordPayment}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
