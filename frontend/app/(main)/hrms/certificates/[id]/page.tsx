'use client';

import { Award, ArrowLeft, Download, Mail, ShieldAlert, Trash2, Edit2, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirm } from '@/context/ConfirmationContext';
import PageHeader from '@/components/ui/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { certificateApi, Certificate } from '@/lib/api/certificate';

export default function CertificateDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const { confirm } = useConfirm();
    const { can, user } = usePermission();

    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (user && params.id) {
            loadCertificate();
        }
    }, [user, params.id]);

    const loadCertificate = async () => {
        try {
            setLoading(true);
            const res = await certificateApi.get(params.id);
            setCertificate(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to load certificate details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!certificate) return;
        if (!await confirm({ message: 'Are you sure you want to delete this certificate? This is permanent.', type: 'danger' })) return;
        try {
            setActionLoading(true);
            await certificateApi.delete(certificate.id);
            toast.success('Certificate deleted successfully');
            router.push('/hrms/certificates');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete certificate');
        } finally {
            setActionLoading(false);
        }
    };

    const handleIssue = async () => {
        if (!certificate) return;
        try {
            setActionLoading(true);
            await certificateApi.issue(certificate.id);
            toast.success('Certificate issued successfully');
            loadCertificate();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to issue certificate');
        } finally {
            setActionLoading(false);
        }
    };

    const handleGeneratePdf = async () => {
        if (!certificate) return;
        try {
            setActionLoading(true);
            await certificateApi.generatePdf(certificate.id);
            toast.success('PDF generated successfully');
            loadCertificate();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate PDF');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!certificate) return;
        try {
            setActionLoading(true);
            await certificateApi.sendEmail(certificate.id);
            toast.success('Certificate sent via email successfully');
            loadCertificate();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to email certificate');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!certificate) return;
        try {
            setActionLoading(true);
            const response = await certificateApi.downloadPdf(certificate.id);
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CERTIFICATE_${certificate.certificateNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Download started');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to download PDF');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevoke = async () => {
        if (!certificate) return;
        if (!await confirm({ message: 'Are you sure you want to revoke this certificate? This marks it permanently as invalid.', type: 'danger' })) return;
        try {
            setActionLoading(true);
            await certificateApi.revoke(certificate.id, 'Revoked by admin request');
            toast.success('Certificate revoked successfully');
            loadCertificate();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to revoke certificate');
        } finally {
            setActionLoading(false);
        }
    };

    if (user && !can('Certificate', 'read')) {
        return <AccessDenied />;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <LoadingSpinner />
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="p-6 text-center text-gray-500">
                Certificate not found.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={`Certificate Details`}
                subtitle={`Verification Ref: ${certificate.certificateNo}`}
                icon={Award}
                actions={
                    <div className="flex items-center gap-3">
                        <Link href="/hrms/certificates" className="ent-button-secondary flex items-center gap-2">
                            <ArrowLeft size={14} /> Back to Ledger
                        </Link>

                        {certificate.status === 'draft' && can('Certificate', 'update') && (
                            <Link href={`/hrms/certificates/${certificate.id}/edit`} className="ent-button-secondary flex items-center gap-2">
                                <Edit2 size={14} /> Edit
                            </Link>
                        )}
                    </div>
                }
            />

            {/* Status Alert Banner */}
            {certificate.status === 'revoked' && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider">Warning: Document Revoked</h4>
                        <p className="text-xs text-red-700 mt-1">
                            This credential has been officially revoked and is no longer valid.
                        </p>
                        {certificate.remarks && (
                            <p className="text-xs text-red-700 font-mono mt-1 bg-red-100/50 p-2 rounded border border-red-200/50">
                                Remarks: {certificate.remarks}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {certificate.status === 'draft' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider">Draft Mode</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            This certificate is in Draft. To generate the PDF and make it shareable, you must issue it.
                        </p>
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={handleIssue}
                                disabled={actionLoading}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider text-[10px] py-1.5 px-3 rounded-md shadow-sm"
                            >
                                {actionLoading ? 'Processing...' : 'Issue & Activate'}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold uppercase tracking-wider text-[10px] py-1.5 px-3 rounded-md"
                            >
                                Delete Draft
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {certificate.status === 'issued' && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider">Active & Issued</h4>
                            <p className="text-xs text-green-700 mt-1">
                                This credential has been officially signed and activated.
                                {certificate.emailSentAt && ` Sent via email on ${new Date(certificate.emailSentAt).toLocaleString()}.`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {actionLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <>
                                <button
                                    onClick={handleGeneratePdf}
                                    className="ent-button-secondary py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                                >
                                    <FileText size={12} /> {certificate.pdfPath ? 'Regenerate PDF' : 'Generate PDF'}
                                </button>

                                {certificate.pdfPath && (
                                    <>
                                        <button
                                            onClick={handleDownload}
                                            className="bg-green-600 text-white hover:bg-green-700 py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Download size={12} /> Download
                                        </button>

                                        <button
                                            onClick={handleSendEmail}
                                            className="bg-primary-600 text-white hover:bg-primary-700 py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Mail size={12} /> Email Recipient
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={handleRevoke}
                                    className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5"
                                >
                                    <ShieldAlert size={12} /> Revoke
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                            Recipient Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="ent-label">Full Name</label>
                                <div className="text-sm font-bold text-gray-900">
                                    {certificate.employee
                                        ? `${certificate.employee.firstName} ${certificate.employee.lastName}`
                                        : 'Recruitment Candidate'}
                                </div>
                            </div>
                            <div>
                                <label className="ent-label">Email Address</label>
                                <div className="text-sm font-bold text-gray-900">
                                    {certificate.employee?.email || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <label className="ent-label">Recipient Category</label>
                                <div className="text-sm font-medium text-gray-700 uppercase text-xs">
                                    {certificate.recipientType}
                                </div>
                            </div>
                            <div>
                                <label className="ent-label">Reference Number</label>
                                <div className="text-sm font-mono font-bold text-primary-900">
                                    {certificate.certificateNo}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                            Credential Parameters
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="ent-label">Certificate Title</label>
                                <div className="text-sm font-bold text-gray-900">{certificate.title}</div>
                            </div>
                            <div>
                                <label className="ent-label">Issue Date</label>
                                <div className="text-sm font-medium text-gray-700">
                                    {new Date(certificate.issuedDate).toLocaleDateString('en-IN', {
                                        day: '2-digit', month: 'long', year: 'numeric'
                                    })}
                                </div>
                            </div>

                            {certificate.type === 'course' && (
                                <>
                                    <div>
                                        <label className="ent-label">Course Name</label>
                                        <div className="text-sm font-bold text-gray-900">{certificate.courseName}</div>
                                    </div>
                                    <div>
                                        <label className="ent-label">Duration</label>
                                        <div className="text-sm font-medium text-gray-700">{certificate.duration || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="ent-label">Grade</label>
                                        <div className="text-sm font-bold text-gray-900">{certificate.grade || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="ent-label">Final Score / Percentage</label>
                                        <div className="text-sm font-medium text-gray-700">{certificate.score || '-'}</div>
                                    </div>
                                </>
                            )}

                            {certificate.type === 'internship' && (
                                <>
                                    <div>
                                        <label className="ent-label">Internship Role</label>
                                        <div className="text-sm font-bold text-gray-900">{certificate.internshipRole}</div>
                                    </div>
                                    <div>
                                        <label className="ent-label">Project Name</label>
                                        <div className="text-sm font-medium text-gray-700">{certificate.projectName || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="ent-label">Mentor/Guide Name</label>
                                        <div className="text-sm font-bold text-gray-900">{certificate.guideName || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="ent-label">Duration</label>
                                        <div className="text-sm font-medium text-gray-700">{certificate.duration || '-'}</div>
                                    </div>
                                </>
                            )}

                            {certificate.type === 'experience' && (
                                <>
                                    <div>
                                        <label className="ent-label">Department</label>
                                        <div className="text-sm font-bold text-gray-900">{certificate.department || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="ent-label">Designation</label>
                                        <div className="text-sm font-bold text-gray-900">{certificate.designation || '-'}</div>
                                    </div>
                                </>
                            )}

                            {certificate.expiryDate && (
                                <div>
                                    <label className="ent-label">Expiry Date</label>
                                    <div className="text-sm font-medium text-red-600">
                                        {new Date(certificate.expiryDate).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'long', year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Custom Fields */}
                        {certificate.customFields && Object.keys(certificate.customFields).length > 0 && (
                            <div className="mt-6 border-t border-gray-100 pt-4">
                                <label className="ent-label mb-2 block">Custom Template Variables</label>
                                <div className="bg-slate-50 p-3 rounded border border-gray-200 grid grid-cols-2 gap-4">
                                    {Object.entries(certificate.customFields).map(([key, val]) => (
                                        <div key={key}>
                                            <span className="text-[10px] font-black uppercase text-gray-400 block">{key}</span>
                                            <span className="text-xs font-bold text-gray-800">{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Preview Details */}
                <div className="space-y-6">
                    <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                            Branding & File
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="ent-label">Design Template</label>
                                <div className="text-sm font-bold text-gray-800">
                                    {certificate.template?.name || 'Default ERP Layout'}
                                </div>
                            </div>

                            <div>
                                <label className="ent-label">Remarks</label>
                                <div className="text-xs text-gray-500 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                                    {certificate.remarks || 'No internal remarks.'}
                                </div>
                            </div>

                            {certificate.pdfPath ? (
                                <div className="border-t border-gray-100 pt-4">
                                    <div className="bg-green-50/50 border border-green-100 rounded-md p-3 text-center">
                                        <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                        <span className="text-xs font-bold text-green-800 block">PDF Generated</span>
                                        <button
                                            onClick={handleDownload}
                                            className="mt-2.5 inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-wider text-[9px] py-1.5 px-3 rounded-md shadow-sm"
                                        >
                                            <Download size={10} /> Download PDF
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-gray-100 pt-4 text-center text-xs text-gray-400 italic">
                                    PDF not generated yet.
                                    {certificate.status === 'issued' && (
                                        <button
                                            onClick={handleGeneratePdf}
                                            disabled={actionLoading}
                                            className="mt-2 block w-full bg-primary-600 hover:bg-primary-700 text-white font-bold uppercase tracking-wider text-[10px] py-2 px-3 rounded-md"
                                        >
                                            {actionLoading ? 'Generating...' : 'Generate PDF Now'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
