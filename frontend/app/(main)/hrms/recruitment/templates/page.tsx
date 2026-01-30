'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Mail, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    type: string;
    isActive: boolean;
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        heading: '', // unused in backend but typical
        body: '',
        type: 'offer'
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('/recruitment/templates');
            setTemplates(res.data);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await api.put(`/recruitment/templates/${editingTemplate.id}`, formData);
            } else {
                await api.post('/recruitment/templates', formData);
            }
            setIsModalOpen(false);
            setEditingTemplate(null);
            setFormData({ name: '', subject: '', heading: '', body: '', type: 'offer' });
            loadTemplates();
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    };

    const { confirm } = useConfirm();

    const handleDelete = async (id: string) => {
        if (await confirm({ message: 'Delete this template?', type: 'danger' })) {
            await api.delete(`/recruitment/templates/${id}`);
            loadTemplates();
        }
    };

    const openEdit = (t: EmailTemplate) => {
        setEditingTemplate(t);
        setFormData({
            name: t.name,
            subject: t.subject,
            heading: '',
            body: t.body,
            type: t.type
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Email Templates</h2>
                    <p className="text-sm text-gray-500">Automate your recruitment communication</p>
                </div>
                <button
                    onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                    <Plus size={18} />
                    <span>Create Template</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((t) => (
                    <div key={t.id} className="bg-white rounded-lg shadow border border-gray-200 p-5 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                                <Mail className="text-primary-500" size={20} />
                                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                            </div>
                            <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${t.type === 'offer' ? 'bg-green-100 text-green-800' :
                                t.type === 'rejection' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {t.type}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2"><strong>Subject:</strong> {t.subject}</p>
                        <p className="text-xs text-gray-400 line-clamp-3 mb-4 bg-gray-50 p-2 rounded">
                            {t.body}
                        </p>
                        <div className="flex justify-end space-x-2 pt-2 border-t">
                            <button onClick={() => openEdit(t)} className="text-blue-600 hover:text-blue-800">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-xl font-bold mb-4">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Template Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="e.g., Offer Letter Standard"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="offer">Offer Letter</option>
                                    <option value="rejection">Rejection</option>
                                    <option value="interview_invite">Interview Invite</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="Your application at Applizor"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Body</label>
                                <textarea
                                    required
                                    rows={6}
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
                                    placeholder="Hello {{firstName}}, ..."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{jobTitle}}'}
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                                    {editingTemplate ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
