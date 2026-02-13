'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Zap, Trash2, ArrowRight, Mail, Bell } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ProjectAutomationRuleModal from '@/components/projects/ProjectAutomationRuleModal';

export default function ProjectAutomationPage({ params }: { params: { id: string } }) {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState<any>(null);
    const toast = useToast();

    useEffect(() => {
        fetchRules();
    }, [params.id]);

    const fetchRules = async () => {
        try {
            const res = await api.get(`/projects/${params.id}/automation`);
            setRules(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
            default: return type;
        }
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'SEND_EMAIL': return <Mail size={10} />;
            case 'IN_APP_NOTIFICATION': return <Bell size={10} />;
            case 'TEAMS_NOTIFICATION': return <span className="text-[8px] font-black">TM</span>;
            default: return <Mail size={10} />;
        }
    };

    const getActionLabel = (type: string) => {
        switch (type) {
            case 'SEND_EMAIL': return 'Email';
            case 'IN_APP_NOTIFICATION': return 'In-App';
            case 'TEAMS_NOTIFICATION': return 'Teams';
            default: return type.replace('_NOTIFICATION', '');
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner /></div>;

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
                                        ) : (
                                            <span>Triggers on task creation</span>
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
        </div>
    );
}

// I need to add Edit/Settings icons if available, but for now I'll use standard ones
import { Edit2 } from 'lucide-react';
