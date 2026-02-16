'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { useSocket } from '@/contexts/SocketContext';
import { MemberManagementModal } from '@/components/projects/MemberManagementModal';
import {
    Clock, CheckCircle2, TrendingUp, AlertCircle,
    ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Users, Settings2,
    Calendar, Activity, FileText, Globe, ExternalLink
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectDashboard({ params }: { params: { id: string } }) {
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

    // Permission check handled by parent layout mostly, but good to have
    const { can } = useProjectPermissions(project);
    const { socket } = useSocket();

    const fetchData = useCallback(async () => {
        try {
            // Fetch basic project info + stats
            const [projectRes, statsRes] = await Promise.all([
                api.get(`/projects/${params.id}`),
                api.get(`/projects/${params.id}/stats`).catch(() => ({ data: null })) // Soft fail on stats
            ]);

            setProject(projectRes.data);

            // If backend returns stats, use them. Otherwise calculate basic ones on frontend
            if (statsRes.data) {
                setStats(statsRes.data);
            } else {
                // Fallback calculation
                calculateFallbackStats(projectRes.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // WebSocket Real-time Sync
    useEffect(() => {
        if (!socket || !params.id) return;

        const onConnect = () => socket.emit('join-project', params.id);
        if (socket.connected) onConnect();

        socket.on('connect', onConnect);

        // Listen for ANY project-related update to refresh dashboard stats
        const refresh = () => fetchData();

        socket.on('TASK_CREATED', refresh);
        socket.on('TASK_UPDATED', refresh);
        socket.on('TASK_DELETED', refresh);
        socket.on('MILESTONE_CREATED', refresh);
        socket.on('MILESTONE_UPDATED', refresh);
        socket.on('SPRINT_UPDATED', refresh);
        socket.on('TIMER_UPDATED', refresh);

        return () => {
            socket.off('connect', onConnect);
            socket.off('TASK_CREATED', refresh);
            socket.off('TASK_UPDATED', refresh);
            socket.off('TASK_DELETED', refresh);
            socket.off('MILESTONE_CREATED', refresh);
            socket.off('MILESTONE_UPDATED', refresh);
            socket.off('SPRINT_UPDATED', refresh);
            socket.off('TIMER_UPDATED', refresh);
        };
    }, [socket, params.id, fetchData]);

    const calculateFallbackStats = (proj: any) => {
        // Basic fallback logic
        const completion = 0; // WIP
        setStats({
            efficiency: { completionRate: completion, status: 'optimal', totalLoggedHours: 0 },
            financials: { budget: proj.budget || 0, revenue: proj.actualRevenue || 0, expenses: proj.actualExpenses || 0, netProfit: 0, margin: 0 }
        });
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;
    if (!project) return null;

    // Use stats or defaults
    const efficiency = stats?.efficiency || { completionRate: 0, status: 'optimal', totalLoggedHours: 0 };
    const financials = stats?.financials || { budget: 0, revenue: 0, expenses: 0, netProfit: 0, margin: 0 };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Progress & Milestones */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. Velocity & Health Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Velocity Card */}
                    <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <div className="flex justify-between items-start mb-8 relative">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Velocity</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-3xl font-black">{efficiency.completionRate}%</span>
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20">
                                        On Track
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-white/10 rounded-lg">
                                <TrendingUp size={18} className="text-white" />
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                <span>Progress</span>
                                <span>Target: 100%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-emerald-400 rounded-full"
                                    style={{ width: `${efficiency.completionRate}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-rows-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary-200 transition-all">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Tasks</p>
                                <p className="text-xl font-black text-slate-900 mt-0.5">{project.tasks?.length || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <Activity size={18} />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary-200 transition-all">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upcoming Deadlines</p>
                                <p className="text-xl font-black text-slate-900 mt-0.5">
                                    {project.milestones?.filter((m: any) => m.status !== 'completed').length || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Calendar size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Milestone Timeline */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <FlagIcon /> Milestone Roadmap
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {project.milestones?.filter((m: any) => m.status === 'completed').length || 0} / {project.milestones?.length || 0} Completed
                        </span>
                    </div>

                    <div className="space-y-6 relative pl-4 border-l border-slate-100 ml-2">
                        {(!project.milestones || project.milestones.length === 0) && (
                            <div className="text-center py-8">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">No milestones defined</p>
                            </div>
                        )}

                        {project.milestones?.slice(0, 4).map((milestone: any, index: number) => {
                            const isCompleted = milestone.status === 'completed';
                            const isOverdue = !isCompleted && milestone.dueDate && new Date(milestone.dueDate) < new Date();

                            return (
                                <div key={milestone.id} className="relative pl-6 group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white transition-all group-hover:scale-110 
                                        ${isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-slate-300'}`}
                                    />

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-all">
                                        <div>
                                            <h4 className={`text-xs font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                                {milestone.title}
                                            </h4>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">
                                                {milestone.description}
                                            </p>
                                        </div>
                                        <div className="mt-2 sm:mt-0 text-right">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest 
                                                ${isCompleted ? 'bg-emerald-50 text-emerald-600' : isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {milestone.status}
                                            </span>
                                            {milestone.dueDate && (
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Column: Financials & Team */}
            <div className="space-y-6">

                {/* Financials Widget */}
                {can('financials', 'view') && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Wallet size={14} className="text-slate-400" /> Financial Overview
                        </h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Budget</p>
                                <p className="text-lg font-black text-slate-900">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency || 'USD' }).format(financials.budget)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Invoiced</p>
                                    <p className="text-sm font-bold text-emerald-700">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency || 'USD' }).format(financials.revenue)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Expenses</p>
                                    <p className="text-sm font-bold text-rose-700">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency || 'USD' }).format(financials.expenses)}
                                    </p>
                                </div>
                            </div>

                            {/* Budget Progress Bar */}
                            <div className="pt-2">
                                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    <span>Budget Utilization</span>
                                    <span>{(financials.expenses / (financials.budget || 1) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-slate-800 rounded-full"
                                        style={{ width: `${Math.min(100, (financials.expenses / (financials.budget || 1) * 100))}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* News Portal Details Widget */}
                {project.cmsPortal && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 relative">
                            <Globe size={14} className="text-primary-600" /> News Portal Details
                        </h3>

                        <div className="space-y-4 relative">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portal Name</p>
                                <p className="text-sm font-black text-slate-900">{project.cmsPortal.name}</p>
                            </div>

                            <div className="p-3 bg-slate-900 rounded-lg text-white shadow-lg">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Public Access URL</p>
                                <a
                                    href={`http://${project.cmsPortal.subdomain}.localhost:3001`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-400 hover:text-white transition-colors text-[11px] font-black flex items-center gap-2"
                                >
                                    {project.cmsPortal.subdomain}.applizor.com
                                    <ExternalLink size={12} />
                                </a>
                                <p className="text-[8px] text-slate-500 font-bold mt-2 italic uppercase">
                                    Local Development: {project.cmsPortal.subdomain}.localhost:3001
                                </p>
                            </div>

                            <div className="flex justify-between items-center px-1">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Subdomain</p>
                                    <p className="text-[11px] font-bold text-slate-900">{project.cmsPortal.subdomain}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Portal Status</p>
                                    <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-emerald-100">
                                        {project.cmsPortal.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Widget */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Users size={14} className="text-slate-400" /> Core Team
                        </h3>
                        {can('settings', 'edit') && (
                            <button
                                onClick={() => setIsMemberModalOpen(true)}
                                className="text-[9px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                            >
                                Manage
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {project.members?.slice(0, 5).map((member: any) => (
                            <div key={member.id} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black uppercase">
                                    {member.employee.firstName[0]}{member.employee.lastName[0]}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{member.employee.firstName} {member.employee.lastName}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                </div>
                            </div>
                        ))}
                        {(!project.members || project.members.length === 0) && (
                            <p className="text-[10px] text-slate-400 italic font-medium">No team members assigned.</p>
                        )}
                    </div>
                </div>

                {/* Documents Widget */}
                {can('tasks', 'view') && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center group hover:border-primary-200 transition-colors cursor-pointer">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <FileText size={20} className="text-slate-400 group-hover:text-primary-600" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Project Files</h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">View specifications & assets</p>
                    </div>
                )}
            </div>

            <MemberManagementModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                projectId={params.id}
                currentMembers={project.members || []}
                onUpdate={() => window.location.reload()}
            />
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
