'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { Plus, Search, Edit, Trash2, Copy, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await api.delete(`/quotation-templates/${id}`);
            toast.success('Template deleted successfully');
            loadTemplates();
        } catch (error: any) {
            toast.error('Failed to delete template');
        }
    };

    const handleUseTemplate = async (id: string) => {
        try {
            // Apply template (increments usage count)
            const response = await api.post(`/quotation-templates/${id}/apply`);
            const template = response.data.template;

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
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quotation Templates</h1>
                    <p className="text-sm text-gray-600 mt-1">Save and reuse quotation templates</p>
                </div>
                {can('Quotation', 'create') && (
                    <button
                        onClick={() => router.push('/quotations/create')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Quotation
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <Copy className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                    <p className="text-gray-600 mb-4">Create your first quotation template to get started</p>
                    {can('Quotation', 'create') && (
                        <button
                            onClick={() => router.push('/quotations/create')}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Create Quotation
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                {/* Category Badge */}
                                {template.category && (
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded mb-3">
                                        {template.category}
                                    </span>
                                )}

                                {/* Template Name */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {template.name}
                                </h3>

                                {/* Description */}
                                {template.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {template.description}
                                    </p>
                                )}

                                {/* Usage Count */}
                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    Used {template.usageCount} times
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleUseTemplate(template.id)}
                                        className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                                    >
                                        Use Template
                                    </button>
                                    {can('Quotation', 'delete') && (
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
