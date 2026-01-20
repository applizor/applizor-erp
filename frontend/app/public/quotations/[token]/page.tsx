'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, XCircle, Download, AlertCircle } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import AlertDialog from '@/components/ui/AlertDialog';
import api from '@/lib/api';

export default function PublicQuotationPage({ params }: { params: { token: string } }) {
    const router = useRouter();
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

    // Local currency formatter (doesn't depend on CurrencyProvider)
    const formatCurrency = (amount: number | string | null | undefined) => {
        const currency = quotation?.currency || 'INR'; // Use quotation's stored currency
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

    useEffect(() => {
        loadQuotation();
    }, [params.token]);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get(`/quotations/public/${params.token}`);
            setQuotation(response.data.quotation);
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to load quotation';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!signature) {
            setAlertDialog({
                isOpen: true,
                type: 'warning',
                title: 'Signature Required',
                message: 'Please provide your signature'
            });
            return;
        }

        if (!termsAccepted) {
            setAlertDialog({
                isOpen: true,
                type: 'warning',
                title: 'Terms Required',
                message: 'Please accept the terms and conditions'
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

            // Reload to show accepted state
            await loadQuotation();
            setShowAcceptForm(false);
            setAlertDialog({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'Quotation accepted successfully! You will receive a confirmation email shortly.'
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

            // Reload to show rejected state
            await loadQuotation();
            setShowRejectForm(false);
            setAlertDialog({
                isOpen: true,
                type: 'info',
                title: 'Declined',
                message: 'Quotation declined. Thank you for your response.'
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
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md p-8">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Quotation Not Found</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!quotation) return null;

    const isAccepted = !!quotation.clientAcceptedAt;
    const isRejected = !!quotation.clientRejectedAt;
    const canRespond = !isAccepted && !isRejected;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Status Banner */}
                {isAccepted && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                        <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                        <div>
                            <p className="font-medium text-green-900">Quotation Accepted</p>
                            <p className="text-sm text-green-700">
                                Accepted by {quotation.clientName} on {new Date(quotation.clientAcceptedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <XCircle className="w-6 h-6 text-red-600 mr-3" />
                        <div>
                            <p className="font-medium text-red-900">Quotation Declined</p>
                            <p className="text-sm text-red-700">
                                Declined by {quotation.clientName} on {new Date(quotation.clientRejectedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}

                {/* Quotation Document */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="px-8 py-10 border-b border-gray-200 flex justify-between items-start">
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
                                <div className="text-2xl font-bold text-primary-600 mb-2">
                                    {quotation.company?.name || 'COMPANY NAME'}
                                </div>
                            )}
                            <p className="text-sm text-gray-600 max-w-xs">
                                {quotation.company?.address && <>{quotation.company.address}<br /></>}
                                {quotation.company?.city && quotation.company?.state && (
                                    <>{quotation.company.city}, {quotation.company.state} - {quotation.company.pincode || ''}<br /></>
                                )}
                                {quotation.company?.email && <>{quotation.company.email}</>}
                                {quotation.company?.phone && <> | {quotation.company.phone}</>}
                            </p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-bold text-gray-900">QUOTATION</h1>
                            <div className="mt-3 space-y-1 text-sm">
                                <p><span className="font-medium">Number:</span> {quotation.quotationNumber}</p>
                                <p><span className="font-medium">Date:</span> {new Date(quotation.quotationDate).toLocaleDateString()}</p>
                                {quotation.validUntil && (
                                    <p><span className="font-medium">Valid Till:</span> {new Date(quotation.validUntil).toLocaleDateString()}</p>
                                )}
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        quotation.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {quotation.status === 'viewed' ? 'WAITING' : quotation.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Billed To */}
                    <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Billed To</h3>
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
                                        <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-right">{Number(item.quantity)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">
                                            {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-600">Sub Total</td>
                                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(quotation.subtotal)}</td>
                                </tr>
                                {Number(quotation.tax) > 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-600">Tax</td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(quotation.tax)}</td>
                                    </tr>
                                )}
                                {Number(quotation.discount) > 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-600">Discount</td>
                                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">-{formatCurrency(quotation.discount)}</td>
                                    </tr>
                                )}
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
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Terms and Conditions</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons - Only show if not responded */}
                {canRespond && !showAcceptForm && !showRejectForm && (
                    <div className="mt-6 flex justify-center space-x-4">
                        <button
                            onClick={() => setShowRejectForm(true)}
                            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => setShowAcceptForm(true)}
                            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-lg"
                        >
                            Accept Quotation
                        </button>
                    </div>
                )}

                {/* Accept Form */}
                {showAcceptForm && canRespond && (
                    <div className="mt-6 bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Accept Quotation</h2>
                        <form onSubmit={handleAccept} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Signature <span className="text-red-500">*</span>
                                </label>
                                <SignaturePad onSave={setSignature} disabled={submitting} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Comments (Optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Any additional comments..."
                                />
                            </div>

                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                                    I accept the terms and conditions stated in this quotation <span className="text-red-500">*</span>
                                </label>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAcceptForm(false)}
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Confirm Acceptance'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Reject Form */}
                {showRejectForm && canRespond && (
                    <div className="mt-6 bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Decline Quotation</h2>
                        <form onSubmit={handleReject} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Declining (Optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Please let us know why you're declining..."
                                />
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectForm(false)}
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Confirm Decline'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

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
