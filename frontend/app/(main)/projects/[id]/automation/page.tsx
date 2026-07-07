'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Zap, Trash2, ArrowRight, Mail, Bell, History, X } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ProjectAutomationRuleModal from '@/components/projects/ProjectAutomationRuleModal';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import AccessDenied from '@/components/AccessDenied';
import { Edit2 } from 'lucide-react';

export default function ProjectAutomationPage({ params }: { params: { id: string } }) {
    const [project, setProject] = useState<any>(null);
    const projectPerms = useProjectPermissions(project);
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<any>(null);
    const toast = useToast();

    // Logs dialog state
    const [selectedRuleForLogs, setSelectedRuleForLogs] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        fetchRules();
    }, [params.id]);

    const fetchRules = async () => {
        try {
            const [rulesRes, projectRes] = await Promise.all([
                api.get(`/projects/${params.id}/automation`),
                api.get(`/projects/${params.id}`)
            ]);
            setRules(rulesRes.data);
            setProject(projectRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (ruleId: string) => {
        try {
            setLoadingLogs(true);
            const res = await api.get(`/projects/automation/${ruleId}/logs`);
            setLogs(res.data || []);
        } catch (error) {
            toast.error('Failed to load execution logs');
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleDelete = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await api.delete(`/projects/automation/${ruleId}`);
            setRules(rules.filter(r => r.id !== ruleId));
            toast.success('Rule deleted');
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    const getTriggerLabel = (type: string) => {
        switch (type) {
            case 'TASK_CREATED': return 'Task Created';
            case 'TASK_STATUS_CHANGE': return 'Status Change';
            case 'TASK_ASSIGNED': return 'Assignment';
            case 'COMMENT_ADDED': return 'New Comment';
            case 'MENTION_FOUND': return 'Mention (@)';
            case 'TASK_REMINDER': return 'Task Reminder';
            default: return type;
        }
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'SEND_EMAIL': return <Mail size={10} />;
            case 'IN_APP_NOTIFICATION': return <Bell size={10} />;
            case 'TEAMS_NOTIFICATION': return <span className="text-[8px] font-black">TM</span>;
            case 'SLACK_NOTIFICATION': return <span className="text-[8px] font-black">SL</span>;
            default: return <Mail size={10} />;
        }
    };

    const getActionLabel = (type: string) => {
        switch (type) {
            case 'SEND_EMAIL': return 'Email';
            case 'IN_APP_NOTIFICATION': return 'In-App';
            case 'TEAMS_NOTIFICATION': return 'Teams';
            case 'SLACK_NOTIFICATION': return 'Slack';
            default: return type.replace('_NOTIFICATION', '');
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner /></div>;

    if (!projectPerms.can('settings', 'edit')) {
        return <AccessDenied />;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-0">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                            <Zap size={24} />
                        </span>
                        Automation Rules
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-xl">
                        Centralized notifications and smart workflows. Rules run automatically across Email, Teams, and In-App channels.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedRule(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 flex items-center gap-2"
                >
                    <Plus size={16} /> New Rule
                </button>
            </div>

            {rules.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Zap size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">No rules yet</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                        Create your first automation rule to save time and reduce manual work.
                    </p>
                    <button
                        onClick={() => {
                            setSelectedRule(null);
                            setIsModalOpen(true);
                        }}
                        className="text-violet-600 font-bold hover:underline font-black uppercase tracking-widest text-xs"
                    >
                        Create your first rule
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {rules.map(rule => (
                        <div key={rule.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${rule.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg mb-1">{rule.name}</h4>
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded uppercase tracking-wider text-[10px] font-black">
                                            {getTriggerLabel(rule.triggerType)}
                                        </span>
                                        <ArrowRight size={12} className="text-slate-300" />
                                        <span className="flex items-center gap-1 bg-violet-50 text-violet-700 px-2 py-1 rounded uppercase tracking-wider text-[10px] font-black">
                                            {getActionIcon(rule.actionType)}
                                            {getActionLabel(rule.actionType)}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <div className="mt-3 text-[11px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-2">
                                        {rule.triggerType === 'TASK_STATUS_CHANGE' ? (
                                            <>
                                                Status: {rule.triggerConfig?.from === '*' ? 'ANY' : rule.triggerConfig?.from}
                                                <ArrowRight size={10} />
                                                {rule.triggerConfig?.to === '*' ? 'ANY' : rule.triggerConfig?.to}
                                            </>
                                        ) : rule.triggerType === 'MENTION_FOUND' ? (
                                            <span>Triggers on @mention in comments</span>
                                        ) : rule.triggerType === 'TASK_ASSIGNED' ? (
                                            <span>Triggers on task assignment</span>
                                        ) : rule.triggerType === 'TASK_REMINDER' ? (
                                            <span>Notify {rule.triggerConfig?.daysBefore || 1} day(s) before due date</span>
                                        ) : (
                                            <span>Triggers on task creation</span>
                                        )}
                                        
                                        {/* Optional Priority & Type Indicators */}
                                        {rule.triggerConfig?.priority && rule.triggerConfig.priority !== '*' && (
                                            <span className="text-[9px] bg-slate-150 text-slate-600 px-1.5 py-0.5 rounded font-black">
                                                Priority: {rule.triggerConfig.priority}
                                            </span>
                                        )}
                                        {rule.triggerConfig?.type && rule.triggerConfig.type !== '*' && (
                                            <span className="text-[9px] bg-slate-150 text-slate-600 px-1.5 py-0.5 rounded font-black">
                                                Type: {rule.triggerConfig.type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 self-end md:self-center">
                                <div className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {rule.isActive ? 'Active' : 'Inactive'}
                                </div>
                                <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => {
                                            setSelectedRuleForLogs(rule);
                                            fetchLogs(rule.id);
                                        }}
                                        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                                        title="Execution History"
                                    >
                                        <History size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedRule(rule);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                        title="Edit Rule"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete Rule"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <ProjectAutomationRuleModal
                    projectId={params.id}
                    rule={selectedRule}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedRule(null);
                    }}
                    onSuccess={fetchRules}
                />
            )}

            {/* Execution logs popup */}
            {selectedRuleForLogs && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fade-in">
                    <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in border border-slate-100 ring-1 ring-slate-900/5">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-black uppercase text-slate-900 leading-none">Execution History</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Rule: {selectedRuleForLogs.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedRuleForLogs(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-3 bg-slate-50/50">
                            {loadingLogs ? (
                                <div className="py-8 text-center"><LoadingSpinner /></div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 uppercase text-[10px] font-black tracking-widest">No executions recorded yet</div>
                            ) : (
                                <div className="space-y-2.5">
                                    {logs.map((log) => (
                                        <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${log.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                                    {log.status}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {new Date(log.executedAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-700 font-semibold mb-1">{log.message}</p>
                                            {log.details && (
                                                <pre className="text-[9px] bg-slate-50 p-2.5 rounded border border-slate-150 overflow-x-auto text-slate-500 font-mono mt-2 select-all max-h-32">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end bg-white">
                            <button
                                onClick={() => setSelectedRuleForLogs(null)}
                                className="btn-secondary text-[10px]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
