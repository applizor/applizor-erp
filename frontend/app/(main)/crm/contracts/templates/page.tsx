'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Search, FileText, Copy, Edit, Trash, ArrowLeft, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function ContractTemplatesList() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/contract-templates');
            setTemplates(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await api.delete(`/contract-templates/${id}`);
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in my-6">
            <PageHeader
                title="Contract Templates"
                subtitle="Manage reusable legal agreement templates"
                icon={LayoutTemplate}
                actions={
                    <div className="flex gap-2">
                        <Link
                            href="/crm/contracts"
                            className="ent-button-secondary gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Back to Contracts
                        </Link>
                        <Link
                            href="/crm/contracts/templates/create"
                            className="ent-button-primary gap-2"
                        >
                            <Plus size={16} />
                            Create Template
                        </Link>
                    </div>
                }
            />

            {/* Filters */}
            <div className="ent-card p-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="SEARCH TEMPLATES..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ent-input pl-9"
                    />
                </div>
            </div>

            {/* List */}
            <div className="ent-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th>Template Name</th>
                                <th>Description</th>
                                <th>Last Updated</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTemplates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        No templates found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredTemplates.map((template) => (
                                    <tr key={template.id} className="group">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-600">
                                                    <Copy size={14} />
                                                </div>
                                                <p className="font-bold text-slate-900">{template.name}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <p className="text-[11px] text-slate-500 max-w-md truncate">{template.description || '-'}</p>
                                        </td>
                                        <td>
                                            <div className="text-[11px] font-bold text-slate-500">
                                                {new Date(template.updatedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <Link
                                                    href={`/crm/contracts/templates/${template.id}/edit`}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={14} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(template.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
