'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Briefcase, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PortalProjects() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/portal/projects')
            .then((res: any) => setProjects(res.data))
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Active Engagements"
                subtitle="Overview of your ongoing projects and deliverables."
                icon={Briefcase}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
                        <Briefcase size={32} className="mx-auto text-slate-300 mb-2" />
                        <h3 className="text-sm font-medium text-slate-900">No active projects</h3>
                        <p className="text-xs text-slate-500 mt-1">New projects will appear here once assigned.</p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <Link href={`/portal/projects/${project.id}`} key={project.id} className="ent-card group hover:shadow-lg transition-all duration-300 block">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                        <Briefcase size={20} />
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${project.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        project.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            'bg-slate-50 text-slate-600 border border-slate-100'
                                        }`}>
                                        {project.status === 'active' && <CheckCircle2 size={10} className="mr-1" />}
                                        {project.status === 'completed' && <CheckCircle2 size={10} className="mr-1" />}
                                        {project.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2 group-hover:text-primary-700 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">
                                    {project.description || 'No description provided.'}
                                </p>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center text-xs font-bold text-slate-400">
                                        <Calendar size={14} className="mr-1.5" />
                                        <span>TIMELINE</span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-700">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                                        <span className="text-slate-300 mx-1">→</span>
                                        {project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : 'Ongoing'}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
