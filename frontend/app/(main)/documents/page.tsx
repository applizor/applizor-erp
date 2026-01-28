'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState } from 'react';
import api from '@/lib/api';
import { FileText } from 'lucide-react';

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
        <div className="animate-fade-in pb-20">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            Document Forge
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Automated synthesis of official manifests and regulatory correspondence.
                        </p>
                    </div>
                </div>

                <div className="ent-card p-8">
                    <div className="bg-primary-50/50 border border-primary-100 rounded-md p-5 mb-8 flex items-start gap-4">
                        <div className="p-2 rounded-md bg-white border border-primary-100 shadow-sm">
                            <FileText size={20} className="text-primary-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-primary-900 uppercase tracking-widest mb-1">Template Manifest: Letterhead v2.4</h4>
                            <p className="text-[10px] font-bold text-primary-700 leading-relaxed">
                                This engine uses the <span className="font-black underline underline-offset-4">Continuation Sheet Controller</span>.
                                Page headers will strictly transition to abbreviated format from Sheet 02 onwards.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="ent-form-group">
                                <label className="ent-label">Recipient Identity *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                    className="ent-input"
                                    placeholder="e.g. Director of Operations"
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label">Professional Designation *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    className="ent-input"
                                    placeholder="e.g. Senior Strategic Lead"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="ent-form-group">
                                <label className="ent-label">Issue Chronology *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="ent-input"
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label">Subject Protocol *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="ent-input"
                                    placeholder="e.g. Confirmation of Tenure"
                                />
                            </div>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Primary Body Manifest *</label>
                            <textarea
                                required
                                rows={8}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="ent-textarea min-h-[250px]"
                                placeholder="Ingress primary content here for automated typesetting..."
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    Typesetting logic supports multi-page bridging
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-50">
                            <button
                                type="submit"
                                disabled={generating}
                                className="btn-primary min-w-[200px] h-12"
                            >
                                {generating ? (
                                    <span className="flex items-center gap-3">
                                        <LoadingSpinner size="sm" />
                                        <span>Forging PDF...</span>
                                    </span>
                                ) : 'Synthesize Manifest'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
