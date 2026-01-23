'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ArrowLeft, User, Calendar, FileText, LayoutTemplate, X, Check, Copy, Send } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import PagedRichTextEditor from '@/components/ui/PagedRichTextEditor';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function EditContractPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    // Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Template State
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Letterhead State
    const [showLetterhead, setShowLetterhead] = useState(false);

    // Store original template with placeholders to allow re-processing when client changes
    const [baseContent, setBaseContent] = useState('');

    // Form State
    const [title, setTitle] = useState('');
    const [clientId, setClientId] = useState('');
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [content, setContent] = useState('');

    const [companyData, setCompanyData] = useState<any>(null);

    // Variables Helper List removed (redundant)

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [companyRes, clientsRes, contractRes] = await Promise.all([
                api.get('/company'),
                api.get('/clients?limit=100'),
                api.get(`/contracts/${params.id}`)
            ]);

            setCompanyData(companyRes.data.company);
            setClients(clientsRes.data.clients || []);

            const c = contractRes.data;
            setTitle(c.title);
            setContent(c.content);
            setClientId(c.clientId);
            if (c.validFrom) setValidFrom(new Date(c.validFrom).toISOString().split('T')[0]);
            if (c.validUntil) setValidUntil(new Date(c.validUntil).toISOString().split('T')[0]);

            // For editing, we don't have the "baseContent" with placeholders
            // but we can initialize it to the current content.
            setBaseContent(c.content);

        } catch (error) {
            toast.error('Failed to load contract data');
            router.push('/crm/contracts');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const res = await api.get('/contract-templates');
            setTemplates(res.data);
            setShowTemplateModal(true);
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const getBaseUrl = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        return apiUrl.replace(/\/api$/, '');
    };

    const processVariables = (text: string, clientData?: any) => {
        let processed = text;
        const now = new Date().toLocaleDateString();

        processed = processed.replace(/\[CURRENT_DATE\]/g, now);
        processed = processed.replace(/\[MY_COMPANY_NAME\]/g, companyData?.name || 'Applizor Softech');

        if (companyData?.digitalSignature) {
            const signatureUrl = `${getBaseUrl()}${companyData.digitalSignature}`;
            const signatureHtml = `<img src="${signatureUrl}" style="max-height: 60px; vertical-align: middle;" alt="Company Signature" />`;
            processed = processed.replace(/\[COMPANY_SIGNATURE\]/g, signatureHtml);
        } else {
            processed = processed.replace(/\[COMPANY_SIGNATURE\]/g, '<strong>[PENDING SIGNATURE]</strong>');
        }

        if (clientData) {
            const replacements: Record<string, string> = {
                '\\[CLIENT_NAME\\]': clientData.name || '',
                '\\[CLIENT_COMPANY\\]': clientData.company?.name || clientData.name || '',
                '\\[CLIENT_ADDRESS\\]': clientData.address || '',
                '\\[CLIENT_CITY\\]': clientData.city || 'City',
            };

            Object.entries(replacements).forEach(([key, value]) => {
                const regex = new RegExp(key, 'g');
                processed = processed.replace(regex, value);
            });
        }
        return processed;
    };

    const handleClientChange = (id: string) => {
        setClientId(id);
        const selectedClient = clients.find(c => c.id === id);

        if (selectedClient && baseContent.includes('[')) {
            const newContent = processVariables(baseContent, selectedClient);
            setContent(newContent);
            toast.success('Updated with ' + selectedClient.name + '\'s details');
        }
    };

    const confirmApplyTemplate = (template: any) => {
        if (content.length > 50) {
            setConfirmDialog({
                isOpen: true,
                title: 'Overwrite Content?',
                message: 'Applying this template will overwrite your current contract content. This action cannot be undone.',
                onConfirm: () => {
                    applyTemplate(template);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            });
        } else {
            applyTemplate(template);
        }
    };

    const applyTemplate = (template: any) => {
        setBaseContent(template.content);
        let newContent = template.content;
        const selectedClient = clients.find(c => c.id === clientId);

        if (selectedClient) {
            newContent = processVariables(newContent, selectedClient);
            toast.success('Template applied & variables filled!');
        } else {
            newContent = processVariables(newContent, undefined);
            toast.success('Template applied. Select a client to fill client variables.');
        }

        setContent(newContent);
        if (!title) setTitle(template.name);
        setShowTemplateModal(false);
    };

    const manualVariableFill = () => {
        const selectedClient = clients.find(c => c.id === clientId);
        if (!selectedClient) {
            toast.error('Please select a client first');
            return;
        }
        const source = baseContent.includes('[CLIENT') ? baseContent : content;
        const filled = processVariables(source, selectedClient);
        setContent(filled);
        toast.success('Variables processed');
    };

    const handleSaveAndSend = async () => {
        setSaving(true);
        try {
            await api.put(`/contracts/${params.id}`, {
                title,
                clientId,
                content,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null
            });
            await api.post(`/contracts/${params.id}/send`);
            toast.success('Contract updated & sent to client!');
            router.push(`/crm/contracts/${params.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send contract');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put(`/contracts/${params.id}`, {
                title,
                clientId,
                content,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null
            });
            toast.success('Contract updated successfully');
            router.push(`/crm/contracts/${params.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update contract');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in relative my-8 px-4 sm:px-6">

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Yes, Overwrite"
                type="warning"
            />

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Select Template</h3>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">CHOOSE A STARTING POINT FOR YOUR CONTRACT</p>
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                            {loadingTemplates ? (
                                <div className="flex justify-center py-12"><LoadingSpinner /></div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-3">
                                        <LayoutTemplate size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-bold">No templates found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map(t => (
                                        <div key={t.id}
                                            className="bg-white border border-slate-200 rounded-lg p-5 hover:border-primary-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between h-32"
                                            onClick={() => confirmApplyTemplate(t)}
                                        >
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition-colors">{t.name}</h4>
                                                <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">{t.description || 'No description provided.'}</p>
                                            </div>
                                            <div className="mt-auto pt-3 flex justify-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    Use Template <ArrowLeft size={10} className="rotate-180" />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <PageHeader
                title="Edit Contract"
                subtitle="Modify agreement details"
                icon={FileText}
                actions={
                    <div className="flex gap-3">
                        <Link
                            href={`/crm/contracts/${params.id}`}
                            className="ent-button-secondary gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Cancel
                        </Link>
                        <button
                            onClick={handleSaveAndSend}
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-md shadow-lg shadow-emerald-900/10 flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            <Send size={14} />
                            {saving ? 'Processing...' : 'Save & Send'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="ent-button-primary gap-2 shadow-xl shadow-primary-900/10 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Top Metadata Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* Title Section - Prominent */}
                        <div className="md:col-span-12 lg:col-span-5 space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Contract Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-lg font-bold text-slate-900 border-0 border-b-2 border-slate-200 focus:border-primary-500 focus:ring-0 px-0 py-2 bg-transparent transition-colors placeholder-slate-300"
                                placeholder="e.g. Software Development Agreement - Client Name"
                            />
                        </div>

                        {/* Client Selector */}
                        <div className="md:col-span-6 lg:col-span-3 space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Client</label>
                            <div className="relative">
                                <select
                                    required
                                    value={clientId}
                                    onChange={(e) => handleClientChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-medium"
                                >
                                    <option value="">-- Select Client --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.company?.name || 'Ind.'})</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                                    <User size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Dates Row */}
                        <div className="md:col-span-6 lg:col-span-4 flex gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Valid From</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Valid Until</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Toolbar */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <LayoutTemplate size={14} /> Document Editor
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={manualVariableFill}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-white border border-emerald-200 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest transition-all px-3 py-2 rounded-lg"
                                title="Fills variables if you changed the client after loading template"
                            >
                                <Check size={12} strokeWidth={3} /> Re-Sync Data
                            </button>
                            <button
                                type="button"
                                onClick={fetchTemplates}
                                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 bg-white border border-primary-200 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest transition-all px-3 py-2 rounded-lg"
                            >
                                <LayoutTemplate size={12} strokeWidth={3} /> Change Template
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Editor Area - Centered Document */}
                <div className="bg-slate-100/50 rounded-xl border border-dashed border-slate-200 p-0 overflow-hidden">
                    <div className="w-full shadow-2xl shadow-slate-200/50">
                        {/* Editor Container */}
                        <PagedRichTextEditor
                            value={content}
                            onChange={setContent}
                            className="min-h-[1000px] border-0"
                            showLetterhead={showLetterhead}
                            pageOneBg="/images/letterhead-page1.png"
                            continuationBg="/images/letterhead-continuation.png"
                        />
                    </div>
                </div>
            </form >
        </div >
    );
}
