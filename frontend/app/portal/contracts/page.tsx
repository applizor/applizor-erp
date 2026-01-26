'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FileSignature, Download, Eye, CheckCircle, Clock, FileText, Search } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function PortalContracts() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/portal/contracts');
            setContracts(res.data || []);
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to load contracts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const handleDownloadPdf = async (id: string, title: string) => {
        try {
            const response = await api.get(`/portal/contracts/${id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Contract-${title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Contract PDF downloaded');
        } catch (error) {
            console.error('PDF download failed', error);
            toast.error('Failed to download PDF');
        }
    };

    const filteredContracts = contracts.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string, signedAt: any) => {
        if (signedAt) {
            return (
                <span className="ent-badge ent-badge-success">
                    <CheckCircle size={10} className="mr-1" />
                    SIGNED
                </span>
            );
        }
        if (status === 'sent') {
            return (
                <span className="ent-badge ent-badge-warning">
                    <Clock size={10} className="mr-1" />
                    AWAITING SIGNATURE
                </span>
            );
        }
        return (
            <span className="ent-badge ent-badge-neutral">
                {status.toUpperCase()}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-20 bg-slate-100 rounded-lg w-full"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-slate-50/50 rounded-lg w-full border border-slate-100"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="My Contracts"
                subtitle="View and sign legal agreements and contracts."
                icon={FileSignature}
            />

            <div className="ent-card p-4">
                <div className="relative w-full ent-form-group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="SEARCH CONTRACTS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ent-input pl-9"
                    />
                </div>
            </div>

            <div className="ent-card overflow-hidden">
                {filteredContracts.length === 0 ? (
                    <div className="py-16 text-center">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-400 font-medium text-sm">
                            No contracts found.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredContracts.map((contract) => (
                            <div
                                key={contract.id}
                                className="p-5 hover:bg-slate-50/50 transition-colors group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-primary-50 rounded-md text-primary-600 flex-shrink-0">
                                                <FileSignature size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-slate-900 truncate">
                                                    {contract.title}
                                                </h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                    Created {new Date(contract.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-3">
                                            {getStatusBadge(contract.status, contract.signedAt)}

                                            {contract.signedAt && (
                                                <span className="text-[10px] text-slate-500 font-bold">
                                                    Signed on {new Date(contract.signedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleDownloadPdf(contract.id, contract.title)}
                                            className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-md hover:bg-slate-50"
                                            title="Download PDF"
                                        >
                                            <Download size={16} />
                                        </button>

                                        <Link
                                            href={`/portal/contracts/${contract.id}`}
                                            className="btn-secondary text-[10px] flex items-center gap-2 px-3 py-1.5"
                                        >
                                            <Eye size={12} />
                                            {contract.signedAt ? 'VIEW' : 'REVIEW & SIGN'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
