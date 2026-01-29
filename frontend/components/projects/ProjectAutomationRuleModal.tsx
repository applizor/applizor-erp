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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fade-in">
                <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in border border-slate-100 ring-1 ring-slate-900/5">

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-primary-900 text-white flex items-center justify-center shadow-md">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Automation Rule</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure Smart Integration Workflows</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {/* Name */}
                        <div>
                            <label className="ent-label">Rule Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="E.g. ALERT LEAD ON STATUS CHANGE"
                                className="ent-input font-bold"
                                autoFocus
                            />
                        </div>

                        {/* Trigger Section */}
                        <div className="ent-card p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-black">1</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger Event</span>
                            </div>

                            <select
                                value={triggerType}
                                onChange={e => setTriggerType(e.target.value)}
                                className="ent-select cursor-pointer"
                            >
                                <option value="TASK_CREATED">Task Created</option>
                                <option value="TASK_STATUS_CHANGE">Task Status Changed</option>
                                <option value="TASK_ASSIGNED">Task Assigned</option>
                                <option value="COMMENT_ADDED">New Comment Added</option>
                                <option value="MENTION_FOUND">User Mentioned (@user)</option>
                            </select>

                            {triggerType === 'TASK_STATUS_CHANGE' && (
                                <div className="flex items-center gap-3 animate-fade-in bg-slate-50 p-3 rounded-md border border-slate-100">
                                    <div className="flex-1">
                                        <label className="ent-label mb-1">From Status</label>
                                        <select
                                            value={triggerConfig.from}
                                            onChange={e => setTriggerConfig({ ...triggerConfig, from: e.target.value })}
                                            className="ent-select text-xs"
                                        >
                                            <option value="*">Any Status</option>
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="review">Review</option>
                                        </select>
                                    </div>
                                    <div className="text-slate-300 mt-4">
                                        <ArrowRight size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="ent-label mb-1">To Status</label>
                                        <select
                                            value={triggerConfig.to}
                                            onChange={e => setTriggerConfig({ ...triggerConfig, to: e.target.value })}
                                            className="ent-select text-xs"
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
                        <div className="ent-card p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-black">2</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action & Channel</span>
                            </div>

                            <select
                                value={actionType}
                                onChange={e => {
                                    setActionType(e.target.value);
                                    if (['TEAMS_NOTIFICATION', 'SLACK_NOTIFICATION'].includes(e.target.value)) {
                                        setActionConfig({ ...actionConfig, recipient: 'custom' });
                                    }
                                }}
                                className="ent-select cursor-pointer"
                            >
                                <option value="SEND_EMAIL">📧 Send Email</option>
                                <option value="IN_APP_NOTIFICATION">🔔 In-App Notification</option>
                                <option value="TEAMS_NOTIFICATION">💬 MS Teams Message</option>
                                <option value="SLACK_NOTIFICATION">💼 Slack Message</option>
                            </select>

                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                {['TEAMS_NOTIFICATION', 'SLACK_NOTIFICATION'].includes(actionType) ? (
                                    <div className="animate-fade-in">
                                        <label className="ent-label">Webhook URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://hooks.slack.com/services/..."
                                            className="ent-input"
                                            value={actionConfig.customEmail || ''}
                                            onChange={e => setActionConfig({ ...actionConfig, customEmail: e.target.value, recipient: 'custom' })}
                                        />
                                        <p className="text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-wide">
                                            Incoming webhook URL from channel settings
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="ent-label">Recipient</label>
                                            <select
                                                value={actionConfig.recipient}
                                                onChange={e => setActionConfig({ ...actionConfig, recipient: e.target.value, useTemplate: (e.target.value === 'mentions' || triggerType === 'MENTION_FOUND') ? 'mention' : 'none' })}
                                                className="ent-select"
                                            >
                                                <option value="assignee">Task Assignee</option>
                                                <option value="mentions">Mentioned Users (@)</option>
                                                <option value="client">Project Client</option>
                                                <option value="custom">Custom Email / External</option>
                                            </select>
                                        </div>

                                        {actionConfig.recipient === 'custom' && (
                                            <div className="animate-fade-in">
                                                <label className="ent-label">Custom Email</label>
                                                <input
                                                    type="text"
                                                    placeholder="email@company.com"
                                                    className="ent-input"
                                                    value={actionConfig.customEmail || ''}
                                                    onChange={e => setActionConfig({ ...actionConfig, customEmail: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div>
                                    <label className="ent-label">Template</label>
                                    <select
                                        value={actionConfig.useTemplate}
                                        onChange={e => setActionConfig({ ...actionConfig, useTemplate: e.target.value })}
                                        className="ent-select"
                                    >
                                        <option value="none">Custom Message</option>
                                        <option value="mention">Standard Mention Template</option>
                                        <option value="assigned">Task Assignment Template</option>
                                        <option value="created">New Task Template</option>
                                        <option value="status">Status Update Template</option>
                                    </select>
                                </div>

                                {actionConfig.useTemplate === 'none' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="ent-label">Subject</label>
                                            <input
                                                type="text"
                                                className="ent-input"
                                                value={actionConfig.subject || ''}
                                                onChange={e => setActionConfig({ ...actionConfig, subject: e.target.value })}
                                                placeholder="NOTIFICATION SUBJECT"
                                            />
                                        </div>
                                        <div>
                                            <label className="ent-label">Message Body</label>
                                            <textarea
                                                className="ent-input h-24 resize-none py-2"
                                                value={actionConfig.body || ''}
                                                onChange={e => setActionConfig({ ...actionConfig, body: e.target.value })}
                                                placeholder="Enter your message content here..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                        <button
                            onClick={onClose}
                            className="btn-secondary text-[10px]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn-primary text-[10px] flex items-center gap-2"
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
