'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ArrowLeft, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import PagedRichTextEditor from '@/components/ui/PagedRichTextEditor';
import Link from 'next/link';

export default function CreateTemplatePage({ params }: { params: { id?: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!params?.id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState(`
        <h2 style="text-align: center;">AGREEMENT TEMPLATE</h2>
        <p style="text-align: center;">This is a standard agreement template.</p>
        <p><br></p>
        <h3>1. Scope</h3>
        <p>Type your agreement terms here...</p>
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
        <div className="max-w-7xl mx-auto pb-20 space-y-6 animate-fade-in my-6 px-4">
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Meta Data */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="ent-card p-6 lg:col-span-2">
                        <div className="ent-form-group">
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
                    </div>
                    <div className="ent-card p-6">
                        <div className="ent-form-group">
                            <label className="ent-label">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="ent-textarea resize-none h-[50px]"
                                placeholder="Brief description..."
                            />
                        </div>
                    </div>
                </div>

                {/* Main Editor - Full Width */}
                <div className="ent-card overflow-hidden border-2 border-slate-100 shadow-xl">
                    <div className="bg-slate-50 border-b border-slate-200 p-2 text-xs text-center text-slate-500 font-medium">
                        DOCUMENT EDITOR - A4 PAGE VIEW
                    </div>
                    <PagedRichTextEditor
                        value={content}
                        onChange={setContent}
                        className="h-[800px]"
                        showLetterhead={true} // Preview with letterhead feel
                    />
                </div>

            </form>
        </div>
    );
}
