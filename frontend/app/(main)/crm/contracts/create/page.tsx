'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ArrowLeft, User, Calendar, FileText, LayoutTemplate, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Link from 'next/link';

export default function CreateContractPage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    // Template State
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [clientId, setClientId] = useState('');
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [content, setContent] = useState(`
        <h2>AGREEMENT</h2>
        <p>This agreement is made on <strong>${new Date().toLocaleDateString()}</strong> between:</p>
        <p><strong>[Your Company Name]</strong> (Service Provider)</p>
        <p>AND</p>
        <p><strong>[Client Name]</strong> (Client)</p>
        <h3>1. Services</h3>
        <p>The Service Provider agrees to provide the following services...</p>
        <h3>2. Payment Terms</h3>
        <p>The Client agrees to pay...</p>
    `);

    useEffect(() => {
        fetchClients();
    }, []);

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

    const applyTemplate = (template: any) => {
        if (!confirm('This will overwrite current content. Continue?')) return;
        setContent(template.content);
        if (!title) setTitle(template.name);
        setShowTemplateModal(false);
        toast.success('Template applied');
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
            toast.success('Contract created successfully');
            router.push('/crm/contracts');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create contract');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6 animate-fade-in relative">
            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 uppercase tracking-wide">Select Template</h3>
                            <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {templates.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No templates found.</p>
                            ) : (
                                templates.map(t => (
                                    <div key={t.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group" onClick={() => applyTemplate(t)}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{t.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{t.description || 'No description'}</p>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 bg-indigo-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                                Select
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <PageHeader
                title="Draft Contract"
                subtitle="Create a new legal agreement"
                icon={FileText}
                actions={
                    <div className="flex gap-3">
                        <Link
                            href="/crm/contracts"
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Cancel
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-5 py-2 bg-indigo-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Contract'}
                        </button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="ent-card p-6">
                        <div className="mb-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Contract Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="ent-input w-full font-bold text-lg"
                                placeholder="e.g. Website Development Agreement"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex justify-between">
                                <span>Agreement Content</span>
                                <button
                                    type="button"
                                    onClick={fetchTemplates}
                                    className="text-indigo-600 cursor-pointer hover:underline flex items-center gap-1"
                                >
                                    <LayoutTemplate size={12} /> Load Template
                                </button>
                            </label>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                className="h-[500px] mb-12"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="ent-card p-6 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2">Contract Details</h3>

                        <div className="ent-form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Client</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <select
                                    required
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="ent-input pl-10 w-full"
                                >
                                    <option value="">Select Client</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.company?.name || 'Ind.'})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Valid From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                        className="ent-input pl-10 w-full"
                                    />
                                </div>
                            </div>

                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Valid Until</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        className="ent-input pl-10 w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ent-card p-6 bg-slate-50 border-slate-200">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mb-2">Note</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Once saved, you can send this contract to the client via the Client Portal. They will be able to digitally sign it.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
