'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
    CheckCircle2,
    XCircle,
    Download,
    AlertCircle,
    Printer,
    Share2,
    CreditCard,
    Truck,
    FileText,
    ShieldCheck,
    Building2,
    Phone,
    Mail,
    Calendar,
    Clock,
    PenTool,
    Check,
    Copy,
    ExternalLink,
    X,
    FileCheck,
    Globe
} from 'lucide-react';
import { getBaseUrl, resolveUrl } from '@/lib/utils/url';
import SignaturePad from '@/components/SignaturePad';
import AlertDialog from '@/components/ui/AlertDialog';
import api from '@/lib/api';

export default function PublicQuotationPage({ params }: { params: { token: string } }) {
    const router = useRouter();
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Form modals
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
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

    // Local currency formatter
    const formatCurrency = (amount: number | string | null | undefined) => {
        const currency = quotation?.currency || 'INR';
        const symbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : (currency === 'GBP' ? '£' : currency)));

        if (amount === null || amount === undefined || amount === '') return `${symbol}0.00`;
        const num = Number(amount);
        if (isNaN(num)) return `${symbol}0.00`;

        return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(num);
    };

    // Format date nicely (e.g., 12 Oct 2026)
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '--';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    useEffect(() => {
        loadQuotation();
    }, [params.token]);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get(`/quotations/public/${params.token}`);
            const q = response.data.quotation;
            setQuotation(q);

            // Pre-fill recipient contact info if available
            if (q.client) {
                setName(prev => prev || q.client.name || q.client.companyName || '');
                setEmail(prev => prev || q.client.email || '');
            } else if (q.lead) {
                setName(prev => prev || q.lead.name || q.lead.company || '');
                setEmail(prev => prev || q.lead.email || '');
            }
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to load quotation';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setDownloadingPdf(true);
            const response = await api.get(`/quotations/public/${params.token}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation-${quotation.quotationNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (err: any) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Download Failed',
                message: err.response?.data?.error || 'Failed to download official quotation PDF'
            });
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleDownloadSignedPdf = async () => {
        try {
            setDownloadingPdf(true);
            const response = await api.get(`/quotations/public/${params.token}/signed-pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation-${quotation.quotationNumber}-Signed.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (err: any) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Download Failed',
                message: err.response?.data?.error || 'Failed to download signed PDF'
            });
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!signature) {
            setAlertDialog({
                isOpen: true,
                type: 'warning',
                title: 'Signature Required',
                message: 'Please draw and save your digital signature before submitting.'
            });
            return;
        }

        if (!termsAccepted) {
            setAlertDialog({
                isOpen: true,
                type: 'warning',
                title: 'Terms Required',
                message: 'Please confirm that you have reviewed and agreed to the quotation terms and conditions.'
            });
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/quotations/public/${params.token}/accept`, {
                signature,
                email,
                name,
                comments
            });

            await loadQuotation();
            setShowAcceptModal(false);
            setAlertDialog({
                isOpen: true,
                type: 'success',
                title: 'Quotation Accepted',
                message: 'Thank you! The quotation has been officially accepted and signed. A confirmation copy will be emailed.'
            });
        } catch (error: any) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: error.response?.data?.error || 'Failed to accept quotation'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            await api.post(`/quotations/public/${params.token}/reject`, {
                email,
                name,
                comments
            });

            await loadQuotation();
            setShowRejectModal(false);
            setAlertDialog({
                isOpen: true,
                type: 'info',
                title: 'Quotation Declined',
                message: 'The quotation has been marked as declined. Thank you for your response.'
            });
        } catch (error: any) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: error.response?.data?.error || 'Failed to decline quotation'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Loading Proposal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
                <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Proposal Not Available</h1>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary text-xs font-bold uppercase tracking-wider px-5 py-2.5"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!quotation) return null;

    const isAccepted = !!quotation.clientAcceptedAt;
    const isRejected = !!quotation.clientRejectedAt;
    const canRespond = !isAccepted && !isRejected;

    // Check if validUntil is in the past
    const isExpired = quotation.validUntil && new Date(quotation.validUntil).getTime() < new Date().setHours(0, 0, 0, 0);

    // Billed to details
    const recipientName = quotation.client?.name || quotation.lead?.name || 'Valued Client';
    const recipientCompany = quotation.client?.companyName || quotation.lead?.company || '';
    const recipientEmail = quotation.client?.email || quotation.lead?.email || '';
    const recipientPhone = quotation.client?.phone || quotation.client?.mobile || quotation.lead?.phone || '';
    const recipientAddress = quotation.client?.address || '';
    const recipientGstin = quotation.client?.gstin || '';

    // Calculate item discounts
    const totalItemDiscounts = (quotation.items || []).reduce((acc: number, item: any) => {
        const gross = Number(item.quantity) * Number(item.unitPrice || 0);
        return acc + (gross * (Number(item.discount || 0) / 100));
    }, 0);

    // Calculate Tax Breakdown
    const taxBreakdown: Record<string, number> = {};
    (quotation.items || []).forEach((item: any) => {
        if (item.appliedTaxes && item.appliedTaxes.length > 0) {
            item.appliedTaxes.forEach((tax: any) => {
                const key = `${tax.name} (${Number(tax.percentage)}%)`;
                taxBreakdown[key] = (taxBreakdown[key] || 0) + Number(tax.amount);
            });
        } else if (Number(item.taxRate || item.tax) > 0) {
            const rate = Number(item.taxRate || item.tax);
            const amount = (Number(item.quantity) * Number(item.unitPrice || 0) * rate) / 100;
            const key = `Tax (${rate}%)`;
            taxBreakdown[key] = (taxBreakdown[key] || 0) + amount;
        }
    });

    return (
        <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-32 print:pb-0 print:bg-white selection:bg-primary-900 selection:text-white">
            {/* Top Navigation / Quick Action Bar */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm print:hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    {/* Brand / Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        {quotation.company?.logo ? (
                            <img
                                src={quotation.company.logo.startsWith('data:')
                                    ? quotation.company.logo
                                    : resolveUrl(quotation.company.logo)
                                }
                                alt={quotation.company?.name || 'Company'}
                                className="h-8 sm:h-9 w-auto max-w-[120px] sm:max-w-[160px] object-contain flex-shrink-0"
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-primary-900 flex items-center justify-center text-white font-black text-sm">
                                    {quotation.company?.name?.[0] || 'A'}
                                </div>
                                <span className="font-black text-sm uppercase tracking-tight text-slate-900 truncate">
                                    {quotation.company?.name || 'Applizor'}
                                </span>
                            </div>
                        )}
                        <span className="hidden md:inline-block h-4 w-px bg-slate-200" />
                        <span className="hidden md:inline-block text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                            Proposal & Quotation
                        </span>
                    </div>

                    {/* Actions on Desktop */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* Copy Link Button */}
                        <button
                            onClick={handleCopyLink}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                            title="Copy Proposal Link"
                        >
                            {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                            <span>{copiedLink ? 'Copied' : 'Share'}</span>
                        </button>

                        {/* Download Official PDF */}
                        <button
                            onClick={isAccepted ? handleDownloadSignedPdf : handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all disabled:opacity-50"
                        >
                            {downloadingPdf ? <LoadingSpinner size="sm" /> : <Download size={14} className="text-primary-600" />}
                            <span>{isAccepted ? 'Signed PDF' : 'Download PDF'}</span>
                        </button>

                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider border ${
                            isAccepted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isRejected
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : isExpired
                                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                isAccepted ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : isExpired ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'
                            }`} />
                            {isAccepted ? 'Accepted' : isRejected ? 'Declined' : isExpired ? 'Expired' : 'Pending Review'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Document Content */}
            <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                {/* Accepted Status Banner */}
                {isAccepted && (
                    <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-5 sm:p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm flex-shrink-0">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-emerald-950 uppercase tracking-tight">
                                        Proposal Accepted & Signed
                                    </h3>
                                    <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                                        Formally approved by <strong className="text-emerald-950">{quotation.clientName}</strong> {quotation.clientEmail ? `(${quotation.clientEmail})` : ''} on {formatDate(quotation.clientAcceptedAt)}.
                                    </p>
                                    {quotation.clientComments && (
                                        <p className="text-xs text-emerald-700 mt-2 bg-emerald-100/60 rounded px-3 py-1.5 italic">
                                            "{quotation.clientComments}"
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadSignedPdf}
                                disabled={downloadingPdf}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-sm transition flex-shrink-0"
                            >
                                <Download size={14} />
                                <span>Download Signed PDF</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Rejected Status Banner */}
                {isRejected && (
                    <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-5 sm:p-6 shadow-sm flex items-start gap-4">
                        <div className="p-2.5 bg-rose-600 text-white rounded-lg shadow-sm flex-shrink-0">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-rose-950 uppercase tracking-tight">
                                Proposal Declined
                            </h3>
                            <p className="text-xs sm:text-sm text-rose-800 mt-0.5">
                                Declined by <strong className="text-rose-950">{quotation.clientName || 'Client'}</strong> on {formatDate(quotation.clientRejectedAt)}.
                            </p>
                            {quotation.clientComments && (
                                <p className="text-xs text-rose-700 mt-2 bg-rose-100/70 rounded px-3 py-1.5 italic">
                                    Feedback: "{quotation.clientComments}"
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Document Canvas */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200/90 overflow-hidden print:shadow-none print:border-none">
                    {/* Top Petrol Blue Accent Bar */}
                    <div className="h-2 bg-gradient-to-r from-primary-900 via-primary-700 to-sky-600" />

                    {/* Document Header */}
                    <div className="p-6 sm:p-10 border-b border-slate-100">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                            {/* Company Information */}
                            <div className="space-y-3 max-w-lg">
                                {quotation.company?.logo ? (
                                    <img
                                        src={quotation.company.logo.startsWith('data:')
                                            ? quotation.company.logo
                                            : resolveUrl(quotation.company.logo)
                                        }
                                        alt={quotation.company.name}
                                        className="h-12 sm:h-14 w-auto object-contain mb-2"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-black text-primary-900 uppercase tracking-tight">
                                        {quotation.company?.name || 'COMPANY NAME'}
                                    </h2>
                                )}

                                <div>
                                    <p className="text-base font-bold text-slate-900">
                                        {quotation.company?.legalName || quotation.company?.name}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                                        {quotation.company?.address && <>{quotation.company.address}<br /></>}
                                        {quotation.company?.city && (
                                            <>{quotation.company.city}, {quotation.company.state} - {quotation.company.pincode || ''}, {quotation.company.country || 'India'}<br /></>
                                        )}
                                        {quotation.company?.email && (
                                            <span className="inline-flex items-center gap-1 mr-3">
                                                <Mail size={11} className="text-slate-400" />
                                                {quotation.company.email}
                                            </span>
                                        )}
                                        {quotation.company?.phone && (
                                            <span className="inline-flex items-center gap-1">
                                                <Phone size={11} className="text-slate-400" />
                                                {quotation.company.phone}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Tax & Business Badges */}
                                {(() => {
                                    const showCompanyGstin = quotation.company?.invoiceSettings?.showGstin !== false;
                                    const showCompanyPan = quotation.company?.invoiceSettings?.showPan !== false;
                                    const hasGstin = !!(quotation.company?.gstin && showCompanyGstin && quotation.company.gstin.trim());
                                    const hasPan = !!(quotation.company?.pan && showCompanyPan && quotation.company.pan.trim());
                                    const hasTan = !!(quotation.company?.tan && quotation.company.tan.trim());
                                    const hasLlpin = !!(quotation.company?.invoiceSettings?.llpin && quotation.company.invoiceSettings.llpin.trim());
                                    const hasWebsite = !!(quotation.company?.invoiceSettings?.website && quotation.company.invoiceSettings.website.trim());

                                    if (!hasGstin && !hasPan && !hasTan && !hasLlpin && !hasWebsite) return null;

                                    return (
                                        <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
                                            {hasGstin && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono">
                                                    GSTIN: {quotation.company.gstin.trim()}
                                                </span>
                                            )}
                                            {hasPan && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono">
                                                    PAN: {quotation.company.pan.trim()}
                                                </span>
                                            )}
                                            {hasTan && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono">
                                                    TAN: {quotation.company.tan.trim()}
                                                </span>
                                            )}
                                            {hasLlpin && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-mono">
                                                    LLPIN: {quotation.company.invoiceSettings.llpin.trim()}
                                                </span>
                                            )}
                                            {hasWebsite && (
                                                <a
                                                    href={quotation.company.invoiceSettings.website.startsWith('http') ? quotation.company.invoiceSettings.website : `https://${quotation.company.invoiceSettings.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-200 hover:underline flex items-center gap-1"
                                                >
                                                    <Globe size={10} />
                                                    {quotation.company.invoiceSettings.website.trim().replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Quotation Identity / Meta */}
                            <div className="w-full md:w-auto text-left md:text-right flex flex-col md:items-end space-y-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 bg-primary-50 px-2.5 py-1 rounded">
                                    Official Business Quotation
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
                                    QUOTATION
                                </h1>

                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-3 sm:p-4 text-xs space-y-2 min-w-[220px]">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Proposal No:</span>
                                        <span className="font-black text-slate-900 font-mono text-sm">{quotation.quotationNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Date Issued:</span>
                                        <span className="font-bold text-slate-800">{formatDate(quotation.quotationDate)}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Valid Till:</span>
                                        <span className={`font-bold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {formatDate(quotation.validUntil)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prepared For / Recipient Section */}
                    <div className="p-6 sm:p-8 bg-slate-50/70 border-b border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                    Billed To / Prepared For
                                </span>
                                <div className="space-y-1">
                                    <p className="text-base sm:text-lg font-black text-slate-900">
                                        {recipientCompany || recipientName}
                                    </p>
                                    {recipientCompany && recipientName && recipientCompany !== recipientName && (
                                        <p className="text-xs font-semibold text-slate-600">
                                            Attn: {recipientName}
                                        </p>
                                    )}
                                    {recipientAddress && (
                                        <p className="text-xs text-slate-500 font-medium">
                                            {recipientAddress}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs text-slate-600">
                                        {recipientEmail && (
                                            <span className="inline-flex items-center gap-1">
                                                <Mail size={12} className="text-slate-400" />
                                                {recipientEmail}
                                            </span>
                                        )}
                                        {recipientPhone && (
                                            <span className="inline-flex items-center gap-1">
                                                <Phone size={12} className="text-slate-400" />
                                                {recipientPhone}
                                            </span>
                                        )}
                                        {recipientGstin && (
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                GSTIN: {recipientGstin}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quotation Highlights / Summary Box */}
                            <div className="bg-white rounded-lg p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Proposal Value</span>
                                    <span className="font-bold text-slate-700">{quotation.items?.length || 0} line item(s)</span>
                                </div>
                                <div className="pt-2 flex items-baseline justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Investment</span>
                                        <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                                            {formatCurrency(quotation.total)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Currency</span>
                                        <span className="text-xs font-bold text-slate-700">{quotation.currency || 'INR'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scope of Work / Introduction (High-End Typography Card) */}
                    {(quotation.title || quotation.description) && (
                        <div className="p-6 sm:p-8 border-b border-slate-100 bg-white">
                            <div className="mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                                    Scope of Work & Specifications
                                </span>
                                {quotation.title && (
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                                        {quotation.title}
                                    </h2>
                                )}
                            </div>

                            {quotation.description && (
                                <div className="bg-slate-50/60 border border-slate-200/70 rounded-lg p-5 sm:p-7">
                                    <div
                                        className="prose prose-sm sm:prose-base max-w-none text-slate-700 font-normal leading-relaxed [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:text-base [&>h1]:font-black [&>h2]:text-sm [&>h2]:font-bold [&>h3]:text-xs [&>h3]:font-bold [&>strong]:font-bold [&>strong]:text-slate-900"
                                        dangerouslySetInnerHTML={{ __html: quotation.description }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Specifications & Items Table */}
                    <div className="p-6 sm:p-8 border-b border-slate-100">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Pricing & Commercial Schedule
                            </span>
                        </div>

                        {/* Table */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-left">
                                    <thead className="bg-slate-900 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider min-w-[200px]">Specification / Description</th>
                                            <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-center">HSN/SAC</th>
                                            <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-center">Qty</th>
                                            <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-center">UoM</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-right min-w-[100px]">Rate</th>
                                            <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-right">Disc %</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-right min-w-[120px]">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100 text-xs font-semibold">
                                        {quotation.items?.map((item: any, index: number) => {
                                            const itemRate = Number(item.unitPrice || 0);
                                            const itemQty = Number(item.quantity || 0);
                                            const itemDisc = Number(item.discount || 0);
                                            const itemGross = itemQty * itemRate;
                                            const itemNet = itemGross * (1 - itemDisc / 100);

                                            return (
                                                <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-4 py-3.5 text-slate-900 font-bold">
                                                        <div className="leading-snug">{item.description}</div>
                                                    </td>
                                                    <td className="px-3 py-3.5 text-center font-mono text-[11px] text-slate-500">
                                                        {item.hsnSacCode || '--'}
                                                    </td>
                                                    <td className="px-3 py-3.5 text-center text-slate-700 font-bold">
                                                        {itemQty}
                                                    </td>
                                                    <td className="px-3 py-3.5 text-center text-slate-600 uppercase text-[11px]">
                                                        {item.unit || '--'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                                                        {formatCurrency(itemRate)}
                                                    </td>
                                                    <td className="px-3 py-3.5 text-right text-rose-500 font-bold">
                                                        {itemDisc > 0 ? `${itemDisc}%` : '--'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-black text-slate-900">
                                                        {formatCurrency(itemNet)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary & Totals Panel */}
                            <div className="bg-slate-50/90 border-t border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-end">
                                <div className="w-full sm:w-80 space-y-2 text-xs">
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span className="font-semibold uppercase text-[10px] tracking-wider text-slate-400">Subtotal:</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(quotation.subtotal)}</span>
                                    </div>

                                    {/* Item Discounts */}
                                    {totalItemDiscounts > 0 && (
                                        <>
                                            <div className="flex justify-between items-center text-rose-600">
                                                <span className="font-semibold uppercase text-[10px] tracking-wider italic">Item Discounts:</span>
                                                <span className="font-bold">-{formatCurrency(totalItemDiscounts)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-dashed border-slate-200">
                                                <span className="font-semibold uppercase text-[10px] tracking-wider">Taxable Amount:</span>
                                                <span className="font-bold text-slate-800">{formatCurrency(Number(quotation.subtotal) - totalItemDiscounts)}</span>
                                            </div>
                                        </>
                                    )}

                                    {/* Taxes Breakdown */}
                                    {(Number(quotation.tax) > 0 || Object.keys(taxBreakdown).length > 0) && (
                                        <>
                                            <div className="flex justify-between items-center text-slate-600 pt-1">
                                                <span className="font-semibold uppercase text-[10px] tracking-wider text-slate-400">Total Tax:</span>
                                                <span className="font-bold text-slate-900">{formatCurrency(quotation.tax)}</span>
                                            </div>
                                            {Object.entries(taxBreakdown).map(([taxLabel, taxAmt]) => (
                                                <div key={taxLabel} className="flex justify-between items-center text-[11px] text-slate-500 pl-3 border-l-2 border-slate-200">
                                                    <span className="italic">{taxLabel}:</span>
                                                    <span>{formatCurrency(taxAmt)}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* Additional Discount */}
                                    {Number(quotation.discount) > 0 && (
                                        <div className="flex justify-between items-center text-rose-600 pt-1">
                                            <span className="font-semibold uppercase text-[10px] tracking-wider">Additional Discount:</span>
                                            <span className="font-bold">-{formatCurrency(quotation.discount)}</span>
                                        </div>
                                    )}

                                    {/* Grand Total */}
                                    <div className="pt-3 mt-2 border-t-2 border-slate-900 flex justify-between items-center">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Grand Total:</span>
                                        <span className="text-xl font-black text-emerald-600 tracking-tight">
                                            {formatCurrency(quotation.total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms & Conditions Section (The Core Fix: Payment Terms, Delivery Terms, Notes) */}
                    <div className="p-6 sm:p-10 border-b border-slate-100 bg-white">
                        <div className="mb-6 flex items-center gap-2">
                            <div className="p-1.5 bg-primary-900 text-white rounded">
                                <FileText size={16} />
                            </div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                                Terms & Conditions
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 1. Payment Terms */}
                            {quotation.paymentTerms && (
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-5 flex flex-col">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary-900 mb-3 pb-2 border-b border-slate-200">
                                        <CreditCard size={15} className="text-primary-600" />
                                        <span>Payment Terms & Milestone Schedule</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                                        {quotation.paymentTerms}
                                    </p>
                                </div>
                            )}

                            {/* 2. Delivery / Fulfillment Terms */}
                            {quotation.deliveryTerms && (
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-5 flex flex-col">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary-900 mb-3 pb-2 border-b border-slate-200">
                                        <Truck size={15} className="text-primary-600" />
                                        <span>Delivery & Fulfillment Terms</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                                        {quotation.deliveryTerms}
                                    </p>
                                </div>
                            )}

                            {/* 3. Remarks / Proposal Conditions */}
                            {quotation.notes && (
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-5 flex flex-col md:col-span-2">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary-900 mb-3 pb-2 border-b border-slate-200">
                                        <FileCheck size={15} className="text-primary-600" />
                                        <span>Remarks & Proposal Conditions</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                                        {quotation.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Authorized Signatory Section */}
                    <div className="p-6 sm:p-10 bg-slate-50/40">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8">
                            <div className="max-w-md text-xs text-slate-500 space-y-1">
                                <p className="font-bold text-slate-700">Official Document Verification</p>
                                <p className="leading-relaxed">
                                    This document is an official computer-generated business quotation issued by {quotation.company?.name}.
                                    Once accepted by the client, it constitutes a binding agreement between both parties.
                                </p>
                            </div>

                            {/* Company Signatory Stamp */}
                            <div className="text-left sm:text-right flex flex-col sm:items-end">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                                    For {quotation.company?.name || 'Company'}
                                </p>

                                {quotation.company?.digitalSignature ? (
                                    <div className="my-1 border-b border-slate-200 pb-2">
                                        <img
                                            src={quotation.company.digitalSignature.startsWith('data:')
                                                ? quotation.company.digitalSignature
                                                : resolveUrl(quotation.company.digitalSignature)
                                            }
                                            alt="Authorized Signatory"
                                            className="max-h-14 sm:max-h-16 w-auto object-contain inline-block"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-10 border-b border-slate-300 w-44 mb-1" />
                                )}

                                <div className="pt-1 text-xs">
                                    <p className="font-black text-slate-900">
                                        {quotation.company?.invoiceSettings?.signatoryName || 'Authorized Signatory'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        {quotation.company?.invoiceSettings?.signatoryDesignation || 'Authorized Representative'}
                                    </p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-200 rounded text-[9px] font-black uppercase tracking-wider">
                                        Authorized Signatory
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Action Dock (When Not Yet Responded) */}
            {canRespond && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl py-3 px-4 sm:px-8 print:hidden">
                    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Total Value & Expiry Notice */}
                        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Investment</span>
                                <span className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight">
                                    {formatCurrency(quotation.total)}
                                </span>
                            </div>
                            <span className="hidden sm:inline-block h-6 w-px bg-slate-200" />
                            <div className="text-right sm:text-left">
                                <span className="text-[10px] font-bold text-slate-500 block">
                                    Proposal Valid Until
                                </span>
                                <span className="text-xs font-black text-slate-800">
                                    {formatDate(quotation.validUntil)}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(true)}
                                className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold uppercase tracking-wider rounded-md transition shadow-sm text-center"
                            >
                                Decline
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowAcceptModal(true)}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-md shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                            >
                                <PenTool size={14} />
                                <span>Accept & Sign</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Accept Quotation Modal */}
            {showAcceptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <PenTool size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Accept & Sign Quotation</h3>
                                    <p className="text-xs text-slate-500">Proposal #{quotation.quotationNumber}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAcceptModal(false)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAccept} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Your Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Official Email Address <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="e.g. john@company.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Digital Signature <span className="text-rose-500">*</span>
                                </label>
                                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                                    <SignaturePad onSave={setSignature} disabled={submitting} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Comments / Purchase Order Ref (Optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={2}
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="Any purchase order reference or milestone remarks..."
                                />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 font-medium">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                                    />
                                    <span>
                                        I confirm that I have reviewed and agree to the <strong>Scope of Work</strong>, <strong>Payment Schedule</strong>, and <strong>Terms & Conditions</strong> stated in this proposal.
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAcceptModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-md hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-md transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <LoadingSpinner size="sm" />
                                            <span>Signing...</span>
                                        </>
                                    ) : (
                                        <span>Confirm Acceptance</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Decline Quotation Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <XCircle size={18} />
                                </div>
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Decline Quotation</h3>
                            </div>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleReject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Your Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Email Address <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                    placeholder="e.g. john@company.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Reason for Declining (Optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                    placeholder="Please let us know how we could improve this proposal..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-md hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-md transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <LoadingSpinner size="sm" />
                                            <span>Declining...</span>
                                        </>
                                    ) : (
                                        <span>Confirm Decline</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Alert Dialog */}
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
