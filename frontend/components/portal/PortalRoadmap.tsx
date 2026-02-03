'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { CheckCircle2, AlertCircle, Clock, Check, X, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSocket } from '@/contexts/SocketContext';

interface Milestone {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: string;
    reviewStatus: string;
}

export default function PortalRoadmap({ projectId }: { projectId: string }) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
    const toast = useToast();
    const { socket } = useSocket();

    useEffect(() => {
        fetchMilestones();
    }, [projectId]);

    useEffect(() => {
        if (!socket) return;

        const onMilestoneUpdated = (data: any) => {
            if (data.projectId === projectId) {
                fetchMilestones();
            }
        };

        socket.on('MILESTONE_UPDATED', onMilestoneUpdated);
        socket.on('MILESTONE_CREATED', onMilestoneUpdated);

        return () => {
            socket.off('MILESTONE_UPDATED', onMilestoneUpdated);
            socket.off('MILESTONE_CREATED', onMilestoneUpdated);
        };
    }, [socket, projectId]);

    const fetchMilestones = async () => {
        try {
            const res = await api.get(`/portal/projects/${projectId}/milestones`);
            setMilestones(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleReview = async (milestoneId: string, action: 'approve' | 'reject') => {
        setRefreshing(true);
        try {
            await api.post(`/portal/milestones/${milestoneId}/review`, {
                action,
                remarks: remarks[milestoneId]
            });
            toast.success(`Milestone ${action}ed successfully`);
            fetchMilestones();
        } catch (error: any) {
            toast.error(error.response?.data?.error || `Failed to ${action} milestone`);
            setRefreshing(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner /></div>;

    if (milestones.length === 0) return (
        <div className="p-12 text-center text-slate-400">
            <Clock size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">No roadmap defined for this project</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl pb-12">
            {/* Legend / Info */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> In Review
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-slate-300" /> Upcoming
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {milestones.map((m, idx) => {
                    const isCompleted = m.status === 'completed' || m.reviewStatus === 'approved';
                    const isPendingReview = m.reviewStatus === 'pending';
                    const isRejected = m.reviewStatus === 'rejected';

                    return (
                        <div key={m.id} className="relative group">
                            {/* Node */}
                            <div className={`absolute -left-8 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 
                                ${isCompleted ? 'bg-emerald-500' : isPendingReview ? 'bg-amber-500' : isRejected ? 'bg-rose-500' : 'bg-slate-300'}`}>
                                {isCompleted ? <Check size={12} className="text-white" /> : isRejected ? <X size={12} className="text-white" /> : null}
                            </div>

                            {/* Content */}
                            <div className={`ent-card p-6 transition-all ${isPendingReview ? 'border-amber-200 ring-2 ring-amber-500/10' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 group-hover:text-primary-600 transition-colors">{m.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} />
                                            {m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                        </div>
                                    </div>
                                </div>

                                {/* Approval/Correction Mode */}
                                {isPendingReview && (
                                    <div className="mt-6 bg-amber-50 rounded-xl p-5 border border-amber-200">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="p-2 bg-amber-200 rounded-lg text-amber-700">
                                                <AlertCircle size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">Action Required</h4>
                                                <p className="text-[11px] text-amber-700 mt-0.5">Please review the deliverables for this milestone and approve or request corrections.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <textarea
                                                value={remarks[m.id] || ''}
                                                onChange={(e) => setRemarks({ ...remarks, [m.id]: e.target.value })}
                                                placeholder="Add comments or correction requests..."
                                                className="w-full bg-white border border-amber-200 rounded-lg p-3 text-xs focus:ring-2 focus:ring-amber-500/20 outline-none min-h-[80px] text-amber-900 placeholder:text-amber-300"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={refreshing}
                                                    onClick={() => handleReview(m.id, 'approve')}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    <Check size={14} /> Approve Milestone
                                                </button>
                                                <button
                                                    disabled={refreshing}
                                                    onClick={() => handleReview(m.id, 'reject')}
                                                    className="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    <X size={14} /> Request Corrections
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isRejected && (
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                                        <AlertCircle size={14} /> Corrections Requested. Internal team is notified.
                                    </div>
                                )}

                                {isCompleted && (
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 w-fit">
                                        <Check size={14} /> Milestone Approved
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const Calendar = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
