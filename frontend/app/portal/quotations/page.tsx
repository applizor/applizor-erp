'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FileText, Download, Filter, Search, ArrowRight } from 'lucide-react';

export default function PortalQuotations() {
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pages: 1 });

    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const fetchQuotations = () => {
        setLoading(true);
        const params: any = {};
        if (search) params.search = search;
        if (status !== 'all') params.status = status;

        api.get('/portal/quotations', { params })
            .then((res: any) => {
                setQuotations(res.data.quotations || []);
                setStats({ total: res.data.total || 0, pages: res.data.pages || 1 });
            })
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuotations();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, status]);

    const handleDownloadPdf = async (id: string, number: string) => {
        try {
            const response = await api.get(`/portal/quotations/${id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation-${number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('PDF download failed', error);
        }
    };

    if (loading) return (
        <div className="animate-pulse space-y-6">
            <div className="h-20 bg-slate-100 rounded-lg w-full"></div>
            <div className="space-y-4">
                <div className="h-12 bg-slate-100 rounded-lg w-full"></div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-50/50 rounded-lg w-full border border-slate-100"></div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="My Quotations"
                subtitle="Review and accept estimates and proposals."
                icon={FileText}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`ent-button-secondary bg-white ${showFilters ? 'ring-2 ring-primary-500' : ''}`}
                        >
                            <Filter size={14} className="mr-2" />
                            Filters
                        </button>
                    </div>
                }
            />

            {/* Filters Bar */}
            {showFilters && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-down mb-6">
                    <div className="relative col-span-2">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search quotation number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ent-input pl-10 w-full"
                        />
                    </div>
                    <div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="ent-input w-full"
                        >
                            <option value="all">All Status</option>
                            <option value="sent">Sent / Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th>Ref Number</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th className="text-right">Total</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {quotations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium text-sm">
                                        No quotations found.
                                    </td>
                                </tr>
                            ) : (
                                quotations.map((quote) => (
                                    <tr key={quote.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-primary-50 rounded-md text-primary-600 mr-3">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="text-sm font-black text-primary-700 font-mono tracking-tight">
                                                    {quote.quotationNumber}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-600">
                                            {new Date(quote.quotationDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-[9px] font-black uppercase tracking-widest rounded-md border ${quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    quote.status === 'rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                        quote.status === 'expired' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                                            'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm font-black text-slate-900 tracking-tight">
                                                {quote.currency || 'INR'} {Number(quote.total).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownloadPdf(quote.id, quote.quotationNumber)}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-md hover:bg-slate-100"
                                                    title="Download PDF"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <Link
                                                    href={`/portal/quotations/${quote.id}`}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-md hover:bg-slate-100 flex items-center text-xs font-bold"
                                                >
                                                    View <ArrowRight size={14} className="ml-1" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
