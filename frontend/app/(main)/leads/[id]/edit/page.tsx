'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Globe, TrendingUp, BarChart3, Activity, ArrowLeft, ChevronRight, Save, CreditCard, Tag, FileText, X, Edit } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function EditLeadPage() {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const { can, user } = usePermission();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        website: '',
        industry: '',
        value: '',
        currency: 'INR',
        source: 'website',
        sourceDetails: '',
        status: 'new',
        priority: 'medium',
        notes: '',
        tags: ''
    });

    useEffect(() => {
        if (params.id) {
            loadLead(params.id as string);
        }
    }, [params.id]);

    const loadLead = async (id: string) => {
        try {
            const response = await api.get(`/leads/${id}`);
            const leadData = response.data.lead || response.data;
            setFormData({
                name: leadData.name || '',
                email: leadData.email || '',
                phone: leadData.phone || '',
                company: leadData.company || '',
                jobTitle: leadData.jobTitle || '',
                website: leadData.website || '',
                industry: leadData.industry || '',
                value: leadData.value || '',
                currency: leadData.currency || 'INR',
                source: leadData.source || 'website',
                sourceDetails: leadData.sourceDetails || '',
                status: leadData.status || 'new',
                priority: leadData.priority || 'medium',
                notes: leadData.notes || '',
                tags: Array.isArray(leadData.tags) ? leadData.tags.join(', ') : ''
            });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Intelligence retrieval failed');
            router.push('/leads/list');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Identity signature is required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                value: formData.value ? String(formData.value) : ''
            };

            await api.put(`/leads/${params.id}`, payload);
            toast.success('Intelligence record updated');
            router.push(`/leads/${params.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Reconfiguration protocol failed');
        } finally {
            setSaving(false);
        }
    };

    // Page Level Security
    if (user && !can('Lead', 'update')) {
        return <AccessDenied />;
    }

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center animate-pulse">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Retrieving Strategic Intel...</p>
            </div>
        );
    }

    const tabs = [
        { id: 'identity', label: 'Prospect Identity', icon: <UserPlus size={14} /> },
        { id: 'corporate', label: 'Corporate Entity', icon: <Globe size={14} /> },
        { id: 'strategic', label: 'Strategic Parameters', icon: <BarChart3 size={14} /> },
        { id: 'intel', label: 'Intelligence', icon: <Activity size={14} /> }
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-600 rounded-lg shadow-lg">
                        <Edit className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Reconfigure Opportunity</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            System Context <ChevronRight size={10} className="text-primary-600" /> Intelligence Update Protocol
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/leads/${params.id}`}
                        className="px-4 py-2 text-gray-400 hover:text-gray-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                        <ArrowLeft size={14} /> Discovery View
                    </Link>
                </div>
            </div>

            <div className="ent-card overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50/50">
                    <nav className="flex overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 py-4 px-6 border-b-2 font-black text-[10px] uppercase tracking-[0.15em] transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-primary-600 text-primary-600 bg-white shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]'
                                        : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* Tab Content: Identity */}
                    {activeTab === 'identity' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Prospect Full Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="ent-input w-full"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Professional Designation</label>
                                    <input
                                        type="text"
                                        className="ent-input w-full"
                                        value={formData.jobTitle}
                                        onChange={(e) => handleChange('jobTitle', e.target.value)}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Contact Protocol (Email)</label>
                                    <input
                                        type="email"
                                        className="ent-input w-full"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Contact Protocol (Phone)</label>
                                    <input
                                        type="tel"
                                        className="ent-input w-full"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Corporate */}
                    {activeTab === 'corporate' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Corporate Legal Entity</label>
                                    <input
                                        type="text"
                                        className="ent-input w-full"
                                        value={formData.company}
                                        onChange={(e) => handleChange('company', e.target.value)}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Digital Presence (URL)</label>
                                    <input
                                        type="url"
                                        className="ent-input w-full"
                                        value={formData.website}
                                        onChange={(e) => handleChange('website', e.target.value)}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Industrial Vertical</label>
                                    <input
                                        type="text"
                                        className="ent-input w-full"
                                        value={formData.industry}
                                        onChange={(e) => handleChange('industry', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Strategic */}
                    {activeTab === 'strategic' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Criticality Level (Priority)</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'LOW PRIORITY', value: 'low' },
                                            { label: 'STANDARD PROTOCOL', value: 'medium' },
                                            { label: 'HIGH CRITICALITY', value: 'high' },
                                            { label: 'URGENT INTERVENTION', value: 'urgent' }
                                        ]}
                                        value={formData.priority}
                                        onChange={(val) => handleChange('priority', val)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Pipeline Stage</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'RAW INQUIRY', value: 'new' },
                                            { label: 'DISCOVERY PHASE', value: 'contacted' },
                                            { label: 'ASSESSED & QUALIFIED', value: 'qualified' },
                                            { label: 'PRICED & PROPOSAL', value: 'proposal' },
                                            { label: 'ACTIVE REFINING', value: 'negotiation' },
                                            { label: 'SECURED & WON', value: 'won' },
                                            { label: 'SHELVED & LOST', value: 'lost' }
                                        ]}
                                        value={formData.status}
                                        onChange={(val) => handleChange('status', val)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Strategic Valuation</label>
                                    <div className="flex gap-2">
                                        <CurrencySelect
                                            value={formData.currency}
                                            onChange={(val) => handleChange('currency', val)}
                                            className="w-24 mt-1"
                                        />
                                        <input
                                            type="number"
                                            className="ent-input w-full bg-emerald-50/30 border-emerald-100 font-bold text-emerald-900"
                                            value={formData.value}
                                            onChange={(e) => handleChange('value', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Inbound Protocol (Source)</label>
                                    <CustomSelect
                                        options={[
                                            { label: 'DIRECT WEB PORTAL', value: 'website' },
                                            { label: 'TRUSTED REFERRAL', value: 'referral' },
                                            { label: 'LINKEDIN INTELLIGENCE', value: 'linkedin' },
                                            { label: 'OUTBOUND COLD PROTOCOL', value: 'cold_call' },
                                            { label: 'SOCIAL ARCHIVAL', value: 'social_media' },
                                            { label: 'MISCELLANEOUS DELEGATION', value: 'other' }
                                        ]}
                                        value={formData.source}
                                        onChange={(val) => handleChange('source', val)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Intel */}
                    {activeTab === 'intel' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Intelligence Notes (Contextual Data)</label>
                                <textarea
                                    className="ent-input w-full min-h-[120px] resize-none"
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Categorical Tags (Internal Routing)</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        className="ent-input w-full pl-10"
                                        value={formData.tags}
                                        onChange={(e) => handleChange('tags', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Actions */}
                    <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-10">
                        <div className="flex items-center gap-3">
                            <Link href={`/leads/${params.id}`} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-colors">Discard Reconfiguration</Link>
                        </div>

                        <div className="flex items-center gap-3">
                            {activeTab !== 'intel' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currIdx = tabs.findIndex(t => t.id === activeTab);
                                        if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1].id);
                                    }}
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-gray-900/10"
                                >
                                    Next Phase <ChevronRight size={14} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-2.5 bg-primary-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-2 shadow-xl shadow-primary-900/10 disabled:opacity-50"
                                >
                                    {saving ? 'SYNCHRONIZING...' : 'Commit Intel Changes'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
