'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, LayoutTemplate, ChevronRight, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '../../../../hooks/useConfirm';

export default function SalaryTemplateListPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/payroll/templates');
            setTemplates(res.data);
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (await confirm({
            title: 'Delete Template?',
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`
        })) {
            try {
                await api.delete(`/payroll/templates/${id}`);
                toast.success('Template deleted successfully');
                loadTemplates();
            } catch (error: any) {
                console.error('Failed to delete template:', error);
                toast.error(error.response?.data?.error || 'Failed to delete template');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-900 rounded-md flex items-center justify-center shadow-lg">
                        <LayoutTemplate size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">Salary Templates</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage Remuneration Structures</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/payroll/templates/create"
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={14} /> Create Template
                    </Link>
                </div>
            </div>

            {/* Template List */}
            <div className="ent-card overflow-hidden">
                <table className="ent-table w-full">
                    <thead>
                        <tr>
                            <th className="text-left pl-6 py-3">Template Name</th>
                            <th className="text-left py-3">Description</th>
                            <th className="text-center py-3">Components</th>
                            <th className="text-right pr-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <TableRowSkeleton columns={4} rows={3} />
                        ) : templates.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center p-10 text-slate-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                            <LayoutTemplate size={24} />
                                        </div>
                                        <p className="text-xs font-medium">No templates found. Create one to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            templates.map((template) => (
                                <tr key={template.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="pl-6 py-4">
                                        <div className="text-[12px] font-black text-slate-900 tracking-tight leading-none uppercase">
                                            {template.name}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="text-[11px] text-slate-500 font-medium truncate max-w-[300px]">
                                            {template.description || '-'}
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className="inline-flex items-center justify-center h-5 px-2.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black">
                                            {template.components?.length || 0}
                                        </span>
                                    </td>
                                    <td className="pr-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/payroll/templates/${template.id}`}
                                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                                title="Edit Template"
                                            >
                                                <Edit size={14} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(template.id, template.name)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                title="Delete Template"
                                            >
                                                <Trash2 size={14} />
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
    );
}
