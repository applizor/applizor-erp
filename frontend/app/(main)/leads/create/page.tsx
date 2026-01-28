'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Globe, TrendingUp, BarChart3, Activity, ArrowLeft, ChevronRight, Save, CreditCard, Tag, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { CurrencySelect } from '@/components/ui/CurrencySelect';

export default function CreateLeadPage() {
    const toast = useToast();
    const router = useRouter();
    const { currency } = useCurrency();
    const { can, user } = usePermission();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');

    // Page Level Security
    if (user && !can('Lead', 'create')) {
        return <AccessDenied />;
    }

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
        tags: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
            value: formData.value ? String(formData.value) : '',
        };

        try {
            await api.post('/leads', payload);
            toast.success('Opportunity committed to registry');
            router.push('/leads/list');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Acquisition protocol failed');
        } finally {
            setLoading(false);
        }
    };

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
                    <div className="p-3 bg-primary-900 rounded-lg shadow-lg">
                        <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Acquire New Opportunity</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Revenue Pipeline <ChevronRight size={10} className="text-primary-600" /> Lead Acquisition Protocol
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/leads/list"
                        className="px-4 py-2 text-gray-400 hover:text-gray-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                        <ArrowLeft size={14} /> Abort Protocol
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
                                        placeholder="EX: NATHAN DRAKE"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Professional Designation</label>
                                    <input
                                        type="text"
                                        className="ent-input w-full"
                                        placeholder="EX: CHIEF ACQUISITION OFFICER"
                                        value={formData.jobTitle}
                                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Contact Protocol (Email)</label>
                                    <input
                                        type="email"
                                        className="ent-input w-full"
                                        placeholder="EX: NATHAN@UNCHARTERED.COM"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Contact Protocol (Phone)</label>
                                    <input
                                        type="tel"
                                        className="ent-input w-full"
                                        placeholder="EX: +1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                                        placeholder="EX: ABSTERGO INDUSTRIES"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Digital Presence (URL)</label>
                                    <input
                                        type="url"
                                        className="ent-input w-full"
                                        placeholder="EX: HTTPS://WWW.ABSTERGO.COM"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Industrial Vertical</label>
                                    <input
                                        type="text"
                                        className="ent-input w-full"
                                        placeholder="EX: AEROSPACE & DEFENSE"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
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
                                    <select
                                        className="ent-input w-full"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">LOW PRIORITY</option>
                                        <option value="medium">STANDARD PROTOCOL</option>
                                        <option value="high">HIGH CRITICALITY</option>
                                        <option value="urgent">URGENT INTERVENTION</option>
                                    </select>
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Strategic Valuation</label>
                                    <div className="flex gap-2">
                                        <CurrencySelect
                                            value={formData.currency}
                                            onChange={(val) => setFormData({ ...formData, currency: val })}
                                            className="w-24 mt-1"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="ent-input w-full bg-emerald-50/30 border-emerald-100 font-bold text-emerald-900"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Inbound Protocol (Source)</label>
                                    <select
                                        className="ent-input w-full"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    >
                                        <option value="website">DIRECT WEB PORTAL</option>
                                        <option value="referral">TRUSTED REFERRAL</option>
                                        <option value="linkedin">LINKEDIN INTELLIGENCE</option>
                                        <option value="cold_call">OUTBOUND COLD PROTOCOL</option>
                                        <option value="social_media">SOCIAL ARCHIVAL</option>
                                        <option value="other">MISCELLANEOUS DELEGATION</option>
                                    </select>
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Source Specification</label>
                                    <input
                                        type="text"
                                        className="ent-input w-full"
                                        placeholder="EX: Q3 CAMPAIGN - OMEGA"
                                        value={formData.sourceDetails}
                                        onChange={(e) => setFormData({ ...formData, sourceDetails: e.target.value })}
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
                                    placeholder="COLLECT RELEVANT CONTEXT, MEETING TRANSCRIPTS, OR STRATEGIC INTEL..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Categorical Tags (Internal Routing)</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        className="ent-input w-full pl-10"
                                        placeholder="EX: TECH, PRIORITY_A1, ENTERPRISE (COMMA SEPARATED)"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Actions */}
                    <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-10">
                        <div className="flex items-center gap-3">
                            <Link href="/leads/list" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-colors">Terminate Operation</Link>
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
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-primary-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-primary-900/10 disabled:opacity-50"
                                >
                                    {loading ? 'SYNCHRONIZING...' : 'Commit to Registry'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
