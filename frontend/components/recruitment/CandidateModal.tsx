'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Briefcase, FileText } from 'lucide-react';
import { Candidate, candidatesApi, jobOpeningsApi, JobOpening } from '@/lib/api/recruitment';
import { useToast } from '@/hooks/useToast';

interface CandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    candidate?: Candidate | null; // If present, Edit mode
}

export default function CandidateModal({ isOpen, onClose, onSuccess, candidate }: CandidateModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<JobOpening[]>([]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobOpeningId: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadJobs();
            if (candidate) {
                setFormData({
                    firstName: candidate.firstName || '',
                    lastName: candidate.lastName || '',
                    email: candidate.email || '',
                    phone: candidate.phone || '',
                    jobOpeningId: candidate.jobOpeningId || '',
                    notes: candidate.notes || ''
                });
            } else {
                setFormData({ firstName: '', lastName: '', email: '', phone: '', jobOpeningId: '', notes: '' });
            }
        }
    }, [isOpen, candidate]);

    const loadJobs = async () => {
        try {
            const data = await jobOpeningsApi.getAll();
            setJobs(data);
        } catch (error) {
            console.error('Failed to load jobs', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (candidate) {
                await candidatesApi.update(candidate.id, formData);
                toast.success('Candidate profile updated');
            } else {
                await candidatesApi.create(formData);
                toast.success('Candidate inducted successfully');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {candidate ? 'Update Profile' : 'Intake Professional'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            {candidate ? `ID: ${candidate.id.substring(0, 8)}` : 'New Candidate Record'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <User size={10} /> First Name
                            </label>
                            <input
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="JOHN"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
                            <input
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="DOE"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Mail size={10} /> Email
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Phone size={10} /> Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="+1 555..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <Briefcase size={10} /> Target Role
                        </label>
                        <select
                            value={formData.jobOpeningId}
                            onChange={(e) => setFormData({ ...formData, jobOpeningId: e.target.value })}
                            className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">-- General Pool --</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <FileText size={10} /> Notes
                        </label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full text-xs font-bold text-slate-900 border-slate-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Additional context..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-slate-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-primary-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-colors shadow-lg shadow-primary-900/20 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : candidate ? 'Save Changes' : 'Confirm Intake'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
