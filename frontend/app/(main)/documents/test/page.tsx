'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState } from 'react';
import api from '@/lib/api';

export default function DocumentTestPage() {
    const toast = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [jsonData, setJsonData] = useState('{\n  "firstName": "John",\n  "lastName": "Doe",\n  "salary": "50,000"\n}');
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.warning('Please select a .docx template');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('data', jsonData);

            const response = await api.post('/documents/generate', formData, {
                responseType: 'blob', // Important for PDF
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Create blob URL
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            setPdfUrl(url);
        } catch (error: any) {
            console.error('Generation failed:', error);
            toast.error('Failed to generate PDF. Check console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Document Engine Test</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">1. Upload DOCX Template</label>
                        <input
                            type="file"
                            accept=".docx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        />
                        <p className="text-xs text-gray-400 mt-1">Use <code>{`{{firstName}}`}</code> tags in Word.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">2. JSON Data</label>
                        <textarea
                            rows={5}
                            value={jsonData}
                            onChange={(e) => setJsonData(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded font-mono text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate PDF'}
                    </button>
                </form>
            </div>

            {pdfUrl && (
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Generated PDF</h2>
                    <iframe src={pdfUrl} className="w-full h-[600px] border border-gray-300" />
                </div>
            )}
        </div>
    );
}
