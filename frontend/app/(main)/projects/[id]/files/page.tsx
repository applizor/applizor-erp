'use client';

import { useState, useEffect } from 'react';
import { FileText, Folder, UploadCloud, Download, Trash2, Search } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ProjectFiles({ params }: { params: { id: string } }) {
    const toast = useToast();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState('General');

    useEffect(() => {
        fetchDocuments();
    }, [params.id]);

    const fetchDocuments = async () => {
        try {
            const res = await api.get(`/projects/${params.id}/documents`);
            setDocuments(res.data);
        } catch (error) {
            console.error(error);
            // toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('category', category);

        try {
            await api.post(`/projects/${params.id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Document uploaded');
            setSelectedFile(null);
            fetchDocuments();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Convert to trash?')) return;
        try {
            await api.delete(`/projects/documents/${docId}`);
            toast.success('Document removed');
            fetchDocuments();
        } catch (error: any) {
            toast.error('Failed to delete');
        }
    };

    const handleDownload = (docId: string) => {
        // Implement download logic or link to public URL if available
        // For local uploads, we need a download endpoint or static serving
        // Assuming static serving from backend `/uploads` or generic text response for now
        toast.success("Download started (Mock)"); // In real app, window.open(url)
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    const categories = ['Contracts', 'Design Assets', 'Specifications', 'Invoices', 'General'];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Digital Ledger</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Assets & Contracts</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <select
                        className="ent-input py-1 text-xs w-32"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <label className="cursor-pointer btn-secondary flex items-center gap-2">
                        <input type="file" className="hidden" onChange={handleFileSelect} />
                        <span className="truncate max-w-[100px]">{selectedFile ? selectedFile.name : 'Select File'}</span>
                    </label>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="btn-primary"
                    >
                        {uploading ? <LoadingSpinner size="sm" /> : <UploadCloud size={14} />}
                    </button>
                </div>
            </div>

            {/* Folder Structure Visualization */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {categories.map(cat => {
                    const count = documents.filter(d => d.category === cat).length;
                    return (
                        <div key={cat} className={`p-4 bg-white border rounded-lg transition-all cursor-pointer group ${count > 0 ? 'border-primary-200 shadow-sm' : 'border-gray-100 opacity-70'}`}>
                            <Folder className={`w-8 h-8 mb-3 transition-transform group-hover:scale-110 ${count > 0 ? 'text-amber-400' : 'text-gray-300'}`} />
                            <h4 className="text-xs font-bold text-gray-900">{cat}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{count} Files</p>
                        </div>
                    );
                })}
            </div>

            {/* File List */}
            <div className="ent-card p-0 overflow-hidden min-h-[300px]">
                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Search className="w-10 h-10 text-gray-200 mb-4" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Repository Empty</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Size</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <FileText size={16} className="text-primary-600" />
                                            <span className="text-xs font-bold text-gray-900">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4"><span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-wide">{doc.category}</span></td>
                                    <td className="p-4 text-xs font-mono text-gray-500">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                                    <td className="p-4 text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleDownload(doc.id)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-primary-600 transition-colors">
                                            <Download size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
