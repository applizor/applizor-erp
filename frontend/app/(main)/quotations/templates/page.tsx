'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { Plus, Search, Edit, Trash2, Copy, TrendingUp, LayoutTemplate, Filter, FileText } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    title: string;
    usageCount: number;
    createdAt: string;
}

export default function QuotationTemplatesPage() {
    const router = useRouter();
    const toast = useToast();
    const { can } = usePermission();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadTemplates();
    }, [selectedCategory]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategory) params.append('category', selectedCategory);
            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get(`/quotation-templates?${params.toString()}`);
            setTemplates(response.data.templates || []);
        } catch (error: any) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadTemplates();
    };

    const handleDelete = (id: string) => {
        setTemplateToDelete(id);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;

        try {
            await api.delete(`/quotation-templates/${templateToDelete}`);
            toast.success('Template deleted successfully');
            loadTemplates();
            setShowDeleteDialog(false);
            setTemplateToDelete(null);
        } catch (error: any) {
            toast.error('Failed to delete template');
        }
    };

    const handleUseTemplate = async (id: string) => {
        try {
            // Apply template (increments usage count)
            const response = await api.post(`/quotation-templates/${id}/apply`);

            // Navigate to create quotation with template data
            router.push(`/quotations/create?templateId=${id}`);
        } catch (error: any) {
            toast.error('Failed to apply template');
        }
    };

    const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Standardized Header */}
            <PageHeader
                title="Quotation Templates"
                subtitle="Manage and organize reusable quotation structures"
                icon={LayoutTemplate}
                actions={
                    can('Quotation', 'create') && (
                        <button
                            onClick={() => router.push('/quotations/create')}
                            className="ent-button-primary shadow-lg shadow-primary-500/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Quote
                        </button>
                    )
                }
            />

            {/* Filters */}
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-1.5 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search templates by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-transparent focus:bg-white border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                </div>

                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border-transparent focus:bg-white border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none transition-all cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <div className="ent-card p-16 text-center border-dashed border-2 bg-gray-50/50">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4 ring-8 ring-gray-50">
                        <Copy className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No templates found</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        {searchTerm || selectedCategory
                            ? "Try adjusting your search or filters to find what you're looking for."
                            : "Create your first quotation template to standardize your proposals and save time."}
                    </p>
                    {can('Quotation', 'create') && !searchTerm && !selectedCategory && (
                        <button
                            onClick={() => router.push('/quotations/create')}
                            className="ent-button-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Draft New Quote
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="group bg-white rounded-md shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    {/* Category Badge */}
                                    {template.category ? (
                                        <span className="ent-badge bg-blue-50 text-blue-700 border-blue-100">
                                            {template.category}
                                        </span>
                                    ) : (
                                        <span className="ent-badge bg-gray-50 text-gray-600 border-gray-100">
                                            General
                                        </span>
                                    )}
                                    <div className="flex items-center text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                        <TrendingUp className="w-3 h-3 mr-1.5 text-emerald-500" />
                                        {template.usageCount}
                                    </div>
                                </div>

                                {/* Template Name */}
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
                                    {template.name}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-gray-500 mb-4 line-clamp-3 leading-relaxed">
                                    {template.description || "No description provided."}
                                </p>

                                <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-auto">
                                    <div className="flex items-center text-xs text-gray-400 font-medium">
                                        <FileText size={12} className="mr-1.5" />
                                        {template.title || 'Untitled Proposal'}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center space-x-3">
                                <button
                                    onClick={() => handleUseTemplate(template.id)}
                                    className="flex-1 ent-button-primary text-xs py-2 bg-gray-900 border-gray-900 hover:bg-gray-800"
                                >
                                    Use Template
                                </button>

                                {/* Edit functionality usually goes to create page prefilled, but if there's a dedicated edit, we'd link there. 
                                    For now, assumption is templates are edited by using them and saving as new or overwriting? 
                                    Or maybe just deleting. The original code didn't have an explicit 'Edit Template' route, just 'Use'. 
                                */}

                                {can('Quotation', 'delete') && (
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 border border-gray-200 text-gray-400 rounded-lg hover:bg-white hover:border-red-200 hover:text-red-600 hover:shadow-sm transition-all bg-white"
                                        title="Delete Template"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setShowDeleteDialog(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-md text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-50 sm:mx-0 sm:h-10 sm:w-10 ring-4 ring-red-50/50">
                                        <Trash2 className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                            Delete Template
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Are you sure you want to delete this template? Any pending quotations created from this template will not be affected, but you won't be able to use it for new proposals.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
                                >
                                    Delete Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteDialog(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
