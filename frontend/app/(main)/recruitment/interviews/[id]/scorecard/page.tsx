'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { Star, Save, ArrowLeft, MessageSquare, ShieldCheck, User, Briefcase } from 'lucide-react';
import Link from 'next/link';

interface Criteria {
    id: string;
    label: string;
    description: string;
}

const EV_CRITERIA: Criteria[] = [
    { id: 'technical', label: 'Technical Proficiency', description: 'Core domain expertise and execution ability' },
    { id: 'communication', label: 'Strategic Communication', description: 'Clarity, empathy, and professional articulation' },
    { id: 'problem_solving', label: 'Analytical Capability', description: 'First-principles thinking and solution logic' },
    { id: 'culture', label: 'Cultural Congruence', description: 'Alignment with organizational values and drive' },
];

export default function InterviewScorecardPage() {
    const { id } = useParams();
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [interview, setInterview] = useState<any>(null);
    const [scores, setScores] = useState<Record<string, number>>({
        technical: 0,
        communication: 0,
        problem_solving: 0,
        culture: 0
    });
    const [comments, setComments] = useState('');
    const [recommendation, setRecommendation] = useState<'hire' | 'reject' | 'next_round' | ''>('');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/recruitment/interviews/${id}`);
            setInterview(res.data);

            // If scorecard exists, load it
            if (res.data.scorecard) {
                setScores(res.data.scorecard.ratings || scores);
                setComments(res.data.scorecard.comments || '');
                setRecommendation(res.data.scorecard.recommendation || '');
            }
        } catch (error) {
            console.error('Failed to load interview:', error);
            toast.error('Manifest retrieval failed');
            router.push('/recruitment/interviews');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!recommendation) {
            toast.error('Selection recommendation required');
            return;
        }

        try {
            await api.post(`/recruitment/interviews/${id}/scorecard`, {
                ratings: scores,
                comments,
                recommendation
            });
            toast.success('Evaluation Matrix Synchronized');
            router.push('/recruitment/interviews');
        } catch (error) {
            console.error(error);
            toast.error('Synchronization failed');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" className="text-primary-600 mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Manifest...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/recruitment/interviews" className="p-2 hover:bg-slate-50 text-slate-400 rounded-md transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="h-10 w-px bg-slate-100 mx-2" />
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">Evaluation Scorecard</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
                            Structured Manifest <ShieldCheck size={10} className="text-primary-600" /> Professional Appraisal
                        </p>
                    </div>
                </div>

                <button onClick={handleSave} className="btn-primary py-2.5 px-6 flex items-center gap-2 shadow-lg shadow-primary-900/10">
                    <Save size={16} /> Finalize Session
                </button>
            </div>

            {/* Candidate Info Ribbon */}
            <div className="bg-primary-900/5 border border-primary-900/10 rounded-md p-6 flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-900 rounded shadow-md">
                        <User size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-primary-900/40 uppercase tracking-widest">Talent Object</p>
                        <p className="text-sm font-black text-primary-900 uppercase">{interview?.candidate?.firstName} {interview?.candidate?.lastName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded shadow-sm">
                        <Briefcase size={16} className="text-primary-600" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requisition</p>
                        <p className="text-sm font-black text-slate-700 uppercase">{interview?.candidate?.jobOpening?.title || 'GENERAL INTAKE'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sequence</p>
                        <p className="text-sm font-black text-slate-700 uppercase">ROUND {interview?.round} ({interview?.type})</p>
                    </div>
                </div>
            </div>

            {/* Rating Matrix */}
            <div className="grid grid-cols-1 gap-6">
                {EV_CRITERIA.map((criteria) => (
                    <div key={criteria.id} className="bg-white p-6 rounded-md border border-slate-200 shadow-sm transition-all hover:border-primary-200 group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="max-w-md">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1 group-hover:text-primary-600 transition-colors">
                                    {criteria.label}
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    {criteria.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setScores({ ...scores, [criteria.id]: star })}
                                        className={`w-10 h-10 rounded-md border transition-all flex items-center justify-center
                                            ${scores[criteria.id] >= star
                                                ? 'bg-primary-900 border-primary-900 text-white shadow-md'
                                                : 'bg-white border-slate-200 text-slate-300 hover:border-primary-300 hover:text-primary-300'}
                                        `}
                                    >
                                        <span className="text-xs font-black">{star}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Narrative & Recommendation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare size={14} className="text-primary-600" />
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Synthesis & Narrative</h3>
                    </div>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="ent-input w-full flex-1 min-h-[150px] resize-none text-xs font-bold p-4"
                        placeholder="ENTER SUMMATIVE REMARKS AND OBSERVATIONS..."
                    />
                </div>

                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Strategic Recommendation</h3>
                    </div>

                    <div className="space-y-3">
                        {[
                            { id: 'hire', label: 'AUTHORIZE TALENT ACQUISITION (HIRE)', color: 'bg-emerald-600', text: 'text-emerald-600' },
                            { id: 'next_round', label: 'PROGRESS TO SUBSEQUENT PHASE', color: 'bg-primary-700', text: 'text-primary-700' },
                            { id: 'reject', label: 'ABORT CANDIDACY (REJECT)', color: 'bg-rose-600', text: 'text-rose-600' },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setRecommendation(btn.id as any)}
                                className={`w-full p-4 rounded-md border transition-all text-[10px] font-black uppercase tracking-widest text-left
                                    ${recommendation === btn.id
                                        ? `${btn.color} border-transparent text-white shadow-lg translate-x-1`
                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'}
                                `}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
