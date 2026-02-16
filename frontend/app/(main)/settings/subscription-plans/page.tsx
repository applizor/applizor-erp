
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function SubscriptionPlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const toast = useToast();

    // Form State
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [interval, setInterval] = useState('monthly');
    const [features, setFeatures] = useState('');

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await api.get('/subscription-plans');
            setPlans(res.data || []);
        } catch (error) {
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const resetForm = () => {
        setName('');
        setCode('');
        setPrice('');
        setCurrency('INR');
        setInterval('monthly');
        setFeatures('');
        setEditingPlan(null);
    };

    const handleEdit = (plan: any) => {
        setEditingPlan(plan);
        setName(plan.name);
        setCode(plan.code);
        setPrice(plan.price.toString());
        setCurrency(plan.currency || 'INR');
        setInterval(plan.interval);
        setFeatures(plan.features?.join(', ') || '');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name,
                code,
                price: parseFloat(price),
                currency,
                interval,
                features: features.split(',').map(f => f.trim()).filter(f => f)
            };

            if (editingPlan) {
                await api.put(`/subscription-plans/${editingPlan.id}`, payload);
                toast.success('Plan updated successfully');
            } else {
                await api.post('/subscription-plans', payload);
                toast.success('Plan created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchPlans();
        } catch (error) {
            toast.error('Failed to save plan');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;
        try {
            await api.delete(`/subscription-plans/${id}`);
            toast.success('Plan deleted');
            fetchPlans();
        } catch (error) {
            toast.error('Failed to delete plan');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-lg font-black text-gray-900 uppercase">Subscription Plans</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage News CMS Billing Plans</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={14} /> Create Plan
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="ent-card border-t-4 border-t-primary-600">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-sm font-black uppercase text-gray-900">{plan.name}</h3>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{plan.code}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(plan)} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="text-[10px] text-gray-500 font-bold uppercase mr-1">{plan.currency || 'INR'}</span>
                                <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase ml-1">/ {plan.interval}</span>
                            </div>

                            <div className="space-y-2 mb-6">
                                {plan.features?.map((feature: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                        <CheckCircle size={12} className="text-green-500" />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${plan.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {plan.isActive ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-sm font-black uppercase text-gray-900">
                                {editingPlan ? 'Edit Plan' : 'New Subscription Plan'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                                <XCircle size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="ent-form-group">
                                <label className="ent-label">Plan Name</label>
                                <input type="text" className="ent-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Professional" />
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label">Internal Code</label>
                                <input type="text" className="ent-input" value={code} onChange={e => setCode(e.target.value)} required placeholder="e.g. pro_monthly" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="ent-label">Price</label>
                                    <input type="number" className="ent-input" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" />
                                </div>
                                <div className="ent-form-group">
                                    <CustomSelect
                                        label="Currency"
                                        value={currency}
                                        onChange={setCurrency}
                                        options={[
                                            { label: 'INR (₹)', value: 'INR' },
                                            { label: 'USD ($)', value: 'USD' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="ent-form-group">
                                <CustomSelect
                                    label="Interval"
                                    value={interval}
                                    onChange={setInterval}
                                    options={[
                                        { label: 'Monthly', value: 'monthly' },
                                        { label: 'Yearly', value: 'yearly' }
                                    ]}
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label">Features (Comma separated)</label>
                                <textarea className="ent-input min-h-[80px]" value={features} onChange={e => setFeatures(e.target.value)} placeholder="AI Writing, Unlimited Posts, etc." />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="btn-primary w-full py-3">
                                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
