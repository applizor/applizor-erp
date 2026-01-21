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
        <div className="animate-fade-in pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 px-2">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
                        Evaluation Schedule
                        {!loading && interviews.length > 0 && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase font-black tracking-widest">
                                {interviews.length} SESSIONS
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Orchestrating professional assessments and candidate evaluation interactions.
                    </p>
                </div>
            </div>

            <div className="mx-2">
                <div className="ent-card overflow-hidden">
                    <ul className="divide-y divide-slate-100">
                        {interviews.map((interview) => (
                            <li key={interview.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600">
                                            {interview.candidate.firstName[0]}{interview.candidate.lastName[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 tracking-tight mb-0.5">
                                                {interview.candidate.firstName} {interview.candidate.lastName}
                                            </h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                <span>Round {interview.round}: {interview.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-indigo-600">{new Date(interview.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
                                                'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            }`}>
                                            {interview.status}
                                        </span>
                                        <Link
                                            href={`/recruitment/interviews/${interview.id}/scorecard`}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 opacity-0 group-hover:opacity-100"
                                        >
                                            Assess Manifest
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
        </div>
    );
}
