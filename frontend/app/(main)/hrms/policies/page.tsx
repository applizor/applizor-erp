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
import { Textarea } from '@/components/ui/Textarea';
import { Policy } from '@/types'; // Ensure you have a Policy type or define inline
import { apiClient } from '@/lib/api'; // Assuming you have a configured axios instance

export default function PoliciesPage() {
    const { can } = usePermission();
    const { toast } = useToast();
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [newPolicy, setNewPolicy] = useState({ title: '', description: '', category: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/policies');
            setPolicies(data);
        } catch (error) {
            console.error('Failed to fetch policies:', error);
            toast({ title: 'Error', description: 'Failed to load policies', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('title', newPolicy.title);
            formData.append('description', newPolicy.description);
            formData.append('category', newPolicy.category);
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            await apiClient.post('/policies', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({ title: 'Success', description: 'Policy published successfully' });
            setIsCreateOpen(false);
            setNewPolicy({ title: '', description: '', category: '' });
            setSelectedFile(null);
            fetchPolicies();
        } catch (error) {
            console.error('Create policy error:', error);
            toast({ title: 'Error', description: 'Failed to publish policy', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const openPolicy = (url?: string) => {
        if (!url) return;
        // Check if URL is absolute or relative
        const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${url}`;
        window.open(fullUrl, '_blank');
    };

    const filteredPolicies = policies.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

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
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="SEARCH PROTOCOLS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-[10px] font-black uppercase tracking-widest w-64 focus:outline-none focus:border-primary-500 transition-all"
                        />
                    </div>
                    <PermissionGuard module="Policy" action="create">
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="px-4 py-2 bg-primary-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-primary-900/10 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Plus size={14} /> Publish Policy
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
                        <div key={policy.id} className="ent-card group hover:border-primary-200 transition-all duration-300">
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        {policy.category || 'General'}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1 group-hover:text-primary-600 transition-colors">
                                        {policy.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                        {policy.description}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        Updated: {new Date(policy.updatedAt).toLocaleDateString()}
                                    </span>
                                    {policy.fileUrl && (
                                        <button
                                            onClick={() => openPolicy(policy.fileUrl)}
                                            className="text-[9px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                        >
                                            <Download size={12} /> Read Protocol
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Publish New Policy">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Policy Title</Label>
                        <Input
                            required
                            value={newPolicy.title}
                            onChange={e => setNewPolicy({ ...newPolicy, title: e.target.value })}
                            placeholder="EX: REMOTE WORK GUIDELINES"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Input
                            value={newPolicy.category}
                            onChange={e => setNewPolicy({ ...newPolicy, category: e.target.value })}
                            placeholder="EX: HR, IT, LEGAL"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Abstract / Description</Label>
                        <Textarea
                            required
                            value={newPolicy.description}
                            onChange={e => setNewPolicy({ ...newPolicy, description: e.target.value })}
                            placeholder="Brief summary of the policy mandate..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Policy Document (PDF)</Label>
                        <div className="border-2 border-dashed border-gray-200 rounded-md p-4 text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                <Upload size={20} />
                                <span className="text-xs font-bold uppercase tracking-wide">
                                    {selectedFile ? selectedFile.name : 'Click to Upload PDF'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Publishing...' : 'Publish'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
