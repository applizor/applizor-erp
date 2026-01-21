'use client';

import { useState, useEffect } from 'react';
import {
    History,
    User,
    Globe,
    Monitor,
    Clock,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Activity,
    Search,
    Filter
} from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

    useEffect(() => {
        fetchLogs(pagination.page);
    }, [pagination.page]);

    const fetchLogs = async (page: number) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/audit-logs?page=${page}&limit=${pagination.limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 px-2">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
                            Security Ledger
                            {pagination.total > 0 && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100 uppercase font-black tracking-widest">
                                    {pagination.total} EVENTS
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Immutable audit trail of system-wide administrative actions and security events.
                        </p>
                    </div>
                </div>

                <div className="ent-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Stream</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto-Refresh</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="ent-table">
                            <thead>
                                <tr>
                                    <th className="rounded-l-xl">Initiator</th>
                                    <th>Action Protocol</th>
                                    <th>Functional Module</th>
                                    <th>Event Specifics</th>
                                    <th>Network Origin</th>
                                    <th className="text-right rounded-r-xl">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse font-black uppercase text-[10px] tracking-widest">Synchronizing ledger...</td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <History size={24} className="text-slate-200 mb-2" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zero security events recorded</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black text-slate-900 tracking-tight">
                                                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System Kernel'}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {log.user?.email || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${log.action === 'LOGIN'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : log.action.includes('DELETE')
                                                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                        : 'bg-primary-50 text-primary-700 border-primary-100'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-tight">
                                                    <Globe size={10} className="text-slate-400" />
                                                    {log.module}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-[10px] font-medium text-slate-500 max-w-xs truncate group-hover:block transition-all">
                                                    {log.details || 'No extended metadata'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 font-mono">
                                                    <Monitor size={10} />
                                                    {log.ipAddress || '0.0.0.0'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="text-[10px] font-black text-slate-900 tracking-tighter">
                                                    {new Date(log.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Redesigned for High Density */}
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                        <div className="hidden sm:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Displaying <span className="text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-slate-900">{pagination.total}</span> entries
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-primary-600 hover:border-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-md border border-slate-200 shadow-sm">
                                <span className="text-[10px] font-black text-primary-600">{pagination.page}</span>
                                <span className="text-[10px] font-black text-slate-300">/</span>
                                <span className="text-[10px] font-black text-slate-400">{pagination.pages}</span>
                            </div>

                            <button
                                onClick={() => setPagination({ ...pagination, page: Math.min(pagination.pages, pagination.page + 1) })}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-primary-600 hover:border-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
