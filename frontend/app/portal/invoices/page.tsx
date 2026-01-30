'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileText, Download, Filter, Search } from 'lucide-react';

export default function PortalInvoices() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pages: 1 });

    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showFilters, setShowFilters] = useState(false);

    const fetchInvoices = () => {
        setLoading(true);
        const params: any = {};
        if (search) params.search = search;
        if (status !== 'all') params.status = status;
        if (dateRange.start) params.startDate = dateRange.start;
        if (dateRange.end) params.endDate = dateRange.end;

        api.get('/portal/invoices', { params })
            .then((res: any) => {
                setInvoices(res.data.invoices || []);
                setStats({ total: res.data.total || 0, pages: res.data.pages || 1 });
            })
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, status, dateRange]);

    const handleExport = async () => {
        try {
            const params: any = {};
            if (search) params.search = search;
            if (status !== 'all') params.status = status;

            const response = await api.get('/portal/invoices/export', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed', error);
        }
    };

    const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
        try {
            const response = await api.get(`/portal/invoices/${id}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
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
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-slate-50/50 rounded-lg w-full border border-slate-100"></div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Financial Documents"
                subtitle="Track and manage your invoices and payment history."
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
                        <button onClick={handleExport} className="ent-button-secondary bg-white">
                            <Download size={14} className="mr-2" />
                            Export CSV
                        </button>
                    </div>
                }
            />

            {/* Filters Bar */}
            {showFilters && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-down">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search invoice number..."
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
                            <option value="paid">Paid</option>
                            <option value="sent">Unpaid/Sent</option>
                            <option value="overdue">Overdue</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                    <div>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="ent-input w-full"
                            placeholder="Start Date"
                        />
                    </div>
                    <div>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="ent-input w-full"
                            placeholder="End Date"
                        />
                    </div>
                </div>
            )}

            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th>Document Ref</th>
                                <th>Issue Date</th>
                                <th>Status</th>
                                <th className="text-right">Amount</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-sm">
                                        No invoices found associated with your account.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-primary-50 rounded-md text-primary-600 mr-3">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="text-sm font-black text-primary-700 font-mono tracking-tight">
                                                    {inv.invoiceNumber}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-600">
                                            {new Date(inv.invoiceDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-[9px] font-black uppercase tracking-widest rounded-md border ${inv.status === 'paid'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                : inv.status === 'sent' || inv.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm font-black text-slate-900 tracking-tight">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(Number(inv.total))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-md hover:bg-slate-100"
                                                    title="Download PDF"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <Link
                                                    href={`/portal/invoices/${inv.id}`}
                                                    className="text-slate-400 hover:text-primary-600 transition-colors p-2 rounded-md hover:bg-slate-100 flex items-center text-xs font-bold"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {stats.pages > 1 && (
                    <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100/50 text-center text-xs text-slate-400 font-medium">
                        Showing page 1 of {stats.pages}
                    </div>
                )}
            </div>
        </div>
    );
}
