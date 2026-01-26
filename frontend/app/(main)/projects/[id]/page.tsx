
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Clock, CheckCircle, TrendingUp, AlertCircle,
    ArrowUpRight, ArrowDownRight, DollarSign, Wallet
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectDashboard({ params }: { params: { id: string } }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // In a real app, this might come from a dedicated /dashboard-stats endpoint
            // For now, we assume getProjectById includes computed stats
            const res = await api.get(`/projects/${params.id}`);
            setStats(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;
    if (!stats) return null;

    // Calculate Completion
    const totalTasks = Object.values(stats.taskStats || {}).reduce((acc: number, val: any) => acc + (val._count || 0), 0) as number;
    const completedTasks = stats.taskStats?.find((s: any) => s.status === 'done')?._count || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Financials (Mock logic if fields rely on complex relations, but we added fields to schema)
    const budget = Number(stats.budget) || 0;
    const revenue = Number(stats.actualRevenue) || 0;
    const expense = Number(stats.actualExpenses) || 0;
    const profit = revenue - expense;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Progress & Overview */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. Progress Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Task Progress (Circular Logic Visualized) */}
                    <div className="ent-card p-6 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xs font-black text-indigo-200 uppercase tracking-widest">Task Completion</h3>
                                <p className="text-[10px] text-indigo-300 mt-1">Milestone Velocity</p>
                            </div>
                            <div className="p-2 bg-white/10 rounded-md">
                                <CheckCircle size={18} className="text-emerald-400" />
                            </div>
                        </div>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-4xl font-black tracking-tight">{completionRate}%</span>
                            <span className="text-[10px] font-bold text-indigo-300 mb-2 uppercase tracking-wide">Overall Status</span>
                        </div>

                        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>

                    {/* Time / Efficiency (Mock for now, normally from Timesheets) */}
                    <div className="ent-card p-6 bg-white border-l-4 border-l-amber-500">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Efficiency Index</h3>
                                <p className="text-[10px] text-gray-400 mt-1">Logged Hours vs Est.</p>
                            </div>
                            <div className="p-2 bg-amber-50 rounded-md">
                                <Clock size={18} className="text-amber-600" />
                            </div>
                        </div>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-4xl font-black tracking-tight text-gray-900">92<span className="text-lg text-gray-400 font-bold">%</span></span>
                            <span className="text-[10px] font-bold text-emerald-600 mb-2 uppercase tracking-wide flex items-center gap-1">
                                <ArrowUpRight size={10} /> Optimal
                            </span>
                        </div>

                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            Project pace is healthy. Resource utilization is within projected safe zones.
                        </p>
                    </div>
                </div>

                {/* 2. Recent Milestones / Activity */}
                <div className="ent-card p-6">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={14} className="text-primary-600" />
                        Critical Path Activity
                    </h3>
                    <div className="space-y-6 relative ml-2 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                        {(!stats.milestones || stats.milestones.length === 0) && (
                            <p className="pl-6 text-xs text-gray-400 italic">No milestones defined yet.</p>
                        )}
                        {stats.milestones?.slice(0, 3).map((m: any, idx: number) => (
                            <div key={m.id} className="relative pl-6">
                                <div className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${m.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{m.title}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">
                                            Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-50 rounded text-gray-500">
                                        {m.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Financials & Team */}
            <div className="space-y-6">

                {/* Financial Overview */}
                <div className="ent-card p-5 border-t-4 border-t-emerald-500">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <Wallet size={14} className="text-emerald-600" />
                        Project Financials
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-3 border-b border-gray-50">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Budget</p>
                                <p className="text-lg font-black text-gray-900">${budget.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Revenue (Invoiced)</p>
                                <p className="text-sm font-black text-emerald-600">${revenue.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Expenses</p>
                                <p className="text-sm font-black text-rose-500">${expense.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Net Profit</span>
                            <div className="text-right">
                                <span className={`text-sm font-black ${profit >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                                    ${profit.toLocaleString()}
                                </span>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{margin}% Margin</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Members */}
                <div className="ent-card p-5">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <Users size={14} className="text-primary-600" />
                        Assigned Core Team
                    </h3>
                    <div className="space-y-3">
                        {stats.members?.map((member: any) => (
                            <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                                <div className="w-8 h-8 rounded bg-primary-50 text-primary-700 flex items-center justify-center text-[10px] font-black uppercase">
                                    {member.employee.firstName[0]}{member.employee.lastName[0]}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="text-xs font-bold text-gray-900 truncate">
                                        {member.employee.firstName} {member.employee.lastName}
                                    </h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                        {member.employee.position?.title || member.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!stats.members || stats.members.length === 0) && (
                            <p className="text-[10px] text-gray-400 italic">No members assigned.</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 bg-gray-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10">
                        Create Invoice
                    </button>
                    <button className="py-3 bg-white text-gray-900 border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                        Log Time
                    </button>
                </div>
            </div>
        </div>
    );
}
