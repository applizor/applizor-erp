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
    const [triggerType, setTriggerType] = useState<string>('TASK_STATUS_CHANGE');
    const [triggerConfig, setTriggerConfig] = useState<any>({ from: '*', to: 'done' });
    const [actionType, setActionType] = useState<string>('SEND_EMAIL');
    const [actionConfig, setActionConfig] = useState<any>({ recipient: 'client', subject: '', body: '', useTemplate: 'none' });

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
                                <h3 className="text-lg font-black text-slate-800">Advanced Automation</h3>
                                <p className="text-xs text-slate-500 font-medium">Configure smart workflows & integrations</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Name */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rule Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g., Alert Team on Mention"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-bold text-slate-700"
                                autoFocus
                            />
                        </div>

                        {/* Trigger Section */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">1</span>
                                Trigger Event
                            </div>

                            <select
                                value={triggerType}
                                onChange={e => setTriggerType(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-violet-400"
                            >
                                <option value="TASK_CREATED">Task Created</option>
                                <option value="TASK_STATUS_CHANGE">Task Status Changed</option>
                                <option value="TASK_ASSIGNED">Task Assigned</option>
                                <option value="COMMENT_ADDED">New Comment Added</option>
                                <option value="MENTION_FOUND">User Mentioned (@user)</option>
                            </select>

                            {triggerType === 'TASK_STATUS_CHANGE' && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">From Status</label>
                                        <select
                                            value={triggerConfig.from}
                                            onChange={e => setTriggerConfig({ ...triggerConfig, from: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                                        >
                                            <option value="*">Any Status</option>
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="review">Review</option>
                                        </select>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300 mt-4" />
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">To Status</label>
                                        <select
                                            value={triggerConfig.to}
                                            onChange={e => setTriggerConfig({ ...triggerConfig, to: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                                        >
                                            <option value="*">Any Status</option>
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="review">Review</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Section */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">2</span>
                                Action & Channel
                            </div>

                            <select
                                value={actionType}
                                onChange={e => {
                                    setActionType(e.target.value);
                                    // Reset Recipient if switching to webhook types
                                    if (['TEAMS_NOTIFICATION', 'SLACK_NOTIFICATION'].includes(e.target.value)) {
                                        setActionConfig({ ...actionConfig, recipient: 'custom' });
                                    }
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-violet-400"
                            >
                                <option value="SEND_EMAIL">📧 Send Email Notification</option>
                                <option value="IN_APP_NOTIFICATION">🔔 In-App Notification</option>
                                <option value="TEAMS_NOTIFICATION">💬 MS Teams Message</option>
                                <option value="SLACK_NOTIFICATION">💼 Slack Message</option>
                            </select>

                            <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in">
                                {['TEAMS_NOTIFICATION', 'SLACK_NOTIFICATION'].includes(actionType) ? (
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                            {actionType === 'TEAMS_NOTIFICATION' ? 'Teams Webhook URL' : 'Slack Webhook URL'}
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://hooks.slack.com/services/..."
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                                            value={actionConfig.customEmail || ''}
                                            onChange={e => setActionConfig({ ...actionConfig, customEmail: e.target.value, recipient: 'custom' })}
                                        />
                                        <p className="text-[9px] text-slate-400 mt-1 font-medium">
                                            Paste the incoming webhook URL from your channel settings.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Recipient</label>
                                            <select
                                                value={actionConfig.recipient}
                                                onChange={e => setActionConfig({ ...actionConfig, recipient: e.target.value, useTemplate: (e.target.value === 'mentions' || triggerType === 'MENTION_FOUND') ? 'mention' : 'none' })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                                            >
                                                <option value="assignee">Task Assignee</option>
                                                <option value="mentions">Mentioned Users (@)</option>
                                                <option value="client">Project Client</option>
                                                <option value="custom">Custom Email</option>
                                            </select>
                                        </div>

                                        {actionConfig.recipient === 'custom' && (
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Custom Email</label>
                                                <input
                                                    type="text"
                                                    placeholder="email@example.com"
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                                    value={actionConfig.customEmail || ''}
                                                    onChange={e => setActionConfig({ ...actionConfig, customEmail: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Template / Content</label>
                                    <select
                                        value={actionConfig.useTemplate}
                                        onChange={e => setActionConfig({ ...actionConfig, useTemplate: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                                    >
                                        <option value="none">Custom Message (Raw)</option>
                                        <option value="mention">Standard Mention Template</option>
                                        <option value="assigned">Task Assignment Template</option>
                                        <option value="created">New Task Template</option>
                                        <option value="status">Status Update Template</option>
                                    </select>
                                </div>

                                {actionConfig.useTemplate === 'none' && (
                                    <>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Message Subject</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                                value={actionConfig.subject || ''}
                                                onChange={e => setActionConfig({ ...actionConfig, subject: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Message Body</label>
                                            <textarea
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium h-20 resize-none"
                                                value={actionConfig.body || ''}
                                                onChange={e => setActionConfig({ ...actionConfig, body: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
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
