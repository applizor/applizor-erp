'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ArrowLeft, User, Calendar, FileText, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Link from 'next/link';

export default function EditContractPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');

    useEffect(() => {
        fetchClients();
        fetchContract();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients?limit=100');
            setClients(res.data.clients || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchContract = async () => {
        try {
            const res = await api.get(`/contracts/${params.id}`);
            const c = res.data;
            setTitle(c.title);
            setContent(c.content);
            if (c.validFrom) setValidFrom(new Date(c.validFrom).toISOString().split('T')[0]);
            if (c.validUntil) setValidUntil(new Date(c.validUntil).toISOString().split('T')[0]);
        } catch (error) {
            toast.error('Failed to load contract');
            router.push('/crm/contracts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put(`/contracts/${params.id}`, {
                title,
                content,
                validFrom: validFrom ? new Date(validFrom) : null,
                validUntil: validUntil ? new Date(validUntil) : null
            });
            toast.success('Contract updated successfully');
            router.push(`/crm/contracts/${params.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update contract');
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-lg">
                        <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Edit Contract</h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest">
                            Update agreement details
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/crm/contracts"
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2 bg-amber-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="ent-card p-6">
                        <div className="mb-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Contract Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="ent-input w-full font-bold text-lg"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Agreement Content</label>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                className="h-[500px] mb-12"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="ent-card p-6 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2">Contract Details</h3>

                        {/* Client is read-only in edit mode usually */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Valid From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                        className="ent-input pl-10 w-full"
                                    />
                                </div>
                            </div>

                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Valid Until</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        className="ent-input pl-10 w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
