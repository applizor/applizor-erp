
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
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
    const { can } = useProjectPermissions(project);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Progress & Overview */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. Progress Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Task Progress - BRANDED */}
                    <div className="ent-card p-5 bg-gradient-to-br from-primary-900 to-primary-950 text-white relative overflow-hidden border-none ring-1 ring-black/5 shadow-lg">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl pointer-events-none" />

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[9px] font-black text-primary-200 uppercase tracking-widest">Task Completion</h3>
                                <p className="text-[9px] text-primary-300 mt-0.5 font-bold">Milestone Velocity</p>
                            </div>
                            <div className="p-1.5 bg-white/10 rounded-md backdrop-blur-sm">
                                <CheckCircle size={14} className="text-emerald-400" />
                            </div>
                        </div>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-3xl font-black tracking-tight">{efficiency.completionRate}%</span>
                            <span className="text-[9px] font-bold text-primary-300 mb-1.5 uppercase tracking-wide">Overall Status</span>
                        </div>

                        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                style={{ width: `${efficiency.completionRate}%` }}
                            />
                        </div>
                    </div>

                    {/* Efficiency Index */}
                    <div className={`ent-card p-5 bg-white border-l-4 ${efficiency.status === 'at-risk' ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Efficiency Index</h3>
                                <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Logged Hours vs Est.</p>
                            </div>
                            <div className={`p-1.5 rounded-md ${efficiency.status === 'at-risk' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                                <Clock size={14} className={efficiency.status === 'at-risk' ? 'text-rose-600' : 'text-amber-600'} />
                            </div>
                        </div>

                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-3xl font-black tracking-tight text-slate-900">
                                {efficiency.totalLoggedHours > 0 ? 'Active' : 'N/A'}
                            </span>
                            <span className={`text-[9px] font-bold mb-1.5 uppercase tracking-wide flex items-center gap-1 ${efficiency.status === 'at-risk' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                <ArrowUpRight size={10} /> {efficiency.status === 'at-risk' ? 'At Risk' : 'Optimal'}
                            </span>
                        </div>

                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                            {efficiency.status === 'at-risk'
                                ? 'Resource usage exceeding estimated velocity. Review allocated hours.'
                                : 'Project pace is healthy. Resource utilization is within projected safe zones.'}
                        </p>
                    </div>
                </div>

                {/* 2. Critical Path Activity */}
                <div className="ent-card p-5">
                    <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={12} className="text-primary-600" />
                        Critical Path Activity
                    </h3>
                    <div className="space-y-6 relative ml-2 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                        {(!project.milestones || project.milestones.length === 0) && (
                            <p className="pl-6 text-[10px] text-slate-400 italic font-bold">No milestones defined yet.</p>
                        )}
                        {project.milestones?.slice(0, 3).map((m: any) => (
                            <div key={m.id} className="relative pl-6 group">
                                <div className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white transition-all group-hover:scale-110 ${m.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900 group-hover:text-primary-700 transition-colors uppercase">{m.title}</h4>
                                        <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                                            Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${m.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
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

                {/* Financials */}
                {can('financials', 'view') && (
                    <div className="ent-card p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Wallet size={12} className="text-primary-600" />
                                Financial Overview
                            </h3>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">FY 2024-25</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-wider">Budget</span>
                                <span className="text-xs font-black text-slate-900 block truncate">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency || 'USD' }).format(project.budget || 0)}
                                </span>
                            </div>
                            <div className="p-2.5 bg-emerald-50 rounded border border-emerald-100">
                                <span className="text-[9px] font-black text-emerald-600 uppercase block mb-1 tracking-wider">Revenue</span>
                                <span className="text-xs font-black text-emerald-700 block truncate">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency || 'USD' }).format(project.actualRevenue || 0)}
                                </span>
                            </div>
                            <div className="p-2.5 bg-rose-50 rounded border border-rose-100">
                                <span className="text-[9px] font-black text-rose-600 uppercase block mb-1 tracking-wider">Expenses</span>
                                <span className="text-xs font-black text-rose-700 block truncate">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency || 'USD' }).format(project.actualExpenses || 0)}
                                </span>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-4">
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Net Profit</span>
                            <div className="text-right">
                                <span className={`text-xs font-black ${financials.netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency || 'USD' }).format(financials.netProfit)}
                                </span>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{financials.margin}% Margin</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Members */}
                <div className="ent-card p-5">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Users size={12} className="text-primary-600" />
                            Assigned Core Team
                        </h3>
                        {can('settings', 'edit') && (
                            <button
                                onClick={() => setIsMemberModalOpen(true)}
                                className="p-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-primary-600 transition-colors"
                                title="Manage Team"
                            >
                                <Settings2 size={12} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {project.members?.map((member: any) => (
                            <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors group cursor-default">
                                <div className="w-8 h-8 rounded bg-primary-50 text-primary-700 flex items-center justify-center text-[10px] font-black uppercase ring-2 ring-transparent group-hover:ring-primary-100 transition-all">
                                    {member.employee.firstName[0]}{member.employee.lastName[0]}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="text-[11px] font-bold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                                        {member.employee.firstName} {member.employee.lastName}
                                    </h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                        {member.employee.position?.title || member.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!project.members || project.members.length === 0) && (
                            <p className="text-[9px] text-slate-400 italic font-bold text-center py-4">No members assigned.</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions removed as per user request */}
            </div>

            <MemberManagementModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                projectId={params.id}
                currentMembers={project.members || []}
                onUpdate={fetchStats}
            />
        </div >
    );
}
