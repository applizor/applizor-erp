'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Plus, LayoutGrid, List, Filter, Search, Briefcase, Clock,
    CheckCircle2, AlertTriangle, ArrowUpRight, Calendar, Users,
    MoreHorizontal, ChevronRight, BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usePermission } from '@/hooks/usePermission';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function ProjectsPage() {
    const toast = useToast();
    const { can, user } = usePermission();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'grid' | 'table'>('table');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        if (can('Project', 'read')) {
            fetchProjects();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.client?.name || '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter ? p.status === statusFilter : true;
            return matchesSearch && matchesStatus;
        });
    }, [projects, search, statusFilter]);

    // Metrics
    const metrics = useMemo(() => {
        const total = projects.length;
        const active = projects.filter(p => p.status === 'active').length;
        const completed = projects.filter(p => p.status === 'completed').length;
        const delayed = projects.filter(p => {
            if (!p.endDate || p.status === 'completed') return false;
            return new Date(p.endDate) < new Date();
        }).length;
        return { total, active, completed, delayed };
    }, [projects]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'planning': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'on-hold': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'completed': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'bg-emerald-500';
        if (percent >= 75) return 'bg-blue-500';
        if (percent >= 50) return 'bg-amber-500';
        return 'bg-slate-400';
    };

    if (user && !can('Project', 'read')) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Access Denied</h3>
                    <p className="text-xs text-slate-500 font-bold mt-2">You do not have permission to view projects.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        Project Control Center
                        <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] tracking-widest font-bold">
                            {projects.length}
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">
                        Manage strategic initiatives, timelines, and deliverables
                    </p>
                </div>
                {can('Project', 'create') && (
                    <Link
                        href="/projects/new"
                        className="bg-slate-900 hover:bg-primary-600 text-white px-5 py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
                    >
                        <Plus size={14} strokeWidth={3} /> New Project
                    </Link>
                )}
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Active Projects"
                    value={metrics.active}
                    icon={<Briefcase size={18} />}
                    trend="+2 this month"
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <MetricCard
                    label="On Schedule"
                    value={metrics.active - metrics.delayed}
                    icon={<CheckCircle2 size={18} />}
                    trend="94% Compliance"
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <MetricCard
                    label="Delayed"
                    value={metrics.delayed}
                    icon={<AlertTriangle size={18} />}
                    trend="Action Required"
                    color="text-rose-600"
                    bgColor="bg-rose-50"
                />
                <MetricCard
                    label="Avg. Progress"
                    value="0%"
                    icon={<BarChart3 size={18} />}
                    trend="Across all projects"
                    color="text-slate-600"
                    bgColor="bg-slate-50"
                />
            </div>

            {/* Filters & Controls */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="SEARCH BY PROJECT OR CLIENT..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase tracking-wide transition-all"
                        />
                    </div>
                    <div className="w-48">
                        <CustomSelect
                            options={[
                                { label: 'All Status', value: '' },
                                { label: 'Planning', value: 'planning' },
                                { label: 'Active', value: 'active' },
                                { label: 'Completed', value: 'completed' },
                                { label: 'On Hold', value: 'on-hold' }
                            ]}
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                        />
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-md">
                    <button
                        onClick={() => setView('table')}
                        className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${view === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={12} /> List View
                    </button>
                    <button
                        onClick={() => setView('grid')}
                        className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={12} /> Grid View
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="ent-card p-16 text-center border-dashed flex flex-col items-center justify-center bg-slate-50/50">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                        <Briefcase className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No Projects Found</h3>
                    <p className="text-xs text-slate-500 font-medium mt-2 max-w-xs mx-auto">
                        {search || statusFilter ? 'Adjust your filters to see more results.' : 'Launch a new initiative to get started.'}
                    </p>
                    {(search || statusFilter) && (
                        <button
                            onClick={() => { setSearch(''); setStatusFilter(''); }}
                            className="mt-6 text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {view === 'table' ? (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-[40%]">Project & Client</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Timeline</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Team</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Progress</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredProjects.map((project) => (
                                            <tr key={project.id} className="group hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-black shadow-md group-hover:scale-105 transition-transform">
                                                            {project.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <Link href={`/projects/${project.id}`} className="text-sm font-bold text-slate-900 hover:text-primary-600 transition-colors block leading-tight">
                                                                {project.name}
                                                            </Link>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">
                                                                {project.client?.name || 'Internal'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                                                        {project.status.replace('-', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                                                        </span>
                                                        {project.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed' && (
                                                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1 mt-0.5">
                                                                <AlertTriangle size={8} /> Delayed
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center -space-x-2">
                                                        {[...Array(Math.min(3, project._count?.members || 0))].map((_, i) => (
                                                            <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
                                                                <Users size={12} />
                                                            </div>
                                                        ))}
                                                        {(project._count?.members || 0) > 3 && (
                                                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
                                                                +{project._count.members - 3}
                                                            </div>
                                                        )}
                                                        {(project._count?.members || 0) === 0 && (
                                                            <span className="text-[10px] text-slate-400 italic">No members</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="w-24 ml-auto">
                                                        <div className="flex justify-end mb-1">
                                                            <span className="text-xs font-bold text-slate-700">0%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-slate-400 w-[0%]" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/projects/${project.id}`}
                                                        className="text-slate-300 hover:text-primary-600 transition-colors"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredProjects.map((project: any) => (
                                <Link
                                    href={`/projects/${project.id}`}
                                    key={project.id}
                                    className="group bg-white rounded-lg border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary-500/30 transition-all duration-300 flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-black shadow-lg group-hover:scale-110 transition-transform">
                                            {project.name.charAt(0)}
                                        </div>
                                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                                            {project.status.replace('-', ' ')}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                                        {project.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                                        {project.client?.name || 'Internal Project'}
                                    </p>

                                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-6 min-h-[2.5em] leading-relaxed">
                                        {project.description || 'No description provided for this project.'}
                                    </p>

                                    <div className="mt-auto pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <Clock size={10} /> Deadline
                                            </p>
                                            <p className="text-xs font-bold text-slate-700">
                                                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                                                <Users size={10} /> Team
                                            </p>
                                            <p className="text-xs font-bold text-slate-700">
                                                {project._count?.members || 0} Members
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function MetricCard({ label, value, icon, trend, color, bgColor }: any) {
    return (
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between group hover:border-slate-300 transition-colors">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{value}</h2>
                <p className={`text-[10px] font-bold mt-2 ${color} flex items-center gap-1`}>
                    <ArrowUpRight size={10} strokeWidth={3} /> {trend}
                </p>
            </div>
            <div className={`p-2.5 rounded-lg ${bgColor} ${color} group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
        </div>
    );
}
