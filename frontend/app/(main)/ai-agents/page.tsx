'use client';

import { useEffect, useState } from 'react';
import { 
    Cpu, 
    CheckCircle, 
    XCircle, 
    Clock, 
    RefreshCw, 
    ShieldCheck, 
    Activity, 
    MessageSquare, 
    User, 
    Zap, 
    ChevronRight,
    CornerDownRight
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AIAgentsDashboard() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [feedbackComments, setFeedbackComments] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'approvals' | 'logs'>('approvals');

    const agentsList = [
        { name: 'ChiefOfStaff', role: 'Agent Orchestration & Worker Coordination', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { name: 'BusinessAnalyst', role: 'Requirement Breakdown & Impact Analysis', icon: Activity, color: 'text-purple-600 bg-purple-50 border-purple-100' },
        { name: 'ClientComm', role: 'Teams Channel Bridging & Client Sync', icon: MessageSquare, color: 'text-sky-600 bg-sky-50 border-sky-100' },
        { name: 'SalesAgent', role: 'Proposal & Quotation Generation', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-100' },
        { name: 'MarketingAgent', role: 'SEO Structuring & Competitor Strategy', icon: Activity, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        { name: 'ResearchAgent', role: 'Product & Stack Trend Compilation', icon: Cpu, color: 'text-pink-600 bg-pink-50 border-pink-100' },
        { name: 'HrAgent', role: 'Resume Ranking & Job Suitability', icon: User, color: 'text-teal-600 bg-teal-50 border-teal-100' }
    ];

    const loadData = async () => {
        try {
            const [logsRes, approvalsRes] = await Promise.all([
                api.get('/ai-system/logs?limit=50').catch(() => ({ data: [] })),
                api.get('/ai-system/approvals').catch(() => ({ data: [] }))
            ]);
            setLogs(logsRes.data || []);
            setApprovals(approvalsRes.data || []);
        } catch (error) {
            console.error('Failed to load AI Dashboard data', error);
            toast.error('Failed to load dashboard metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Auto refresh logs every 20 seconds
        const timer = setInterval(loadData, 20000);
        return () => clearInterval(timer);
    }, []);

    const handleApprovalAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        const comments = feedbackComments[id] || `${status} via Web Dashboard`;
        try {
            setLoading(true);
            await api.put(`/ai-system/approvals/${id}`, { status, comments });
            toast.success(`Request successfully ${status.toLowerCase()}!`);
            // Clear input
            setFeedbackComments(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
            loadData();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Failed to update approval request');
            setLoading(false);
        }
    };

    if (loading && logs.length === 0) return <LoadingSpinner />;

    // Calc metrics
    const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;
    const successLogsCount = logs.filter(l => l.status === 'SUCCESS').length;
    const failedLogsCount = logs.filter(l => l.status === 'FAILED').length;
    const totalRuns = logs.length;

    return (
        <div className="animate-fade-in pb-20 px-2 lg:px-4">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">AI Control Center Dashboard</h1>
                    <p className="mt-1 text-slate-500 font-medium text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-pulse" />
                        Governance & Orchestration layer active.
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="bg-white border border-slate-200 p-2.5 rounded-md hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 text-xs font-bold text-slate-600"
                >
                    <RefreshCw size={14} />
                    Sync Feed
                </button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="ent-card p-5 border-t-4 border-t-indigo-600 bg-white shadow-md">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-mono">Agent Triggers</p>
                    <h3 className="text-xl font-black text-slate-900">{totalRuns} Runs</h3>
                </div>
                <div className="ent-card p-5 border-t-4 border-t-amber-500 bg-white shadow-md">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-mono">Pending Approvals</p>
                    <h3 className="text-xl font-black text-amber-600">{pendingApprovalsCount} Queue</h3>
                </div>
                <div className="ent-card p-5 border-t-4 border-t-emerald-500 bg-white shadow-md">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-mono">Successful Tasks</p>
                    <h3 className="text-xl font-black text-emerald-600">{successLogsCount} Complete</h3>
                </div>
                <div className="ent-card p-5 border-t-4 border-t-rose-500 bg-white shadow-md">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-mono">Failed Operations</p>
                    <h3 className="text-xl font-black text-rose-600">{failedLogsCount} Errors</h3>
                </div>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Approvals & Logs Feed */}
                <div className="lg:col-span-8 flex flex-col">
                    <div className="flex border-b border-slate-100 mb-6 gap-6">
                        <button 
                            onClick={() => setActiveTab('approvals')}
                            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'approvals' ? 'border-primary-600 text-slate-900' : 'border-transparent text-slate-400'}`}
                        >
                            Approval Requests Queue ({pendingApprovalsCount})
                        </button>
                        <button 
                            onClick={() => setActiveTab('logs')}
                            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'logs' ? 'border-primary-600 text-slate-900' : 'border-transparent text-slate-400'}`}
                        >
                            Live Agent Activity Logs ({logs.length})
                        </button>
                    </div>

                    {activeTab === 'approvals' ? (
                        <div className="space-y-4">
                            {approvals.filter(a => a.status === 'PENDING').length > 0 ? (
                                approvals.filter(a => a.status === 'PENDING').map((app) => (
                                    <div key={app.id} className="ent-card p-6 bg-white border border-slate-100 shadow-lg rounded-md relative">
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div>
                                                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 mr-2">
                                                    ID: {app.id.slice(0, 8)}
                                                </span>
                                                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                                                    {app.type}
                                                </span>
                                                <h3 className="text-base font-black text-slate-900 mt-2">{app.title}</h3>
                                                <p className="text-xs text-slate-400 mt-1 font-bold">Generated by: {app.agentName}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(app.createdAt).toLocaleString()}</span>
                                        </div>

                                        {app.description && (
                                            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded mb-4 italic border-l-2 border-l-slate-300">
                                                {app.description}
                                            </p>
                                        )}

                                        {/* Payload content Viewer */}
                                        {app.payload && (
                                            <div className="mb-4 bg-slate-900 text-slate-300 text-xs font-mono p-4 rounded max-h-60 overflow-y-auto border border-slate-800">
                                                <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1 uppercase text-[9px] font-black">Draft Content payload</div>
                                                <pre className="whitespace-pre-wrap leading-relaxed">{app.payload.content || JSON.stringify(app.payload, null, 2)}</pre>
                                            </div>
                                        )}

                                        {/* Feedback comments input */}
                                        <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="Add reviewer comments or revisions instructions..."
                                                value={feedbackComments[app.id] || ''}
                                                onChange={(e) => setFeedbackComments({ ...feedbackComments, [app.id]: e.target.value })}
                                                className="w-full text-xs p-3 border border-slate-200 rounded focus:border-indigo-600 focus:outline-none bg-slate-50/50"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleApprovalAction(app.id, 'REJECTED')}
                                                    className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-wider rounded transition-colors"
                                                >
                                                    Reject / Revise
                                                </button>
                                                <button 
                                                    onClick={() => handleApprovalAction(app.id, 'APPROVED')}
                                                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500 text-[10px] font-black uppercase tracking-wider rounded transition-colors shadow-lg"
                                                >
                                                    Approve Release
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-md text-slate-400">
                                    <CheckCircle size={28} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No pending approvals in the queue</p>
                                    <p className="text-[10px] text-slate-400 mt-1">When agents require validation on proposals, quotations, or releases, they will appear here.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[1000px] overflow-y-auto pr-2">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-md border-b border-slate-100 transition-colors">
                                        <div className="mt-1">
                                            {log.status === 'SUCCESS' ? (
                                                <CheckCircle size={16} className="text-emerald-500" />
                                            ) : log.status === 'FAILED' ? (
                                                <XCircle size={16} className="text-rose-500" />
                                            ) : (
                                                <Clock size={16} className="text-sky-500 animate-spin" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="text-xs font-black text-slate-900 uppercase">
                                                    {log.agentName} <CornerDownRight size={10} className="inline mx-1 text-slate-300" /> <span className="text-slate-500 font-bold lowercase">{log.action}</span>
                                                </h4>
                                                <span className="text-[9px] text-slate-400 font-bold">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                            {log.details && (
                                                <div className="mt-2 text-[10px] font-mono bg-slate-50 text-slate-600 p-2 rounded max-w-full overflow-x-auto border border-slate-100/50">
                                                    <pre>{typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 bg-white border border-slate-100 rounded-md text-slate-400">
                                    <p className="text-xs font-bold uppercase tracking-widest">No activity log entries found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Agents List */}
                <div className="lg:col-span-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">AI Agent Personas</h3>
                    <div className="space-y-4">
                        {agentsList.map((agent, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 shadow-sm rounded-md hover:shadow-md transition-shadow">
                                <div className={`w-8 h-8 rounded flex items-center justify-center border ${agent.color}`}>
                                    <agent.icon size={16} />
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="text-xs font-black text-slate-900">{agent.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{agent.role}</p>
                                </div>
                                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
