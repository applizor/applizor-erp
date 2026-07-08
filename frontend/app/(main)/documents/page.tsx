'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Edit, Trash2, FileText, Search, Settings, Copy, Info, X, LayoutTemplate, PenTool, Eye, Check, Download, Send, Scale } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { CustomSelect } from '@/components/ui/CustomSelect';

// Variable Groups for Templates
const VARIABLE_GROUPS = {
    'Employee Details': [
        'EMPLOYEE_NAME', 
        'EMPLOYEE_CODE', 
        'EMPLOYEE_EMAIL', 
        'EMPLOYEE_PHONE', 
        'DESIGNATION', 
        'DEPARTMENT', 
        'JOINING_DATE', 
        'EXIT_DATE', 
        'DATE_OF_BIRTH', 
        'GENDER', 
        'BLOOD_GROUP', 
        'MARITAL_STATUS', 
        'CURRENT_ADDRESS', 
        'PERMANENT_ADDRESS', 
        'EMPLOYEE_STATUS', 
        'WORK_LOCATION', 
        'EMPLOYMENT_TYPE'
    ],
    'Financials': ['SALARY', 'BASIC_SALARY', 'HRA', 'ALLOWANCES', 'CTC_ANNUAL'],
    'Company Info': [
        'COMPANY_NAME', 
        'COMPANY_ADDRESS', 
        'COMPANY_PHONE', 
        'COMPANY_LOGO',
        'DATE', 
        'HR_MANAGER',
        'AUTHORIZED_SIGNATORY_SIGNATURE'
    ],
    'Client Details': [
        'CLIENT_NAME',
        'CLIENT_EMAIL',
        'CLIENT_PHONE',
        'CLIENT_ADDRESS',
        'CLIENT_CITY',
        'CLIENT_STATE',
        'CLIENT_GSTIN',
        'CLIENT_PAN',
        'CLIENT_WEBSITE'
    ]
};

import { useConfirm } from '@/context/ConfirmationContext';

