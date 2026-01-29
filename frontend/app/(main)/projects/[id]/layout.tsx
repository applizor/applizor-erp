
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { EditProjectModal } from '@/components/projects/EditProjectModal';
import {
    LayoutDashboard, CheckSquare, Flag, FileText,
    DollarSign, BookOpen, Settings, ChevronLeft,
    Calendar, Users, Building2, Pencil, MapPin, Zap, Clock
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ScrollArea } from '@/components/ui/ScrollArea';

export default function ProjectLayout({
    children,
    params
}: {
    children: React.ReactNode,
    params: { id: string }
}) {
    const pathname = usePathname();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        fetchProjectHeader();
    }, [params.id]);

    const fetchProjectHeader = async () => {
        try {
            // We might need a lightweight endpoint just for header info if the full getProject is heavy
            // For now, using the main endpoint
            const res = await api.get(`/projects/${params.id}`);
            setProject(res.data);
        } catch (error) {
            console.error('Failed to load project header', error);
        } finally {
            setLoading(false);
        }
    };

    const { role, can } = useProjectPermissions(project);

    const allTabs = [
        { id: '', label: 'Overview', icon: LayoutDashboard, permission: 'tasks', action: 'view' },
        { id: '/roadmap', label: 'Roadmap', icon: MapPin, permission: 'tasks', action: 'view' },
        { id: '/backlog', label: 'Backlog', icon: BookOpen, permission: 'tasks', action: 'view' },
        { id: '/tasks', label: 'Board', icon: CheckSquare, permission: 'tasks', action: 'view' },
        { id: '/milestones', label: 'Milestones', icon: Flag, permission: 'milestones', action: 'view' },
        { id: '/members', label: 'Members', icon: Users, permission: 'team', action: 'view' },
        { id: '/files', label: 'Files', icon: FileText, permission: 'tasks', action: 'view' },
        { id: '/wiki', label: 'Wiki', icon: BookOpen, permission: 'tasks', action: 'view' },
        { id: '/financials', label: 'Financials', icon: DollarSign, permission: 'financials', action: 'view' },
        { id: '/timesheets', label: 'Timesheets', icon: Clock, permission: 'tasks', action: 'view' },
        { id: '/automation', label: 'Automation', icon: Zap, permission: 'settings', action: 'edit' },
        { id: '/settings', label: 'Settings', icon: Settings, permission: 'settings', action: 'view' },
    ];

    // Filter tabs
    const tabs = allTabs.filter(tab => {
        if (!project) return false;
        // Overview is always visible if they can access project
        if (tab.id === '') return true;
        // Wiki/Files currently mapped to tasks view permission for simplicity, or default loose
        // Ideally we add 'wiki' and 'files' to permission matrix. 
        // For strict compliance as requested:
        return can(tab.permission as any, tab.action as any);
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'planning': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'on-hold': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );

    if (!project) return <div>Project not found</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Navigation Back */}
            <div>
                <Link
                    href="/projects"
                    className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-primary-600 uppercase tracking-widest transition-colors w-fit"
                >
                    <ChevronLeft size={12} /> Back to Portfolio
                </Link>
            </div>

            {/* Persistent Header */}
            <div className="ent-card p-6 border-l-4 border-l-primary-600">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2 flex items-center gap-3">
                            {project.name}
                            {can('settings', 'edit') && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
                        </h1>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <Building2 size={12} className="text-gray-400" />
                                <span className="uppercase tracking-wide">
                                    {project.client?.name || 'Internal Initiative'}
                                </span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-gray-400" />
                                <span>
                                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                                    {' - '}
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                            <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                                {project.status}
                            </span>
                        </div>
                        <div className="flex -space-x-2">
                            {project.members?.slice(0, 4).map((m: any) => (
                                <div key={m.id} className="w-8 h-8 rounded-md bg-gray-800 border-2 border-white text-white text-[10px] font-black flex items-center justify-center uppercase shadow-sm" title={m.employee.firstName}>
                                    {m.employee.firstName[0]}
                                </div>
                            ))}
                            {project.members?.length > 4 && (
                                <div className="w-8 h-8 rounded-md bg-gray-100 border-2 border-white text-gray-500 text-[9px] font-black flex items-center justify-center uppercase shadow-sm">
                                    +{project.members.length - 4}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <ScrollArea className="flex items-center gap-1 mt-8 border-b border-gray-100 pb-1">
                    {tabs.map((tab) => {
                        // Exact match for root, partial for sub-routes
                        const fullPath = `/projects/${params.id}${tab.id}`;
                        const isActive = pathname === fullPath;

                        return (
                            <Link
                                key={tab.id}
                                href={fullPath}
                                draggable={false}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                    ${isActive
                                        ? 'bg-gray-900 text-white border-b-2 border-primary-500 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                                `}
                            >
                                <tab.icon size={13} className={isActive ? 'text-primary-400' : 'text-gray-400'} />
                                {tab.label}
                            </Link>
                        );
                    })}
                </ScrollArea>
            </div>

            {/* Dynamic Content */}
            <div className="animate-fade-in">
                {children}
            </div>

            <EditProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={project}
                onUpdate={fetchProjectHeader}
            />
        </div>
    );
}
