'use client';

import { useState } from 'react';
import { Calendar, X, Clock, User, Hash } from 'lucide-react';

interface ScheduleInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

export default function ScheduleInterviewModal({ isOpen, onClose, onSubmit }: ScheduleInterviewModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        round: 1,
        type: 'technical',
        scheduledAt: '',
        interviewer: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await onSubmit(formData);
            onClose();
            setFormData({ round: 1, type: 'technical', scheduledAt: '', interviewer: '' });
        } catch (error) {
            console.error('Failed to schedule interview:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <div>
                            <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase leading-none">Schedule Session</h3>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Interview Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="ent-form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                                <Hash size={10} /> Round Number
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.round}
                                onChange={(e) => setFormData({ ...formData, round: Number(e.target.value) })}
                                className="ent-input w-full"
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Interview Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="ent-input w-full appearance-none"
                            >
                                <option value="technical">Technical</option>
                                <option value="hr">HR</option>
                                <option value="managerial">Managerial</option>
                                <option value="final">Final Round</option>
                            </select>
                        </div>
                    </div>

                    <div className="ent-form-group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                            <Clock size={10} /> Date & Time Target
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.scheduledAt}
                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                            className="ent-input w-full"
                        />
                    </div>

                    <div className="ent-form-group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                            <User size={10} /> Interviewer
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.interviewer}
                            onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                            placeholder="EX: JANE DOE"
                            className="ent-input w-full"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 bg-primary-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-950 transition-all shadow-lg shadow-primary-900/10 disabled:opacity-50"
                        >
                            {submitting ? 'Scheudling...' : 'Confirm Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
