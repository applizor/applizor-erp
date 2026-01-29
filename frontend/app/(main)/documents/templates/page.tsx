'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { documentTemplatesApi, DocumentTemplate } from '@/lib/api/documents';
import { useConfirm } from '@/context/ConfirmationContext';
import { FileText, Plus, ChevronRight, Activity, Shield, Download, Trash2, UploadCloud, LayoutTemplate } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import PageHeader from '@/components/ui/PageHeader';

export default function DocumentTemplatesPage() {
    const toast = useToast();
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [type, setType] = useState('OfferLetter');
    const [letterheadMode, setLetterheadMode] = useState('NONE');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await documentTemplatesApi.getAll();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return toast.warning('Please select a file');

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('name', name);
            formData.append('type', type);
            formData.append('letterheadMode', letterheadMode);
            formData.append('file', file!);

            await documentTemplatesApi.upload(formData);

            // Reset
            setName('');
            setFile(null);
            setShowForm(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upload template');
        } finally {
            setSubmitting(false);
        }
    };

    const { confirm } = useConfirm();

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Delete this template?', type: 'danger' })) return;
        try {
            await documentTemplatesApi.delete(id);
            loadData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Standardized Header */}
            <PageHeader
                title="Management Templates"
                subtitle="Global document structure and manifestation registry"
                icon={LayoutTemplate}
                actions={
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary flex items-center gap-2"
                    >
                        {showForm ? <Trash2 size={14} /> : <Plus size={14} />}
                        {showForm ? 'Abort Operation' : 'Register Template'}
                    </button>
                }
            />

            {showForm && (
                <div className="ent-card p-6 border-primary-100/50 bg-gradient-to-br from-white to-gray-50/50">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-2.5 rounded-md bg-primary-900 text-white">
                            <UploadCloud size={16} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">Registration protocol</h3>
                            <p className="text-[10px] text-gray-500 font-bold leading-relaxed max-w-2xl italic">
                                Initialize a new strategic document template. Supported format: .DOCX. These templates serve as the digital ledger
                                for automated generation of offer letters, contracts, and financial manifestations.
                            </p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        <div className="md:col-span-6 ent-form-group">
                            <label className="ent-label">Template Identifier</label>
                            <input
                                type="text" required
                                value={name} onChange={e => setName(e.target.value)}
                                className="ent-input"
                                placeholder="e.g. STRATEGIC_OFFER_MANIFEST_2024"
                            />
                        </div>
                        <div className="md:col-span-6 ent-form-group">
                            <label className="ent-label">Classification node</label>
                            <CustomSelect
                                options={[
                                    { label: 'Offer Letter', value: 'OfferLetter' },
                                    { label: 'Payslip', value: 'Payslip' },
                                    { label: 'Contract', value: 'Contract' },
                                    { label: 'Invoice', value: 'Invoice' }
                                ]}
                                value={type}
                                onChange={val => setType(val)}
                            />
                        </div>
                        <div className="md:col-span-6 ent-form-group">
                            <label className="ent-label">Letterhead overlay encryption</label>
                            <CustomSelect
                                options={[
                                    { label: 'None (Use Native Design)', value: 'NONE' },
                                    { label: 'Initial Page Only', value: 'FIRST_PAGE' },
                                    { label: 'All Global Pages', value: 'ALL_PAGES' }
                                ]}
                                value={letterheadMode}
                                onChange={val => setLetterheadMode(val)}
                            />
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-1.5 italic">Requires verified company letterhead PDF in settings.</p>
                        </div>
                        <div className="md:col-span-6 ent-form-group">
                            <label className="ent-label">Source manifest (.DOCX)</label>
                            <input
                                type="file" accept=".docx" required
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="ent-input py-1.5"
                            />
                        </div>

                        <div className="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button" onClick={() => setShowForm(false)}
                                className="ent-button-secondary"
                            >
                                Abort
                            </button>
                            <button
                                type="submit" disabled={submitting}
                                className="btn-primary"
                            >
                                {submitting ? <LoadingSpinner size="sm" className="mr-2" /> : <UploadCloud size={14} className="mr-2" />}
                                {submitting ? 'Executing Upload...' : 'Commit Template'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="p-20 flex flex-col items-center justify-center animate-pulse">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Template Intelligence...</p>
                </div>
            ) : templates.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                    <Shield size={40} className="text-gray-300 mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Zero document nodes detected. Initialize first registry.</p>
                </div>
            ) : (
                <div className="ent-card overflow-hidden">
                    <table className="ent-table">
                        <thead>
                            <tr>
                                <th>Template Identity</th>
                                <th>Classification</th>
                                <th>Overlay Protocol</th>
                                <th>Activation Date</th>
                                <th className="text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-gray-50 text-primary-600 border border-gray-100">
                                                <FileText size={14} />
                                            </div>
                                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{t.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[8px] font-black uppercase tracking-widest">
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        {t.letterheadMode}
                                    </td>
                                    <td className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end px-2">
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-[9px] font-black text-gray-300 hover:text-rose-600 uppercase tracking-widest transition-colors"
                                            >
                                                Purge template
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
