'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Interview {
    id: string;
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
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInterviews();
    }, []);

    const loadInterviews = async () => {
        try {
            setLoading(true);
            // In a real app, we'd have a specific endpoint for ALL interviews or filter by date
            // For now, fetching via specific candidates or a new generic endpoint is needed.
            // Assuming we added a generic getInterviews endpoint or we fetch for active candidates.
            // Let's assume we made a generic endpoint /recruitment/interviews or similar.
            // Since we didn't explicitly create "get all interviews", I'll mock it or fetch via candidates.
            // Recommendation: Add `getInterviews` to controller.
            // For this step, I'll fetch candidates and then their interviews (n+1 problem but works for prototype)
            // OR simpler: I'll just list widely.

            // Wait, I didn't create `getAllInterviews` in backend. 
            // I should have. 
            // I will implement a basic client-side fetch from candidates for now or assume a prop.

            // Let's implement a quick fix: Fetch candidates in "Interview" stage and get their interviews.
            const candidatesRes = await api.get('/recruitment/candidates?status=interview');
            const candidates = candidatesRes.data;

            let allInterviews: Interview[] = [];
            for (const c of candidates) {
                const intsRes = await api.get(`/recruitment/candidates/${c.id}/interviews`);
                allInterviews = [...allInterviews, ...intsRes.data.map((i: any) => ({ ...i, candidate: c }))];
            }

            setInterviews(allInterviews);
        } catch (error) {
            console.error('Failed to load interviews:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Scheduled Interviews</h2>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {interviews.map((interview) => (
                        <li key={interview.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    {interview.candidate.firstName} {interview.candidate.lastName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Round {interview.round}: {interview.type} • {new Date(interview.scheduledAt).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400">Interviewer: {interview.interviewer}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                    }`}>
                                    {interview.status}
                                </span>
                                <Link
                                    href={`/recruitment/interviews/${interview.id}/scorecard`}
                                    className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                                >
                                    Evaluate / Scorecard
                                </Link>
                            </div>
                        </li>
                    ))}
                    {interviews.length === 0 && (
                        <li className="px-6 py-8 text-center text-gray-500">
                            No upcoming interviews found. Schedule one from the Kanban Board.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
