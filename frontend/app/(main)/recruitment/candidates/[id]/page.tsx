'use client';

import { useToast } from '@/hooks/useToast';
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
import ScheduleInterviewModal from '@/components/recruitment/ScheduleInterviewModal';
import OfferLetterModal from '@/components/recruitment/OfferLetterModal';
import OnboardEmployeeModal from '@/components/recruitment/OnboardEmployeeModal';

export default function CandidateDetailsPage({ params }: { params: { id: string } }) {
    const toast = useToast();
    const router = useRouter();
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

    const updateInterviewFeedback = async (id: string) => {
        const feedback = prompt('Enter feedback:');
        if (feedback === null) return;
        const rating = Number(prompt('Enter rating (1-5):', '3'));

        await interviewsApi.updateFeedback(id, {
            feedback,
            rating,
            status: 'completed'
        });
        loadData();
    };

    const acceptOffer = async (id: string) => {
        if (confirm('Mark offer as ACCEPTED? This will mark the candidate as HIRED.')) {
            await offersApi.updateStatus(id, 'accepted');
            loadData();
        }
    };

    const rejectOffer = async (id: string) => {
        if (confirm('Mark offer as REJECTED? This will mark the candidate as REJECTED.')) {
            await offersApi.updateStatus(id, 'rejected');
            loadData();
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!candidate) return <div>Candidate not found</div>;

    return (
        <div>
            <div className="mb-6">
                <Link href="/recruitment/candidates" className="text-sm text-gray-500 hover:text-gray-700">
                    ← Back to Candidates
                </Link>
                <div className="flex justify-between items-center mt-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {candidate.firstName} {candidate.lastName}
                        </h1>
                        <p className="text-sm text-gray-500">{candidate.email} • {candidate.phone}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wide
                    ${candidate.status === 'hired' ? 'bg-green-100 text-green-800' :
                                candidate.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {candidate.status}
                        </div>
                        {candidate.status === 'hired' && (
                            <button
                                onClick={() => setIsOnboardModalOpen(true)}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium"
                            >
                                Onboard as Employee
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Interviews Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Interviews</h3>
                            <button
                                onClick={() => setIsInterviewModalOpen(true)}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                            >
                                + Schedule Interview
                            </button>
                        </div>
                        <div className="border-t border-gray-200">
                            {interviews.length === 0 ? (
                                <div className="px-4 py-5 text-sm text-gray-500 text-center">No interviews scheduled.</div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {interviews.map((interview) => (
                                        <li key={interview.id} className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    Round {interview.round}: {interview.type.toUpperCase()}
                                                </div>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${interview.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {interview.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                <p>Scheduled: {new Date(interview.scheduledAt).toLocaleString()}</p>
                                                <p>Interviewer: {interview.interviewer}</p>
                                                {interview.feedback && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded">
                                                        <p className="font-medium">Feedback:</p>
                                                        <p>{interview.feedback}</p>
                                                        <p>Rating: {interview.rating}/5</p>
                                                    </div>
                                                )}
                                            </div>
                                            {interview.status === 'scheduled' && (
                                                <div className="mt-2">
                                                    <button
                                                        onClick={() => updateInterviewFeedback(interview.id)}
                                                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                                                    >
                                                        Add Feedback & Complete
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Offer Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Offer Letter</h3>
                            {!offer && (
                                <button
                                    onClick={() => setIsOfferModalOpen(true)}
                                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                                >
                                    + Generate Offer
                                </button>
                            )}
                        </div>
                        <div className="border-t border-gray-200">
                            {offer ? (
                                <div className="px-4 py-5 sm:px-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                        offer.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {offer.status.toUpperCase()}
                                                </span>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Salary (CTC)</dt>
                                            <dd className="mt-1 text-sm text-gray-900">₹ {offer.salary.toLocaleString()}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Position</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{offer.position}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Joining Date</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{new Date(offer.startDate).toLocaleDateString()}</dd>
                                        </div>
                                    </div>
                                    {offer.status === 'pending' || offer.status === 'sent' ? (
                                        <div className="mt-6 flex space-x-4">
                                            <button
                                                onClick={() => acceptOffer(offer.id)}
                                                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                                            >
                                                Mark Accepted (Hire)
                                            </button>
                                            <button
                                                onClick={() => rejectOffer(offer.id)}
                                                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                                            >
                                                Mark Rejected
                                            </button>
                                            {offer.status === 'pending' && (
                                                <button
                                                    onClick={() => offersApi.updateStatus(offer.id, 'sent').then(loadData)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                                                >
                                                    Mark Sent
                                                </button>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="px-4 py-5 text-sm text-gray-500 text-center">No offer generated yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Application Details (Existing) */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Application Details</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-gray-200">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Applying For</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {candidate.jobOpening?.title || 'General Application'}
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Applied On</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {new Date(candidate.createdAt).toLocaleDateString()}
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Current Stage</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {candidate.currentStage || 'N/A'}
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                                        {candidate.notes || 'No notes added.'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                </div>

                {/* Sidebar Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={statusFormData.status}
                                    onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                >
                                    <option value="applied">Applied</option>
                                    <option value="screening">Screening</option>
                                    <option value="interview">Interview</option>
                                    <option value="offer">Offer</option>
                                    <option value="hired">Hired</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Stage</label>
                                <input
                                    type="text"
                                    value={statusFormData.currentStage}
                                    onChange={(e) => setStatusFormData({ ...statusFormData, currentStage: e.target.value })}
                                    placeholder="e.g. Technical Round 1"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
                                <textarea
                                    rows={4}
                                    value={statusFormData.notes}
                                    onChange={(e) => setStatusFormData({ ...statusFormData, notes: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {saving ? 'Updating...' : 'Update Status'}
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

        </div>
    );
}
