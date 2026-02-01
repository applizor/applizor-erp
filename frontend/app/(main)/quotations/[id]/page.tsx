'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/context/CurrencyContext';
import { Plus, Trash2, FileText, CheckCircle, Printer, Mail, Download, ArrowLeft, Edit, Activity, ExternalLink, RefreshCw, Copy, XCircle, Globe } from 'lucide-react';
import Link from 'next/link';
import { quotationsApi } from '@/lib/api/quotations';
import { AnalyticsDashboard } from '@/components/quotations/AnalyticsDashboard';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/context/ConfirmationContext';

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const { can } = usePermission();
    const { formatCurrency } = useCurrency();
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generatingLink, setGeneratingLink] = useState(false);
    const [publicUrl, setPublicUrl] = useState<string>('');
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [useLetterhead, setUseLetterhead] = useState(true);

    useEffect(() => {
        loadQuotation();
    }, [params.id]);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            const data = await quotationsApi.getById(params.id);
            setQuotation(data.quotation);
        } catch (error) {
            toast.error('Failed to load quotation details');
            router.push('/quotations');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        try {
            setGeneratingLink(true);
            const response = await api.post(`/quotations/${params.id}/generate-link`, {
                expiresInDays: 30
            });
            const url = response.data.publicUrl;
            setPublicUrl(url);
            setShowLinkDialog(true);
            toast.success('Public link generated successfully!');
            await loadQuotation(); // Reload to get updated status
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate link');
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleCopyLink = () => {
        if (quotation?.publicToken) {
            const url = `${window.location.origin}/public/quotations/${quotation.publicToken}`;
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        }
    };

    const { confirm } = useConfirm();

    const handleRevokeLink = async () => {
        if (!await confirm({ message: 'Are you sure you want to revoke this public link? Clients will no longer be able to access it.', type: 'danger' })) {
            return;
        }
        try {
            await api.post(`/quotations/${params.id}/revoke-link`);
            toast.success('Public link revoked successfully');
            await loadQuotation();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to revoke link');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            sent: 'bg-blue-100 text-blue-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            expired: 'bg-orange-100 text-orange-800'
        };
        return `ent-badge ${styles[status] || 'bg-gray-100 text-gray-800'}`;
    };

    // Calculate Tax Breakdown
    const taxBreakdown = quotation?.items?.reduce((acc: Record<string, number>, item: any) => {
        if (item.appliedTaxes && item.appliedTaxes.length > 0) {
            item.appliedTaxes.forEach((tax: any) => {
                const key = `${tax.name} @${Number(tax.percentage)}%`;
                acc[key] = (acc[key] || 0) + Number(tax.amount);
            });
        } else if (Number(item.tax) > 0) {
            // Legacy/Simple Tax Fallback
            const taxAmount = (Number(item.quantity) * Number(item.unitPrice) * Number(item.tax)) / 100;
            const key = `Tax @${Number(item.tax)}%`;
            acc[key] = (acc[key] || 0) + taxAmount;
        }
        return acc;
    }, {}) || {};

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!quotation) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
            {/* Header / Actions - Hidden in Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:hidden gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href="/quotations"
                            className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 uppercase tracking-wider"
                        >
                            <ArrowLeft size={12} className="mr-1" />
                            Ledger
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-xs font-bold text-gray-900 tracking-wide">{quotation.quotationNumber}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                            {quotation.title}
                        </h1>
                        <span className={getStatusBadge(quotation.status)}>
                            {quotation.status}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {can('Quotation', 'update') && quotation.status === 'draft' && (
                        <Link href={`/quotations/${quotation.id}/edit`}>
                            <Button variant="secondary" icon={Edit}>
                                Edit
                            </Button>
                        </Link>
                    )}

                    <Button
                        onClick={async () => {
                            try {
                                const blob = await quotationsApi.generatePDF(params.id, useLetterhead);
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Quotation-${quotation.quotationNumber}.pdf`;
                                a.click();
                                toast.success('Transfer complete');
                            } catch (error) {
                                toast.error('Transfer failed');
                            }
                        }}
                        variant="secondary"
                        icon={Download}
                    >
                        Preview PDF
                    </Button>

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



                    {can('Quotation', 'read') && quotation.clientAcceptedAt && (
                        <Button
                            onClick={async () => {
                                try {
                                    const response = await api.get(`/quotations/${params.id}/signed-pdf?useLetterhead=${useLetterhead}`, {
                                        responseType: 'blob'
                                    });
                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `Quotation-${quotation.quotationNumber}-Signed.pdf`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    toast.success('Signed PDF downloaded successfully');
                                } catch (error: any) {
                                    toast.error(error.response?.data?.error || 'Failed to download signed PDF');
                                }
                            }}
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                            icon={Download}
                        >
                            Signed PDF
                        </Button>
                    )}

                    {can('Quotation', 'update') && !quotation.isPublicEnabled && (
                        <Button
                            onClick={handleGenerateLink}
                            disabled={generatingLink}
                            isLoading={generatingLink}
                            variant="primary"
                            className="bg-primary-600 hover:bg-primary-700 border-primary-600"
                            icon={Globe}
                        >
                            Public Link
                        </Button>
                    )}

                    {can('Quotation', 'update') && quotation.status === 'draft' && (
                        <Button
                            onClick={async () => {
                                try {
                                    setGeneratingLink(true);
                                    await api.post(`/quotations/${params.id}/send-email`);
                                    toast.success('Quotation email sent successfully!');
                                    await loadQuotation(); // Reload to get updated status
                                } catch (error: any) {
                                    toast.error(error.response?.data?.error || 'Failed to send email');
                                } finally {
                                    setGeneratingLink(false);
                                }
                            }}
                            disabled={generatingLink}
                            isLoading={generatingLink}
                            variant="primary"
                            icon={Mail}
                        >
                            Send to Client
                        </Button>
                    )}

                    {can('Quotation', 'update') && (quotation.status === 'accepted' || quotation.clientAcceptedAt) && (
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                            onClick={async () => {
                                if (!await confirm({ message: quotation.convertedToInvoiceId ? 'This quotation was already converted. Do you want to generate a NEW invoice (re-generation)?' : 'Convert to Invoice?', type: 'info' })) return;
                                try {
                                    await quotationsApi.convertToInvoice(quotation.id);
                                    toast.success('Converted successfully');
                                    router.push('/invoices');
                                } catch (e) { toast.error('Conversion failed') }
                            }}
                            variant="primary"
                            icon={CheckCircle}
                        >
                            {quotation.convertedToInvoiceId ? 'Re-generate Invoice' : 'Convert to Invoice'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-lg border border-gray-200 mb-6 w-fit print:hidden">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'details'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                >
                    Details
                </button>
                {can('Quotation', 'read') && (
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'analytics'
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                    >
                        <Activity size={14} />
                        Analytics
                    </button>
                )}
            </div>

            {activeTab === 'analytics' ? (
                <AnalyticsDashboard quotationId={params.id} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Document Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quotation Document */}
                        <div className="bg-white shadow-xl shadow-slate-200/50 rounded-md overflow-hidden border border-gray-100 print:shadow-none print:border-0 print:rounded-none">
                            {/* Branding Header */}
                            <div className="px-8 py-10 border-b border-gray-100 flex justify-between bg-gradient-to-b from-gray-50/50 to-white">
                                <div>
                                    {quotation.company?.logo ? (
                                        <img
                                            src={quotation.company.logo.startsWith('http')
                                                ? quotation.company.logo
                                                : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${quotation.company.logo}`
                                            }
                                            alt={quotation.company.name}
                                            className="h-10 w-auto mb-4"
                                        />
                                    ) : (
                                        <div className="text-xl font-black text-primary-700 mb-2 tracking-tight uppercase">
                                            {quotation.company?.name || 'COMPANY NAME'}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 font-medium leading-relaxed">
                                        {quotation.company?.address && <>{quotation.company.address}<br /></>}
                                        {quotation.company?.city && quotation.company?.state && (
                                            <>{quotation.company.city}, {quotation.company.state} {quotation.company.pincode}<br /></>
                                        )}
                                        {quotation.company?.country && <>{quotation.company.country}<br /></>}
                                        <div className="mt-2 flex gap-4 text-gray-400">
                                            {quotation.company?.email && <span>{quotation.company.email}</span>}
                                            {quotation.company?.phone && <span>{quotation.company.phone}</span>}
                                        </div>
                                    </div>
                                    {quotation.company?.gstin && (
                                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">GSTIN: {quotation.company.gstin}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-black text-gray-100 select-none tracking-tighter">QUOTATION</h2>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-sm font-bold text-gray-900">
                                            <span className="text-gray-400 text-xs uppercase tracking-wider mr-2 font-medium">Ref No.</span>
                                            {quotation.quotationNumber}
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">
                                            <span className="text-gray-400 text-xs uppercase tracking-wider mr-2 font-medium">Issue Date</span>
                                            {new Date(quotation.quotationDate).toLocaleDateString()}
                                        </p>
                                        {quotation.validUntil && (
                                            <p className="text-sm font-bold text-gray-900">
                                                <span className="text-gray-400 text-xs uppercase tracking-wider mr-2 font-medium">Valid Until</span>
                                                {new Date(quotation.validUntil).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Client Details */}
                            <div className="px-8 py-8 border-b border-gray-100 grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</h3>
                                    <div className="text-sm text-gray-900">
                                        {quotation.lead && (
                                            <>
                                                <p className="font-bold text-lg mb-1">{quotation.lead.company || quotation.lead.name}</p>
                                                {quotation.lead.company && <p className="font-medium text-gray-600 mb-1">{quotation.lead.name}</p>}
                                                <div className="text-gray-500 font-medium">
                                                    {quotation.lead.email && <p>{quotation.lead.email}</p>}
                                                    {quotation.lead.phone && <p>{quotation.lead.phone}</p>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {quotation.status === 'accepted' && (
                                    <div className="flex justify-end items-center">
                                        <div className="border-2 border-emerald-100 bg-emerald-50/50 rounded-lg p-3 text-center rotate-3 opacity-90">
                                            <div className="text-emerald-800 font-black uppercase text-sm tracking-widest border-b-2 border-emerald-200 mb-1 pb-1">Accepted</div>
                                            <div className="text-emerald-600 text-xs font-bold">{new Date(quotation.clientAcceptedAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Proposal Scope & Introduction */}
                            {(quotation.title || quotation.description) && (
                                <div className="px-8 py-8 border-b border-gray-100">
                                    {quotation.title && (
                                        <div className="mb-6 pb-6 border-b border-gray-100/50">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Proposal Title</h3>
                                            <p className="text-lg font-black text-gray-800">{quotation.title}</p>
                                        </div>
                                    )}

                                    {quotation.description && (
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Scope of Work / Introduction</h3>
                                            <div
                                                className="prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: quotation.description }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Items Table */}
                            <div className="px-8 py-8">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100">
                                            <th className="px-2 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider w-1/3">Description</th>
                                            <th className="px-2 py-3 text-center text-xs font-black text-gray-400 uppercase tracking-wider">HSN/SAC</th>
                                            <th className="px-2 py-3 text-center text-xs font-black text-gray-400 uppercase tracking-wider">Qty</th>
                                            <th className="px-2 py-3 text-center text-xs font-black text-gray-400 uppercase tracking-wider">UoM</th>
                                            <th className="px-2 py-3 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Rate</th>
                                            <th className="px-2 py-3 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Disc %</th>
                                            <th className="px-2 py-3 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Tax</th>
                                            <th className="px-2 py-3 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {quotation.items?.map((item: any, index: number) => (
                                            <tr key={index}>
                                                <td className="px-2 py-4">
                                                    <p className="text-sm font-bold text-gray-900">{item.description}</p>
                                                </td>
                                                <td className="px-2 py-4 text-center text-sm font-medium text-gray-400 font-mono">
                                                    {item.hsnSacCode || '--'}
                                                </td>
                                                <td className="px-2 py-4 text-center text-sm font-medium text-gray-600">
                                                    {Number(item.quantity)}
                                                </td>
                                                <td className="px-2 py-4 text-center text-sm font-medium text-gray-600 uppercase">
                                                    {item.unit || '--'}
                                                </td>
                                                <td className="px-2 py-4 text-right text-sm font-medium text-gray-600">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="px-2 py-4 text-right text-sm font-bold text-rose-500">
                                                    {Number(item.discount) > 0 ? `${Number(item.discount)}%` : '--'}
                                                </td>
                                                <td className="px-2 py-4 text-right text-sm font-medium text-gray-600">
                                                    {Number(item.tax)}%
                                                </td>
                                                <td className="px-2 py-4 text-right text-sm font-bold text-gray-900">
                                                    {formatCurrency(Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount || 0) / 100))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals & Notes */}
                            <div className="px-8 py-8 bg-gray-50/30 border-t border-gray-100">
                                <div className="flex flex-col md:flex-row gap-12">
                                    <div className="md:w-3/5">
                                        {quotation.notes && (
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Terms & Notes</h3>
                                                <p className="text-xs text-gray-500 font-medium whitespace-pre-wrap leading-relaxed border-l-2 border-gray-200 pl-3">
                                                    {quotation.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:w-2/5 space-y-3">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span className="font-medium">Subtotal:</span>
                                            <span className="font-bold">{formatCurrency(quotation.subtotal)}</span>
                                        </div>

                                        {(() => {
                                            const itemDiscounts = quotation.items.reduce((acc: number, item: any) => {
                                                const gross = Number(item.quantity) * Number(item.unitPrice);
                                                return acc + (gross * (Number(item.discount || 0) / 100));
                                            }, 0);

                                            if (itemDiscounts > 0) {
                                                return (
                                                    <>
                                                        <div className="flex justify-between text-sm text-gray-600">
                                                            <span className="font-medium text-rose-600">Item Discounts:</span>
                                                            <span className="font-bold text-rose-600">-{formatCurrency(itemDiscounts)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm text-gray-900 border-t border-dashed border-gray-300 pt-1 mt-1">
                                                            <span className="font-black text-xs uppercase tracking-wider">Taxable Amount:</span>
                                                            <span className="font-black">{formatCurrency(quotation.subtotal - itemDiscounts)}</span>
                                                        </div>
                                                    </>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {(() => {
                                            const hasTax = Number(quotation.tax) > 0 || Object.keys(taxBreakdown).length > 0;
                                            if (!hasTax) return null;

                                            return (
                                                <>
                                                    <div className="flex justify-between text-sm text-gray-600">
                                                        <span className="font-medium">Total Tax:</span>
                                                        <span className="font-bold text-emerald-600">{formatCurrency(quotation.tax)}</span>
                                                    </div>
                                                    <div className="pl-4 border-l-2 border-gray-100 space-y-1 py-1 ml-1">
                                                        {Object.entries(taxBreakdown).map(([key, amount]) => (
                                                            <div key={key} className="flex justify-between text-xs text-gray-500">
                                                                <span className="italic">{key}:</span>
                                                                <span>{formatCurrency(amount as number)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            );
                                        })()}

                                        {Number(quotation.discount) > 0 && (
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span className="font-medium text-xs uppercase tracking-wider text-gray-500">Additional Discount:</span>
                                                <span className="font-bold text-rose-600">-{formatCurrency(quotation.discount)}</span>
                                            </div>
                                        )}
                                        <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-center text-gray-900">
                                            <span className="text-base font-black uppercase tracking-tight">Total:</span>
                                            <span className="text-xl font-black">{formatCurrency(quotation.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-6 print:hidden">

                        {/* Public Link Section */}
                        {quotation.isPublicEnabled && quotation.publicToken && (
                            <div className="ent-card border-primary-100 bg-primary-50/30 overflow-hidden">
                                <div className="p-4 border-b border-primary-100 bg-primary-50/50 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-primary-900 uppercase tracking-wider flex items-center gap-2">
                                        <Globe size={14} className="text-primary-600" />
                                        Public Link Active
                                    </h3>
                                    <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse"></div>
                                </div>
                                <div className="p-4">
                                    <p className="text-xs text-primary-700 font-medium mb-3">
                                        Anyone with this link can view the quotation.
                                        {quotation.publicExpiresAt && (
                                            <span className="block mt-1 opacity-75">
                                                Expires: {new Date(quotation.publicExpiresAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${window.location.origin}/public/quotations/${quotation.publicToken}`}
                                                className="flex-1 px-3 py-1.5 border border-primary-200 rounded text-xs bg-white text-primary-900 font-medium focus:ring-2 focus:ring-primary-500"
                                            />
                                            <button
                                                onClick={handleCopyLink}
                                                className="p-1.5 bg-white border border-primary-200 rounded hover:bg-primary-50 text-primary-700 transition-colors"
                                                title="Copy to clipboard"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        {can('Quotation', 'update') && (
                                            <button
                                                onClick={handleRevokeLink}
                                                className="w-full py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition-colors"
                                            >
                                                Revoke Access
                                            </button>
                                        )}
                                    </div>
                                    {quotation.clientViewedAt && (
                                        <div className="mt-4 flex items-center justify-center text-[10px] font-bold text-primary-400 uppercase tracking-widest bg-white/50 py-1 rounded">
                                            Viewed by Client: {new Date(quotation.clientViewedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Client Acceptance/Rejection Section */}
                        {(quotation.clientAcceptedAt || quotation.clientRejectedAt) && (
                            <div className={`ent-card overflow-hidden ${quotation.clientAcceptedAt
                                ? 'border-emerald-100 bg-emerald-50/30'
                                : 'border-rose-100 bg-rose-50/30'
                                }`}>
                                <div className={`p-4 border-b flex items-center gap-3 ${quotation.clientAcceptedAt ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/50'}`}>
                                    {quotation.clientAcceptedAt ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-rose-600" />
                                    )}
                                    <h3 className={`text-sm font-bold uppercase tracking-wide ${quotation.clientAcceptedAt ? 'text-emerald-900' : 'text-rose-900'}`}>
                                        {quotation.clientAcceptedAt ? 'Accepted' : 'Declined'}
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="text-xs font-medium">
                                        <div className="flex justify-between py-1 border-b border-black/5">
                                            <span className="text-gray-500">Date</span>
                                            <span className="font-bold text-gray-900">
                                                {quotation.clientAcceptedAt
                                                    ? new Date(quotation.clientAcceptedAt).toLocaleDateString()
                                                    : new Date(quotation.clientRejectedAt).toLocaleDateString()
                                                }
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-black/5 mt-2">
                                            <span className="text-gray-500">User</span>
                                            <span className="font-bold text-gray-900">{quotation.clientName || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 mt-2">
                                            <span className="text-gray-500">Email</span>
                                            <span className="font-bold text-gray-900">{quotation.clientEmail || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {quotation.clientComments && (
                                        <div className="bg-white/50 p-3 rounded border border-black/5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Comments</span>
                                            <p className="text-xs text-gray-700 italic">"{quotation.clientComments}"</p>
                                        </div>
                                    )}

                                    {quotation.clientAcceptedAt && quotation.clientSignature && (
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Signature</span>
                                            <div className="bg-white border border-gray-200 rounded p-2">
                                                <img
                                                    src={quotation.clientSignature}
                                                    alt="Client Signature"
                                                    className="max-h-16 w-auto opacity-80"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!quotation.clientAcceptedAt && !quotation.clientRejectedAt && (
                            <div className="ent-card p-4 border-gray-100 bg-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Timeline</h3>
                                <div className="relative pl-4 space-y-4 border-l border-gray-200 my-2">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gray-300"></div>
                                        <p className="text-xs text-gray-900 font-bold">Created</p>
                                        <p className="text-[10px] text-gray-500">{new Date(quotation.createdAt).toLocaleString()}</p>
                                    </div>
                                    {quotation.status === 'sent' && (
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-400"></div>
                                            <p className="text-xs text-gray-900 font-bold">Sent to Client</p>
                                            <p className="text-[10px] text-gray-500">Via Email</p>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-0 h-2.5 w-2.5 rounded-full border-2 border-gray-300 bg-white"></div>
                                        <p className="text-xs text-gray-400 font-medium">Awaiting Response</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
