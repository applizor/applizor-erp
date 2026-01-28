'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Zap, Trash2, ArrowRight, Mail } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ProjectAutomationRuleModal from '@/components/projects/ProjectAutomationRuleModal';

export default function ProjectAutomationPage({ params }: { params: { id: string } }) {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
            await api.delete(`/projects/automation/${ruleId}`); // Note: Route path check
            setRules(rules.filter(r => r.id !== ruleId));
            toast.success('Rule deleted');
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                            <Zap size={24} />
                        </span>
                        Automation Rules
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-xl">
                        Streamline your workflow by automating repetitive tasks. Rules run automatically when triggers are met.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
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
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-violet-600 font-bold hover:underline"
                    >
                        Create your first rule
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {rules.map(rule => (
                        <div key={rule.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${rule.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg mb-1">{rule.name}</h4>
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded uppercase tracking-wider text-[10px] font-bold">
                                            {rule.triggerType === 'TASK_STATUS_CHANGE' ? 'Status Change' : 'Task Created'}
                                        </span>
                                        <ArrowRight size={12} className="text-slate-300" />
                                        <span className="flex items-center gap-1 bg-violet-50 text-violet-700 px-2 py-1 rounded uppercase tracking-wider text-[10px] font-bold">
                                            <Mail size={10} /> Send Email
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <div className="mt-3 text-sm text-slate-600 flex items-center gap-2">
                                        {rule.triggerType === 'TASK_STATUS_CHANGE' ? (
                                            <>
                                                When status changes from
                                                <span className="font-bold text-slate-800">
                                                    {rule.triggerConfig?.from === '*' ? 'Any' : rule.triggerConfig?.from}
                                                </span>
                                                to
                                                <span className="font-bold text-slate-800">
                                                    {rule.triggerConfig?.to}
                                                </span>
                                            </>
                                        ) : (
                                            <span>When a new task is created</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 self-end md:self-center">
                                <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {rule.isActive ? 'Active' : 'Inactive'}
                                </div>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Rule"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isCreateModalOpen && (
                <ProjectAutomationRuleModal
                    projectId={params.id}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={fetchRules}
                />
            )}
        </div>
    );
}
