'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Briefcase, Calendar, CheckCircle2, Plus, ArrowLeft } from 'lucide-react';
import PortalTaskBoard from '@/components/portal/PortalTaskBoard';
import PortalCreateIssueModal from '@/components/portal/PortalCreateIssueModal';
import PortalTaskDetailModal from '@/components/portal/PortalTaskDetailModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PortalProjectDetail({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'board' | 'review'>('board');
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);

    useEffect(() => {
        fetchProjectData();
    }, [params.id]);

    const fetchProjectData = async () => {
        try {
            const [projectsRes, tasksRes] = await Promise.all([
                api.get('/portal/projects'),
                api.get(`/portal/tasks?projectId=${params.id}`)
            ]);

            const foundProject = projectsRes.data.find((p: any) => p.id === params.id);
            if (!foundProject) {
                // Ensure better error handling in real app
            }
            setProject(foundProject);
            setTasks(tasksRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskCreated = () => {
        fetchProjectData();
    };

    const handleTaskUpdate = () => {
        fetchProjectData();
    };

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );

    if (!project) return (
        <div className="p-12 text-center">
            <h3 className="text-lg font-bold text-slate-700">Project not found</h3>
            <Link href="/portal/projects" className="text-primary-600 hover:underline mt-2 inline-block">Back to Projects</Link>
        </div>
    );

    const filteredTasks = tasks.filter(t => {
        if (activeTab === 'review') return t.status === 'review';
        return t.status !== 'review'; // Show everything else on the main board
    });

    const reviewCount = tasks.filter(t => t.status === 'review').length;

    return (
        <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
            {/* Header / Breadcrumb */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <Link href="/portal/projects" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors flex items-center gap-1 mb-2">
                        <ArrowLeft size={10} /> Back to Projects
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {project.name}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest translate-y-0.5 ${project.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                            {project.status === 'active' && <CheckCircle2 size={10} className="mr-1" />}
                            {project.status}
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">{project.description}</p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary-600 transition-all shadow-lg shadow-primary-900/10 flex items-center gap-2 group"
                >
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                    Report Issue
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('board')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'board' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Project Board
                </button>
                <button
                    onClick={() => setActiveTab('review')}
                    className={`relative px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${activeTab === 'review' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Ready for Review
                    {reviewCount > 0 && (
                        <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[9px] min-w-[16px] text-center">
                            {reviewCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Board Area */}
            <div className="flex-1 min-h-0">
                {activeTab === 'review' && filteredTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} className="text-slate-200" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest">No tasks pending review</p>
                    </div>
                ) : (
                    <PortalTaskBoard
                        tasks={filteredTasks}
                        onTaskClick={setSelectedTask}
                    />
                )}
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <PortalCreateIssueModal
                    projectId={params.id}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleTaskCreated}
                />
            )}

            {selectedTask && (
                <PortalTaskDetailModal
                    taskId={selectedTask.id}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                />
            )}
        </div>
    );
}
