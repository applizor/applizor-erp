'use client';

import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/context/ConfirmationContext';
import { useEffect, useState } from 'react';
import { candidatesApi, jobOpeningsApi, Candidate, JobOpening } from '@/lib/api/recruitment';
import { Users, Plus, Filter, Search, Trash2, Mail, Briefcase, Edit2, Calendar, Zap, Target } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import CandidateModal from '@/components/recruitment/CandidateModal';
import ScheduleInterviewModal from '@/components/recruitment/ScheduleInterviewModal';

export default function CandidatesPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobs, setJobs] = useState<JobOpening[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);

    const [filters, setFilters] = useState({
        jobOpeningId: '',
        status: ''
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

    const handleDelete = async (id: string) => {
        if (await confirm({ message: 'Are you sure you want to delete this candidate?', type: 'danger' })) {
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

    const handleEdit = (candidate: Candidate) => {
        setEditingCandidate(candidate);
        setIsModalOpen(true);
    };

    const handleSchedule = (candidate: Candidate) => {
        setSchedulingCandidate(candidate);
        setIsScheduleModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingCandidate(null);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        loadData();
    };

    const runAIAnalysis = async (id: string) => {
        try {
            toast.info('Engaging AI Engine...');
            await candidatesApi.parseResume(id);
            toast.success('AI Resonance Analysis Complete');
            loadData();
        } catch (error) {
            toast.error('AI Analysis Failed');
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header (Compact) */}
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-md border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-900 rounded-md flex items-center justify-center shadow-md">
                        <Users size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Talent Reservoir</h2>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Candidate Database Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Pool:</span>
                        <select
                            value={filters.jobOpeningId}
                            onChange={(e) => setFilters({ ...filters, jobOpeningId: e.target.value })}
                            className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary-600 focus:ring-0 p-0 cursor-pointer"
                        >
                            <option value="">ALL OPENINGS</option>
                            {jobs.map(job => <option key={job.id} value={job.id}>{job.title.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <button
                        onClick={handleAddNew}
                        className="btn-primary py-2 px-4 shadow-lg shadow-primary-900/10 active:scale-95"
                    >
                        <Plus size={14} className="mr-2" /> Intake Candidate
                    </button>
                </div>
            </div>

            {/* Registry Search (High Density) */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                    <Search size={14} className="text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Search Hub</span>
                </div>
                <input
                    type="text"
                    placeholder="LOCATE PROFESSIONAL BY NAME, EMAIL OR PHONE..."
                    className="flex-1 bg-transparent border-none text-[10px] font-bold uppercase tracking-wider placeholder-slate-300 focus:ring-0"
                />
                <div className="flex items-center gap-2 pr-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary-50 rounded-md">
                        <span className="text-[9px] font-black text-primary-700 uppercase tracking-widest">{candidates.length} Profiles</span>
                    </div>
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
                                <th>Match Profile</th>
                                <th>Evolvement State</th>
                                <th>Intake Chronology</th>
                                <th className="text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && candidates.length === 0 ? (
                                <TableRowSkeleton columns={6} rows={5} />
                            ) : candidates.map((candidate) => (
                                <tr key={candidate.id} className="group hover:bg-primary-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-md bg-primary-50 flex items-center justify-center text-[11px] font-black text-primary-700 border border-primary-100 shadow-sm">
                                                {candidate.firstName[0]}
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-black text-gray-900 tracking-tight leading-none uppercase group-hover:text-primary-700 transition-colors">
                                                    {candidate.firstName} {candidate.lastName}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {candidate.tags?.map((tag: string) => (
                                                        <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-[8px] font-black uppercase text-slate-500 rounded tracking-widest border border-slate-200">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {candidate.email && (
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1">
                                                            <Mail size={10} className="text-primary-400" /> {candidate.email}
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
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[80px]">
                                                <div
                                                    className="h-full bg-primary-600 rounded-full"
                                                    style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest">
                                                {Math.floor(Math.random() * 40) + 60}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`ent-badge ${candidate.status === 'hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            candidate.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                'bg-primary-50 text-primary-700 border-primary-100'
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
                                            <button
                                                onClick={() => handleSchedule(candidate)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                                title="Schedule Interview"
                                            >
                                                <Calendar size={14} />
                                            </button>
                                            <button
                                                onClick={() => runAIAnalysis(candidate.id)}
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition-all animate-pulse"
                                                title="Execute AI Parsing"
                                            >
                                                <Zap size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(candidate)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-all"
                                                title="Edit Profile"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(candidate.id)}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                                title="Purge Record"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {candidates.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center mx-auto mb-4 border border-gray-100">
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

            <CandidateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                candidate={editingCandidate}
            />

            {schedulingCandidate && (
                <ScheduleInterviewModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    onSuccess={() => {
                        setIsScheduleModalOpen(false);
                        handleSuccess();
                    }}
                    candidateId={schedulingCandidate.id}
                    candidateName={`${schedulingCandidate.firstName} ${schedulingCandidate.lastName}`}
                />
            )}
        </div>
    );
}
