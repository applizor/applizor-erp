'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { templatesApi, DocumentTemplate } from '@/lib/api/document-templates';
import { Copy, Upload, FileText, Plus, Trash2, Edit, Save, X, Code, Variable, Monitor } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';

interface Template {
    id: string;
    name: string;
    type: 'offer' | 'contract' | 'other';
    variables: string[];
    lastUpdated: string;
}

const mockTemplates: Template[] = [
    { id: '1', name: 'Standard Offer Letter - Engineering', type: 'offer', variables: ['candidate_name', 'position', 'ctc', 'start_date'], lastUpdated: '2026-01-20' },
    { id: '2', name: 'Consultant Agreement', type: 'contract', variables: ['consultant_name', 'rate', 'duration'], lastUpdated: '2025-12-15' },
];


export default function TemplatesPage() {
    const toast = useToast();
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await templatesApi.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates', error);
            // Fallback to mock if API fails during dev
            // setTemplates(mockTemplates as any);
        } finally {
            setLoading(false);
        }
    };

    const [newTemplate, setNewTemplate] = useState({ name: '', type: 'offer', variables: '', content: '', filePath: '' });

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            // In a real app, we would upload the file here and get a path
            // For now, we just save the metadata
            const vars = newTemplate.variables.split(',').map(v => v.trim()).filter(v => v);

            await templatesApi.create({
                ...newTemplate,
                variables: vars
            });

            toast.success('Template uploaded successfully');
            setIsCreateOpen(false);
            setNewTemplate({ name: '', type: 'offer', variables: '', content: '', filePath: '' });
            loadTemplates();
        } catch (error) {
            toast.error('Failed to save template');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Copy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Document Templates</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest">
                            Manage DOCX Assets & Variable Mappings
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <PermissionGuard module="DocumentTemplate" action="create">
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="px-4 py-2 bg-primary-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-primary-900/10 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Plus size={14} /> Upload Template
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Template List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {templates.map((template) => (
                    <div key={template.id} className="ent-card group hover:border-primary-200 transition-all">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                                    <FileText size={20} />
                                </div>
                                <span className={`ent-badge ${template.type === 'offer' ? 'ent-badge-success' : 'ent-badge-warning'}`}>
                                    {template.type.toUpperCase()}
                                </span>
                            </div>

                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2 truncate" title={template.name}>
                                {template.name}
                            </h3>

                            <div className="bg-gray-50 rounded p-3 mb-4 border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Variable size={10} /> Detected Variables
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {template.variables.map(v => (
                                        <span key={v} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[9px] font-mono text-gray-600">
                                            {`{{${v}}}`}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    Created At: {new Date(template.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                    <button className="text-gray-400 hover:text-primary-600 transition-colors">
                                        <Edit size={14} />
                                    </button>
                                    <button className="text-gray-400 hover:text-rose-600 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Modal */}
            <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Upload DOCX Template">
                <form onSubmit={handleUpload} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label>Template Name</Label>
                        <Input
                            required
                            value={newTemplate.name}
                            onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                            placeholder="EX: APPOINTMENT LETTER 2026"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Template Content (HTML / Rich Text)</Label>
                        <div className="ent-editor-wrapper">
                            <RichTextEditor
                                value={newTemplate.content || ''}
                                onChange={newContent => setNewTemplate({ ...newTemplate, content: newContent })}
                                placeholder="Enter template content..."
                            />
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Use variables like [CLIENT_NAME], [DATE], [COMPANY_NAME]
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Category Used For</Label>
                            <select
                                className="ent-input w-full"
                                value={newTemplate.type}
                                onChange={e => setNewTemplate({ ...newTemplate, type: e.target.value })}
                            >
                                <option value="offer">Offer Letter</option>
                                <option value="contract">Contract / Agreement</option>
                                <option value="other">General / Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Map Variables (Comma Separated)</Label>
                        <Textarea
                            value={newTemplate.variables}
                            onChange={e => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                            placeholder="name, position, salary, joining_date, address..."
                            rows={2}
                        />
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            These variables (e.g. {`{{name}}`}) in the DOCX will be replaced.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Upload .DOCX File</Label>
                        <div className="border-2 border-dashed border-gray-200 rounded-md p-6 flex flex-col items-center justify-center text-center hover:border-primary-200 transition-colors cursor-pointer bg-gray-50/50">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Click to browse or drag file</p>
                            <p className="text-[9px] text-gray-400 mt-1">Supports .DOCX only</p>
                            <input type="file" className="hidden" accept=".docx" />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? <><LoadingSpinner size="sm" /> Uploading...</> : 'Upload Asset'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
