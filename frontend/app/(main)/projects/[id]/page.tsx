
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { MemberManagementModal } from '@/components/projects/MemberManagementModal';
import {
    Clock, CheckCircle, TrendingUp, AlertCircle,
    ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Users, Settings2
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ... imports remain the same

export default function ProjectDashboard({ params }: { params: { id: string } }) {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get(`/projects/${params.id}`);
            setProject(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;
    if (!project) return null;

    const { stats } = project;
    // Fallback if stats are missing (shouldn't happen with new backend)
    const financials = stats?.financials || { budget: 0, revenue: 0, expenses: 0, netProfit: 0, margin: 0 };
    const efficiency = stats?.efficiency || { completionRate: 0, status: 'optimal' };
    const criticalPath = stats?.criticalPath || { nextMilestone: null };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Progress & Overview */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. Progress Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Task Progress */}
                    <div className="ent-card p-5 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Task Completion</h3>
                                <p className="text-[9px] text-indigo-300 mt-1">Milestone Velocity</p>
                            </div>
                            <div className="p-1.5 bg-white/10 rounded-md">
                                <CheckCircle size={14} className="text-emerald-400" />
                            </div>
                        </div>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-3xl font-black tracking-tight">{efficiency.completionRate}%</span>
                            <span className="text-[9px] font-bold text-indigo-300 mb-1.5 uppercase tracking-wide">Overall Status</span>
                        </div>

                        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${efficiency.completionRate}%` }}
                            />
                        </div>
                    </div>

                    {/* Efficiency Index */}
                    <div className={`ent-card p-5 bg-white border-l-4 ${efficiency.status === 'at-risk' ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Efficiency Index</h3>
                                <p className="text-[9px] text-gray-400 mt-1">Logged Hours vs Est.</p>
                            </div>
                            <div className={`p-1.5 rounded-md ${efficiency.status === 'at-risk' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                                <Clock size={14} className={efficiency.status === 'at-risk' ? 'text-rose-600' : 'text-amber-600'} />
                            </div>
                        </div>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-3xl font-black tracking-tight text-gray-900">
                                {efficiency.totalLoggedHours > 0 ? 'Active' : 'N/A'}
                            </span>
                            <span className={`text-[9px] font-bold mb-1.5 uppercase tracking-wide flex items-center gap-1 ${efficiency.status === 'at-risk' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                <ArrowUpRight size={10} /> {efficiency.status === 'at-risk' ? 'At Risk' : 'Optimal'}
                            </span>
                        </div>

                        <p className="text-[9px] text-gray-400 leading-relaxed">
                            {efficiency.status === 'at-risk'
                                ? 'Resource usage exceeding estimated velocity. Review allocated hours.'
                                : 'Project pace is healthy. Resource utilization is within projected safe zones.'}
                        </p>
                    </div>
                </div>

                {/* 2. Critical Path Activity */}
                <div className="ent-card p-5">
                    <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={12} className="text-primary-600" />
                        Critical Path Activity
                    </h3>
                    <div className="space-y-6 relative ml-2 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                        {(!project.milestones || project.milestones.length === 0) && (
                            <p className="pl-6 text-[10px] text-gray-400 italic">No milestones defined yet.</p>
                        )}
                        {project.milestones?.slice(0, 3).map((m: any) => (
                            <div key={m.id} className="relative pl-6">
                                <div className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${m.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900">{m.title}</h4>
                                        <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">
                                            Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-50 rounded text-gray-500">
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
                    <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <Wallet size={12} className="text-emerald-600" />
                        Project Financials
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-3 border-b border-gray-50">
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Budget</p>
                                <p className="text-lg font-black text-gray-900">${financials.budget.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                                <p className="text-xs font-black text-emerald-600">${financials.revenue.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Expenses</p>
                                <p className="text-xs font-black text-rose-500">${financials.expenses.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Net Profit</span>
                            <div className="text-right">
                                <span className={`text-xs font-black ${financials.netProfit >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                                    ${financials.netProfit.toLocaleString()}
                                </span>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{financials.margin}% Margin</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Members */}
                <div className="ent-card p-5">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Users size={12} className="text-primary-600" />
                            Assigned Core Team
                        </h3>
                        <button
                            onClick={() => setIsMemberModalOpen(true)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"
                            title="Manage Team"
                        >
                            <Settings2 size={12} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {project.members?.map((member: any) => (
                            <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                                <div className="w-7 h-7 rounded bg-primary-50 text-primary-700 flex items-center justify-center text-[9px] font-black uppercase">
                                    {member.employee.firstName[0]}{member.employee.lastName[0]}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="text-[11px] font-bold text-gray-900 truncate">
                                        {member.employee.firstName} {member.employee.lastName}
                                    </h4>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate">
                                        {member.employee.position?.title || member.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!project.members || project.members.length === 0) && (
                            <p className="text-[9px] text-gray-400 italic">No members assigned.</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button className="py-2.5 bg-gray-900 text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10">
                        Create Invoice
                    </button>
                    <button className="py-2.5 bg-white text-gray-900 border border-gray-200 rounded text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                        Log Time
                    </button>
                </div>
            </div>

            <MemberManagementModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                projectId={params.id}
                currentMembers={project.members || []}
                onUpdate={fetchStats}
            />
        </div>
    );
}
