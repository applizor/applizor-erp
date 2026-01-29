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
    AlertCircle,
    CheckCircle2,
    ListTodo,
    BellRing,
    Calendar,
    MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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
        <div className="animate-fade-in space-y-8">
            <PageHeader
                title="Client Dashboard"
                subtitle="Overview of your projects, tasks, and notifications."
                icon={LayoutDashboard}
            />

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. Needs Review - Highlighted */}
                <Link href="/portal/projects" className="ent-card p-6 border-l-4 border-l-violet-500 relative overflow-hidden group hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-violet-50 block cursor-pointer">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-violet-600">
                        <BellRing size={64} />
                    </div>
                    <div className="relative">
                        <h3 className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">Needs Your Review</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {stats.tasksInReview || 0}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Tasks</span>
                        </div>
                        {stats.tasksInReview > 0 ? (
                            <div className="mt-3 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-wide text-white bg-violet-600 px-3 py-1.5 rounded-lg shadow-sm animate-pulse-slow">
                                <AlertCircle size={10} />
                                Action Required
                            </div>
                        ) : (
                            <div className="mt-3 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded">
                                <CheckCircle2 size={10} />
                                All caught up
                            </div>
                        )}
                    </div>
                </Link>

                {/* 2. Outstanding Balance */}
                <Link href="/portal/invoices" className="ent-card p-6 border-l-4 border-l-rose-500 relative overflow-hidden group block cursor-pointer hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-rose-600">
                        <CreditCard size={64} />
                    </div>
                    <div className="relative">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium text-slate-500">{stats.currency || 'USD'}</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {Number(stats.totalDue).toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-3 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                            <span className="bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                {stats.pendingInvoicesCount} invoices pending
                            </span>
                        </div>
                    </div>
                </Link>

                {/* 3. In Progress */}
                <Link href="/portal/projects" className="ent-card p-6 border-l-4 border-l-blue-500 relative overflow-hidden group block cursor-pointer hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-blue-600">
                        <ListTodo size={64} />
                    </div>
                    <div className="relative">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Work In Progress</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.tasksInProgress || 0}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Active Tasks</span>
                        </div>
                        <div className="mt-3 text-[10px] font-bold text-blue-500">
                            For {stats.activeProjects} Active Projects
                        </div>
                    </div>
                </Link>

                {/* 4. Active Projects */}
                <Link href="/portal/projects" className="ent-card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group block cursor-pointer hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-600">
                        <Briefcase size={64} />
                    </div>
                    <div className="relative">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Projects</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.activeProjects || 0}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Engagements</span>
                        </div>
                        <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            <CheckCircle2 size={10} /> ON TRACK
                        </div>
                    </div>
                </Link>
            </div>

            {/* Notification & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Updates Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                            Recent Updates
                        </h3>
                    </div>

                    {stats.recentActivities && stats.recentActivities.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentActivities.map((activity: any) => (
                                <div key={activity.id} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow group">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">
                                                    {activity.user} <span className="text-slate-500 font-medium">commented on</span> {activity.taskTitle}
                                                </p>
                                                <div className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                                    "{activity.content.replace(/<[^>]*>/g, '').substring(0, 100)}..."
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-4">
                                                {formatDistanceToNow(new Date(activity.createdAt))} ago
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
                            <p className="text-sm text-slate-400 font-medium">No recent activity found.</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar / Quick Summary */}
                <div className="space-y-6">
                    {/* Important Reminders */}
                    <div className="ent-card p-5">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quick Summary</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                                <span className="font-bold flex items-center gap-2">
                                    <ListTodo size={14} /> Documents
                                </span>
                                <span className="font-medium">All Signed</span>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                                <span className="font-bold flex items-center gap-2">
                                    <Calendar size={14} /> Meetings
                                </span>
                                <span className="font-medium">No Upcoming</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
