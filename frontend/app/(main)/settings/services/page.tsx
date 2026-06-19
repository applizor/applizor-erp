'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, XCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const toast = useToast();

    // Form State
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [category, setCategory] = useState('SaaS');
    const [customCategory, setCustomCategory] = useState('');
    const [description, setDescription] = useState('');

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await api.get('/services');
            setServices(res.data || []);
        } catch (error) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const resetForm = () => {
        setName('');
        setCode('');
        setCategory('SaaS');
        setCustomCategory('');
        setDescription('');
        setEditingService(null);
    };

    const handleEdit = (service: any) => {
        setEditingService(service);
        setName(service.name);
        setCode(service.code);
        setDescription(service.description || '');

        const standardCategories = ['SaaS', 'Marketing', 'Custom Development', 'Consulting'];
        if (standardCategories.includes(service.category)) {
            setCategory(service.category);
            setCustomCategory('');
        } else {
            setCategory('custom');
            setCustomCategory(service.category);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalCategory = category === 'custom' ? customCategory.trim() : category;
            if (!finalCategory) {
                toast.error('Please specify a category');
                return;
            }

            const payload = {
                name,
                code: code.trim(),
                category: finalCategory,
                description
            };

            if (editingService) {
                await api.put(`/services/${editingService.id}`, payload);
                toast.success('Service updated successfully');
            } else {
                await api.post('/services', payload);
                toast.success('Service created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchServices();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save service');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this service?')) return;
        try {
            await api.delete(`/services/${id}`);
            toast.success('Service deactivated');
            fetchServices();
        } catch (error) {
            toast.error('Failed to delete service');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-lg font-black text-gray-900 uppercase">Product & Service Catalog</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage company services and price categories</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={14} /> Add Service
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div key={service.id} className="ent-card border-t-4 border-t-primary-600 flex flex-col justify-between min-h-[180px]">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-sm font-black uppercase text-gray-900">{service.name}</h3>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{service.code}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(service)} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-700 font-extrabold uppercase px-2 py-0.5 rounded">
                                        {service.category}
                                    </span>
                                </div>

                                {service.description && (
                                    <p className="text-[11px] text-slate-500 line-clamp-3 font-semibold mt-1">
                                        {service.description}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 pt-2 border-t border-slate-50 flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded inline-block ${service.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {service.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && (
                        <div className="col-span-full text-center p-12 bg-white rounded-md border border-slate-100 text-slate-400 font-bold text-xs">
                            No services defined in the catalog yet. Click "Add Service" to create one.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-sm font-black uppercase text-gray-900">
                                {editingService ? 'Edit Service' : 'New Product/Service'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                                <XCircle size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="ent-form-group">
                                <label className="ent-label">Service Name</label>
                                <input type="text" className="ent-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Retail ERP Software" />
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label">Internal Code (for AI matching)</label>
                                <input type="text" className="ent-input" value={code} onChange={e => setCode(e.target.value)} required placeholder="e.g. retail_erp" />
                            </div>

                            <div className="ent-form-group">
                                <CustomSelect
                                    label="Service Category"
                                    value={category}
                                    onChange={setCategory}
                                    options={[
                                        { label: 'SaaS Suite', value: 'SaaS' },
                                        { label: 'Marketing & SEO', value: 'Marketing' },
                                        { label: 'Custom Development', value: 'Custom Development' },
                                        { label: 'Consulting', value: 'Consulting' },
                                        { label: '+ Add Custom Category...', value: 'custom' }
                                    ]}
                                />
                            </div>

                            {category === 'custom' && (
                                <div className="ent-form-group animate-fade-in">
                                    <label className="ent-label">Custom Category Name</label>
                                    <input type="text" className="ent-input" value={customCategory} onChange={e => setCustomCategory(e.target.value)} required placeholder="e.g. Hardware Maintenance" />
                                </div>
                            )}

                            <div className="ent-form-group">
                                <label className="ent-label">Description</label>
                                <textarea className="ent-input min-h-[80px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Service package overview and details..." />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="btn-primary w-full py-3">
                                    {editingService ? 'Update Service' : 'Create Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
