
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { employeeDocumentsApi, EmployeeDocument } from '@/lib/api/employee-documents';
import { Upload, FileText, Trash2, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';

export default function MyDocumentsPage() {
    const toast = useToast();
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState('other');

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const data = await employeeDocumentsApi.getMine();
            setDocuments(data);
        } catch (error) {
            console.error('Failed to load documents', error);
            // toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;

        if (!fileInput.files || fileInput.files.length === 0) {
            toast.error('Please select a file');
            return;
        }

        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', uploadType);
        formData.append('name', file.name); // Optional, backend can derive

        try {
            await employeeDocumentsApi.upload(formData);
            toast.success('Document uploaded successfully');
            setIsUploadOpen(false);
            loadDocuments();
        } catch (error) {
            toast.error('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await employeeDocumentsApi.delete(id);
            toast.success('Document deleted');
            loadDocuments();
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="ent-badge ent-badge-success flex items-center gap-1"><CheckCircle size={10} /> Approved</span>;
            case 'rejected': return <span className="ent-badge ent-badge-danger flex items-center gap-1"><XCircle size={10} /> Rejected</span>;
            default: return <span className="ent-badge ent-badge-warning flex items-center gap-1"><Clock size={10} /> Pending</span>;
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">My Documents</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest">
                            Manage your personal files & records
                        </p>
                    </div>
                </div>

                <Button onClick={() => setIsUploadOpen(true)} className="bg-primary-900 text-white uppercase font-black text-[10px] tracking-widest">
                    <Upload size={14} className="mr-2" /> Upload Document
                </Button>
            </div>

            {/* Documents List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {documents.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-md border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase text-xs">No documents found</p>
                    </div>
                )}

                {documents.map((doc) => (
                    <div key={doc.id} className="ent-card group hover:border-primary-200 transition-all">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                    <FileText size={20} />
                                </div>
                                {getStatusBadge(doc.status)}
                            </div>

                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2 truncate" title={doc.name}>
                                {doc.name}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                {doc.type.replace('_', ' ')} • {(doc.fileSize / 1024).toFixed(0)} KB
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                    {/* Download/View would go here */}
                                    {doc.status !== 'approved' && (
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="text-gray-400 hover:text-rose-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Modal */}
            <Dialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Document">
                <form onSubmit={handleUpload} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label>Document Type</Label>
                        <select
                            className="ent-input w-full"
                            value={uploadType}
                            onChange={(e) => setUploadType(e.target.value)}
                        >
                            <option value="id_proof">ID Proof (Passport/DL/Aadhaar)</option>
                            <option value="address_proof">Address Proof</option>
                            <option value="education">Education Certificate</option>
                            <option value="experience">Experience Letter</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Select File</Label>
                        <div className="border-2 border-dashed border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-center hover:border-primary-200 transition-colors cursor-pointer bg-gray-50/50 relative">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept=".pdf,.jpg,.jpeg,.png,.docx"
                            />
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Click to browse or drag file</p>
                            <p className="text-[9px] text-gray-400 mt-1">PDF, IMG, DOCX (Max 5MB)</p>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? <><LoadingSpinner size="sm" /> Uploading...</> : 'Upload'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
