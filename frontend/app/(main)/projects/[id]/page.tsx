'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { useSocket } from '@/contexts/SocketContext';
import { MemberManagementModal } from '@/components/projects/MemberManagementModal';
import {
    Clock, CheckCircle2, TrendingUp, AlertCircle,
    ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Users, Settings2,
    Calendar, Activity, FileText, Globe, ExternalLink, Zap
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import { useRouter } from 'next/navigation';

const STATUS_COLORS: any = {
    todo: '#64748b',
    doing: '#0ea5e9',
    review: '#8b5cf6',
    done: '#10b981',
    cancelled: '#ef4444'
};

const PRIORITY_COLORS: any = {
    low: '#94a3b8',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#7f1d1d'
};

export default function ProjectDashboard({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [activityFeed, setActivityFeed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

    const { can } = useProjectPermissions(project);
    const { socket } = useSocket();

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get(`/projects/${params.id}`);
            setProject(res.data);
            setStats(res.data.stats);
            setActivityFeed(res.data.activityFeed || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!socket || !params.id) return;
        const onConnect = () => socket.emit('join-project', params.id);
        if (socket.connected) onConnect();
        socket.on('connect', onConnect);
        const refresh = () => fetchData();
        socket.on('TASK_CREATED', refresh);
        socket.on('TASK_UPDATED', refresh);
        socket.on('TASK_DELETED', refresh);
        return () => {
            socket.off('connect', onConnect);
            socket.off('TASK_CREATED', refresh);
            socket.off('TASK_UPDATED', refresh);
            socket.off('TASK_DELETED', refresh);
        };
    }, [socket, params.id, fetchData]);

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;
    if (!project) return null;

    const efficiency = stats?.efficiency || { completionRate: 0, status: 'optimal', totalLoggedHours: 0 };
    const financials = stats?.financials || { budget: 0, revenue: 0, expenses: 0, netProfit: 0, margin: 0 };

    // Prepare chart data
    const statusData = Object.entries(efficiency.statusDistribution || {}).map(([name, value]) => ({ name, value }));
    const priorityData = Object.entries(efficiency.priorityDistribution || {}).map(([name, value]) => ({ name, value }));
    const assigneeData = Object.entries(efficiency.assigneeDistribution || {}).map(([name, count]) => ({ name, count }));

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* 1. Header KPIs - High Density */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricTile title="Total Tasks" value={efficiency.totalTasks} icon={<FileText size={18} />} color="sky" />
                <MetricTile title="Completion" value={`${efficiency.completionRate}%`} icon={<CheckCircle2 size={18} />} color="emerald" trend="+5%" />
                <MetricTile title="Burn Rate" value={`${financials.margin}%`} icon={<TrendingUp size={18} />} color="violet" subValue="Profit Margin" />
                <MetricTile title="Deadlines" value={project.milestones?.filter((m: any) => m.status !== 'completed').length || 0} icon={<Calendar size={18} />} color="amber" />
                <MetricTile title="Billable Hours" value={efficiency.totalLoggedHours} icon={<Clock size={18} />} color="slate" subValue="Logged" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Analytics & Roadmap */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Distribution Analytics Hub */}
                    <div className="ent-card p-6 bg-white overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-primary-600" /> Workload Intelligence
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[8px] font-bold text-slate-400 uppercase">On Track</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-[8px] font-bold text-slate-400 uppercase">At Risk</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Status Chart */}
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Task Status</p>
                                <div className="h-40 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statusData} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value">
                                                {statusData.map((entry: any, index) => (
                                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-lg font-black text-slate-700">{efficiency.totalTasks}</span>
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Tasks</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
                                    {statusData.map((s: any) => (
                                        <div key={s.name} className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] || '#ccc' }} />
                                            <span className="text-[8px] font-bold text-slate-500 uppercase">{s.name} ({s.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Priority Distribution */}
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Priority Heatmap</p>
                                <div className="h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={priorityData} innerRadius={0} outerRadius={60} dataKey="value">
                                                {priorityData.map((entry: any, index) => (
                                                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#cbd5e1'} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
                                    {priorityData.map((p: any) => (
                                        <div key={p.name} className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p.name] || '#ccc' }} />
                                            <span className="text-[8px] font-bold text-slate-500 uppercase">{p.name} ({p.value})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Team Load */}
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Team Resource Load</p>
                                <div className="h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={assigneeData} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 800, fill: '#64748b' }} width={60} />
                                            <Bar dataKey="count" fill="#334155" radius={[0, 4, 4, 0]} barSize={10} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Milestone Roadmap */}
                    <div className="ent-card p-6 bg-white overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-amber-500" /> Critical Path Roadmap
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {project.milestones?.filter((m: any) => m.status === 'completed').length || 0} / {project.milestones?.length || 0} Accomplished
                            </span>
                        </div>
                        <div className="relative pl-4 border-l-2 border-slate-100 ml-2 space-y-6">
                            {project.milestones?.map((milestone: any) => (
                                <div key={milestone.id} className="relative pl-6 group">
                                    <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                                        ${milestone.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        {milestone.status === 'completed' && <CheckCircle2 size={10} className="text-white" />}
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg group-hover:bg-primary-50 transition-all border border-transparent group-hover:border-primary-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className={`text-xs font-bold ${milestone.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{milestone.title}</h4>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{milestone.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${milestone.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {milestone.status}
                                                </span>
                                                <p className="text-[9px] font-black text-slate-400 mt-1 uppercase">{milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'TBD'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity & Financials */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Activity Feed */}
                    <div className="ent-card p-6 bg-slate-900 text-white overflow-hidden relative min-h-[500px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative z-10">
                            <Activity size={14} className="text-primary-400" /> Recent Trajectory
                        </h3>
                        <div className="space-y-6 relative z-10">
                            {activityFeed.length > 0 ? activityFeed.map((activity, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shadow-pulse-slow ${activity.type === 'comment' ? 'bg-indigo-400' :
                                            activity.type === 'milestone' ? 'bg-emerald-400' : 'bg-primary-500'
                                            }`} />
                                        <div className="flex-1 w-px bg-slate-800 my-1 group-last:bg-transparent" />
                                    </div>
                                    <div className="pb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-black text-primary-400 uppercase">{activity.user}</span>
                                            <span className="text-[8px] font-bold text-slate-500 uppercase">{activity.type}</span>
                                        </div>
                                        <p className="text-[11px] leading-snug">
                                            {activity.action} <span className="font-black text-white">{activity.taskTitle || activity.milestoneTitle}</span>
                                        </p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <span className="text-[8px] text-slate-600 font-bold uppercase">{new Date(activity.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                                            {activity.taskId && (
                                                <button
                                                    onClick={() => router.push(`/projects/${params.id}/tasks?taskId=${activity.taskId}`)}
                                                    className="text-[8px] font-black text-primary-500 uppercase hover:text-white transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 opacity-30">
                                    <Activity size={40} className="mx-auto mb-4" />
                                    <p className="text-xs font-bold uppercase">No trajectory data recorded yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financial Pulse */}
                    {can('financials', 'view') && (
                        <div className="ent-card p-6 bg-white border-l-4 border-l-emerald-500">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <DollarSign size={14} className="text-emerald-500" /> Economic Health
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoiced Revenue</p>
                                        <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: project.currency }).format(financials.revenue)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
                                        <p className="text-sm font-bold text-rose-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: project.currency }).format(financials.expenses)}</p>
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${Math.min(100, (financials.expenses / (financials.revenue || 1)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right italic">
                                    Budget Utilization: {financials.budget > 0 ? `${Math.round((financials.revenue / financials.budget) * 100)}%` : 'T&M Basis'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Team Load Indicators */}
                    <div className="ent-card p-6 bg-white">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Users size={14} className="text-slate-400" /> Human Capital
                        </h3>
                        <div className="space-y-4">
                            {project.members?.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-900 text-white flex items-center justify-center text-[10px] font-black uppercase ring-2 ring-white shadow-sm">
                                            {member.employee.firstName[0]}{member.employee.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{member.employee.firstName}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-black uppercase text-slate-400 mb-1">Active Tasks</div>
                                        <span className="text-xs font-black text-slate-700">
                                            {project.tasks?.filter((t: any) => t.assignedToId === member.employee.userId && t.status !== 'done').length}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <MemberManagementModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                projectId={params.id}
                currentMembers={project.members || []}
                onUpdate={() => fetchData()}
            />
        </div>
    );
}

function MetricTile({ title, value, icon, color, trend, subValue }: any) {
    const colorClasses: any = {
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        slate: 'bg-slate-50 text-slate-600 border-slate-100'
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${colorClasses[color]} transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
                {trend && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{trend}</span>}
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
                    {subValue && <span className="text-[8px] text-slate-400 font-bold uppercase">{subValue}</span>}
                </div>
            </div>
        </div>
    );
}


function FlagIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" x2="4" y1="22" y2="15" />
        </svg>
    )
}
