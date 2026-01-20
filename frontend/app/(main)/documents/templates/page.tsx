'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { documentTemplatesApi, DocumentTemplate } from '@/lib/api/documents';

export default function DocumentTemplatesPage() {
    const toast = useToast();
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [type, setType] = useState('OfferLetter');
    const [letterheadMode, setLetterheadMode] = useState('NONE');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await documentTemplatesApi.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return toast.warning('Please select a file');

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('name', name);
            formData.append('type', type);
            formData.append('letterheadMode', letterheadMode);
            formData.append('file', file!);

            await documentTemplatesApi.upload(formData);

            // Reset
            setName('');
            setFile(null);
            setShowForm(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upload template');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        try {
            await documentTemplatesApi.delete(id);
            loadData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                    {showForm ? 'Cancel' : '+ Add Template'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
                    <h2 className="text-lg font-medium mb-4">Upload New Template</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Template Name</label>
                            <input
                                type="text" required
                                value={name} onChange={e => setName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="e.g. Standard Offer Letter 2024"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                value={type} onChange={e => setType(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="OfferLetter">Offer Letter</option>
                                <option value="Payslip">Payslip</option>
                                <option value="Contract">Contract</option>
                                <option value="Invoice">Invoice</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Letterhead Overlay</label>
                            <select
                                value={letterheadMode} onChange={e => setLetterheadMode(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="NONE">None (Use Template Design)</option>
                                <option value="FIRST_PAGE">First Page Only</option>
                                <option value="ALL_PAGES">All Pages</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Requires Company Letterhead PDF to be configured in Settings.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">DOCX File</label>
                            <input
                                type="file" accept=".docx" required
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit" disabled={submitting}
                                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
                            >
                                {submitting ? 'Uploading...' : 'Save Template'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : templates.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                    No templates found. Upload your first DOCX template.
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {templates.map(t => (
                                <tr key={t.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.letterheadMode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
