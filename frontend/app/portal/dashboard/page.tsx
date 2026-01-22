'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import {
    LayoutDashboard,
    CreditCard,
    Clock,
    Briefcase,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

export default function PortalDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/portal/dashboard')
            .then((res: any) => setStats(res.data))
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );

    if (!stats) return null;

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Client Dashboard"
                subtitle="Overview of your projects, invoices, and payments."
                icon={LayoutDashboard}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Due Card */}
                <div className="ent-card p-6 border-l-4 border-l-rose-500 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard size={64} />
                    </div>
                    <div className="relative">
                        <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">Total Outstanding</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium text-slate-500">{stats.currency || 'USD'}</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {Number(stats.totalDue).toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-rose-500 bg-rose-50 px-2 py-1 rounded inline-block">
                            <AlertCircle size={12} />
                            Action Required
                        </div>
                    </div>
                </div>

                {/* Pending Invoices Card */}
                <div className="ent-card p-6 border-l-4 border-l-amber-500 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={64} />
                    </div>
                    <div className="relative">
                        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Pending Invoices</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {stats.pendingInvoicesCount}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Documents</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                            <Clock size={12} />
                            Awaiting Payment
                        </div>
                    </div>
                </div>

                {/* Active Projects Card */}
                <div className="ent-card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Briefcase size={64} />
                    </div>
                    <div className="relative">
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Active Projects</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {stats.activeProjects}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Engagements</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                            <CheckCircle2 size={12} />
                            On Track
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
