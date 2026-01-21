'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/context/CurrencyContext';
import { Plus, Trash2, FileText, CheckCircle, Printer, Mail, Download, ArrowLeft, Edit, Activity } from 'lucide-react';
import Link from 'next/link';
import { quotationsApi } from '@/lib/api/quotations';
import { AnalyticsDashboard } from '@/components/quotations/AnalyticsDashboard';

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

    const handleRevokeLink = async () => {
        if (!confirm('Are you sure you want to revoke this public link? Clients will no longer be able to access it.')) {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!quotation) return null;

    return (
        <div className="p-6 max-w-5xl mx-auto print:p-0 print:max-w-none">
            {/* Header / Actions - Hidden in Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 print:hidden">
                <div className="flex items-center mb-4 md:mb-0">
                    <button
                        onClick={() => router.back()}
                        className="mr-4 p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold text-gray-900">{quotation.quotationNumber}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {quotation.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{quotation.title}</p>
                    </div>
                </div>

                <div className="flex space-x-3">
                    {can('Quotation', 'update') && quotation.status === 'draft' && (
                        <Link
                            href={`/quotations/${quotation.id}/edit`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                    )}

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </button>

                    {can('Quotation', 'read') && quotation.clientAcceptedAt && (
                        <button
                            onClick={async () => {
                                try {
                                    const response = await api.get(`/quotations/${params.id}/signed-pdf`, {
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
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Signed PDF
                        </button>
                    )}

                    {can('Quotation', 'update') && !quotation.isPublicEnabled && (
                        <button
                            onClick={handleGenerateLink}
                            disabled={generatingLink}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            {generatingLink ? 'Generating...' : 'Generate Public Link'}
                        </button>
                    )}

                    {can('Quotation', 'update') && quotation.status === 'draft' && (
                        <button
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
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            {generatingLink ? 'Sending...' : 'Send to Client'}
                        </button>
                    )}

                    {can('Quotation', 'update') && quotation.status === 'accepted' && !quotation.convertedToInvoiceId && (
                        <button
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                            onClick={async () => {
                                if (!confirm('Convert to Invoice?')) return;
                                try {
                                    await quotationsApi.convertToInvoice(quotation.id);
                                    toast.success('Converted successfully');
                                    router.push('/invoices');
                                } catch (e) { toast.error('Conversion failed') }
                            }}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Convert to Invoice
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 print:hidden">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`${activeTab === 'details'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Details
                    </button>
                    {can('Quotation', 'read') && (
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`${activeTab === 'analytics'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Activity className="w-4 h-4 mr-2" />
                            Analytics
                        </button>
                    )}
                </nav>
            </div>

            {activeTab === 'analytics' ? (
                <AnalyticsDashboard quotationId={params.id} />
            ) : (
                <div className="space-y-6">
                    {/* Quotation Document */}
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 print:shadow-none print:border-0">
                        {/* Branding Header */}
                        <div className="px-8 py-10 border-b border-gray-200 flex justify-between">
                            <div>
                                {quotation.company?.logo ? (
                                    <img
                                        src={quotation.company.logo.startsWith('http')
                                            ? quotation.company.logo
                                            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${quotation.company.logo}`
                                        }
                                        alt={quotation.company.name}
                                        className="h-12 w-auto mb-3"
                                    />
                                ) : (
                                    <div className="h-10 w-auto text-2xl font-bold text-primary-600 mb-2">
                                        {quotation.company?.name || 'COMPANY NAME'}
                                    </div>
                                )}
                                <p className="text-sm text-gray-500 max-w-xs">
                                    {quotation.company?.address && <>{quotation.company.address}<br /></>}
                                    {quotation.company?.city && quotation.company?.state && (
                                        <>{quotation.company.city}, {quotation.company.state} - {quotation.company.pincode || ''}<br /></>
                                    )}
                                    {quotation.company?.country && <>{quotation.company.country}<br /></>}
                                    {quotation.company?.email && <>{quotation.company.email}</>}
                                    {quotation.company?.phone && <> | {quotation.company.phone}</>}
                                </p>
                                {quotation.company?.gstin && (
                                    <p className="text-xs text-gray-400 mt-2">GSTIN: {quotation.company.gstin}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-gray-900">QUOTATION</h2>
                                <p className="text-sm text-gray-500 mt-2">
                                    <span className="font-medium">Number:</span> {quotation.quotationNumber}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium">Date:</span> {new Date(quotation.quotationDate).toLocaleDateString()}
                                </p>
                                {quotation.validUntil && (
                                    <p className="text-sm text-gray-500">
                                        <span className="font-medium">Valid Until:</span> {new Date(quotation.validUntil).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Client Details */}
                        <div className="px-8 py-6 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Billed To</h3>
                            <div className="text-sm text-gray-900">
                                {quotation.lead && (
                                    <>
                                        <p className="font-medium text-base">{quotation.lead.name}</p>
                                        {quotation.lead.company && <p>{quotation.lead.company}</p>}
                                        {quotation.lead.email && <p>{quotation.lead.email}</p>}
                                        {quotation.lead.phone && <p>{quotation.lead.phone}</p>}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {quotation.items?.map((item: any, index: number) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{Number(item.quantity)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Subtotal</td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(quotation.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Tax</td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(quotation.tax)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">Discount</td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">-{formatCurrency(quotation.discount)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-right text-base font-bold text-gray-900">Total</td>
                                        <td className="px-6 py-3 text-right text-base font-bold text-green-600">{formatCurrency(quotation.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Notes */}
                        {quotation.notes && (
                            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Notes & Terms</h3>
                                <p className="text-sm text-gray-500 whitespace-pre-wrap">{quotation.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Public Link Section */}
                    {quotation.isPublicEnabled && quotation.publicToken && (
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 print:hidden">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-blue-900 mb-2">Public Link Active</h3>
                                    <p className="text-sm text-blue-700 mb-3">
                                        This quotation can be accessed via public link.
                                        {quotation.publicExpiresAt && (
                                            <span className="block mt-1">
                                                Expires: {new Date(quotation.publicExpiresAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${window.location.origin}/public/quotations/${quotation.publicToken}`}
                                            className="flex-1 px-3 py-2 border border-blue-300 rounded-md text-sm bg-white"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                                        >
                                            Copy Link
                                        </button>
                                        {can('Quotation', 'update') && (
                                            <button
                                                onClick={handleRevokeLink}
                                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                    {quotation.clientViewedAt && (
                                        <p className="text-xs text-blue-600 mt-2">
                                            Viewed by client: {new Date(quotation.clientViewedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Client Acceptance/Rejection Section */}
                    {(quotation.clientAcceptedAt || quotation.clientRejectedAt) && (
                        <div className={`mt-6 border rounded-lg p-6 print:hidden ${quotation.clientAcceptedAt
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className={`text-lg font-semibold mb-1 ${quotation.clientAcceptedAt ? 'text-green-900' : 'text-red-900'
                                        }`}>
                                        {quotation.clientAcceptedAt ? '✓ Quotation Accepted' : '✗ Quotation Declined'}
                                    </h3>
                                    <p className={`text-sm ${quotation.clientAcceptedAt ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        {quotation.clientAcceptedAt
                                            ? `Accepted on ${new Date(quotation.clientAcceptedAt).toLocaleString()}`
                                            : `Declined on ${new Date(quotation.clientRejectedAt).toLocaleString()}`
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Client Information */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Client Information</h4>
                                    <div className="space-y-2 text-sm">
                                        {quotation.clientName && (
                                            <div>
                                                <span className="font-medium text-gray-700">Name:</span>
                                                <span className="ml-2 text-gray-600">{quotation.clientName}</span>
                                            </div>
                                        )}
                                        {quotation.clientEmail && (
                                            <div>
                                                <span className="font-medium text-gray-700">Email:</span>
                                                <span className="ml-2 text-gray-600">{quotation.clientEmail}</span>
                                            </div>
                                        )}
                                        {quotation.clientComments && (
                                            <div>
                                                <span className="font-medium text-gray-700">Comments:</span>
                                                <p className="mt-1 text-gray-600 whitespace-pre-wrap">{quotation.clientComments}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Signature (only for accepted quotations) */}
                                {quotation.clientAcceptedAt && quotation.clientSignature && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Digital Signature</h4>
                                        <div className="border-2 border-gray-300 rounded-lg bg-white p-4">
                                            <img
                                                src={quotation.clientSignature}
                                                alt="Client Signature"
                                                className="max-w-full h-auto max-h-32"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Signed by {quotation.clientName} on {new Date(quotation.clientAcceptedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                </div>
            )}
        </div>
    );
}
