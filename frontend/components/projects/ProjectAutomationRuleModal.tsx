'use client';

import React, { useState } from 'react';
import { X, Zap, ArrowRight, Mail } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import Portal from '@/components/ui/Portal';

interface ProjectAutomationRuleModalProps {
    projectId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProjectAutomationRuleModal({ projectId, onClose, onSuccess }: ProjectAutomationRuleModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Form State
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState<'TASK_STATUS_CHANGE' | 'TASK_CREATED'>('TASK_STATUS_CHANGE');
    const [triggerConfig, setTriggerConfig] = useState<any>({ from: '*', to: 'done' });
    const [actionType, setActionType] = useState<'SEND_EMAIL'>('SEND_EMAIL');
    const [actionConfig, setActionConfig] = useState<any>({ recipient: 'client', subject: '', body: '' });

    const handleSubmit = async () => {
        if (!name) return toast.error('Rule name required');

        setLoading(true);
        try {
            await api.post(`/projects/${projectId}/automation`, {
                name,
                triggerType,
                triggerConfig,
                actionType,
                actionConfig
            });
            toast.success('Rule created!');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to create rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-zoom-in">

                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Create Automation</h3>
                                <p className="text-xs text-slate-500 font-medium">Automate your project workflow</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Rule Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g., Notify Client on Completion"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                                autoFocus
                            />
                        </div>

                        {/* Trigger Section */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">1</span>
                                When this happens...
                            </div>

                            <select
                                value={triggerType}
                                onChange={e => setTriggerType(e.target.value as any)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700"
                            >
                                <option value="TASK_STATUS_CHANGE">Task Status Changes</option>
                                <option value="TASK_CREATED">Task Created</option>
                            </select>

                            {triggerType === 'TASK_STATUS_CHANGE' && (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">From</label>
                                        <select
                                            value={triggerConfig.from}
                                            onChange={e => setTriggerConfig({ ...triggerConfig, from: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
                                        >
                                            <option value="*">Any Status</option>
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="review">Review</option>
                                        </select>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 mt-4" />
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">To</label>
                                        <select
                                            value={triggerConfig.to}
                                            onChange={e => setTriggerConfig({ ...triggerConfig, to: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
                                        >
                                            <option value="done">Done</option>
                                            <option value="review">Review</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="todo">To Do</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Section */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">2</span>
                                Do this action...
                            </div>

                            <select
                                value={actionType}
                                onChange={e => setActionType(e.target.value as any)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700"
                            >
                                <option value="SEND_EMAIL">Send Email</option>
                            </select>

                            {actionType === 'SEND_EMAIL' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Recipient</label>
                                        <select
                                            value={actionConfig.recipient}
                                            onChange={e => setActionConfig({ ...actionConfig, recipient: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
                                        >
                                            <option value="client">Client</option>
                                            <option value="assignee">Task Assignee</option>
                                            <option value="custom">Custom Email</option>
                                        </select>
                                    </div>
                                    {actionConfig.recipient === 'custom' && (
                                        <input
                                            type="email"
                                            placeholder="Enter email address"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                                            onChange={e => setActionConfig({ ...actionConfig, customEmail: e.target.value })}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2.5 bg-violet-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-violet-200 hover:bg-violet-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                        >
                            {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Create Rule
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
