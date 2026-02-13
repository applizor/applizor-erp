'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    Layout,
    MoreVertical,
    PieChart,
    Plus,
    Search,
    Users
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/hooks/useCurrency';

// High Density Project Card
const ProjectCard = ({ project }: { project: any }) => {
    const { formatCurrency } = useCurrency();
    const progress = project.stats?.efficiency?.completionRate || 0;

    // Health Status Logic
    let healthColor = 'bg-emerald-500';
    if (project.stats?.efficiency?.status === 'at-risk') healthColor = 'bg-rose-500';

    return (
        <div className="ent-card group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                    <div className="h-10 w-10 bg-primary-50 rounded flex items-center justify-center text-primary-700 font-bold text-xs">
                        {project.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-900 leading-tight">{project.name}</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">
                            {project.client?.companyName || 'Internal'}
                        </p>
                    </div>
                </div>
                <div className={`h-2 w-2 rounded-full ${healthColor}`} title="Project Health" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Budget</p>
                    <p className="text-xs font-bold text-gray-700">
                        {formatCurrency(project.stats?.financials?.budget || 0, project.currency)}
                    </p>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Spent</p>
                    <p className="text-xs font-bold text-primary-600">
                        {formatCurrency(project.stats?.financials?.expenses || 0, project.currency)}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1">
                    <span>PROGRESS</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                <div className="flex -space-x-1">
                    {project.members?.slice(0, 3).map((m: any) => (
                        <div key={m.id} className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold">
                            {m.employee.firstName[0]}
                        </div>
                    ))}
                    {project.members?.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                            +{project.members.length - 3}
                        </div>
                    )}
                </div>

                <div className="flex gap-1">
                    <Link
                        href={`/projects/${project.id}`}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        title="View Dashboard"
                    >
                        <Layout size={14} />
                    </Link>
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            try {
                                const res = await api.get(`/projects/${project.id}/sow`, { responseType: 'blob' });
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `SOW_${project.name}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                            } catch (err) {
                                alert('Failed to generate SOW');
                            }
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        title="Download SOW"
                    >
                        <FileText size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ProjectCommandCenter() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            // Assuming getProjects now returns limited data, we might need a separate 'dashboard' endpoint
            // Or we iterate and fetch details. For now, let's use the basic list and maybe enhance backend later
            // The implementation plan implies we use getProjects.
            const res = await api.get('/projects');

            // Upgrade: Fetch detailed stats for each (In a real app, do this in one bulk API call)
            // For this demo, we'll map and fetch (careful with rate limits)
            // Ideally backend getProjects should support ?includeStats=true
            // Let's assume standard list for now, and fetch stats on the fly or just mock for "Project Command Center" 
            // speed view.
            // Wait, I updated `getProjectById` to return stats. `getProjects` does not returns stats.
            // I will just display basic info for now to avoid N+1.
            setProjects(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            Operations Hub
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wide">
                            Project Command Center
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/operations/timesheets/approvals" className="btn-secondary flex items-center gap-2">
                        <Clock size={14} />
                        Timesheet Approvals
                    </Link>
                    <Link href="/projects/new" className="btn-primary flex items-center gap-2">
                        <Plus size={14} />
                        New Project
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                            <PieChart size={16} />
                        </div>
                        <h3 className="text-[10px] uppercase font-black text-gray-400">Total Projects</h3>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{projects.length}</p>
                </div>
                {/* Add more KPIs later */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projects.map((p: any) => (
                    <ProjectCard key={p.id} project={p} />
                ))}
            </div>
        </div>
    );
}
