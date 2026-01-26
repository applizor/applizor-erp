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

    // Additional Fields
    const [contractValue, setContractValue] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [contractType, setContractType] = useState('');
    const [projectId, setProjectId] = useState('');

    const [companyData, setCompanyData] = useState<any>(null);

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

    useEffect(() => {
        setBaseContent(initialContent);
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [companyRes, clientsRes] = await Promise.all([
                api.get('/company'),
                api.get('/clients?limit=100')
            ]);
            setCompanyData(companyRes.data.company);
            setClients(clientsRes.data.clients || []);
        } catch (error) {
            console.error('Failed to fetch initial data', error);
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
                '\\[CLIENT_COMPANY\\]': clientData.companyName || clientData.name || '',
                '\\[CLIENT_EMAIL\\]': clientData.email || '',
                '\\[CLIENT_PHONE\\]': clientData.phone || '',
                '\\[CLIENT_MOBILE\\]': clientData.mobile || '',
                '\\[CLIENT_WEBSITE\\]': clientData.website || '',
                '\\[CLIENT_TAX_NAME\\]': clientData.taxName || '',
                '\\[CLIENT_ADDRESS\\]': clientData.address || '',
                '\\[CLIENT_CITY\\]': clientData.city || '',
                '\\[CLIENT_STATE\\]': clientData.state || '',
                '\\[CLIENT_GSTIN\\]': clientData.gstin || '',
                '\\[CLIENT_PAN\\]': clientData.pan || '',
            };

            Object.entries(replacements).forEach(([key, value]) => {
                const regex = new RegExp(key, 'g');
                processed = processed.replace(regex, value);
            });
        }

        // Company Variables
        if (companyData) {
            const replacements: Record<string, string> = {
                '\\[COMPANY_NAME\\]': companyData.name || '',
                '\\[COMPANY_LEGAL_NAME\\]': companyData.legalName || companyData.name || '',
                '\\[COMPANY_EMAIL\\]': companyData.email || '',
                '\\[COMPANY_PHONE\\]': companyData.phone || '',
                '\\[COMPANY_ADDRESS\\]': companyData.address || '',
                '\\[COMPANY_GSTIN\\]': companyData.gstin || '',
                '\\[COMPANY_PAN\\]': companyData.pan || '',
            };

            Object.entries(replacements).forEach(([key, value]) => {
                const regex = new RegExp(key, 'g');
                processed = processed.replace(regex, value);
            });
        }

        // Contract / System Variables
        const contractReplacements: Record<string, string> = {
            '\\[CONTRACT_VALUE\\]': contractValue || '0',
            '\\[CURRENCY\\]': currency || 'INR',
            '\\[VALID_FROM\\]': validFrom || '',
            '\\[VALID_UNTIL\\]': validUntil || '',
            '\\[CURRENT_DATE\\]': new Date().toLocaleDateString(),
        };

        Object.entries(contractReplacements).forEach(([key, value]) => {
            const regex = new RegExp(key, 'g');
            processed = processed.replace(regex, value);
        });
        return processed;
    };

    const handleClientChange = (id: string) => {
        setClientId(id);
        const selectedClient = clients.find(c => c.id === id);

        if (selectedClient) {
            const sourceContent = baseContent || content;
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
            const res = await api.post('/contracts', {
                title,
                clientId,
                content,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null,
                contractValue: parseFloat(contractValue) || 0,
                currency,
                contractType,
                projectId
            });
            await api.post(`/contracts/${res.data.id}/send`);
            toast.success('Contract created & sent to client!');
            router.push('/crm/contracts');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send contract');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);

        try {
            await api.post('/contracts', {
                title,
                clientId,
                content,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null,
                contractValue: parseFloat(contractValue) || 0,
                currency,
                contractType,
                projectId
            });
            toast.success('Contract saved as draft');
            router.push('/crm/contracts');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create contract');
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
                title="Create Contract"
                subtitle="Draft a new agreement"
                icon={FileText}
                actions={
                    <div className="flex gap-3">
                        <Link href="/crm/contracts" className="ent-button-secondary gap-2">
                            <ArrowLeft className="w-3 h-3" />
                            Back
                        </Link>
                        <button
                            onClick={handleSaveAndSend}
                            disabled={saving}
                            className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-none px-4 py-2 text-[10px] shadow-lg shadow-emerald-900/10"
                        >
                            <Send size={14} className="mr-2" />
                            {saving ? 'Processing...' : 'Save & Send'}
                        </button>
                        <button
                            onClick={() => handleSubmit()}
                            disabled={saving}
                            className="btn-primary gap-2 shadow-xl shadow-primary-900/10"
                        >
                            <Save size={14} />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="ent-card p-5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        <div className="md:col-span-12 lg:col-span-5 ent-form-group">
                            <label className="ent-label">Contract Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="ent-input text-sm"
                                placeholder="e.g. Software Development Agreement"
                            />
                        </div>

                        <div className="md:col-span-6 lg:col-span-3 ent-form-group">
                            <label className="ent-label">Client</label>
                            <div className="relative">
                                <select
                                    required
                                    value={clientId}
                                    onChange={(e) => handleClientChange(e.target.value)}
                                    className="ent-input pr-10"
                                >
                                    <option value="">-- Select Client --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.company?.name || 'Ind.'})</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                    <User size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-6 lg:col-span-4 flex gap-4">
                            <div className="flex-1 ent-form-group">
                                <label className="ent-label">Valid From</label>
                                <input
                                    type="date"
                                    value={validFrom}
                                    onChange={(e) => setValidFrom(e.target.value)}
                                    className="ent-input"
                                />
                            </div>
                            <div className="flex-1 ent-form-group">
                                <label className="ent-label">Valid Until</label>
                                <input
                                    type="date"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    className="ent-input"
                                />
                            </div>
                        </div>

                        {/* Extra Fields */}
                        <div className="md:col-span-6 lg:col-span-3 ent-form-group">
                            <label className="ent-label">Contract Value</label>
                            <input
                                type="number"
                                value={contractValue}
                                onChange={(e) => setContractValue(e.target.value)}
                                className="ent-input"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="md:col-span-6 lg:col-span-2 ent-form-group">
                            <label className="ent-label">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="ent-input"
                            >
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                        <div className="md:col-span-6 lg:col-span-3 ent-form-group">
                            <label className="ent-label">Contract Type</label>
                            <input
                                type="text"
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value)}
                                className="ent-input"
                                placeholder="e.g. Service Agreement"
                            />
                        </div>
                        <div className="md:col-span-6 lg:col-span-4 ent-form-group">
                            <label className="ent-label">Internal Project Link</label>
                            <input
                                type="text"
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="ent-input font-mono text-[10px]"
                                placeholder="Paste Project ID (Optional)"
                            />
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                            <LayoutTemplate size={12} /> Document Editor
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={manualVariableFill}
                                className="btn-secondary gap-2 text-[9px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-3 py-1.5"
                            >
                                <Check size={12} strokeWidth={3} /> RE-SYNC DATA
                            </button>
                            <button
                                type="button"
                                onClick={fetchTemplates}
                                className="btn-secondary gap-2 text-[9px] px-3 py-1.5"
                            >
                                <LayoutTemplate size={12} strokeWidth={3} /> CHANGE TEMPLATE
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100/50 rounded-xl border border-dashed border-slate-200 p-0 overflow-hidden">
                    <div className="w-full shadow-2xl shadow-slate-200/50">
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
            </form>
        </div>
    );
}
