'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    FileText, Download, Upload, Trash2,
    File, FileCode, ImageIcon, Search, Plus
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

interface ProjectDocument {
    id: string;
    name: string;
    type: string;
    status: string;
    fileSize: number | null;
    mimeType: string | null;
    createdAt: string;
    uploadedById: string | null;
}

export default function PortalFiles({ projectId }: { projectId: string }) {
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchDocuments();
    }, [projectId]);

    const fetchDocuments = async () => {
        try {
            const res = await api.get(`/portal/projects/${projectId}/documents`);
            setDocuments(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('type', 'Project Shared');
        formData.append('projectId', projectId);

        setUploading(true);
        try {
            await api.post('/portal/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('File uploaded successfully');
            fetchDocuments();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'N/A';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType: string | null) => {
        if (!mimeType) return <File size={20} />;
        if (mimeType.includes('image')) return <ImageIcon size={20} className="text-blue-500" />;
        if (mimeType.includes('pdf')) return <FileText size={20} className="text-rose-500" />;
        if (mimeType.includes('javascript') || mimeType.includes('json')) return <FileCode size={20} className="text-amber-500" />;
        return <File size={20} className="text-slate-400" />;
    };

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search project files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ent-input pl-10 w-full"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <label className="flex-1 md:flex-none">
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        <div className={`px-4 py-2.5 bg-primary-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-800 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {uploading ? <LoadingSpinner size="sm" /> : <Upload size={14} />}
                            Upload New
                        </div>
                    </label>
                </div>
            </div>

            {/* Files Grid/List */}
            {filteredDocs.length === 0 ? (
                <div className="p-20 text-center text-slate-300">
                    <File size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest italic">No matching files found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocs.map(doc => (
                        <div key={doc.id} className="ent-card p-4 hover:border-primary-200 transition-all group relative">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary-50 transition-colors">
                                    {getFileIcon(doc.mimeType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 truncate" title={doc.name}>
                                        {doc.name}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                            {formatFileSize(doc.fileSize)}
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {doc.status}
                                        </span>

                                        {/* Download button should eventually point to a real proxy/signed url */}
                                        <button
                                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/portal/documents/${doc.id}/download`, '_blank')}
                                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
