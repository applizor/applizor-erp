'use client';

import React, { useState } from 'react';
import { X, Zap, ArrowRight, Mail } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import Portal from '@/components/ui/Portal';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface ProjectAutomationRuleModalProps {
    projectId: string;
    rule?: any; // Optional rule for editing
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProjectAutomationRuleModal({ projectId, rule, onClose, onSuccess }: ProjectAutomationRuleModalProps) {
    const isEditing = !!rule;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Form State
    const [name, setName] = useState(rule?.name || '');
    const [triggerType, setTriggerType] = useState<string>(rule?.triggerType || 'TASK_STATUS_CHANGE');
    const [triggerConfig, setTriggerConfig] = useState<any>(rule?.triggerConfig || { from: '*', to: 'done' });
    const [actionType, setActionType] = useState<string>(rule?.actionType || 'SEND_EMAIL');
    const [actionConfig, setActionConfig] = useState<any>(rule?.actionConfig || { recipient: 'client', subject: '', body: '', useTemplate: 'none' });
    const [isActive, setIsActive] = useState<boolean>(rule ? rule.isActive : true);

    const [showGuide, setShowGuide] = useState(false);

    const handleSubmit = async () => {
        if (!name) return toast.error('Rule name required');

        setLoading(true);
        try {
            const payload = {
                name,
                triggerType,
                triggerConfig,
                actionType,
                actionConfig,
                isActive
            };

            if (isEditing) {
                await api.put(`/projects/automation/${rule.id}`, payload);
                toast.success('Rule updated!');
            } else {
                await api.post(`/projects/${projectId}/automation`, payload);
                toast.success('Rule created!');
            }
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(isEditing ? 'Failed to update rule' : 'Failed to create rule');
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
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{isEditing ? 'Edit Rule' : 'Automation Rule'}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{isEditing ? 'Modify your smart workflow' : 'Configure Smart Integration Workflows'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {/* Name & Status */}
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
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
                            {isEditing && (
                                <div className="mb-1">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div
                                            onClick={() => setIsActive(!isActive)}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isActive ? 'left-6' : 'left-1'}`} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Active</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Trigger Section */}
                        <div className="ent-card p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-black">1</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger Event</span>
                            </div>

                            <CustomSelect
                                value={triggerType}
                                onChange={(val) => setTriggerType(val)}
                                options={[
                                    { label: 'Task Created', value: 'TASK_CREATED' },
                                    { label: 'Task Status Changed', value: 'TASK_STATUS_CHANGE' },
                                    { label: 'Task Assigned', value: 'TASK_ASSIGNED' },
                                    { label: 'New Comment Added', value: 'COMMENT_ADDED' },
                                    { label: 'User Mentioned (@user)', value: 'MENTION_FOUND' },
                                    { label: '⏰ Task Reminder (Scheduled)', value: 'TASK_REMINDER' }
                                ]}
                                className="w-full"
                            />

                            {triggerType === 'TASK_STATUS_CHANGE' && (
                                <div className="flex items-center gap-3 animate-fade-in bg-slate-50 p-3 rounded-md border border-slate-100">
                                    <div className="flex-1">
                                        <label className="ent-label mb-1">From Status</label>
                                        <CustomSelect
                                            value={triggerConfig.from}
                                            onChange={(val) => setTriggerConfig({ ...triggerConfig, from: val })}
                                            options={[
                                                { label: 'Any Status', value: '*' },
                                                { label: 'To Do', value: 'todo' },
                                                { label: 'In Progress', value: 'in-progress' },
                                                { label: 'Review', value: 'review' }
                                            ]}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="text-slate-300 mt-4">
                                        <ArrowRight size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="ent-label mb-1">To Status</label>
                                        <CustomSelect
                                            value={triggerConfig.to}
                                            onChange={(val) => setTriggerConfig({ ...triggerConfig, to: val })}
                                            options={[
                                                { label: 'Any Status', value: '*' },
                                                { label: 'To Do', value: 'todo' },
                                                { label: 'In Progress', value: 'in-progress' },
                                                { label: 'Review', value: 'review' },
                                                { label: 'Done', value: 'done' }
                                            ]}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}

                            {triggerType === 'TASK_REMINDER' && (
                                <div className="animate-fade-in bg-slate-50 p-4 rounded-md border border-slate-100 space-y-3">
                                    <label className="ent-label">Days Before Due Date</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            className="ent-input w-24 font-bold"
                                            value={triggerConfig.daysBefore || 1}
                                            onChange={(e) => setTriggerConfig({ ...triggerConfig, daysBefore: parseInt(e.target.value) })}
                                        />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Days remaining</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                                        System will scan daily and notify recipients when task due date is exactly X days away.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Section */}
                        <div className="ent-card p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-black">2</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action & Channel</span>
                            </div>

                            <CustomSelect
                                value={actionType}
                                onChange={(val) => {
                                    setActionType(val);
                                    if (['TEAMS_NOTIFICATION', 'SLACK_NOTIFICATION'].includes(val)) {
                                        setActionConfig({ ...actionConfig, recipient: 'custom' });
                                    }
                                }}
                                options={[
                                    { label: '📧 Send Email', value: 'SEND_EMAIL' },
                                    { label: '🔔 In-App Notification', value: 'IN_APP_NOTIFICATION' },
                                    { label: '💬 MS Teams Message', value: 'TEAMS_NOTIFICATION' },
                                    { label: '💼 Slack Message', value: 'SLACK_NOTIFICATION' }
                                ]}
                                className="w-full"
                            />

                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                {['TEAMS_NOTIFICATION', 'SLACK_NOTIFICATION'].includes(actionType) ? (
                                    <div className="animate-fade-in space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="ent-label">Webhook URL</label>
                                            <button
                                                onClick={() => setShowGuide(true)}
                                                className="text-[9px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center gap-1 bg-primary-50 px-2 py-1 rounded border border-primary-100 hover:bg-primary-100 transition-all"
                                            >
                                                <Info size={10} /> guide: Setup {actionType === 'SLACK_NOTIFICATION' ? 'Slack' : 'Teams'} Webhook
                                            </button>
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="https://hooks.slack.com/services/..."
                                            className="ent-input"
                                            value={actionConfig.customEmail || ''}
                                            onChange={e => setActionConfig({ ...actionConfig, customEmail: e.target.value, recipient: 'custom' })}
                                        />
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                            Incoming webhook URL from {actionType === 'SLACK_NOTIFICATION' ? 'Slack' : 'Teams'} channel settings
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="ent-label">Recipient</label>
                                            <CustomSelect
                                                value={actionConfig.recipient}
                                                onChange={(val) => setActionConfig({ ...actionConfig, recipient: val, useTemplate: (val === 'mentions' || triggerType === 'MENTION_FOUND') ? 'mention' : 'none' })}
                                                options={[
                                                    { label: 'Task Assignee', value: 'assignee' },
                                                    { label: 'Mentioned Users (@)', value: 'mentions' },
                                                    { label: 'Project Client', value: 'client' },
                                                    { label: 'Custom Email / External', value: 'custom' }
                                                ]}
                                                className="w-full"
                                            />
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
                                    <CustomSelect
                                        value={actionConfig.useTemplate}
                                        onChange={(val) => setActionConfig({ ...actionConfig, useTemplate: val })}
                                        options={[
                                            { label: 'Custom Message', value: 'none' },
                                            { label: 'Standard Mention Template', value: 'mention' },
                                            { label: 'Task Assignment Template', value: 'assigned' },
                                            { label: 'New Task Template', value: 'created' },
                                            { label: 'Status Update Template', value: 'status' }
                                        ]}
                                        className="w-full"
                                    />
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
                            {isEditing ? 'Update Rule' : 'Create Rule'}
                        </button>
                    </div>

                    {showGuide && (
                        <WebhookGuideModal
                            type={actionType === 'SLACK_NOTIFICATION' ? 'slack' : 'teams'}
                            onClose={() => setShowGuide(false)}
                        />
                    )}
                </div>
            </div>
        </Portal>
    );
}

import { Info } from 'lucide-react';
import WebhookGuideModal from './WebhookGuideModal';
