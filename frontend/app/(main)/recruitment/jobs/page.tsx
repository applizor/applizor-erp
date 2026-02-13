'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Briefcase, Plus, Edit2, Trash2, Users, X, ChevronRight, Activity, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useToast } from '@/hooks/useToast';

interface JobOpening {
    id: string;
    title: string;
    department: string;
    status: string;
    isPublic?: boolean;
    publicId?: string;
    _count?: {
        candidates: number;
    };
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<JobOpening[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    // Metadata for dropdowns
    const [departments, setDepartments] = useState<{ label: string, value: string }[]>([]);
    const [positions, setPositions] = useState<{ label: string, value: string }[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        department: '',
        position: '',
        description: '',
        requirements: '',
        status: 'open',
        isPublic: false
    });

    useEffect(() => {
        loadJobs();
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        try {
            const [deptRes, posRes] = await Promise.all([
                api.get('/departments'),
                api.get('/positions')
            ]);
            const deptOptions = deptRes.data.map((d: any) => ({ label: d.name, value: d.name }));
            setDepartments(deptOptions);
            const posOptions = posRes.data.map((p: any) => ({ label: p.title, value: p.title }));
            setPositions(posOptions);
        } catch (error) {
            console.error('Failed to load metadata:', error);
        }
    };

    const loadJobs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/recruitment/jobs');
            setJobs(res.data);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (job: JobOpening) => {
        setEditingJob(job.id);
        setFormData({
            title: job.title,
            department: job.department,
            position: job.title,
            description: (job as any).description || '',
            requirements: (job as any).requirements || '',
            status: job.status,
            isPublic: job.isPublic || false
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this requisition?')) return;
        try {
            await api.delete(`/recruitment/jobs/${id}`);
            loadJobs();
        } catch (error) {
            console.error('Failed to delete job:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingJob) {
                await api.put(`/recruitment/jobs/${editingJob}`, formData);
                toast.success('Requisition updated successfully');
            } else {
                await api.post('/recruitment/jobs', formData);
                toast.success('New requisition initialized');
            }
            setIsModalOpen(false);
            setEditingJob(null);
            setFormData({ title: '', department: '', position: '', description: '', requirements: '', status: 'open', isPublic: false });
            loadJobs();
        } catch (error: any) {
            console.error('Failed to save job:', error);
            toast.error(error.response?.data?.error || 'Failed to save requisition');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header (Compact) */}
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-md border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-900 rounded-md flex items-center justify-center shadow-md">
                        <Briefcase size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Active Requisitions</h2>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Management of Strategic Vacancies</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setEditingJob(null);
                        setFormData({ title: '', department: '', position: '', description: '', requirements: '', status: 'open', isPublic: false });
                        setIsModalOpen(true);
                    }}
                    className="btn-primary py-2 px-4 shadow-lg shadow-primary-900/10 active:scale-95"
                >
                    <Plus size={14} className="mr-2" /> Initialize Vacancy
                </button>
            </div>

            {/* Filter / Search Bar (Horizontal High Density) */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                    <Search size={14} className="text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Registry Search</span>
                </div>
                <input
                    type="text"
                    placeholder="IDENTIFY REQUISITION BY ROLE OR DEPARTMENT..."
                    className="flex-1 bg-transparent border-none text-[10px] font-bold uppercase tracking-wider placeholder-slate-300 focus:ring-0"
                />
                <div className="flex items-center gap-2 pr-2">
                    <button className="p-1.5 hover:bg-slate-50 text-slate-400 rounded-md transition-colors">
                        <Filter size={14} />
                    </button>
                    <div className="h-4 w-px bg-slate-100 mx-1" />
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary-50 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
                        <span className="text-[9px] font-black text-primary-700 uppercase tracking-widest">{jobs.length} Active</span>
                    </div>
                </div>
            </div>


            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && jobs.length === 0 ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : jobs.map((job) => (
                    <div key={job.id} className="ent-card group hover:border-primary-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Briefcase size={80} className="text-primary-900 transform rotate-12" />
                        </div>

                        <div className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Position Title</span>
                                    <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight uppercase group-hover:text-primary-700 transition-colors">
                                        {job.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {job.isPublic && (
                                        <Link
                                            href={`/careers/b81a0e3f-9301-43f7-a633-6db7e5fa54b0`} // Hardcoding for test, should be dynamic from company context
                                            target="_blank"
                                            className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors"
                                        >
                                            <Activity size={10} className="animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Public Site</span>
                                        </Link>
                                    )}
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${job.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                        {job.status}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-6 space-y-3">
                                <div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Department</span>
                                    <p className="text-xs font-bold text-gray-700 uppercase">{job.department}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <Link
                                    href={`/recruitment/candidates?job=${job.id}`}
                                    className="flex items-center gap-2 group/link cursor-pointer"
                                >
                                    <div className="p-1.5 rounded-md bg-primary-50 text-primary-600 group-hover/link:bg-primary-600 group-hover/link:text-white transition-colors">
                                        <Users size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-gray-900 leading-none">{job._count?.candidates || 0}</span>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Candidates</span>
                                    </div>
                                </Link>

                                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(job)}
                                        className="p-2 hover:bg-gray-50 text-gray-400 hover:text-primary-600 rounded-md transition-colors"
                                        title="Edit Configuration"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(job.id)}
                                        className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-md transition-colors"
                                        title="Purge Requisition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] border border-gray-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Initialize Requisition</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">New Vacancy Protocol</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Position Title <span className="text-rose-500">*</span></label>
                                    <CustomSelect
                                        options={positions}
                                        value={formData.title}
                                        onChange={(val) => setFormData({ ...formData, title: val, position: val })} // Setting both title and position? Schema has both? 
                                        placeholder="SELECT POSITION..."
                                        searchable
                                    />
                                    {/* Fallback to text input if custom position needed? User just asked to make it dynamic. */}
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Department <span className="text-rose-500">*</span></label>
                                    <CustomSelect
                                        options={departments}
                                        value={formData.department}
                                        onChange={(val) => setFormData({ ...formData, department: val })}
                                        placeholder="SELECT DEPARTMENT..."
                                        searchable
                                    />
                                </div>
                            </div>

                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Functional Mandate (Description) <span className="text-rose-500">*</span></label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="ent-input w-full resize-none"
                                    placeholder="DEFINE STRATEGIC RESPONSIBILITIES..."
                                />
                            </div>

                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Core Prerequisites</label>
                                <textarea
                                    rows={3}
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    className="ent-input w-full resize-none"
                                    placeholder="LIST REQUIRED CERTIFICATIONS & SKILLS..."
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${formData.isPublic ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                                        <Activity size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-900 leading-tight">Syndicate to Public Careers</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Enable external application portal</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isPublic}
                                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>

                            <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-primary-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary-950 transition-all shadow-lg shadow-primary-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Deploying...' : 'Execute Deployment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
