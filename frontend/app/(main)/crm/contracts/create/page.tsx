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

export default function CreateContractPage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
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

    // Initial content with correct variables
    const initialContent = `
        <h2 style="text-align: center;">AGREEMENT</h2>
        <p>This agreement is made on <strong>[CURRENT_DATE]</strong> between:</p>
        <p><strong>[MY_COMPANY_NAME]</strong> (Service Provider)</p>
        <p>AND</p>
        <p><strong>[CLIENT_NAME]</strong> (Client)</p>
        <h3>1. Services</h3>
        <p>The Service Provider agrees to provide the following services...</p>
        <h3>2. Payment Terms</h3>
        <p>The Client agrees to pay...</p>
    `;
    const [content, setContent] = useState(initialContent);

    // Set initial base content
    useEffect(() => {
        setBaseContent(initialContent);
    }, []);

    // Variables Helper List
    const availableVariables = [
        { label: 'Client Name', var: '[CLIENT_NAME]' },
        { label: 'Client Company', var: '[CLIENT_COMPANY]' },
        { label: 'Client Address', var: '[CLIENT_ADDRESS]' },
        { label: 'Client City', var: '[CLIENT_CITY]' },
        { label: 'My Company', var: '[MY_COMPANY_NAME]' },
        { label: 'Company Signature', var: '[COMPANY_SIGNATURE]' }, // Added
        { label: 'Current Date', var: '[CURRENT_DATE]' },
    ];

    const [companyData, setCompanyData] = useState<any>(null);

    useEffect(() => {
        fetchClients();
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const res = await api.get('/company');
            setCompanyData(res.data.company);
        } catch (error) {
            console.error('Failed to fetch company details');
        }
    };

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients?limit=100');
            setClients(res.data.clients || []);
        } catch (error) {
            console.error(error);
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

    // Helper to get base URL (without /api)
    const getBaseUrl = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        return apiUrl.replace(/\/api$/, '');
    };

    // Logic to replace variables with client data
    const processVariables = (text: string, clientData?: any) => {
        let processed = text;
        const now = new Date().toLocaleDateString();

        // System Variables
        processed = processed.replace(/\[CURRENT_DATE\]/g, now);
        processed = processed.replace(/\[MY_COMPANY_NAME\]/g, companyData?.name || 'Applizor Softech');

        // Company Signature Variable
        if (companyData?.digitalSignature) {
            const signatureUrl = `${getBaseUrl()}${companyData.digitalSignature}`;
            const signatureHtml = `<img src="${signatureUrl}" style="max-height: 60px; vertical-align: middle;" alt="Company Signature" />`;
            processed = processed.replace(/\[COMPANY_SIGNATURE\]/g, signatureHtml);
        } else {
            processed = processed.replace(/\[COMPANY_SIGNATURE\]/g, '<strong>[PENDING SIGNATURE]</strong>');
        }

        // Client Variables
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

        if (selectedClient) {
            // ALWAYS use baseContent (with placeholders) as the source
            // This ensures we can switch clients and re-apply variables correctly
            const sourceContent = baseContent || content;

            // Check if source actually has placeholders, otherwise updates might be useless
            // But if we have baseContent, it SHOULD have placeholders.
            if (sourceContent.includes('[')) {
                const newContent = processVariables(sourceContent, selectedClient);
                setContent(newContent);
                toast.success('Updated with ' + selectedClient.name + '\'s details');
            }
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
        // 1. Store the raw template as baseContent
        setBaseContent(template.content);

        let newContent = template.content;
        const selectedClient = clients.find(c => c.id === clientId);

        // 2. Apply variables immediately if client is selected
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

        // Use baseContent if available to ensure we have placeholders, otherwise fallback to current content
        const source = baseContent.includes('[CLIENT') ? baseContent : content;

        const filled = processVariables(source, selectedClient);
        setContent(filled);
        toast.success('Variables processed');
    };

    const handleSaveAndSend = async () => {
        setLoading(true);
        try {
            // 1. Create/Save Contract
            const res = await api.post('/contracts', {
                title,
                clientId,
                content,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null
            });
            const contractId = res.data.id;

            // 2. Send Notification
            // Note: Ensure POST /contracts/:id/send route exists on backend
            await api.post(`/contracts/${contractId}/send`);

            toast.success('Contract saved & sent to client!');
            router.push('/crm/contracts');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send contract');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/contracts', {
                title,
                clientId,
                content,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null
            });
            toast.success('Contract saved as draft');
            router.push('/crm/contracts');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create contract');
        } finally {
            setLoading(false);
        }
    };

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
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
                                    <Link href="/crm/contracts/templates/create" className="text-primary-600 text-xs font-black uppercase tracking-widest mt-2 inline-block hover:underline">Create your first template</Link>
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
                title="Draft New Contract"
                subtitle="Create a legally binding agreement"
                icon={FileText}
                actions={
                    <div className="flex gap-3">
                        <Link
                            href="/crm/contracts"
                            className="ent-button-secondary gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Cancel
                        </Link>
                        <button
                            onClick={handleSaveAndSend}
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-md shadow-lg shadow-emerald-900/10 flex items-center gap-2 transition-all"
                        >
                            <Send size={14} />
                            {loading ? 'Processing...' : 'Save & Send'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="ent-button-primary gap-2 shadow-xl shadow-primary-900/10"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Draft'}
                        </button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Editor Area */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="ent-card p-6 shadow-sm">
                        <div className="mb-6 ent-form-group">
                            <label className="ent-label text-[10px] mb-2">Contract Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="ent-input text-lg py-2.5 px-4 font-bold border-slate-200 focus:border-primary-500 focus:ring-primary-500/20"
                                placeholder="E.G. SOFTWARE DEVELOPMENT AGREEMENT"
                            />
                        </div>

                        <div className="relative">
                            <div className="flex justify-between items-center mb-4">
                                <label className="ent-label text-[10px]">Agreement Content</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={manualVariableFill}
                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-white border border-emerald-100 flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest transition-all px-2.5 py-1.5 rounded shadow-sm"
                                        title="Replace variables with selected client data"
                                    >
                                        <Check size={10} strokeWidth={3} /> Auto-Fill Data
                                    </button>
                                    <button
                                        type="button"
                                        onClick={fetchTemplates}
                                        className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 bg-white border border-primary-100 flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest transition-all px-2.5 py-1.5 rounded shadow-sm"
                                    >
                                        <LayoutTemplate size={10} strokeWidth={3} /> Load Template
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                            <PagedRichTextEditor
                                value={content}
                                onChange={setContent}
                                className="min-h-[800px] border-0"
                                showLetterhead={showLetterhead}
                                pageOneBg="/images/letterhead-page1.png"
                                continuationBg="/images/letterhead-continuation.png"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Contract Configuration */}
                    <div className="ent-card p-6 space-y-6 border-t-4 border-t-primary-600">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <div className="p-1.5 bg-primary-50 rounded text-primary-600">
                                <User size={16} />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Contract & Client</h3>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Select Client</label>
                            <div className="relative">
                                <select
                                    required
                                    value={clientId}
                                    onChange={(e) => handleClientChange(e.target.value)}
                                    className="ent-input py-2.5 pl-3 pr-10"
                                >
                                    <option value="">-- SELECT CLIENT --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.company?.name || 'IND.'})</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                                Selecting a client will automatically fill variables in the contract template.
                            </p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="ent-form-group">
                                <label className="ent-label">Valid From</label>
                                <input
                                    type="date"
                                    value={validFrom}
                                    onChange={(e) => setValidFrom(e.target.value)}
                                    className="ent-input"
                                />
                            </div>

                            <div className="ent-form-group">
                                <label className="ent-label">Valid Until</label>
                                <input
                                    type="date"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    className="ent-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Variables Helper */}
                    <div className="ent-card p-0 overflow-hidden border-slate-200 bg-slate-50">
                        <div className="p-4 border-b border-slate-200 bg-white">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                                <Copy size={12} className="text-slate-400" />
                                Available Variables
                            </h3>
                        </div>
                        <div className="p-2 space-y-1 bg-slate-50/50 max-h-80 overflow-y-auto">
                            {availableVariables.map((v) => (
                                <button type="button" key={v.var} className="w-full flex justify-between items-center group cursor-pointer hover:bg-white p-2 rounded border border-transparent hover:border-slate-200 hover:shadow-sm transition-all"
                                    onClick={() => {
                                        navigator.clipboard.writeText(v.var);
                                        toast.success('Copied ' + v.var);
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-slate-500">{v.label}</span>
                                    <code className="text-[9px] font-mono bg-white border border-slate-200 text-primary-600 px-1.5 py-0.5 rounded shadow-sm">{v.var}</code>
                                </button>
                            ))}
                        </div>
                        <div className="p-3 bg-slate-100 border-t border-slate-200">
                            <p className="text-[9px] text-slate-400 text-center font-medium">
                                Click to copy. Variables are auto-filled when you select a client.
                            </p>
                        </div>
                    </div>
                </div>
            </form >
        </div >
    );
}
