'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Paperclip, AlertCircle, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import Portal from '@/components/ui/Portal';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface PortalCreateIssueModalProps {
    projectId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PortalCreateIssueModal({ projectId, onClose, onSuccess }: PortalCreateIssueModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAiPrompt, setShowAiPrompt] = useState(false);
    const toast = useToast();
    const { register, control, handleSubmit, formState: { errors }, setValue } = useForm();

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('projectId', projectId);
            formData.append('title', data.title);
            formData.append('description', data.description || '');
            formData.append('priority', data.priority);
            formData.append('type', data.type); // 'issue' or 'bug' or 'feat'

            files.forEach(file => {
                formData.append('files', file);
            });

            await api.post('/portal/tasks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Issue reported successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit issue');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-zoom-in">

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Report New Issue</h3>
                            <p className="text-xs text-slate-500 font-medium">Submit a bug report or feature request for this project.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <form id="issue-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                             {/* Title */}
                            <div className="ent-form-group">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="ent-label mb-0">Issue Title <span className="text-rose-500">*</span></label>
                                    <button
                                        type="button"
                                        onClick={() => setShowAiPrompt(!showAiPrompt)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all text-[10px] font-black uppercase tracking-widest shadow-sm ${showAiPrompt ? 'bg-primary-900 text-white' : 'text-primary-600 bg-primary-50 hover:bg-primary-100 hover:shadow'}`}
                                    >
                                        <Sparkles size={12} className={isGenerating ? 'animate-pulse' : ''} />
                                        {showAiPrompt ? 'Hide Assistant' : 'AI Write Assistant'}
                                    </button>
                                </div>

                                {showAiPrompt && (
                                    <div className="mb-6 p-5 bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-xl shadow-md animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 relative group">
                                                <input
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && aiPrompt.trim()) {
                                                            e.preventDefault();
                                                            setIsGenerating(true);
                                                            try {
                                                                const res = await api.post('/ai/generate-task', { prompt: aiPrompt });
                                                                setValue('title', res.data.title);
                                                                setValue('description', res.data.description);
                                                                setShowAiPrompt(false);
                                                                setAiPrompt('');
                                                                toast.success('Strategy Drafted by AI!');
                                                            } catch (err) {
                                                                toast.error('AI Generation encountered an error');
                                                            } finally {
                                                                setIsGenerating(false);
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Briefly describe what's happening... (e.g. 'Fix layout on iPhone')"
                                                    className="w-full bg-white border-primary-200 text-sm font-bold py-3 pl-4 pr-12 rounded-lg focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all shadow-sm placeholder:text-slate-300"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {isGenerating ? (
                                                        <Loader2 size={18} className="text-primary-600 animate-spin" />
                                                    ) : (
                                                        <Sparkles size={18} className="text-primary-400 group-hover:text-primary-600 transition-colors" />
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowAiPrompt(false)}
                                                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 px-2 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 pl-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                                            <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest">
                                                Gemini Engine Active • Press <span className="text-slate-900 border border-slate-200 px-1 rounded-sm bg-white">Enter</span> to proceed
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <input
                                    {...register('title', { required: 'Title is required' })}
                                    className="ent-input text-sm"
                                    placeholder="e.g., Login page not loading on mobile"
                                />
                                {errors.title && <span className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.title.message as string}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Type */}
                                <div className="ent-form-group">
                                    <label className="ent-label">Issue Type</label>
                                    <Controller
                                        name="type"
                                        control={control}
                                        defaultValue="issue"
                                        render={({ field }) => (
                                            <CustomSelect
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[
                                                    { label: 'General Issue', value: 'issue' },
                                                    { label: 'Bug Report', value: 'bug' },
                                                    { label: 'Feature Request', value: 'feature' }
                                                ]}
                                                className="w-full"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Priority */}
                                <div className="ent-form-group">
                                    <label className="ent-label">Priority</label>
                                    <Controller
                                        name="priority"
                                        control={control}
                                        defaultValue="medium"
                                        render={({ field }) => (
                                            <CustomSelect
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[
                                                    { label: 'Medium', value: 'medium' },
                                                    { label: 'High', value: 'high' },
                                                    { label: 'Urgent', value: 'urgent' },
                                                    { label: 'Low', value: 'low' }
                                                ]}
                                                className="w-full"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="ent-form-group">
                                <label className="ent-label">Description</label>
                                <div className="rounded-md border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/10 focus-within:border-primary-500/50 transition-all">
                                    <Controller
                                        name="description"
                                        control={control}
                                        defaultValue=""
                                        render={({ field }) => (
                                            <RichTextEditor
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Provide detailed steps to reproduce, expected behavior, or specific requirements..."
                                                className="min-h-[150px] border-none"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Attachments */}
                            <div className="ent-form-group">
                                <label className="ent-label">Attachments</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group relative">
                                    <input
                                        type="file"
                                        multiple
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-slate-400 group-hover:text-primary-500">
                                            <Paperclip size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 group-hover:text-slate-900">
                                                {files.length > 0 ? `${files.length} files selected` : 'Drop details or screenshots here'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, PDF, DOCX (Max 10MB)</p>
                                        </div>
                                    </div>
                                </div>
                                {files.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {files.map((f, i) => (
                                            <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                                                {f.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                        <button
                            onClick={onClose}
                            className="ent-button-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="issue-form"
                            disabled={isLoading}
                            className="btn-primary"
                        >
                            {isLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                            Submit Issue
                        </button>
                    </div>

                </div>
            </div>
        </Portal>
    );
}
