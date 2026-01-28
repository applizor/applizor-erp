'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ScorecardPage({ params }: { params: { id: string } }) {
    const toast = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [scorecard, setScorecard] = useState({
        technical: 0,
        communication: 0,
        problemSolving: 0,
        cultureFit: 0,
        comments: ''
    });

    // Rating generic component
    const RatingInput = ({ label, value, onChange }: any) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label} (1-10)</label>
            <div className="flex space-x-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                        key={num}
                        type="button"
                        onClick={() => onChange(num)}
                        className={`w-8 h-8 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${value >= num
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/recruitment/interviews/${params.id}/scorecard`);
            if (res.data) {
                setScorecard({
                    technical: res.data.technical,
                    communication: res.data.communication,
                    problemSolving: res.data.problemSolving,
                    cultureFit: res.data.cultureFit,
                    comments: res.data.comments || ''
                });
            }
        } catch (error) {
            console.error('Failed to load scorecard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Calculate average rating
            const avg = (scorecard.technical + scorecard.communication + scorecard.problemSolving + scorecard.cultureFit) / 4;

            await api.put(`/recruitment/interviews/${params.id}/feedback`, {
                scorecard,
                rating: Math.round(avg * 10) / 10, // 1 decimal
                feedback: scorecard.comments, // sync simple feedback too
                status: 'completed'
            });

            router.push('/recruitment/interviews');
        } catch (error) {
            toast.error('Failed to submit scorecard');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Interview Scorecard</h1>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
                <RatingInput
                    label="Technical Skills"
                    value={scorecard.technical}
                    onChange={(v: number) => setScorecard({ ...scorecard, technical: v })}
                />

                <RatingInput
                    label="Communication"
                    value={scorecard.communication}
                    onChange={(v: number) => setScorecard({ ...scorecard, communication: v })}
                />

                <RatingInput
                    label="Problem Solving"
                    value={scorecard.problemSolving}
                    onChange={(v: number) => setScorecard({ ...scorecard, problemSolving: v })}
                />

                <RatingInput
                    label="Culture Fit"
                    value={scorecard.cultureFit}
                    onChange={(v: number) => setScorecard({ ...scorecard, cultureFit: v })}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700">Detailed Comments</label>
                    <textarea
                        rows={4}
                        value={scorecard.comments}
                        onChange={(e) => setScorecard({ ...scorecard, comments: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Key strengths, weaknesses, recommendation..."
                    />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700"
                    >
                        Submit Scorecard
                    </button>
                </div>
            </form>
        </div>
    );
}
