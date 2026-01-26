
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, LayoutGrid, List, Filter, Search, Briefcase, Clock, CheckCircle, Percent } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usePermission } from '@/hooks/usePermission';

export default function ProjectsPage() {
    const toast = useToast();
    const { can, user } = usePermission();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'grid' | 'list'>('grid');
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

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.client?.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter ? p.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'planning': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'on-hold': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'completed': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    if (user && !can('Project', 'read')) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                    <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-gray-900 uppercase">Access Denied</h3>
                    <p className="text-sm text-gray-500 mt-2">You do not have permission to view projects.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none truncate">Project Portfolio</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Strategic Initiatives & Deliverables
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {can('Project', 'create') && (
                        <Link
                            href="/projects/new"
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={14} /> New Project
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="SEARCH PROJECTS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ent-input pl-9 h-9 text-[10px] uppercase font-bold"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="ent-select h-9 w-32"
                    >
                        <option value="">All Status</option>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                    </select>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-md">
                    <button
                        onClick={() => setView('grid')}
                        className={`p-1.5 rounded-sm transition-all ${view === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400'}`}
                    >
                        <LayoutGrid size={14} />
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`p-1.5 rounded-sm transition-all ${view === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400'}`}
                    >
                        <List size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="ent-card p-12 text-center border-dashed">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-sm font-black text-gray-900 uppercase">No Projects Found</h3>
                    <p className="text-xs text-gray-500 mt-1">Initiate a new project to get started.</p>
                </div>
            ) : (
                <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                    {filteredProjects.map(project => (
                        <Link
                            href={`/projects/${project.id}`}
                            key={project.id}
                            className={`group ent-card block hover:ring-2 hover:ring-primary-500/20 transition-all duration-300 ${view === 'list' ? 'flex items-center justify-between p-4' : 'p-6'}`}
                        >
                            <div className={view === 'list' ? "flex items-center gap-6" : ""}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white font-black shadow-lg">
                                            {project.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                {project.client?.name || 'Internal'}
                                            </p>
                                        </div>
                                    </div>
                                    {view === 'grid' && (
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                                            {project.status}
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 line-clamp-2 mb-6 h-8">
                                    {project.description || 'No description provided.'}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            <Clock size={10} /> Deadline
                                        </div>
                                        <p className="text-xs font-bold text-gray-700">
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            <CheckCircle size={10} /> Progress
                                        </div>
                                        {/* Placeholder progress logic */}
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 w-0" />
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600">0%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {view === 'list' && (
                                <div className="flex items-center gap-6">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Members</p>
                                        <p className="text-xs font-bold text-gray-900">{project._count?.members || 0}</p>
                                    </div>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function ShieldCheck({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
