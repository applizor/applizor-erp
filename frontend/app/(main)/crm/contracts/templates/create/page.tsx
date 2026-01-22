'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ArrowLeft, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Link from 'next/link';

export default function CreateTemplatePage({ params }: { params: { id?: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!params?.id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState(`
        <h2>AGREEMENT TEMPLATE</h2>
        <p>This is a standard agreement template.</p>
        <h3>1. Scope</h3>
        <p>...</p>
    `);

    useEffect(() => {
        if (params?.id) {
            fetchTemplate(params.id);
        }
    }, [params?.id]);

    const fetchTemplate = async (id: string) => {
        try {
            const res = await api.get(`/contract-templates/${id}`);
            const t = res.data;
            setName(t.name);
            setDescription(t.description || '');
            setContent(t.content);
        } catch (error) {
            toast.error('Failed to load template');
            router.push('/crm/contracts/templates');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (params?.id) {
                await api.put(`/contract-templates/${params.id}`, { name, description, content });
                toast.success('Template updated');
            } else {
                await api.post('/contract-templates', { name, description, content });
                toast.success('Template created');
            }
            router.push('/crm/contracts/templates');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return (
        <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6 animate-fade-in my-6">
            <PageHeader
                title={params?.id ? "Edit Template" : "New Template"}
                subtitle="Design reusable contract layout"
                icon={LayoutTemplate}
                actions={
                    <div className="flex gap-3">
                        <Link
                            href="/crm/contracts/templates"
                            className="ent-button-secondary gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Cancel
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="ent-button-primary gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="ent-card p-6">
                        <div className="mb-4 ent-form-group">
                            <label className="ent-label">Template Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="ent-input text-lg font-black"
                                placeholder="E.G. NDA AGREEMENT"
                            />
                        </div>

                        <div>
                            <label className="ent-label mb-2 block">Template Content</label>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                className="min-h-[500px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <div className="ent-card p-6 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">Template Details</h3>

                        <div className="ent-form-group">
                            <label className="ent-label">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="ent-textarea h-32 resize-none"
                                placeholder="Brief description of when to use this template..."
                            />
                        </div>
                    </div>

                    <div className="ent-card p-5 bg-amber-50/50 border-amber-200/60 dashed-border">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Tip</h3>
                        <p className="text-[11px] font-bold text-amber-600/80 leading-relaxed">
                            You can leave placeholders like [CLIENT_NAME] or [DATE] in the text. You will be able to edit them when creating the actual contract.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
