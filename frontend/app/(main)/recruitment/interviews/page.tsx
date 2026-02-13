'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Users, FileText, Calendar, Clock, RotateCw, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/context/ConfirmationContext';
import ScheduleInterviewModal from '@/components/recruitment/ScheduleInterviewModal';

interface Interview {
    id: string;
    candidateId: string;
    candidate: {
        firstName: string;
        lastName: string;
    };
    round: number;
    type: string;
    scheduledAt: string;
    interviewer: string;
    status: string;
}

export default function InterviewsPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; interview: Interview | null }>({
        isOpen: false,
        interview: null
    });

    useEffect(() => {
        loadInterviews();
    }, []);

    const loadInterviews = async () => {
        try {
            setLoading(true);
            const res = await api.get('/recruitment/interviews');
            setInterviews(res.data);
        } catch (error) {
            console.error('Failed to load interviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (await confirm({ message: 'Are you sure you want to cancel this interview? Candidates will NOT be automatically notified.', type: 'danger' })) {
            try {
                await api.delete(`/recruitment/interviews/${id}`);
                toast.success('Interview cancelled');
                loadInterviews();
            } catch (error) {
                console.error('Failed to cancel:', error);
                toast.error('Failed to cancel interview');
            }
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
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Evaluation Horizon</h2>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Active Assessment Sessions</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{interviews.length} Scheduled</span>
                    </div>
                </div>
            </div>

            <div className="mx-2">
                <div className="ent-card overflow-hidden">
                    <ul className="divide-y divide-slate-100">
                        {interviews.map((interview) => (
                            <li key={interview.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-md bg-primary-50 flex items-center justify-center text-xs font-black text-primary-600">
                                            {interview.candidate.firstName[0]}{interview.candidate.lastName[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 tracking-tight mb-0.5">
                                                {interview.candidate.firstName} {interview.candidate.lastName}
                                            </h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                <span>Round {interview.round}: {interview.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-primary-600">{new Date(interview.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded bg-slate-100 border border-slate-200" />
                                                Assigned Evaluator: {interview.interviewer}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 self-end sm:self-center">
                                        <span className={`ent-badge ${interview.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            interview.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                'bg-primary-50 text-primary-700 border-primary-100'
                                            }`}>
                                            {interview.status}
                                        </span>

                                        {interview.status === 'scheduled' && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setRescheduleModal({ isOpen: true, interview })}
                                                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded bg-white border border-slate-200"
                                                    title="Reschedule"
                                                >
                                                    <RotateCw size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(interview.id)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded bg-white border border-slate-200"
                                                    title="Cancel"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        )}

                                        <Link
                                            href={`/recruitment/interviews/${interview.id}/scorecard`}
                                            className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-800 transition-colors bg-primary-50/50 px-3 py-1.5 rounded-lg border border-primary-100 opacity-0 group-hover:opacity-100"
                                        >
                                            Assess
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {interviews.length === 0 && (
                            <li className="px-6 py-12 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No evaluation sessions discovered in horizon.</p>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {rescheduleModal.interview && (
                <ScheduleInterviewModal
                    isOpen={rescheduleModal.isOpen}
                    onClose={() => setRescheduleModal({ isOpen: false, interview: null })}
                    candidateId={rescheduleModal.interview.candidateId} // Add this to Interview interface if missing
                    candidateName={`${rescheduleModal.interview.candidate.firstName} ${rescheduleModal.interview.candidate.lastName}`}
                    onSuccess={() => {
                        setRescheduleModal({ isOpen: false, interview: null });
                        loadInterviews();
                    }}
                    interviewId={rescheduleModal.interview.id}
                    initialData={{
                        round: rescheduleModal.interview.round,
                        type: rescheduleModal.interview.type,
                        scheduledAt: rescheduleModal.interview.scheduledAt,
                        interviewer: rescheduleModal.interview.interviewer
                    }}
                />
            )}
        </div>
    );
}
