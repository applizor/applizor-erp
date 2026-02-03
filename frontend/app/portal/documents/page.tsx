'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Package, Download, Upload, Check, X, Clock, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

export default function PortalDocumentsPage() {
    const toast = useToast();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        name: '',
        type: 'Onboarding', // default
        file: null as File | null
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const { data } = await api.get('/portal/documents');
            setDocuments(data);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadForm({ ...uploadForm, file: e.target.files[0] });
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadForm.file || !uploadForm.name) {
            toast.error('Please select a file and enter a name');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', uploadForm.file);
            formData.append('name', uploadForm.name);
            formData.append('type', uploadForm.type);

            await api.post('/portal/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Document uploaded successfully');
            setIsUploadModalOpen(false);
            setUploadForm({ name: '', type: 'Onboarding', file: null });
            fetchDocuments(); // Refresh list
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide"><Check size={10} className="mr-1" /> Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-rose-100 text-rose-700 uppercase tracking-wide"><X size={10} className="mr-1" /> Rejected</span>;
            case 'pending':
            default:
                return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wide"><Clock size={10} className="mr-1" /> Pending Review</span>;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading documents...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Documents</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Upload and manage your onboarding documents</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-slate-900/10"
                >
                    <Upload size={14} />
                    Upload Document
                </button>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                {documents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-slate-300" />
                        </div>
                        <p className="font-medium">No documents uploaded yet</p>
                        <p className="text-xs mt-1">Upload your ID Proof or Registration Certificates to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploaded On</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{doc.name}</div>
                                                    {doc.rejectionReason && (
                                                        <div className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                                            <AlertCircle size={10} />
                                                            {doc.rejectionReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{doc.type}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(doc.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* In a real app, this would be a download link */}
                                            <a
                                                href={`${SERVER_URL}/${doc.filePath}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                                                title="View Document"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Upload Document</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Document Name</label>
                                <input
                                    type="text"
                                    value={uploadForm.name}
                                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                                    placeholder="e.g. GST Certificate, ID Proof"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Document Type</label>
                                <select
                                    value={uploadForm.type}
                                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                                >
                                    <option value="Onboarding">Onboarding</option>
                                    <option value="Legal">Legal</option>
                                    <option value="Identification">Identification</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">File</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-md hover:bg-slate-50 transition-colors cursor-pointer relative">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-8 w-8 text-slate-400" />
                                        <div className="flex text-sm text-slate-600 justify-center">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        <p className="text-xs text-slate-500">PDF, PNG, JPG up to 10MB</p>
                                        {uploadForm.file && (
                                            <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 py-1 px-2 rounded inline-block">
                                                Selected: {uploadForm.file.name}
                                            </p>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? 'Uploading...' : 'Upload Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
