import { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, Tag, Briefcase } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CustomSelect } from '@/components/ui/CustomSelect';

import { CurrencySelect } from '@/components/ui/CurrencySelect';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    onUpdate: () => void;
}

export function EditProjectModal({ isOpen, onClose, project, onUpdate }: EditProjectModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        status: '',
        startDate: '',
        endDate: '',
        budget: '',
        currency: 'INR',
        description: ''
    });

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                status: project.status || 'planning',
                startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                budget: project.budget || '',
                currency: project.currency || 'INR',
                description: project.description || ''
            });
        }
    }, [project, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/projects/${project.id}`, {
                ...formData,
                budget: Number(formData.budget)
            });
            toast.success('Project updated successfully');
            onUpdate();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update project');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Edit Project Configuration</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Update core parameters</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-400 hover:text-gray-900">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 ent-form-group">
                        <label className="ent-label">Project Name</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                className="ent-input pl-9"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Project Title"
                                required
                            />
                        </div>
                    </div>

                    <div className="ent-form-group">
                        <label className="ent-label">Status Protocol</label>
                        <CustomSelect
                            value={formData.status}
                            onChange={(val) => setFormData({ ...formData, status: val })}
                            options={[
                                { label: 'Planning', value: 'planning' },
                                { label: 'Active', value: 'active' },
                                { label: 'On Hold', value: 'on-hold' },
                                { label: 'Completed', value: 'completed' },
                                { label: 'Cancelled', value: 'cancelled' }
                            ]}
                            className="w-full"
                        />
                    </div>

                    <div className="ent-form-group">
                        <label className="ent-label">Allocated Budget</label>
                        <div className="flex gap-2">
                            <CurrencySelect
                                value={formData.currency}
                                onChange={(val) => setFormData({ ...formData, currency: val })}
                                className="w-24"
                            />
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    className="ent-input pl-3"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="ent-form-group">
                        <label className="ent-label">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                            <input
                                type="date"
                                className="ent-input pl-9"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="ent-form-group">
                        <label className="ent-label">Deadline / End Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                            <input
                                type="date"
                                className="ent-input pl-9"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 ent-form-group">
                        <label className="ent-label">Description / Scope</label>
                        <textarea
                            className="ent-input h-24 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the project scope..."
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-50">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                            {loading ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
