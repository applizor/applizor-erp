'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Briefcase, Calendar, CheckCircle2, Plus, ArrowLeft, Globe, ExternalLink, Users, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import PortalTaskBoard from '@/components/portal/PortalTaskBoard';
import PortalCreateIssueModal from '@/components/portal/PortalCreateIssueModal';
import PortalTaskDetailModal from '@/components/portal/PortalTaskDetailModal';
import PortalRoadmap from '@/components/portal/PortalRoadmap';
import PortalFiles from '@/components/portal/PortalFiles';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/contexts/SocketContext';

export default function PortalProjectDetail({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'board' | 'review' | 'roadmap' | 'files' | 'financials' | 'team'>('board');
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const { socket } = useSocket();

    useEffect(() => {
        if (params.id) fetchProjectData();
    }, [params.id]);

    useEffect(() => {
        if (!socket || !params.id) return;

        const onConnect = () => {
            console.log('Portal: Socket connected/reconnected, joining project room:', params.id);
            socket.emit('join-project', params.id);
        };

        // Join immediately if already connected
        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        socket.on('TASK_CREATED', (data) => {
            if (data.projectId === params.id) fetchProjectData();
        });
        socket.on('TASK_UPDATED', (data) => {
            if (data.projectId === params.id) fetchProjectData();
        });
        socket.on('TASK_DELETED', (data) => {
            if (data.projectId === params.id) fetchProjectData();
        });

        return () => {
            socket.off('connect', onConnect);
            socket.off('TASK_CREATED');
            socket.off('TASK_UPDATED');
            socket.off('TASK_DELETED');
        };
    }, [socket, params.id]);

    const fetchProjectData = async () => {
        try {
            const [projectsRes, tasksRes, milestonesRes] = await Promise.all([
                api.get('/portal/projects'),
                api.get(`/portal/tasks?projectId=${params.id}`),
                api.get(`/portal/projects/${params.id}/milestones`)
            ]);

            const foundProject = projectsRes.data.find((p: any) => p.id === params.id);
            if (!foundProject) {
                // Ensure better error handling in real app
            }
            setProject(foundProject);
            setTasks(tasksRes.data);
            setMilestones(milestonesRes.data);
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

            {/* Project Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Type</p>
                    <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-primary-600" />
                        <p className="text-sm font-black text-slate-900 uppercase">{project?.type?.replace(/_/g, ' ') || 'General'}</p>
                    </div>
                </div>

                {/* Health Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Health</p>
                    <div className="space-y-3 mt-2">
                        {/* Tasks */}
                        <div>
                            <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                                <span className="text-slate-500">Tasks</span>
                                <span className="text-slate-900">{tasks.filter(t => t.status === 'done').length}/{tasks.length}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                        {/* Milestones */}
                        <div>
                            <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                                <span className="text-slate-500">Milestones</span>
                                <span className="text-slate-900">{milestones.filter(m => m.status === 'completed').length}/{milestones.length}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${milestones.length > 0 ? (milestones.filter(m => m.status === 'completed').length / milestones.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Timeline</p>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary-600" />
                        <p className="text-sm font-black text-slate-900">
                            {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                        </p>
                    </div>
                </div>

                {project?.cmsPortal && (
                    <div className="md:col-span-2 bg-primary-900 p-4 rounded-xl border border-primary-800 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-20"></div>
                        <p className="text-[9px] font-black text-primary-300 uppercase tracking-widest mb-1 relative z-10">News Portal Access</p>
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-primary-800 rounded-lg">
                                    <Globe size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white">{project.cmsPortal.name}</p>
                                    <p className="text-[10px] text-primary-300 font-bold">{project.cmsPortal.subdomain}.applizor.com</p>
                                </div>
                            </div>
                            <a
                                href={`http://${project.cmsPortal.subdomain}.localhost:3001`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white text-primary-900 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-primary-50 transition-colors"
                            >
                                Visit Portal <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                )}
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
                <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'roadmap' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Roadmap
                </button>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'files' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Files
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'team' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Team
                </button>
                <button
                    onClick={() => setActiveTab('financials')}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'financials' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    Financials
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
                ) : activeTab === 'roadmap' ? (
                    <PortalRoadmap projectId={params.id} />
                ) : activeTab === 'files' ? (
                    <PortalFiles projectId={params.id} />
                ) : activeTab === 'team' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
                        {project.members && project.members.length > 0 ? (
                            project.members.map((member: any) => (
                                <div key={member.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-black text-lg">
                                        {member.employee.firstName[0]}{member.employee.lastName[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 leading-none mb-1">
                                            {member.employee.firstName} {member.employee.lastName}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {member.employee.position?.title || 'Team Member'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center text-slate-400 uppercase font-black tracking-widest text-xs">
                                No team members assigned yet
                            </div>
                        )}
                    </div>
                ) : activeTab === 'financials' ? (
                    <div className="animate-slide-up space-y-8">
                        {/* Financial Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm border-t-4 border-t-primary-600">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invoiced</p>
                                    <div className="p-1.5 bg-primary-50 rounded-lg">
                                        <TrendingUp size={14} className="text-primary-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: project.currency || 'INR' }).format(
                                        project.invoices?.reduce((acc: number, inv: any) => acc + Number(inv.total), 0) || 0
                                    )}
                                </h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Total billing including taxes</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Amount</p>
                                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                                        <CheckCircle2 size={14} className="text-emerald-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: project.currency || 'INR' }).format(
                                        project.invoices?.reduce((acc: number, inv: any) => acc + Number(inv.paidAmount), 0) || 0
                                    )}
                                </h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Successfully processed payments</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm border-t-4 border-t-amber-500">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding</p>
                                    <div className="p-1.5 bg-amber-50 rounded-lg">
                                        <Wallet size={14} className="text-amber-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: project.currency || 'INR' }).format(
                                        (project.invoices?.reduce((acc: number, inv: any) => acc + Number(inv.total), 0) || 0) -
                                        (project.invoices?.reduce((acc: number, inv: any) => acc + Number(inv.paidAmount), 0) || 0)
                                    )}
                                </h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Pending dues for this project</p>
                            </div>
                        </div>

                        {/* Recent Invoices List */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Project Invoices</h3>
                                <Link href="/portal/invoices" className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">View All</Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice #</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {project.invoices && project.invoices.length > 0 ? (
                                            project.invoices.map((inv: any) => (
                                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-900 text-xs">{inv.invoiceNumber}</td>
                                                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-900 text-xs">
                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: project.currency || 'INR' }).format(Number(inv.total))}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                                            inv.status === 'overdue' ? 'bg-rose-50 text-rose-600' :
                                                                'bg-amber-50 text-amber-600'
                                                            }`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">
                                                    No invoices yet for this project
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