export default function DocumentsPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState<'instant' | 'templates'>('instant');

    // --- DIRECTORY & COMPANY STATE ---
    const [employees, setEmployees] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [company, setCompany] = useState<any>(null);

    // --- TEMPLATE STATE ---
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [editorRevision, setEditorRevision] = useState(0); // Key to reset editor only on open
    const [templateForm, setTemplateForm] = useState({ 
        id: '', 
        name: '', 
        type: 'General', 
        variables: [] as string[],
        pdfMarginTop: 180,
        pdfMarginBottom: 80,
        pdfMarginLeft: 40,
        pdfMarginRight: 40,
        pdfContinuationTop: 80
    });

    // --- INSTANT WRITE STATE ---
    const [generating, setGenerating] = useState(false);
    const [useLetterhead, setUseLetterhead] = useState(true);
    const [instantContent, setInstantContent] = useState('');
    const [documentTitle, setDocumentTitle] = useState('');

    // --- GENERATION WIZARD STATE ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardTemplate, setWizardTemplate] = useState<any>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [wizardUseLetterhead, setWizardUseLetterhead] = useState(true);
    const [previewHtml, setPreviewHtml] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [forging, setForging] = useState(false);

    const loadDirectory = async () => {
        try {
            const empRes = await api.get('/employees');
            if (Array.isArray(empRes.data)) {
                setEmployees(empRes.data);
            } else if (empRes.data?.data && Array.isArray(empRes.data.data)) {
                setEmployees(empRes.data.data);
            } else {
                console.warn('Unexpected employees response format:', empRes.data);
                setEmployees([]);
            }
        } catch (error: any) {
            console.error('Failed to load employees:', error);
            toast.error(error?.response?.data?.error || 'Failed to load employees');
        }

        try {
            const clientRes = await api.get('/clients');
            setClients(clientRes.data || []);
        } catch (error) {
            console.error('Failed to load clients:', error);
        }

        try {
            const companyRes = await api.get('/company');
            setCompany(companyRes.data || null);
        } catch (error) {
            console.error('Failed to load company details:', error);
        }
    };

    useEffect(() => {
        loadDirectory();
    }, []);

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

    const handleDeleteTemplate = async (id: string) => {
        if (!await confirm({ message: 'Delete this template?', type: 'danger' })) return;
        try {
            await api.delete(`/document-templates/${id}`);
            toast.success('Template deleted');
            loadTemplates();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openCreateTemplate = () => {
        setTemplateForm({ 
            id: '', 
            name: '', 
            type: 'General', 
            variables: [],
            pdfMarginTop: 180,
            pdfMarginBottom: 80,
            pdfMarginLeft: 40,
            pdfMarginRight: 40,
            pdfContinuationTop: 80
        });
        setEditorContent('<p>Start designing...</p>');
        setEditorRevision(prev => prev + 1);
        setIsTemplateModalOpen(true);
    };

    const openEditTemplate = (t: any) => {
        setTemplateForm({ 
            id: t.id, 
            name: t.name, 
            type: t.type, 
            variables: t.variables || [],
            pdfMarginTop: t.pdfMarginTop !== null && t.pdfMarginTop !== undefined ? t.pdfMarginTop : 180,
            pdfMarginBottom: t.pdfMarginBottom !== null && t.pdfMarginBottom !== undefined ? t.pdfMarginBottom : 80,
            pdfMarginLeft: t.pdfMarginLeft !== null && t.pdfMarginLeft !== undefined ? t.pdfMarginLeft : 40,
            pdfMarginRight: t.pdfMarginRight !== null && t.pdfMarginRight !== undefined ? t.pdfMarginRight : 40,
            pdfContinuationTop: t.pdfContinuationTop !== null && t.pdfContinuationTop !== undefined ? t.pdfContinuationTop : 80
        });
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
                recipientName: documentTitle || 'Document',
                designation: '',
                subject: documentTitle || 'Document',
                date: new Date().toISOString().split('T')[0],
                content: instantContent,
                useLetterhead
            };
            const response = await api.post('/documents/generate-instant', payload, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${(documentTitle || 'Document').replace(/\s+/g, '_')}_Letter.pdf`);
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

    // --- GENERATION WIZARD ACTIONS ---
    const extractVariables = (html: string) => {
        const matches = html.match(/\[([A-Z_]+)\]/g);
        return matches ? Array.from(new Set(matches.map(m => m.replace(/[\[\]]/g, '')))) : [];
    };

    const needsEmployee = useMemo(() => {
        if (!wizardTemplate) return false;
        const vars = extractVariables(wizardTemplate.content || '');
        return vars.some(v => 
            v.startsWith('EMPLOYEE_') || 
            ['DESIGNATION', 'DEPARTMENT', 'JOINING_DATE', 'EXIT_DATE', 'SALARY', 'CTC_ANNUAL', 'BASIC_SALARY', 'HRA', 'ALLOWANCES', 'DATE_OF_BIRTH', 'GENDER', 'BLOOD_GROUP', 'MARITAL_STATUS', 'CURRENT_ADDRESS', 'PERMANENT_ADDRESS', 'EMPLOYEE_STATUS', 'WORK_LOCATION', 'EMPLOYMENT_TYPE'].includes(v)
        );
    }, [wizardTemplate]);

    const needsClient = useMemo(() => {
        if (!wizardTemplate) return false;
        const vars = extractVariables(wizardTemplate.content || '');
        return vars.some(v => 
            v.startsWith('CLIENT_') || 
            ['CLIENT_NAME', 'CLIENT_EMAIL', 'CLIENT_PHONE', 'CLIENT_ADDRESS', 'CLIENT_COMPANY', 'CLIENT_GSTIN', 'CLIENT_PAN', 'CLIENT_WEBSITE'].includes(v)
        );
    }, [wizardTemplate]);

    const loadPreview = async () => {
        if (!wizardTemplate) return;
        
        // Wait until required values are selected
        if (needsEmployee && !selectedEmployeeId) {
            setPreviewHtml('<p class="text-slate-400 font-medium text-xs text-center py-20 uppercase tracking-wider">Select an employee from the dropdown to load preview.</p>');
            return;
        }
        if (needsClient && !selectedClientId) {
            setPreviewHtml('<p class="text-slate-400 font-medium text-xs text-center py-20 uppercase tracking-wider">Select a client from the dropdown to load preview.</p>');
            return;
        }

        try {
            setLoadingPreview(true);
            const res = await api.post('/documents/preview', {
                templateId: wizardTemplate.id,
                employeeId: selectedEmployeeId || undefined,
                clientId: selectedClientId || undefined,
                useLetterhead: wizardUseLetterhead
            });
            setPreviewHtml(res.data?.html || '<p class="text-slate-400 font-medium text-xs text-center py-20">Empty document preview.</p>');
        } catch (error) {
            console.error('Failed to load preview:', error);
            setPreviewHtml('<p class="text-rose-500 font-bold p-4 text-center">Failed to render template preview</p>');
        } finally {
            setLoadingPreview(false);
        }
    };

    useEffect(() => {
        if (isWizardOpen) {
            loadPreview();
        }
    }, [isWizardOpen, wizardTemplate, selectedEmployeeId, selectedClientId, wizardUseLetterhead]);

    const openGenerateWizard = (t: any) => {
        setWizardTemplate(t);
        setSelectedEmployeeId('');
        setSelectedClientId('');
        setWizardUseLetterhead(true);
        setPreviewHtml('');
        setIsWizardOpen(true);
    };

    const handleDownloadPdf = async () => {
        if (!wizardTemplate) return;
        try {
            setForging(true);
            const response = await api.post('/documents/generate-from-template', {
                templateId: wizardTemplate.id,
                employeeId: selectedEmployeeId || undefined,
                clientId: selectedClientId || undefined,
                useLetterhead: wizardUseLetterhead
            }, { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${wizardTemplate.name.replace(/\s+/g, '_')}_Forged.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Document downloaded successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to download PDF');
        } finally {
            setForging(false);
        }
    };

    const handleSaveAndIssue = async () => {
        if (!wizardTemplate) return;
        try {
            setForging(true);
            await api.post('/documents', {
                templateId: wizardTemplate.id,
                employeeId: selectedEmployeeId || undefined,
                clientId: selectedClientId || undefined,
                useLetterhead: wizardUseLetterhead,
                saveAsDraft: false
            });
            toast.success('Document forged and saved to profile files');
            setIsWizardOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save document');
        } finally {
            setForging(false);
        }
    };

    // --- UTILS ---
    const editorRef = useRef<any>(null);

    const insertVariable = (variable: string) => {
        if (editorRef.current) {
            editorRef.current.insertContent(`[${variable}]`);
        } else {
            console.warn('Lexical instance not ready');
        }
    };

    // Computed letterhead variables for live preview
    const showLetterheadBackground = wizardUseLetterhead && company?.letterhead && !company.letterhead.toLowerCase().endsWith('.pdf');

    const previewTopPadding = useMemo(() => {
        if (!wizardUseLetterhead) return 40;
        return wizardTemplate?.pdfMarginTop !== null && wizardTemplate?.pdfMarginTop !== undefined
            ? Number(wizardTemplate.pdfMarginTop)
            : (company?.pdfMarginTop || 180);
    }, [wizardUseLetterhead, wizardTemplate, company]);

    const previewBottomPadding = useMemo(() => {
        if (!wizardUseLetterhead) return 40;
        return wizardTemplate?.pdfMarginBottom !== null && wizardTemplate?.pdfMarginBottom !== undefined
            ? Number(wizardTemplate.pdfMarginBottom)
            : (company?.pdfMarginBottom || 80);
    }, [wizardUseLetterhead, wizardTemplate, company]);

    const previewLeftPadding = useMemo(() => {
        if (!wizardUseLetterhead) return 40;
        return wizardTemplate?.pdfMarginLeft !== null && wizardTemplate?.pdfMarginLeft !== undefined
            ? Number(wizardTemplate.pdfMarginLeft)
            : (company?.pdfMarginLeft || 40);
    }, [wizardUseLetterhead, wizardTemplate, company]);

    const previewRightPadding = useMemo(() => {
        if (!wizardUseLetterhead) return 40;
        return wizardTemplate?.pdfMarginRight !== null && wizardTemplate?.pdfMarginRight !== undefined
            ? Number(wizardTemplate.pdfMarginRight)
            : (company?.pdfMarginRight || 40);
    }, [wizardUseLetterhead, wizardTemplate, company]);

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
                        <div className="ent-form-group">
                            <Label>Document Title *</Label>
                            <Input
                                value={documentTitle}
                                onChange={e => setDocumentTitle(e.target.value)}
                                required
                                placeholder="e.g. Appointment Letter, Non-Disclosure Agreement, Company Policy, etc."
                            />
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
                                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between gap-1 relative z-10">
                                            <button
                                                onClick={() => openGenerateWizard(t)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-primary-800 transition-all shadow-sm active:scale-95"
                                            >
                                                <PenTool size={11} /> Generate
                                            </button>
                                            <div className="flex gap-0.5">
                                                <button onClick={() => openEditTemplate(t)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded transition-colors"><Edit size={13} /></button>
                                                <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={13} /></button>
                                            </div>
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

                            {/* Layout Settings (A4) */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Scale size={14} className="text-primary-600" /> Layout & Margins
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">First Page Top (px)</Label>
                                        <Input
                                            type="number"
                                            value={templateForm.pdfMarginTop}
                                            onChange={e => setTemplateForm({ ...templateForm, pdfMarginTop: parseInt(e.target.value) || 0 })}
                                            required
                                            className="font-medium text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Continuation Top (px)</Label>
                                        <Input
                                            type="number"
                                            value={templateForm.pdfContinuationTop}
                                            onChange={e => setTemplateForm({ ...templateForm, pdfContinuationTop: parseInt(e.target.value) || 0 })}
                                            required
                                            className="font-medium text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Bottom Margin (px)</Label>
                                        <Input
                                            type="number"
                                            value={templateForm.pdfMarginBottom}
                                            onChange={e => setTemplateForm({ ...templateForm, pdfMarginBottom: parseInt(e.target.value) || 0 })}
                                            required
                                            className="font-medium text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Left Margin (px)</Label>
                                        <Input
                                            type="number"
                                            value={templateForm.pdfMarginLeft}
                                            onChange={e => setTemplateForm({ ...templateForm, pdfMarginLeft: parseInt(e.target.value) || 0 })}
                                            required
                                            className="font-medium text-xs"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Right Margin (px)</Label>
                                        <Input
                                            type="number"
                                            value={templateForm.pdfMarginRight}
                                            onChange={e => setTemplateForm({ ...templateForm, pdfMarginRight: parseInt(e.target.value) || 0 })}
                                            required
                                            className="font-medium text-xs"
                                        />
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


            {/* DOCUMENT FORGE WIZARD DRAWER */}
            <Drawer isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} title="Document Forge Wizard">
                <div className="h-full flex flex-col bg-slate-50">
                    <div className="flex-1 flex overflow-hidden">
                        
                        {/* Control Panel Sidebar */}
                        <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-6 space-y-6">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Template</h3>
                                <p className="text-sm font-black text-slate-900 mt-1 uppercase truncate">{wizardTemplate?.name}</p>
                                <span className="inline-block text-[8px] font-black uppercase bg-primary-50 text-primary-700 px-2 py-0.5 rounded border border-primary-100 mt-1.5">{wizardTemplate?.type}</span>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                                    <PenTool size={12} className="text-primary-600" /> Recipient Context
                                </h4>

                                {needsEmployee && (
                                    <div className="ent-form-group">
                                        <Label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Target Employee *</Label>
                                        <CustomSelect
                                            options={[
                                                { label: 'Select Employee', value: '' },
                                                ...employees.map(e => ({ label: `${e.firstName} ${e.lastName || ''} (${e.email || 'No email'})`, value: e.id }))
                                            ]}
                                            value={selectedEmployeeId}
                                            onChange={setSelectedEmployeeId}
                                            className="w-full text-xs font-bold"
                                        />
                                    </div>
                                )}

                                {needsClient && (
                                    <div className="ent-form-group">
                                        <Label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Target Client *</Label>
                                        <CustomSelect
                                            options={[
                                                { label: 'Select Client', value: '' },
                                                ...clients.map(c => ({ label: `${c.name} (${c.email || 'No email'})`, value: c.id }))
                                            ]}
                                            value={selectedClientId}
                                            onChange={setSelectedClientId}
                                            className="w-full text-xs font-bold"
                                        />
                                    </div>
                                )}

                                {!needsEmployee && !needsClient && (
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/50">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                                            This template contains no recipient variables. It can be forged directly without employee or client context.
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200/40 rounded-lg">
                                    <Label htmlFor="wiz-lh" className="text-[9px] font-black uppercase text-slate-600 cursor-pointer select-none">Overlay Letterhead</Label>
                                    <input
                                        id="wiz-lh"
                                        type="checkbox"
                                        checked={wizardUseLetterhead}
                                        onChange={e => setWizardUseLetterhead(e.target.checked)}
                                        className="toggle toggle-primary toggle-sm"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Template Variables</h4>
                                <div className="flex flex-wrap gap-1">
                                    {wizardTemplate && extractVariables(wizardTemplate.content || '').map(v => (
                                        <span key={v} className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Live Sandbox Preview Area */}
                        <div className="flex-1 flex flex-col bg-slate-200 p-6 overflow-y-auto">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-3">Live Document Preview (A4 Sheet Simulation)</span>
                            
                            <div className="flex-1 flex items-start justify-center min-h-[900px] w-full">
                                {loadingPreview ? (
                                    <div className="w-full h-96 flex items-center justify-center bg-white rounded-xl shadow border border-slate-200">
                                        <div className="text-center">
                                            <LoadingSpinner size="lg" className="mx-auto mb-2 text-primary-900" />
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Populating Context Variables...</p>
                                        </div>
                                    </div>
                                ) : !previewHtml ? (
                                    <div className="w-full h-96 flex items-center justify-center bg-white rounded-xl shadow border border-slate-200">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Please select recipient context to load preview</p>
                                    </div>
                                ) : (
                                    <div 
                                        className="a4-preview-sheet select-none bg-white shadow-lg border border-slate-300 rounded max-w-[800px] w-full min-h-[1100px] relative"
                                        style={{
                                            backgroundImage: showLetterheadBackground ? `url('${company.letterhead}')` : 'none',
                                            backgroundSize: '100% 100%',
                                            backgroundRepeat: 'no-repeat',
                                            paddingTop: `${previewTopPadding}px`,
                                            paddingBottom: `${previewBottomPadding}px`,
                                            paddingLeft: `${previewLeftPadding}px`,
                                            paddingRight: `${previewRightPadding}px`
                                        }}
                                    >
                                        <div className="prose prose-sm max-w-none text-slate-900" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="flex-shrink-0 px-8 py-4 bg-white border-t border-slate-200 flex justify-end gap-3 z-10 shadow-sm">
                        <Button type="button" variant="outline" onClick={() => setIsWizardOpen(false)} className="px-6 text-[10px] font-black uppercase tracking-wider">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={forging || (needsEmployee && !selectedEmployeeId) || (needsClient && !selectedClientId)}
                            className="bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest px-6 inline-flex items-center gap-1.5"
                        >
                            {forging ? <LoadingSpinner size="sm" /> : <><Download size={13} /> Download PDF</>}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveAndIssue}
                            disabled={forging || (needsEmployee && !selectedEmployeeId) || (needsClient && !selectedClientId)}
                            className="btn-primary text-[10px] font-black uppercase tracking-widest px-8 inline-flex items-center gap-1.5"
                        >
                            {forging ? <LoadingSpinner size="sm" /> : <><Check size={13} /> Save & Issue</>}
                        </Button>
                    </div>
                </div>
            </Drawer>

        </div>
    );
}
