'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BookOpen, Plus, FileText, Download, Trash2, ShieldCheck, ChevronRight, Search, Upload } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePermission } from '@/hooks/usePermission';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import apiClient from '@/lib/api';

export default function PoliciesPage() {
    const { can } = usePermission();
    const toast = useToast();
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

    // View Policy State
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewingPolicy, setViewingPolicy] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({ title: '', description: '', category: '', status: 'DRAFT' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/policies');
            setPolicies(data);
        } catch (error) {
            console.error('Failed to fetch policies:', error);
            toast.error('Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleSubmit = async (e: React.FormEvent, statusOverride?: string) => {
        if (e) e.preventDefault();
        try {
            setSubmitting(true);
            const status = statusOverride || formData.status;
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('category', formData.category);
            submitData.append('status', status);
            if (selectedFile) {
                submitData.append('file', selectedFile);
            }

            if (isEditMode && editingPolicyId) {
                await apiClient.put(`/policies/${editingPolicyId}`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Policy updated successfully');
            } else {
                await apiClient.post('/policies', submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(status === 'PUBLISHED' ? 'Policy published successfully' : 'Policy saved as draft');
            }

            setIsDialogOpen(false);
            resetForm();
            fetchPolicies();
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to process policy');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!policyToDelete) return;
        try {
            setSubmitting(true);
            await apiClient.delete(`/policies/${policyToDelete}`);
            toast.success('Policy deleted');
            setIsDeleteConfirmOpen(false);
            setPolicyToDelete(null);
            fetchPolicies();
        } catch (error) {
            toast.error('Failed to delete policy');
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (policy: any) => {
        setIsEditMode(true);
        setEditingPolicyId(policy.id);
        setFormData({
            title: policy.title,
            description: policy.description || '',
            category: policy.category || '',
            status: policy.status || 'DRAFT'
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', category: '', status: 'DRAFT' });
        setSelectedFile(null);
        setIsEditMode(false);
        setEditingPolicyId(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const openPolicy = (url?: string) => {
        if (!url) return;
        const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${url}`;
        window.open(fullUrl, '_blank');
    };

    const openViewPolicy = (policy: any) => {
        setViewingPolicy(policy);
        setIsViewDialogOpen(true);
    };

    const filteredPolicies = policies.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Company Policies</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            HR Handbook <ChevronRight size={10} className="text-primary-600" /> Compliance Protocols
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="SEARCH..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-[10px] font-black uppercase tracking-widest w-40 md:w-64 focus:outline-none focus:border-primary-500 transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary-500 transition-all"
                    >
                        <option value="ALL">ALL STATUS</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <PermissionGuard module="Policy" action="create">
                        <button
                            onClick={() => { resetForm(); setIsDialogOpen(true); }}
                            className="px-4 py-2 bg-primary-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-primary-900/10 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={14} /> New Policy
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPolicies.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-400 text-xs">No policies found.</div>
                ) : (
                    filteredPolicies.map((policy) => (
                        <div key={policy.id} className="ent-card group hover:border-primary-200 transition-all duration-300 flex flex-col cursor-pointer" onClick={() => openViewPolicy(policy)}>
                            <div className="p-5 space-y-4 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className={`p-2 rounded-md ${policy.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${policy.status === 'PUBLISHED' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-amber-100 border-amber-200 text-amber-700'}`}>
                                            {policy.status}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                            {policy.category || 'General'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1 group-hover:text-primary-600 transition-colors">
                                        {policy.title}
                                    </h3>
                                    <div
                                        className="text-xs text-gray-500 line-clamp-3 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: policy.description }}
                                    />
                                </div>
                            </div>
                            <div className="px-5 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between mt-auto">
                                <div className="flex gap-2">
                                    <PermissionGuard module="Policy" action="update">
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(policy); }} className="p-1.5 bg-white border border-gray-100 rounded text-gray-400 hover:text-primary-600 hover:border-primary-100 transition-all shadow-sm">
                                            <FileText size={14} />
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard module="Policy" action="delete">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPolicyToDelete(policy.id);
                                                setIsDeleteConfirmOpen(true);
                                            }}
                                            className="p-1.5 bg-white border border-gray-100 rounded text-gray-400 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </PermissionGuard>
                                </div>
                                <div className="flex items-center gap-3">
                                    {policy.fileUrl && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openPolicy(policy.fileUrl); }}
                                            className="p-1.5 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors"
                                            title="Download PDF"
                                        >
                                            <Download size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openViewPolicy(policy); }}
                                        className="text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                    >
                                        READ MORE <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={isEditMode ? "Update Policy Protocol" : "New Policy Protocol"}
                maxWidth="4xl"
            >
                <div className="space-y-4 p-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Policy Title</Label>
                            <Input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="EX: EMPLOYEE CONDUCT..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Category</Label>
                            <Input
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="EX: HR, IT, SAFETY"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Detailed Protocol Content</Label>
                        <div className="h-[300px]">
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                                placeholder="Enter detailed policy guidelines here..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Policy Document (PDF Attachment)</Label>
                        <div className="border-2 border-dashed border-gray-100 rounded-md p-6 text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0]"
                            />
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                <Upload size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {selectedFile ? selectedFile.name : (isEditMode ? 'Replace PDF Document (Optional)' : 'Upload Official Protocol PDF')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center bg-gray-50/50 -mx-6 -mb-6 p-4 px-6 rounded-b-md border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Close</Button>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={(e) => handleSubmit(e, 'DRAFT')}
                                disabled={submitting}
                                className="bg-white border-gray-200 text-[10px] font-black uppercase tracking-widest"
                            >
                                {submitting ? '...' : 'Save as Draft'}
                            </Button>
                            <Button
                                type="button"
                                onClick={(e) => handleSubmit(e, 'PUBLISHED')}
                                disabled={submitting}
                                className="text-[10px] font-black uppercase tracking-widest px-6"
                            >
                                {submitting ? 'Processing...' : (isEditMode ? 'Update & Publish' : 'Publish Protocol')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Policy"
                message="Are you sure you want to delete this policy protocol? This action cannot be undone."
                type="danger"
                isLoading={submitting}
            />

            {/* View Policy Modal */}
            <Dialog
                isOpen={isViewDialogOpen}
                onClose={() => setIsViewDialogOpen(false)}
                title={viewingPolicy?.title || "Policy Details"}
                maxWidth="6xl"
            >
                <div className="space-y-6 py-2">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md ${viewingPolicy?.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">
                                    {viewingPolicy?.title}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest">
                                    Protocol ID: {viewingPolicy?.id?.split('-')[0]} | Category: {viewingPolicy?.category || 'General'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${viewingPolicy?.status === 'PUBLISHED' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-amber-100 border-amber-200 text-amber-700'}`}>
                                {viewingPolicy?.status}
                            </span>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-100 min-h-[400px]">
                        <div
                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed font-medium"
                            dangerouslySetInnerHTML={{ __html: viewingPolicy?.description || '<p className="text-gray-400 italic">No description provided for this protocol.</p>' }}
                        />
                    </div>

                    {viewingPolicy?.fileUrl && (
                        <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-900 text-white rounded">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-primary-900 uppercase tracking-tight">Official Attachment Available</p>
                                    <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Signed Protocol Document (PDF)</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => openPolicy(viewingPolicy.fileUrl)}
                                className="bg-primary-900 text-[10px] font-black uppercase tracking-widest px-6"
                            >
                                <Download size={14} className="mr-2" /> Download Document
                            </Button>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                        <PermissionGuard module="Policy" action="update">
                            <Button
                                variant="secondary"
                                onClick={() => { setIsViewDialogOpen(false); openEdit(viewingPolicy); }}
                                className="text-[10px] font-black uppercase tracking-widest border-gray-200"
                            >
                                <FileText size={14} className="mr-2" /> Edit Protocol
                            </Button>
                        </PermissionGuard>
                        <Button
                            onClick={() => setIsViewDialogOpen(false)}
                            className="bg-gray-900 text-[10px] font-black uppercase tracking-widest px-8"
                        >
                            Close Reader
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
