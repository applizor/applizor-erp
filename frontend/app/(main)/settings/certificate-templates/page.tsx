'use client';

import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/context/ConfirmationContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';

import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, XCircle, ArrowLeft, Check, Play, Info } from 'lucide-react';
import Link from 'next/link';
import { certificateTemplateApi, CertificateTemplate } from '@/lib/api/certificate';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function CertificateTemplatesPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const { can, user } = usePermission();

    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<CertificateTemplate>>({
        name: '',
        type: 'course',
        content: '',
        variables: [],
        isActive: true
    });

    const [variablesString, setVariablesString] = useState('');

    useEffect(() => {
        if (user) {
            loadTemplates();
        }
    }, [user]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const res = await certificateTemplateApi.list();
            setTemplates(res.data);
        } catch (error) {
            toast.error('Failed to load certificate templates');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tmpl: CertificateTemplate) => {
        setFormData(tmpl);
        setVariablesString(tmpl.variables ? tmpl.variables.join(', ') : '');
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const parsedVariables = variablesString
                .split(',')
                .map(v => v.trim())
                .filter(v => v.length > 0);

            const payload = {
                ...formData,
                variables: parsedVariables
            };

            if (isEditing && formData.id) {
                await certificateTemplateApi.update(formData.id, payload);
                toast.success('Template updated successfully');
            } else {
                await certificateTemplateApi.create(payload);
                toast.success('Template created successfully');
            }

            setIsModalOpen(false);
            resetForm();
            loadTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Are you sure you want to delete this template? Any draft certificates linked to it may fall back to defaults.', type: 'danger' })) return;
        try {
            await certificateTemplateApi.delete(id);
            toast.success('Template deleted successfully');
            loadTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete template');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'course',
            content: `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Helvetica', sans-serif; margin: 0; padding: 40px; text-align: center; }
  .cert-container { border: 10px double #001C30; padding: 30px; position: relative; }
  .title { font-size: 32px; font-weight: bold; color: #001C30; text-transform: uppercase; margin-bottom: 20px; }
  .subtitle { font-size: 18px; margin-bottom: 30px; }
  .name { font-size: 24px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
  .details { font-size: 14px; margin-bottom: 40px; }
</style>
</head>
<body>
  <div class="cert-container">
    <div class="title">{{title}}</div>
    <div class="subtitle">This is to certify that</div>
    <div class="name">{{recipientName}}</div>
    <div class="details">has successfully completed the course <strong>{{courseName}}</strong>.</div>
  </div>
</body>
</html>`,
            variables: [],
            isActive: true
        });
        setVariablesString('');
        setIsEditing(false);
    };

    if (user && !can('CertificateTemplate', 'read')) {
        return <AccessDenied />;
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Certificate Templates"
                subtitle="Design and structure branding templates for credentials"
                icon={Settings}
                actions={
                    <div className="flex items-center gap-3">
                        <Link href="/hrms/certificates" className="ent-button-secondary flex items-center gap-2">
                            <ArrowLeft size={14} /> Back to Ledger
                        </Link>
                        {can('CertificateTemplate', 'create') && (
                            <button
                                onClick={() => { resetForm(); setIsModalOpen(true); }}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={14} /> Add Template
                            </button>
                        )}
                    </div>
                }
            />

            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Certificate Layouts</h3>
                </div>
                <div className="ent-table-container">
                    <table className="ent-table min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr>
                                <th>Template Name</th>
                                <th>Type Category</th>
                                <th>Placeholders supported</th>
                                <th className="text-center">Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400 italic">
                                        No templates found. Add a custom layout to begin.
                                    </td>
                                </tr>
                            ) : (
                                templates.map((tmpl) => (
                                    <tr key={tmpl.id} className="hover:bg-gray-50/50">
                                        <td className="font-bold text-gray-900">{tmpl.name}</td>
                                        <td className="text-[10px] font-black uppercase tracking-wider">
                                            {tmpl.type === 'course' && <span className="text-blue-600">Course Certificate</span>}
                                            {tmpl.type === 'internship' && <span className="text-purple-600">Internship Certificate</span>}
                                            {tmpl.type === 'experience' && <span className="text-emerald-600">Experience Letter</span>}
                                            {tmpl.type === 'custom' && <span className="text-slate-600">Custom Document</span>}
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {tmpl.variables && tmpl.variables.map(v => (
                                                    <span key={v} className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                                        {v}
                                                    </span>
                                                ))}
                                                {(!tmpl.variables || tmpl.variables.length === 0) && (
                                                    <span className="text-gray-400 italic text-[11px]">none</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${tmpl.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                {tmpl.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(tmpl)}
                                                    className="p-1.5 text-gray-600 hover:text-primary-900 hover:bg-gray-100 rounded"
                                                    title="Edit Template"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tmpl.id)}
                                                    className="p-1.5 text-red-500 hover:text-red-900 hover:bg-red-50 rounded"
                                                    title="Delete Template"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-md shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                    {isEditing ? 'Modify Template' : 'Create Template Layout'}
                                </h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                    Configure HTML & styles for certificate overlays
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="ent-form-group">
                                        <label className="ent-label">Template Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="ent-input"
                                            placeholder="e.g. Standard React Certificate"
                                        />
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="ent-label">Template Category *</label>
                                        <CustomSelect
                                            value={formData.type}
                                            onChange={(val: any) => setFormData({ ...formData, type: val })}
                                            options={[
                                                { label: 'Course Certificate', value: 'course' },
                                                { label: 'Internship Certificate', value: 'internship' },
                                                { label: 'Experience Letter', value: 'experience' },
                                                { label: 'Custom Document', value: 'custom' }
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div className="ent-form-group">
                                    <label className="ent-label">Extra Placeholders / Variables</label>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                                        Comma-separated list of values (e.g. mentor_name, grade, project_title)
                                    </p>
                                    <input
                                        type="text"
                                        value={variablesString}
                                        onChange={(e) => setVariablesString(e.target.value)}
                                        className="ent-input text-xs font-mono"
                                        placeholder="mentor_name, grade, project_title"
                                    />
                                </div>

                                <div className="ent-form-group flex-1 flex flex-col min-h-[300px]">
                                    <label className="ent-label mb-1">HTML Template Body *</label>
                                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-2.5 mb-2 flex items-start gap-2">
                                        <Info size={14} className="shrink-0 mt-0.5 text-amber-700" />
                                        <div className="text-[10px]">
                                            <strong>Core Placeholders available:</strong> <code>{"{{title}}"}</code>, <code>{"{{recipientName}}"}</code>, <code>{"{{certificateNo}}"}</code>, <code>{"{{issuedDate}}"}</code>, <code>{"{{expiryDate}}"}</code>.
                                            Custom variables declared above will replace matching <code>{"{{variableName}}"}</code> tags.
                                        </div>
                                    </div>
                                    <textarea
                                        required
                                        rows={12}
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="ent-input font-mono text-xs flex-1 w-full bg-slate-900 text-slate-100 focus:bg-slate-900 focus:text-slate-100"
                                        placeholder="<html><body>...</body></html>"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Active Status</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Allow new certificates to be drafted with this layout</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary"
                                >
                                    {saving ? 'Saving...' : 'Synchronise Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
