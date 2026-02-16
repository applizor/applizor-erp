
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usePermission } from '@/hooks/usePermission';
import Link from 'next/link';
import { ChevronLeft, Save, Globe } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function NewProjectPage() {
    const router = useRouter();
    const toast = useToast();
    const { can, user } = usePermission();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [clientId, setClientId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('planning');
    const [budget, setBudget] = useState('');

    // CMS Specific State
    const [projectType, setProjectType] = useState<string>('standard');
    const [portalName, setPortalName] = useState('');
    const [portalSubdomain, setPortalSubdomain] = useState('');
    const [portalPlan, setPortalPlan] = useState('basic');

    // Available Data
    const [clients, setClients] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, plansRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/subscription-plans')
                ]);
                setClients(clientsRes.data.clients || []);
                setPlans(plansRes.data || []);

                // Set default plan if plans exist
                if (plansRes.data?.length > 0 && !portalPlan) {
                    setPortalPlan(plansRes.data[0].code);
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            toast.error('Project Title is required');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name,
                description,
                clientId: clientId || null,
                startDate: startDate || null,
                endDate: endDate || null,
                priority,
                status,
                budget: budget ? parseFloat(budget) : null,
                type: projectType,
                portalConfig: projectType === 'news_cms' ? {
                    name: portalName || name,
                    subdomain: portalSubdomain,
                    plan: portalPlan
                } : undefined
            };

            await api.post('/projects', payload);
            toast.success('Project Created Successfully');
            router.push('/projects');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    if (user && !can('Project', 'create')) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                    <h3 className="text-lg font-black text-gray-900 uppercase">Access Denied</h3>
                    <p className="text-sm text-gray-500 mt-2">You do not have permission to create projects.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/projects" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Initiate Project</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Create New Portfolio Entry</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-2">Core Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ent-form-group md:col-span-2">
                            <CustomSelect
                                label="Project Type"
                                value={projectType}
                                onChange={setProjectType}
                                options={[
                                    { label: 'Standard Project', value: 'standard' },
                                    { label: 'News CMS Portal', value: 'news_cms', icon: <Globe size={14} className="text-primary-600" /> }
                                ]}
                                placeholder="Select Type"
                            />
                        </div>

                        {projectType === 'news_cms' && (
                            <div className="col-span-2 border border-blue-100 bg-blue-50/50 rounded-lg p-5 space-y-4">
                                <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={14} /> Portal Configuration
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="ent-form-group">
                                        <label className="ent-label">Portal Name</label>
                                        <input
                                            type="text"
                                            className="ent-input"
                                            value={portalName}
                                            onChange={e => setPortalName(e.target.value)}
                                            placeholder={name || "My News Portal"}
                                        />
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="ent-label">Subdomain</label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                className="ent-input rounded-r-none border-r-0"
                                                value={portalSubdomain}
                                                onChange={e => setPortalSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                placeholder="news-portal"
                                            />
                                            <div className="bg-gray-100 border border-gray-200 border-l-0 rounded-r-md px-3 flex items-center text-xs text-gray-500 font-medium">
                                                .news-app.com
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ent-form-group md:col-span-2">
                                        <CustomSelect
                                            label="Subscription Plan"
                                            value={portalPlan}
                                            onChange={setPortalPlan}
                                            options={plans.map(p => ({
                                                label: `${p.name} (${p.currency === 'INR' ? '₹' : '$'}${p.price}/${p.interval})`,
                                                value: p.code,
                                                description: p.features?.join(', ') || ''
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="ent-form-group md:col-span-2">
                            <label className="ent-label">Project Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="ent-input text-lg font-bold"
                                placeholder="e.g. Q4 Marketing Campaign"
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (projectType === 'news_cms' && !portalName) {
                                        setPortalName(e.target.value);
                                    }
                                }}
                            />
                        </div>

                        <div className="ent-form-group md:col-span-2">
                            <label className="ent-label">Description</label>
                            <textarea
                                className="ent-input min-h-[100px] resize-y"
                                placeholder="Strategic goals and overview..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="ent-form-group">
                            <CustomSelect
                                label="Client"
                                value={clientId}
                                onChange={setClientId}
                                options={[
                                    { label: 'Internal Project', value: '', icon: <Globe size={14} className="text-slate-400" /> },
                                    ...clients.map(c => ({
                                        label: c.name,
                                        value: c.id,
                                        description: c.companyName
                                    }))
                                ]}
                                placeholder="Select Client"
                            />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Total Budget</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                <input
                                    type="number"
                                    className="ent-input pl-7"
                                    placeholder="0.00"
                                    value={budget}
                                    onChange={e => setBudget(e.target.value)}
                                    disabled={projectType === 'news_cms'} // Budget is handled by subscription
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-2">Timeline & Status</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ent-form-group">
                            <label className="ent-label">Start Date</label>
                            <input
                                type="date"
                                className="ent-input"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">End Date (Deadline)</label>
                            <input
                                type="date"
                                className="ent-input"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="ent-form-group">
                            <CustomSelect
                                label="Priority"
                                value={priority}
                                onChange={setPriority}
                                options={[
                                    { label: 'Low', value: 'low' },
                                    { label: 'Medium', value: 'medium' },
                                    { label: 'High', value: 'high' },
                                    { label: 'Urgent', value: 'urgent' }
                                ]}
                                className="uppercase"
                            />
                        </div>

                        <div className="ent-form-group">
                            <CustomSelect
                                label="Initial Status"
                                value={status}
                                onChange={setStatus}
                                options={[
                                    { label: 'Planning', value: 'planning' },
                                    { label: 'Active', value: 'active' },
                                    { label: 'On Hold', value: 'on-hold' }
                                ]}
                                className="uppercase"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 py-3 px-8"
                    >
                        {loading ? <LoadingSpinner size="sm" /> : <Save size={16} />}
                        Create Project
                    </button>
                </div>
            </form>
        </div>
    );
}
