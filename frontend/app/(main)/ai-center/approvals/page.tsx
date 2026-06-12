'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
    Brain, 
    Check, 
    X, 
    Clock, 
    FileText, 
    Wallet, 
    GitPullRequest, 
    Layers,
    Loader2,
    AlertCircle,
    UserCheck,
    Calendar
} from 'lucide-react';

interface AiApproval {
    id: string;
    title: string;
    description: string | null;
    type: string; // release, quotation, budget, structure_change
    status: string; // pending, approved, rejected
    requestedBy: string;
    approvedBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function ApprovalCenterPage() {
    const [approvals, setApprovals] = useState<AiApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/ai/approvals');
            setApprovals(res.data);
        } catch (err: any) {
            console.error('Failed to load approvals:', err);
            setError(err.response?.data?.error || 'Failed to fetch AI approvals queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const handleAction = async (id: string, action: 'approved' | 'rejected') => {
        try {
            setActionLoadingId(id);
            const res = await api.put(`/ai/approvals/${id}/action`, { status: action });
            // Update item in state
            setApprovals(prev => prev.map(item => item.id === id ? res.data : item));
        } catch (err) {
            console.error(`Failed to ${action} approval:`, err);
            alert(`Failed to submit action: ${action}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Helper to get approval type visual details
    const getTypeDetails = (type: string) => {
        switch (type.toLowerCase()) {
            case 'release':
                return { label: 'Code Release', icon: GitPullRequest, color: 'bg-blue-50 text-blue-700 border-blue-100' };
            case 'quotation':
                return { label: 'Quotation Over-limit', icon: FileText, color: 'bg-amber-50 text-amber-700 border-amber-100' };
            case 'budget':
                return { label: 'Budget Override', icon: Wallet, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
            case 'structure_change':
                return { label: 'Org Structure Change', icon: Layers, color: 'bg-purple-50 text-purple-700 border-purple-100' };
            default:
                return { label: 'General Request', icon: Brain, color: 'bg-slate-50 text-slate-700 border-slate-100' };
        }
    };

    // Calculate dynamic stats
    const pendingCount = approvals.filter(a => a.status === 'pending').length;
    const approvedCount = approvals.filter(a => a.status === 'approved').length;
    const totalCount = approvals.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Brain className="w-7 h-7 text-indigo-600 animate-pulse" />
                        AI Approval Center
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Review, audit, and authorize sensitive operations requested by autonomous background AI nodes.
                    </p>
                </div>
                <button
                    onClick={fetchApprovals}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-colors"
                >
                    Refresh Queue
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Tasks</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Authorized Actions</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                        <Check className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Evaluated</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Approvals Queue */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-sm text-slate-500 mt-4 font-medium">Scanning approval queues...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-800">Connection Error</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        <button onClick={fetchApprovals} className="mt-3 text-xs font-bold text-red-800 underline hover:text-red-900">
                            Retry Connection
                        </button>
                    </div>
                </div>
            ) : approvals.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <Check className="w-16 h-16 text-emerald-500 mx-auto bg-emerald-50 p-4 rounded-full border border-emerald-100" />
                    <h3 className="text-lg font-bold text-slate-800 mt-4">All Clear!</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                        No pending operational actions from AI nodes require manual review.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {approvals.map((item) => {
                        const typeInfo = getTypeDetails(item.type);
                        const TypeIcon = typeInfo.icon;
                        
                        return (
                            <div 
                                key={item.id} 
                                className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden ${
                                    item.status === 'pending' ? 'border-amber-100 bg-amber-50/10' : 'border-slate-100'
                                }`}
                            >
                                {/* Side Indicator Stripe */}
                                <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                                    item.status === 'pending' ? 'bg-amber-400' :
                                    item.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'
                                }`} />

                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${typeInfo.color}`}>
                                            <TypeIcon className="w-3.5 h-3.5" />
                                            {typeInfo.label}
                                        </span>
                                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(item.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                                        {item.description && (
                                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                                        <div>
                                            Requested By:{' '}
                                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-bold font-mono">
                                                {item.requestedBy}
                                            </span>
                                        </div>

                                        {item.status !== 'pending' && item.approvedBy && (
                                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                <UserCheck className="w-3.5 h-3.5" />
                                                <span>Reviewed by: Administrator</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions & Status Badge */}
                                <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 justify-end">
                                    {item.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleAction(item.id, 'rejected')}
                                                disabled={actionLoadingId === item.id}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                Deny Action
                                            </button>
                                            
                                            <button
                                                onClick={() => handleAction(item.id, 'approved')}
                                                disabled={actionLoadingId === item.id}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors disabled:opacity-50"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Approve & Run
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                                            item.status === 'approved' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                                        }`}>
                                            {item.status === 'approved' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            {item.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
