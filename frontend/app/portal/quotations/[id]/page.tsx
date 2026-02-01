'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import SignaturePad from '@/components/SignaturePad';
import AlertDialog from '@/components/ui/AlertDialog';
import { CheckCircle2, FileText, ArrowLeft, Download, Info, ShieldCheck, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function QuotationDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [showAcceptForm, setShowAcceptForm] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [signature, setSignature] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [comments, setComments] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Alert dialog state
    const [alertDialog, setAlertDialog] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        title?: string;
        message: string;
    }>({ isOpen: false, type: 'info', message: '' });

    const loadQuotation = async () => {
        try {
            setLoading(true);
            const res: any = await api.get(`/portal/quotations/${params.id}`);
            setQuotation(res.data.quotation);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuotation();
    }, [params.id]);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signature) {
            toast.error('Please provide your signature');
            return;
        }
        if (!termsAccepted) {
            toast.error('Please accept the terms and conditions');
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/portal/quotations/${params.id}/accept`, {
                signature, email, name, comments
            });
            await loadQuotation();
            setShowAcceptForm(false);
            setAlertDialog({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'Quotation accepted successfully!'
            });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to accept quotation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.post(`/portal/quotations/${params.id}/reject`, {
                email, name, comments
            });
            await loadQuotation();
            setShowRejectForm(false);
            setAlertDialog({
                isOpen: true,
                type: 'info',
                title: 'Declined',
                message: 'Quotation declined.'
            });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to reject quotation');
        } finally {
            setSubmitting(false);
        }
    };

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
            toast.error('PDF download failed');
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

    if (!quotation) return <div className="p-8 text-center text-slate-500">Quotation not found</div>;

    const isAccepted = !!quotation.clientAcceptedAt;
    const isRejected = !!quotation.clientRejectedAt;
    const canRespond = !isAccepted && !isRejected && (quotation.status === 'sent' || quotation.status === 'viewed');

    const getStatusColor = (status: string) => {
        if (status === 'accepted') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (status === 'rejected') return 'text-rose-600 bg-rose-50 border-rose-200';
        if (status === 'expired') return 'text-slate-600 bg-slate-50 border-slate-200';
        return 'text-amber-600 bg-amber-50 border-amber-200';
    };

    return (
        <div className="animate-fade-in space-y-6 pb-12">
            {/* Status Banners */}
            {isAccepted && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-md p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center text-emerald-900">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500" />
                        <div>
                            <p className="font-bold text-sm">Quotation Accepted</p>
                            <p className="text-xs text-emerald-700 mt-0.5">Accepted on {new Date(quotation.clientAcceptedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {isRejected && (
                <div className="bg-rose-50 border border-rose-100 rounded-md p-4 flex items-center text-rose-900 shadow-sm">
                    <XCircle className="w-5 h-5 mr-3 text-rose-500" />
                    <div>
                        <p className="font-bold text-sm">Quotation Declined</p>
                        <p className="text-xs text-rose-700 mt-0.5">Declined on {new Date(quotation.clientRejectedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            )}

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
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">QUOTATION</h1>
                                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none">#{quotation.quotationNumber}</p>
                            </div>
                            <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusColor(quotation.status)}`}>
                                {quotation.status}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-5 grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Prepared For</h3>
                                <p className="text-xs font-black text-slate-900 leading-none">{quotation.lead?.name || 'Client'}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{quotation.lead?.company || ''}</p>
                                <p className="text-[10px] text-slate-400">{quotation.lead?.email || ''}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Dates</h3>
                                <p className="text-[11px] font-bold text-slate-700">
                                    <span className="text-slate-400 mr-2 uppercase text-[9px]">Date:</span>
                                    {new Date(quotation.quotationDate).toLocaleDateString()}
                                </p>
                                {quotation.validUntil && (
                                    <p className="text-[11px] font-bold text-slate-700 mt-1">
                                        <span className="text-slate-400 mr-2 uppercase text-[9px]">Valid Until:</span>
                                        {new Date(quotation.validUntil).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border-t border-slate-100">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description / HSN/SAC</th>
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Disc %</th>
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quotation.items.map((item: any, i: number) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-900">{item.description}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                    {item.hsnSacCode ? `Code: ${item.hsnSacCode}` : ''}
                                                    {item.unit ? `${item.hsnSacCode ? ' | ' : ''}Unit: ${item.unit}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-center font-bold text-slate-600">{Number(item.quantity)}</td>
                                            <td className="px-6 py-4 text-xs text-right font-bold text-slate-600">
                                                {new Intl.NumberFormat(quotation.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(item.unitPrice))}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-right font-black text-rose-500 italic">
                                                {Number(item.discount) > 0 ? `${Number(item.discount)}%` : '--'}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-right font-black text-slate-900">
                                                {new Intl.NumberFormat(quotation.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount || 0) / 100))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="p-6 bg-slate-50/30 border-t border-slate-100">
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Gross Subtotal:</span>
                                        <span className="text-xs font-black text-slate-900">{new Intl.NumberFormat(quotation.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(quotation.subtotal))}</span>
                                    </div>

                                    {(() => {
                                        const formatter = new Intl.NumberFormat(quotation.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: quotation.currency || 'USD' });
                                        const itemDiscounts = (quotation.items || []).reduce((acc: number, item: any) => {
                                            const gross = Number(item.quantity) * Number(item.unitPrice);
                                            return acc + (gross * (Number(item.discount || 0) / 100));
                                        }, 0);

                                        if (itemDiscounts > 0) {
                                            return (
                                                <>
                                                    <div className="flex justify-between items-center text-sm pt-1">
                                                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Item Discounts:</span>
                                                        <span className="text-xs font-black text-rose-600">-{formatter.format(itemDiscounts)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm pt-1 border-t border-dashed border-slate-200 mt-1 pb-1">
                                                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">Taxable Amount:</span>
                                                        <span className="text-xs font-black text-slate-900">{formatter.format(Number(quotation.subtotal) - itemDiscounts)}</span>
                                                    </div>
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {(() => {
                                        const taxBreakdown: Record<string, number> = {};
                                        (quotation.items || []).forEach((item: any) => {
                                            const appliedTaxes = item.appliedTaxes;
                                            if (appliedTaxes && appliedTaxes.length > 0) {
                                                appliedTaxes.forEach((tax: any) => {
                                                    const key = `${tax.name} @${Number(tax.percentage)}%`;
                                                    taxBreakdown[key] = (taxBreakdown[key] || 0) + Number(tax.amount);
                                                });
                                            } else if (Number(item.taxRate || item.tax) > 0) {
                                                const rate = Number(item.taxRate || item.tax);
                                                const amount = (Number(item.quantity) * Number(item.unitPrice || item.rate || 0) * (1 - Number(item.discount || 0) / 100) * rate) / 100;
                                                const key = `Tax @${rate}%`;
                                                taxBreakdown[key] = (taxBreakdown[key] || 0) + amount;
                                            }
                                        });

                                        const hasTax = Number(quotation.tax) > 0 || Object.keys(taxBreakdown).length > 0;
                                        if (!hasTax) return null;

                                        return (
                                            <>
                                                <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-100">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Tax:</span>
                                                    <span className="text-xs font-black text-slate-900">{new Intl.NumberFormat(quotation.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(quotation.tax))}</span>
                                                </div>
                                                {Object.entries(taxBreakdown).map(([key, amount]) => (
                                                    <div key={key} className="flex justify-between items-center text-[10px] pl-3 border-l-2 border-slate-100 ml-1">
                                                        <span className="text-slate-500 font-bold uppercase tracking-tight text-[8px] italic">{key}:</span>
                                                        <span className="font-bold text-slate-600 italic">
                                                            {new Intl.NumberFormat(quotation.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(amount as number)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </>
                                        );
                                    })()}

                                    {Number(quotation.discount) > 0 && (
                                        <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-100">
                                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none">Total Discount:</span>
                                            <span className="text-xs font-black text-rose-600">-{new Intl.NumberFormat(quotation.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(quotation.discount))}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-base pt-3 border-t-2 border-slate-900">
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total:</span>
                                        <span className="font-black text-emerald-600">{new Intl.NumberFormat(quotation.currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(quotation.total))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Sections and Forms */}
                        {(showAcceptForm || showRejectForm) && (
                            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                                {showAcceptForm && (
                                    <form onSubmit={handleAccept} className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-emerald-900 rounded-md shadow-lg">
                                                <ShieldCheck className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Accept Quotation</h2>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Please provide your details and signature</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                                <input
                                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                                    placeholder="Enter your name"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                                <input
                                                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Signature</label>
                                            <div className="bg-white border border-slate-200 rounded-md p-1">
                                                <SignaturePad onSave={setSignature} disabled={submitting} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Comments (Optional)</label>
                                            <textarea
                                                rows={2} value={comments} onChange={(e) => setComments(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-bold focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
                                                placeholder="Any additional notes..."
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="w-3.5 h-3.5 border-slate-300 rounded text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">I accept the terms and conditions stated in this quotation.</span>
                                        </label>

                                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                                            <button
                                                type="button" onClick={() => setShowAcceptForm(false)} disabled={submitting}
                                                className="flex-1 h-10 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-slate-50 transition-all disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit" disabled={submitting}
                                                className="flex-1 h-10 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                            >
                                                {submitting ? 'Processing...' : 'Confirm Acceptance'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {showRejectForm && (
                                    <form onSubmit={handleReject} className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-rose-900 rounded-md shadow-lg">
                                                <Info className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Decline Quotation</h2>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Please let us know your feedback</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                                <input
                                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                                <input
                                                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs font-bold focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Declining</label>
                                            <textarea
                                                rows={4} value={comments} onChange={(e) => setComments(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-bold focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none"
                                                placeholder="Provide a reason..."
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                                            <button
                                                type="button" onClick={() => setShowRejectForm(false)} disabled={submitting}
                                                className="flex-1 h-10 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-slate-50 transition-all disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit" disabled={submitting}
                                                className="flex-1 h-10 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                                            >
                                                {submitting ? 'Submitting...' : 'Confirm Decline'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="w-full md:w-80 space-y-6">
                    <div className="ent-card p-5 space-y-4">
                        <button
                            onClick={handleDownloadPdf}
                            className="w-full flex items-center justify-center h-10 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                        >
                            <Download size={14} className="mr-2" />
                            Download PDF
                        </button>

                        {canRespond && !showAcceptForm && !showRejectForm && (
                            <>
                                <div className="h-px bg-slate-100 w-full" />
                                <button
                                    onClick={() => setShowAcceptForm(true)}
                                    className="w-full flex items-center justify-center h-10 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                >
                                    Accept Quotation
                                </button>
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    className="w-full flex items-center justify-center h-10 border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-rose-50 transition-all"
                                >
                                    Decline
                                </button>
                            </>
                        )}
                    </div>

                    {(quotation.notes || quotation.terms) && (
                        <div className="ent-card p-5 space-y-4">
                            {quotation.notes && (
                                <div>
                                    <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-2 leading-none">Terms & Conditions</h4>
                                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed whitespace-pre-wrap">{quotation.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog
                isOpen={alertDialog.isOpen}
                onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                type={alertDialog.type}
                title={alertDialog.title}
                message={alertDialog.message}
            />
        </div>
    );
}
