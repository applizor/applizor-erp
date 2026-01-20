'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState } from 'react';
import api from '@/lib/api';

export default function DocumentsPage() {
    const toast = useToast();
    const [generating, setGenerating] = useState(false);
    const [formData, setFormData] = useState({
        recipientName: '',
        designation: '',
        subject: '',
        content: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const response = await api.post('/documents/generate', formData, {
                responseType: 'blob' // Important for file download
            });

            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Generated_Letter.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            console.error('Generation failed:', error);
            toast.error('Failed to generate document. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Document Engine</h1>

            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium mb-4">Generate Official Letter</h2>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <p className="text-sm text-blue-700">
                        This tool uses the <strong>Letterhead with Continuation Sheet</strong> template.
                        If the content exceeds one page, the continuation header will strictly appear from Page 2 onwards.
                    </p>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                            <input
                                type="text"
                                required
                                value={formData.recipientName}
                                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                placeholder="Mr. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Designation</label>
                            <input
                                type="text"
                                required
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                placeholder="Senior Software Engineer"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                placeholder="Offer of Employment"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Body Content</label>
                        <textarea
                            required
                            rows={10}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="Type the main content of the letter here..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tip: To test continuation logic, paste a long text that spans multiple pages.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={generating}
                            className={`
                                inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                                ${generating ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}
                            `}
                        >
                            {generating ? 'Generating PDF...' : 'Generate Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
