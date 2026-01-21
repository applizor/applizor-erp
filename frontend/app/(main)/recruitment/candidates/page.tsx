'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import { candidatesApi, jobOpeningsApi, Candidate, JobOpening } from '@/lib/api/recruitment';
import { Users, Plus, Filter, Search, ChevronRight, X, Trash2, Mail, Phone, Briefcase, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export default function CandidatesPage() {
    const toast = useToast();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobs, setJobs] = useState<JobOpening[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [filters, setFilters] = useState({
        jobOpeningId: '',
        status: ''
    });

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobOpeningId: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [candidatesData, jobsData] = await Promise.all([
                candidatesApi.getAll(filters.jobOpeningId),
                jobOpeningsApi.getAll()
            ]);
            setCandidates(candidatesData);
            setJobs(jobsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await candidatesApi.create(formData as any);
            setIsModalOpen(false);
            setFormData({ firstName: '', lastName: '', email: '', phone: '', jobOpeningId: '', notes: '' });
            loadData();
            toast.success('Candidate successfully inducted');
        } catch (error) {
            console.error('Failed to create candidate:', error);
            toast.error('Failed to add candidate');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this candidate?')) {
            try {
                await candidatesApi.delete(id);
                loadData();
                toast.success('Candidate record purged');
            } catch (error) {
                console.error('Failed to delete candidate:', error);
                toast.error('Failed to delete candidate');
            }
        }
    };



    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-900 rounded-lg shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Talent Reservoir</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Recruitment Ops <ChevronRight size={10} className="text-indigo-600" /> Candidate Pipeline
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 bg-indigo-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-indigo-950 transition-all flex items-center gap-2 shadow-xl shadow-indigo-900/10 active:scale-95"
                    >
                        <Plus size={14} /> Intake Candidate
                    </button>
                </div>
            </div>

            {/* Filter / Search Tool */}
            <div className="ent-card p-3 flex flex-col md:flex-row items-center gap-3 bg-white/80 backdrop-blur border-indigo-100/50">
                <div className="flex items-center gap-2 px-2 border-r border-gray-100 min-w-max">
                    <Filter size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">FILTERS</span>
                </div>

                <div className="relative flex-1 w-full md:w-auto">
                    <select
                        value={filters.jobOpeningId}
                        onChange={(e) => setFilters({ ...filters, jobOpeningId: e.target.value })}
                        className="ent-input w-full py-1.5 text-[10px] font-bold uppercase tracking-wide appearance-none"
                    >
                        <option value="">Target: All Strategic Openings</option>
                        {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative w-full md:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="SEARCH DATABASE..."
                        className="ent-input w-full pl-9 py-1.5 text-[10px] font-bold uppercase tracking-wide placeholder-gray-300"
                    />
                </div>
            </div>

            {/* Data Grid */}
            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th>Candidate Identity</th>
                                <th>Strategic Targeting</th>
                                <th>Evolvement State</th>
                                <th>Intake Chronology</th>
                                <th className="text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && candidates.length === 0 ? (
                                <TableRowSkeleton columns={5} rows={5} />
                            ) : candidates.map((candidate) => (
                                <tr key={candidate.id} className="group hover:bg-indigo-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-[11px] font-black text-indigo-700 border border-indigo-100 shadow-sm">
                                                {candidate.firstName[0]}
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-black text-gray-900 tracking-tight leading-none uppercase group-hover:text-indigo-700 transition-colors">
                                                    {candidate.firstName} {candidate.lastName}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {candidate.email && (
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1">
                                                            <Mail size={10} className="text-indigo-400" /> {candidate.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={12} className="text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                                {candidate.jobOpening?.title || 'GENERAL POOL'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`ent-badge ${candidate.status === 'hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            candidate.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            }`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            {new Date(candidate.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDelete(candidate.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all" title="Purge Record">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {candidates.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                            <Users className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reservoir Empty. Initiate Intake.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Intake New Professional</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Candidate Profile Creation</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Forename <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="ent-input w-full"
                                        placeholder="EX: JOHN"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Surname <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="ent-input w-full"
                                        placeholder="EX: DOE"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Digital Address <span className="text-rose-500">*</span></label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="ent-input w-full"
                                        placeholder="EX: JOHN.D@EXAMPLE.COM"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Communication Link</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="ent-input w-full"
                                        placeholder="+1 (555)..."
                                    />
                                </div>
                            </div>

                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Target Protocol (Job ID)</label>
                                <div className="relative">
                                    <select
                                        value={formData.jobOpeningId}
                                        onChange={(e) => setFormData({ ...formData, jobOpeningId: e.target.value })}
                                        className="ent-input w-full appearance-none"
                                    >
                                        <option value="">General Intake / Unsolicited</option>
                                        {jobs.map(job => (
                                            <option key={job.id} value={job.id}>{job.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
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
                                    className="px-6 py-2.5 bg-indigo-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-indigo-950 transition-all shadow-lg shadow-indigo-900/10"
                                >
                                    Authorize Intake
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
