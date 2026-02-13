import { useState } from 'react';
import { X, Calendar, Clock, Link as LinkIcon, User } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface ScheduleInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    candidateName: string;
    onSuccess: () => void;
    interviewId?: string; // If present, Reschedule Mode
    initialData?: {
        round: number;
        type: string;
        scheduledAt: string;
        interviewer: string;
        meetingLink?: string;
    };
}

export default function ScheduleInterviewModal({
    isOpen, onClose, candidateId, candidateName, onSuccess, interviewId, initialData
}: ScheduleInterviewModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        round: initialData?.round ? String(initialData.round) : '1',
        type: initialData?.type || 'Telephonic',
        scheduledAt: initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : '',
        interviewer: initialData?.interviewer || '',
        meetingLink: initialData?.meetingLink || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            if (interviewId) {
                // Reschedule Mode
                await api.put(`/recruitment/interviews/${interviewId}/reschedule`, {
                    candidateId,
                    ...formData
                });
                toast.success('Interview rescheduled successfully');
            } else {
                // Schedule Mode
                await api.post('/recruitment/interviews', {
                    candidateId,
                    ...formData
                });
                toast.success('Interview scheduled successfully');
            }

            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to schedule interview');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {interviewId ? 'Reschedule Interview' : 'Schedule Interview'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            Candidate: <span className="text-primary-600">{candidateName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Round</label>
                            <select
                                className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-slate-50/50"
                                value={formData.round}
                                onChange={e => setFormData({ ...formData, round: e.target.value })}
                            >
                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>Round {r}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                            <select
                                className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-slate-50/50"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="Telephonic">Telephonic</option>
                                <option value="Video Call">Video Call</option>
                                <option value="Face to Face">Face-to-Face</option>
                                <option value="Technical">Technical Test</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar size={10} /> Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            value={formData.scheduledAt}
                            onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <User size={10} /> Interviewer
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. John Doe (Tech Lead)"
                            className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            value={formData.interviewer}
                            onChange={e => setFormData({ ...formData, interviewer: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <LinkIcon size={10} /> Meeting Link (Optional)
                        </label>
                        <input
                            type="url"
                            placeholder="https://meet.google.com/..."
                            className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            value={formData.meetingLink}
                            onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-primary-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-colors shadow-lg shadow-primary-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Scheduling...' : 'Confirm Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
