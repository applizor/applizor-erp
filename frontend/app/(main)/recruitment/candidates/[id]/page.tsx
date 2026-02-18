'use client';

import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/context/ConfirmationContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    candidatesApi,
    interviewsApi,
    offersApi,
    Candidate,
    Interview,
    OfferLetter
} from '@/lib/api/recruitment';
import { employeesApi } from '@/lib/api/hrms';
import ScheduleInterviewModal from '@/components/hrms/recruitment/ScheduleInterviewModal';
import OfferLetterModal from '@/components/hrms/recruitment/OfferLetterModal';
import OnboardEmployeeModal from '@/components/hrms/recruitment/OnboardEmployeeModal';
import { ArrowLeft, Mail, Phone, Calendar, Clock, User, CheckCircle, XCircle, FileText, ChevronRight, Briefcase, DollarSign, Award, Activity } from 'lucide-react';

export default function CandidateDetailsPage({ params }: { params: { id: string } }) {
    const toast = useToast();
    const router = useRouter();
    const { confirm } = useConfirm();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [offer, setOffer] = useState<OfferLetter | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

    // Status update form
    const [statusFormData, setStatusFormData] = useState({
        status: '',
        currentStage: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cand] = await Promise.all([
                candidatesApi.getById(params.id)
            ]);
            setCandidate(cand);
            setStatusFormData({
                status: cand.status,
                currentStage: cand.currentStage || '',
                notes: cand.notes || ''
            });

            // Load related data
            loadInterviews();
            loadOffer();
        } catch (error) {
            console.error('Failed to load candidate data:', error);
            toast.error('Failed to load candidate details');
            router.push('/recruitment/candidates');
        } finally {
            setLoading(false);
        }
    };

    const loadInterviews = async () => {
        try {
            const data = await interviewsApi.getByCandidate(params.id);
            setInterviews(data);
        } catch (error) {
            console.error('Failed to load interviews:', error);
        }
    };

    const loadOffer = async () => {
        try {
            const data = await offersApi.getByCandidate(params.id);
            setOffer(data);
        } catch (error) {
            // Normalize 404
            console.log('No offer found');
        }
    };

    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await candidatesApi.updateStatus(params.id, statusFormData);
            loadData();
            toast.success('Candidate status protocol updated');
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update candidate status');
        } finally {
            setSaving(false);
        }
    };

    const handleScheduleInterview = async (data: any) => {
        await interviewsApi.schedule({ ...data, candidateId: params.id });
        loadData();
    };

    const handleGenerateOffer = async (data: any) => {
        await offersApi.create({ ...data, candidateId: params.id });
        loadData();
    };

    const handleOnboard = async (data: any) => {
        await employeesApi.create(data);
        toast.success('Employee onboarded successfully! User account created.');
        loadData();
    };

    const [feedbackModal, setFeedbackModal] = useState({
        isOpen: false,
        interviewId: '',
        feedback: '',
        rating: 3
    });

    const openFeedbackModal = (id: string) => {
        setFeedbackModal({
            isOpen: true,
            interviewId: id,
            feedback: '',
            rating: 3
        });
    };

    const submitFeedback = async () => {
        if (!feedbackModal.feedback) return toast.error('Please enter feedback');

        try {
            await interviewsApi.updateFeedback(feedbackModal.interviewId, {
                feedback: feedbackModal.feedback,
                rating: feedbackModal.rating,
                status: 'completed'
            });
            toast.success('Feedback recorded');
            setFeedbackModal({ ...feedbackModal, isOpen: false });
            loadData();
        } catch (error) {
            toast.error('Failed to submit feedback');
        }
    };

    const acceptOffer = async (id: string) => {
        if (await confirm({ message: 'Mark offer as ACCEPTED? This will mark the candidate as HIRED.', type: 'success' })) {
            await offersApi.updateStatus(id, 'accepted');
            loadData();
        }
    };

    const rejectOffer = async (id: string) => {
        if (await confirm({ message: 'Mark offer as REJECTED? This will mark the candidate as REJECTED.', type: 'danger' })) {
            await offersApi.updateStatus(id, 'rejected');
            loadData();
        }
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center animate-pulse">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Retrieving Candidate Intel...</p>
        </div>
    );
    if (!candidate) return <div>Candidate not found</div>;

    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-lg shadow-lg">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">
                            {candidate.firstName} {candidate.lastName}
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Target: {candidate.jobOpening?.title || 'General Pool'} <ChevronRight size={10} className="text-primary-600" /> {candidate.currentStage || 'Screening'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded font-black text-[9px] uppercase tracking-widest">
                        <Link
                            href="/hrms/recruitment/candidates"
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded flex items-center gap-2 transition-all bg-white text-primary-600 shadow-sm border border-gray-200"
                        >
                            <ArrowLeft size={12} /> Return to Reservoir
                        </Link>
                    </div>
                    {candidate.status === 'hired' && (
                        <button
                            onClick={() => setIsOnboardModalOpen(true)}
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-xl shadow-emerald-900/10 active:scale-95"
                        >
                            <Briefcase size={14} /> Onboard Employee
                        </button>
                    )}
                </div>
            </div>


            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Candidate Identity Card */}
                    <div className="ent-card p-6">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase flex items-center gap-2">
                                    <FileText size={14} className="text-primary-600" /> Application Dossier
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    Submitted: {new Date(candidate.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`ent-badge ${candidate.status === 'hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                candidate.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                    'bg-primary-50 text-primary-700 border-primary-100'
                                }`}>
                                STATUS: {candidate.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contact Protocol</span>
                                    <div className="flex flex-col gap-1.5">
                                        {candidate.email && (
                                            <a href={`mailto:${candidate.email}`} className="text-[11px] font-bold text-gray-700 hover:text-primary-600 flex items-center gap-2 transition-colors">
                                                <Mail size={12} className="text-gray-400" /> {candidate.email}
                                            </a>
                                        )}
                                        {candidate.phone && (
                                            <a href={`tel:${candidate.phone}`} className="text-[11px] font-bold text-gray-700 hover:text-primary-600 flex items-center gap-2 transition-colors">
                                                <Phone size={12} className="text-gray-400" /> {candidate.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Current Stage</span>
                                    <div className="p-2 bg-gray-50 border border-gray-100 rounded text-[11px] font-bold text-gray-700 uppercase">
                                        {candidate.currentStage || 'INITIAL REVIEW'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Intelligence Notes</span>
                                <div className="p-3 bg-yellow-50/50 border border-yellow-100 rounded text-[11px] text-gray-600 min-h-[100px] leading-relaxed">
                                    {candidate.notes || 'No contextual data recorded.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interviews Section */}
                    <div className="ent-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase flex items-center gap-2">
                                <Clock size={14} className="text-primary-600" /> Interview Log
                            </h3>
                            <button
                                onClick={() => setIsInterviewModalOpen(true)}
                                className="text-[9px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center gap-1 border border-primary-100 bg-white px-3 py-1.5 rounded shadow-sm hover:shadow transition-all"
                            >
                                + Schedule
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {interviews.length === 0 ? (
                                <div className="p-8 text-center bg-white">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No interview sessions scheduled.</p>
                                </div>
                            ) : (
                                <div className="bg-white">
                                    {interviews.map((interview) => (
                                        <div key={interview.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-black text-gray-500 text-xs shadow-sm">
                                                        R{interview.round}
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] font-black text-gray-900 uppercase tracking-tight">
                                                            {interview.type} Protocol
                                                        </div>
                                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                            {new Date(interview.scheduledAt).toLocaleString()} • {interview.interviewer}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`ent-badge ${interview.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                    {interview.status}
                                                </span>
                                            </div>

                                            {interview.feedback && (
                                                <div className="mt-3 ml-11 p-3 bg-gray-50 rounded border border-gray-100">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-[11px] text-gray-600 italic leading-relaxed">"{interview.feedback}"</p>
                                                        <div className="flex items-center gap-1 ml-4 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">
                                                            <Award size={10} className="text-amber-500" />
                                                            <span className="text-[10px] font-black text-gray-900">{interview.rating}/5</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {interview.status === 'scheduled' && (
                                                <div className="mt-3 ml-11">
                                                    <button
                                                        onClick={() => openFeedbackModal(interview.id)}
                                                        className="text-[9px] font-black text-primary-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={10} /> Record Feedback & Close
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Offer Section */}
                    <div className="ent-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase flex items-center gap-2">
                                <DollarSign size={14} className="text-emerald-600" /> Compensation Offer
                            </h3>
                            {!offer && (
                                <button
                                    onClick={() => setIsOfferModalOpen(true)}
                                    className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1 border border-emerald-100 bg-white px-3 py-1.5 rounded shadow-sm hover:shadow transition-all"
                                >
                                    + Generate Proposal
                                </button>
                            )}
                        </div>
                        <div className="bg-white">
                            {offer ? (
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6 border-b border-gray-100 pb-6">
                                        <div className="space-y-4 w-full">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Proposal Status</span>
                                                    <span className={`ent-badge inline-block ${offer.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        offer.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                            'bg-sky-50 text-sky-700 border-sky-100'
                                                        }`}>
                                                        {offer.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Proposed CTC</span>
                                                    <div className="text-xl font-black text-gray-900 tracking-tight">
                                                        ₹ {offer.salary.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Designated Role</span>
                                                    <div className="text-[11px] font-bold text-gray-700 uppercase">{offer.position}</div>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Effective Date</span>
                                                    <div className="text-[11px] font-bold text-gray-700 uppercase">{new Date(offer.startDate).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {(offer.status === 'pending' || offer.status === 'sent') && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => acceptOffer(offer.id)}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
                                            >
                                                Confirm Acceptance (Hire)
                                            </button>
                                            <button
                                                onClick={() => rejectOffer(offer.id)}
                                                className="px-4 py-2 bg-white text-rose-600 border border-rose-100 rounded text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 shadow-sm active:scale-95 transition-all"
                                            >
                                                Mark Rejected
                                            </button>
                                            {offer.status === 'pending' && (
                                                <button
                                                    onClick={() => offersApi.updateStatus(offer.id, 'sent').then(loadData)}
                                                    className="px-4 py-2 bg-white text-sky-600 border border-sky-100 rounded text-[10px] font-black uppercase tracking-widest hover:bg-sky-50 shadow-sm active:scale-95 transition-all ml-auto"
                                                >
                                                    Mark as Sent
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No compensation proposal generated.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Sidebar Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="ent-card p-6 bg-white border-t-4 border-t-primary-500">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <Activity size={14} className="text-primary-500" /> Status Protocol
                        </h3>
                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Pipeline Status</label>
                                <div className="relative">
                                    <select
                                        value={statusFormData.status}
                                        onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value })}
                                        className="ent-input w-full appearance-none"
                                    >
                                        <option value="applied">Applied</option>
                                        <option value="screening">Screening</option>
                                        <option value="interview">Interview</option>
                                        <option value="offer">Offer</option>
                                        <option value="hired">Hired</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                                </div>
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Stage Details</label>
                                <input
                                    type="text"
                                    value={statusFormData.currentStage}
                                    onChange={(e) => setStatusFormData({ ...statusFormData, currentStage: e.target.value })}
                                    placeholder="EX: TECH ROUND 1"
                                    className="ent-input w-full"
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Internal Notes</label>
                                <textarea
                                    rows={4}
                                    value={statusFormData.notes}
                                    onChange={(e) => setStatusFormData({ ...statusFormData, notes: e.target.value })}
                                    className="ent-input w-full resize-none"
                                    placeholder="ADD CONTEXTUAL DATA..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2.5 bg-gray-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-900/10 disabled:opacity-50 active:scale-95"
                            >
                                {saving ? 'SYNCHRONIZING...' : 'UPDATE PROTOCOL'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <ScheduleInterviewModal
                isOpen={isInterviewModalOpen}
                onClose={() => setIsInterviewModalOpen(false)}
                onSubmit={handleScheduleInterview}
            />

            <OfferLetterModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                onSubmit={handleGenerateOffer}
                candidateName={`${candidate.firstName} ${candidate.lastName}`}
            />

            <OnboardEmployeeModal
                isOpen={isOnboardModalOpen}
                onClose={() => setIsOnboardModalOpen(false)}
                onSubmit={handleOnboard}
                candidate={candidate}
                offer={offer}
            />

            {/* Feedback Modal */}
            {feedbackModal.isOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Record Interview Feedback</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={feedbackModal.rating}
                                    onChange={(e) => setFeedbackModal({ ...feedbackModal, rating: parseInt(e.target.value) })}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                                <textarea
                                    rows={4}
                                    value={feedbackModal.feedback}
                                    onChange={(e) => setFeedbackModal({ ...feedbackModal, feedback: e.target.value })}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Enter detailed feedback..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitFeedback}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
