'use client';

import { Award, Plus, Download, Mail, Eye, Trash2, ShieldAlert, FileText, Settings, Search } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirm } from '@/context/ConfirmationContext';
import PageHeader from '@/components/ui/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { certificateApi, Certificate } from '@/lib/api/certificate';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function CertificatesPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const { can, user } = usePermission();

    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadCertificates();
        }
    }, [user, search, type, status, page]);

    const loadCertificates = async () => {
        try {
            setLoading(true);
            const res = await certificateApi.list({
                search: search || undefined,
                type: type || undefined,
                status: status || undefined,
                page,
                limit: 10,
            });
            setCertificates(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to load certificates');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Are you sure you want to delete this certificate? This action cannot be undone.', type: 'danger' })) return;
        try {
            setActionLoadingId(id);
            await certificateApi.delete(id);
            toast.success('Certificate deleted successfully');
            loadCertificates();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete certificate');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSendEmail = async (id: string) => {
        try {
            setActionLoadingId(id);
            await certificateApi.sendEmail(id);
            toast.success('Certificate sent via email successfully');
            loadCertificates();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to email certificate');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleGeneratePdf = async (id: string) => {
        try {
            setActionLoadingId(id);
            await certificateApi.generatePdf(id);
            toast.success('PDF generated successfully');
            loadCertificates();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate PDF');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!await confirm({ message: 'Are you sure you want to revoke this certificate? It will mark it permanently as invalid/revoked.', type: 'danger' })) return;
        try {
            setActionLoadingId(id);
            await certificateApi.revoke(id, 'Manually revoked by administrator');
            toast.success('Certificate revoked successfully');
            loadCertificates();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to revoke certificate');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDownload = async (id: string, certificateNo: string) => {
        try {
            setActionLoadingId(id);
            const response = await certificateApi.downloadPdf(id);
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CERTIFICATE_${certificateNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Download started');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to download PDF');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleIssue = async (id: string) => {
        try {
            setActionLoadingId(id);
            await certificateApi.issue(id);
            toast.success('Certificate issued successfully');
            loadCertificates();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to issue certificate');
        } finally {
            setActionLoadingId(null);
        }
    };

    if (user && !can('Certificate', 'read')) {
        return <AccessDenied />;
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Credential & Certificate Ledger"
                subtitle="Issue and verify training certificates, internship credentials, and work experience letters"
                icon={Award}
                actions={
                    <div className="flex items-center gap-3">
                        {can('CertificateTemplate', 'read') && (
                            <Link href="/settings/certificate-templates" className="ent-button-secondary flex items-center gap-2">
                                <Settings size={14} /> Templates
                            </Link>
                        )}
                        {can('Certificate', 'create') && (
                            <Link href="/hrms/certificates/new" className="btn-primary flex items-center gap-2">
                                <Plus size={14} /> New Certificate
                            </Link>
                        )}
                    </div>
                }
            />

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by certificate number, title or course name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="ent-input pl-9 w-full"
                    />
                </div>
                <div className="w-full md:w-48">
                    <CustomSelect
                        value={type}
                        onChange={(val) => setType(val)}
                        options={[
                            { label: 'All Types', value: '' },
                            { label: 'Course Certificate', value: 'course' },
                            { label: 'Internship Certificate', value: 'internship' },
                            { label: 'Experience Letter', value: 'experience' },
                            { label: 'Custom Document', value: 'custom' }
                        ]}
                    />
                </div>
                <div className="w-full md:w-48">
                    <CustomSelect
                        value={status}
                        onChange={(val) => setStatus(val)}
                        options={[
                            { label: 'All Statuses', value: '' },
                            { label: 'Draft', value: 'draft' },
                            { label: 'Issued', value: 'issued' },
                            { label: 'Revoked', value: 'revoked' }
                        ]}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-16 bg-white rounded-md border border-gray-200">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                    <div className="ent-table-container">
                        <table className="ent-table min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr>
                                    <th>Ref Number</th>
                                    <th>Recipient</th>
                                    <th>Document Type</th>
                                    <th>Title</th>
                                    <th>Issue Date</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {certificates.map((cert) => {
                                    const isActionLoading = actionLoadingId === cert.id;
                                    return (
                                        <tr key={cert.id} className="hover:bg-gray-50/50">
                                            <td className="font-mono text-primary-900 font-bold whitespace-nowrap">
                                                {cert.certificateNo}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                {cert.employee ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">
                                                            {cert.employee.firstName} {cert.employee.lastName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            {cert.employee.employeeId} • {cert.employee.email}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">Candidate / Other</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap uppercase tracking-wider text-[10px]">
                                                {cert.type === 'course' && <span className="text-blue-600 font-black">Course</span>}
                                                {cert.type === 'internship' && <span className="text-purple-600 font-black">Internship</span>}
                                                {cert.type === 'experience' && <span className="text-emerald-600 font-black">Experience</span>}
                                                {cert.type === 'custom' && <span className="text-slate-600 font-black">Custom</span>}
                                            </td>
                                            <td>
                                                <div className="font-medium text-gray-800">{cert.title}</div>
                                                {cert.courseName && (
                                                    <div className="text-[10px] text-gray-500 font-medium">{cert.courseName}</div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap text-gray-600 font-bold">
                                                {new Date(cert.issuedDate).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                                                    cert.status === 'issued' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                    cert.status === 'revoked' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                    'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {cert.status}
                                                </span>
                                            </td>
                                            <td className="text-right whitespace-nowrap">
                                                {isActionLoading ? (
                                                    <div className="inline-block"><LoadingSpinner /></div>
                                                ) : (
                                                    <div className="flex justify-end gap-1.5">
                                                        <Link
                                                            href={`/hrms/certificates/${cert.id}`}
                                                            title="View Details"
                                                            className="p-1.5 text-gray-600 hover:text-primary-900 hover:bg-gray-100 rounded"
                                                        >
                                                            <Eye size={14} />
                                                        </Link>

                                                        {cert.status === 'draft' && (
                                                            <button
                                                                onClick={() => handleIssue(cert.id)}
                                                                title="Issue Certificate"
                                                                className="p-1.5 text-amber-600 hover:text-green-900 hover:bg-green-50 rounded"
                                                            >
                                                                <FileText size={14} />
                                                            </button>
                                                        )}

                                                        {cert.status === 'issued' && (
                                                            <>
                                                                {!cert.pdfPath ? (
                                                                    <button
                                                                        onClick={() => handleGeneratePdf(cert.id)}
                                                                        title="Generate PDF"
                                                                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                                                    >
                                                                        <FileText size={14} />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleDownload(cert.id, cert.certificateNo)}
                                                                        title="Download PDF"
                                                                        className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                                                    >
                                                                        <Download size={14} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleSendEmail(cert.id)}
                                                                    title="Email to Recipient"
                                                                    className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded"
                                                                    disabled={!cert.pdfPath}
                                                                >
                                                                    <Mail size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRevoke(cert.id)}
                                                                    title="Revoke Certificate"
                                                                    className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded"
                                                                >
                                                                    <ShieldAlert size={14} />
                                                                </button>
                                                            </>
                                                        )}

                                                        {cert.status !== 'issued' && can('Certificate', 'delete') && (
                                                            <button
                                                                onClick={() => handleDelete(cert.id)}
                                                                title="Delete"
                                                                className="p-1.5 text-red-500 hover:text-red-900 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {certificates.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No certificates found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    className="ent-button-secondary py-1 px-3 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className="ent-button-secondary py-1 px-3 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
