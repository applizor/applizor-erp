'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Edit, Trash2, FileText, Search, Settings, Copy, Info, X, LayoutTemplate, PenTool } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import RichTextEditor from '@/components/ui/RichTextEditor';

// Variable Groups for Templates
const VARIABLE_GROUPS = {
    'Employee Details': ['EMPLOYEE_NAME', 'EMPLOYEE_CODE', 'DESIGNATION', 'DEPARTMENT', 'JOINING_DATE', 'ADDRESS'],
    'Financials': ['SALARY', 'BASIC_SALARY', 'HRA', 'ALLOWANCES', 'CTC_ANNUAL'],
    'Company Info': ['COMPANY_NAME', 'COMPANY_ADDRESS', 'COMPANY_PHONE', 'DATE', 'HR_MANAGER']
};

import { useConfirm } from '@/context/ConfirmationContext';

export default function DocumentsPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState<'instant' | 'templates'>('instant');

    // --- TEMPLATE STATE ---
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [editorRevision, setEditorRevision] = useState(0); // Key to reset editor only on open
    const [templateForm, setTemplateForm] = useState({ id: '', name: '', type: 'General', variables: [] as string[] });

    // --- INSTANT WRITE STATE ---
    const [generating, setGenerating] = useState(false);
    const [useLetterhead, setUseLetterhead] = useState(true);
    const [instantContent, setInstantContent] = useState('');
    const [instantForm, setInstantForm] = useState({
        recipientName: '',
        designation: '',
        subject: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (activeTab === 'templates') {
            loadTemplates();
        }
    }, [activeTab]);

    // --- TEMPLATE ACTIONS ---
    const loadTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const res = await api.get('/document-templates');
            setTemplates(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSavingTemplate(true);
            const currentContent = editorRef.current?.getHTML() || editorContent;
            const payload = { ...templateForm, content: currentContent, variables: extractVariables(currentContent) };
            if (templateForm.id) {
                await api.put(`/document-templates/${templateForm.id}`, payload);
                toast.success('Template updated');
            } else {
                await api.post('/document-templates', payload);
                toast.success('Template created');
            }
            setIsTemplateModalOpen(false);
            loadTemplates();
        } catch (error) {
            toast.error('Failed to save template');
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Delete this template?', type: 'danger' })) return;
        try {
            await api.delete(`/documents/${id}`);
            toast.success('Template deleted');
            loadTemplates();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openCreateTemplate = () => {
        setTemplateForm({ id: '', name: '', type: 'General', variables: [] });
        setEditorContent('<p>Start designing...</p>');
        setEditorRevision(prev => prev + 1);
        setIsTemplateModalOpen(true);
    };

    const openEditTemplate = (t: any) => {
        setTemplateForm({ id: t.id, name: t.name, type: t.type, variables: t.variables || [] });
        setEditorContent(t.content || '');
        setEditorRevision(prev => prev + 1);
        setIsTemplateModalOpen(true);
    };

    // --- INSTANT WRITE ACTIONS ---
    const handleInstantGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const payload = {
                ...instantForm,
                content: instantContent,
                useLetterhead
            };
            const response = await api.post('/documents/generate-instant', payload, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${instantForm.recipientName}_Letter.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove(); // Clean up
            window.URL.revokeObjectURL(url); // Free memory
            toast.success('Document forged successfully');
        } catch (error) {
            console.error(error);
            toast.error('Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    // --- UTILS ---
    const editorRef = useRef<any>(null);

    const extractVariables = (html: string) => {
        const matches = html.match(/\[([A-Z_]+)\]/g);
        return matches ? Array.from(new Set(matches.map(m => m.replace(/[\[\]]/g, '')))) : [];
    };

    const insertVariable = (variable: string) => {
        if (editorRef.current) {
            editorRef.current.insertContent(`[${variable}]`);
        } else {
            console.warn('Lexical instance not ready');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in pb-20 space-y-6">

            {/* Page Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Document Hub</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Central command for automated and manual correspondence.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('instant')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'instant' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <PenTool size={14} className="inline mr-2 mb-0.5" /> Instant Write
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'templates' ? 'bg-white text-primary-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutTemplate size={14} className="inline mr-2 mb-0.5" /> Templates
                    </button>
                </div>
            </div>

            {/* --- INSTANT TAB --- */}
            {activeTab === 'instant' && (
                <div className="ent-card p-6 md:p-8 animate-fade-in">
                    <div className="bg-primary-50/50 border border-primary-100 rounded-md p-4 mb-8 flex items-start gap-4">
                        <div className="p-2 rounded-md bg-white border border-primary-100 shadow-sm">
                            <FileText size={20} className="text-primary-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-primary-900 uppercase tracking-widest mb-1">Manual Mode: Letterhead v2.4</h4>
                            <p className="text-[10px] font-bold text-primary-700 leading-relaxed">
                                Use this for one-off letters. Content is automatically formatted with recipient details header.
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-primary-100 shadow-sm">
                            <Label htmlFor="lh-toggle" className="text-[10px] font-black uppercase tracking-wider text-primary-900 cursor-pointer">Use Letterhead</Label>
                            <input
                                id="lh-toggle"
                                type="checkbox"
                                checked={useLetterhead}
                                onChange={(e) => setUseLetterhead(e.target.checked)}
                                className="toggle toggle-primary toggle-sm"
                            />
                        </div>
                    </div>

                    <form onSubmit={handleInstantGenerate} className="space-y-6 max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="ent-form-group">
                                <Label>Recipient Identity *</Label>
                                <Input value={instantForm.recipientName} onChange={e => setInstantForm({ ...instantForm, recipientName: e.target.value })} required placeholder="e.g. John Doe" />
                            </div>
                            <div className="ent-form-group">
                                <Label>Professional Designation *</Label>
                                <Input value={instantForm.designation} onChange={e => setInstantForm({ ...instantForm, designation: e.target.value })} required placeholder="e.g. Senior Manager" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="ent-form-group">
                                <Label>Issue Date *</Label>
                                <Input type="date" value={instantForm.date} onChange={e => setInstantForm({ ...instantForm, date: e.target.value })} required />
                            </div>
                            <div className="ent-form-group">
                                <Label>Subject *</Label>
                                <Input value={instantForm.subject} onChange={e => setInstantForm({ ...instantForm, subject: e.target.value })} required placeholder="e.g. Appointment Letter" />
                            </div>
                        </div>

                        <div className="ent-form-group">
                            <Label className="mb-2 block">Body Content *</Label>
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden min-h-[400px]">
                                <RichTextEditor
                                    value={instantContent}
                                    placeholder="Type your letter content here..."
                                    onChange={setInstantContent}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100 mt-8">
                            <Button type="submit" disabled={generating} className="btn-primary min-w-[200px] h-12 text-xs tracking-widest">
                                {generating ? <><LoadingSpinner size="sm" className="mr-2" /> FORGING DOCUMENT...</> : 'GENERATE PDF'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- TEMPLATES TAB --- */}
            {activeTab === 'templates' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-end">
                        <Button onClick={openCreateTemplate} className="btn-primary">
                            <Plus size={16} className="mr-2" /> New Template
                        </Button>
                    </div>

                    {loadingTemplates ? (
                        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                            <LayoutTemplate size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">No Templates Yet</h3>
                            <p className="text-slate-500 text-xs mt-2">Create your first template to automate workflows.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {templates.map(t => (
                                <div key={t.id} className="ent-card group hover:-translate-y-1 transition-all duration-300">
                                    <div className="p-6 h-full flex flex-col relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform" />
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="p-3 bg-white text-primary-700 rounded-lg border border-slate-100 shadow-sm group-hover:border-primary-200 transition-colors">
                                                <FileText size={24} strokeWidth={1.5} />
                                            </div>
                                            <span className={`ent-badge ${t.isActive ? 'ent-badge-success' : 'ent-badge-neutral'}`}>{t.type}</span>
                                        </div>
                                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2 truncate pr-4">{t.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{extractVariables(t.content || '').length} Variables</p>
                                        <div className="mt-auto pt-4 border-t border-slate-50 flex justify-end gap-1 relative z-10">
                                            <button onClick={() => openEditTemplate(t)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-md transition-colors"><Edit size={14} /></button>
                                            <button onClick={() => handleDeleteTemplate(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}


            {/* TEMPLATE EDITOR DRAWER (Replaces Dialog) */}
            <Drawer isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Template Studio Pro">
                <form onSubmit={handleSaveTemplate} className="h-full flex flex-col bg-slate-50">
                    <div className="flex-1 flex overflow-hidden">

                        {/* Sidebar */}
                        <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-6 space-y-8">
                            {/* Configuration Config */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Settings size={14} className="text-primary-600" /> Configuration
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Template Name</Label>
                                        <Input
                                            value={templateForm.name}
                                            onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                                            required
                                            className="font-medium text-sm"
                                            placeholder="Overview Report..."
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 block">Category</Label>
                                        <select
                                            className="ent-input w-full font-medium text-sm"
                                            value={templateForm.type}
                                            onChange={e => setTemplateForm({ ...templateForm, type: e.target.value })}
                                        >
                                            <option>General</option>
                                            <option>Offer Letter</option>
                                            <option>Contract</option>
                                            <option>Notice</option>
                                            <option>Certificate</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Variables Panel */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Copy size={14} className="text-primary-600" /> Variables
                                    </h4>
                                </div>
                                {Object.entries(VARIABLE_GROUPS).map(([group, vars]) => (
                                    <div key={group} className="space-y-2.5">
                                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{group}</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {vars.map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()} // CRITICAL: Stop blur
                                                    onClick={() => insertVariable(v)}
                                                    className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all active:scale-95"
                                                    title={`Insert [${v}]`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 p-6">
                            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <RichTextEditor
                                    ref={editorRef}
                                    value={editorContent}
                                    placeholder="Start designing your template..."
                                    onChange={setEditorContent}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex-shrink-0 px-8 py-4 bg-white border-t border-slate-200 flex justify-end gap-3 z-10">
                        <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(false)} className="px-6">Discard Changes</Button>
                        <Button type="submit" disabled={savingTemplate} className="btn-primary px-8 min-w-[160px]">
                            {savingTemplate ? <LoadingSpinner size="sm" /> : 'Save Configuration'}
                        </Button>
                    </div>
                </form>
            </Drawer>

        </div>
    );
}
