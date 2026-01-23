'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Send, Edit, Download, Mail, Eye, MousePointer, Calendar, History, FileText, CheckCircle, Activity, Globe, Smartphone, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

export default function ContractDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'tracking'>('overview');
    const [sending, setSending] = useState(false);
    const [useLetterhead, setUseLetterhead] = useState(true);

    useEffect(() => {
        fetchContract();
    }, []);

    const fetchContract = async () => {
        try {
            const res = await api.get(`/contracts/${params.id}`);
            setContract(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load contract');
        } finally {
            setLoading(false);
        }
    };

    const handleCompanySign = async () => {
        if (!confirm('Are you sure you want to digitally sign this contract as the authorized company representative?')) return;

        setSending(true); // Reuse loading state
        try {
            // Generate a simple text signature on canvas
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, 400, 100);
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#065f46'; // Emerald 900
                ctx.fillText('Authorized Signatory', 20, 40);
                ctx.font = '16px monospace';
                ctx.fillStyle = '#333';
                ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
            }
            const signature = canvas.toDataURL(); // Base64

            await api.post(`/contracts/${params.id}/sign-company`, { signature });
            toast.success('Contract signed successfully');
            fetchContract();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to sign contract');
        } finally {
            setSending(false);
        }
    };

    const handleSend = async () => {
        setSending(true);
        try {
            await api.post(`/contracts/${params.id}/send`);
            toast.success('Contract sent to client successfully');
            fetchContract(); // Refresh status and activities
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send contract');
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
        </div>
    );

    if (!contract) return <div>Contract not found</div>;

    const stats = [
        { label: 'Total Views', value: contract.viewCount || 0, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Email Opens', value: contract.emailOpens || 0, icon: Mail, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Last Viewed', value: contract.lastViewedAt ? new Date(contract.lastViewedAt).toLocaleDateString() : 'Never', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in my-8 px-4">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/crm/contracts"
                        className="flex items-center text-slate-500 hover:text-primary-600 transition-colors text-[10px] font-black uppercase tracking-widest mb-3"
                    >
                        <ArrowLeft size={12} className="mr-1" />
                        Back to Contracts
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{contract.title}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${contract.status === 'signed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            contract.status === 'sent' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {contract.status}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-sm text-slate-500 font-medium">Client: <span className="text-slate-900 font-bold">{contract.client.name}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sign as Company Button */}
                    {!contract.companySignature && (
                        <Button
                            onClick={handleCompanySign}
                            isLoading={sending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold uppercase tracking-widest text-xs"
                        >
                            <CheckCircle size={14} />
                            Sign as Company
                        </Button>
                    )}

                    {contract.status === 'draft' && (
                        <Link
                            href={`/crm/contracts/${params.id}/edit`}
                            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Edit size={14} /> Edit
                        </Link>
                    )}
                    {contract.status === 'draft' && (
                        <Button
                            onClick={handleSend}
                            isLoading={sending}
                            className="ent-button-primary gap-2"
                        >
                            <Send size={14} />
                            Publish & Send
                        </Button>
                    )}
                    {/* Allow Resending if Sent OR Signed */}
                    {(contract.status === 'sent' || contract.status === 'signed') && (
                        <Button
                            onClick={handleSend}
                            isLoading={sending}
                            variant="secondary"
                            className="gap-2"
                        >
                            <Send size={14} />
                            Resend Email
                        </Button>
                    )}

                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <input
                            type="checkbox"
                            id="useLetterhead"
                            checked={useLetterhead}
                            onChange={(e) => setUseLetterhead(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <label htmlFor="useLetterhead" className="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer select-none">Letterhead</label>
                    </div>

                    <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/contracts/${contract.id}/pdf?useLetterhead=${useLetterhead}`}
                        target="_blank"
                        className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
                    >
                        <Download size={14} /> PDF
                    </a>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 flex gap-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('tracking')}
                    className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'tracking' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                >
                    Tracking
                    <span className="bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded text-[9px]">{contract.viewCount || 0}</span>
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-12 min-h-[500px] prose prose-slate max-w-none prose-headings:font-black prose-p:text-slate-600">
                        {/* Watermark for draft */}
                        {contract.status === 'draft' && (
                            <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
                                <span className="text-8xl font-black text-slate-900 uppercase -rotate-12 block border-4 border-slate-900 p-4 rounded-xl">DRAFT</span>
                            </div>
                        )}
                        <div dangerouslySetInnerHTML={{ __html: contract.content }} />
                    </div>

                    {/* Signatures Section - Always Visible if any signature exists */}
                    {(contract.clientSignature || contract.companySignature) && (
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-start justify-between gap-12 mt-12">

                            {/* Company Signature */}
                            <div className="flex-1 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 pb-2 border-b border-slate-200">Company Signature</h3>
                                {contract.companySignature ? (
                                    <>
                                        <div className="bg-white p-4 border border-emerald-100 rounded-lg inline-block">
                                            <img src={contract.companySignature} alt="Company Signature" className="h-16 opacity-90" />
                                        </div>
                                        <div className="text-xs space-y-1 text-slate-600">
                                            <p className="font-bold text-emerald-700 flex items-center gap-1.5"><CheckCircle size={12} /> Signed by Authorized Representative</p>
                                            <p>Date: {new Date(contract.companySignedAt).toLocaleString()}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center">
                                        <p className="text-xs text-slate-400 font-medium">Waiting for Company Signature</p>
                                    </div>
                                )}
                            </div>

                            {/* Client Signature */}
                            <div className="flex-1 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 pb-2 border-b border-slate-200">Client Signature</h3>
                                {contract.clientSignature ? (
                                    <>
                                        <div className="bg-white p-4 border border-emerald-100 rounded-lg inline-block">
                                            <img src={contract.clientSignature} alt="Client Signature" className="h-16 opacity-90" />
                                        </div>
                                        <div className="text-xs space-y-1 text-slate-600">
                                            <p className="font-bold text-emerald-700 flex items-center gap-1.5"><CheckCircle size={12} /> Signed by {contract.signerName}</p>
                                            <p>Date: {new Date(contract.signedAt).toLocaleString()}</p>
                                            <p className="font-mono text-[10px] text-slate-400">IP: {contract.signerIp}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center">
                                        <p className="text-xs text-slate-400 font-medium">Waiting for Client Signature</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            )}

            {/* Tracking Tab */}
            {activeTab === 'tracking' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat) => (
                            <div key={stat.label} className="ent-card p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                                    <span className="block text-2xl font-black text-slate-900 mt-1">{stat.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-4">
                                <History size={14} /> Activity Timeline
                            </h3>

                            <div className="ent-card p-6">
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                    {contract.activities && contract.activities.length > 0 ? (
                                        contract.activities.map((activity: any, idx: number) => (
                                            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                                {/* Icon */}
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                    {activity.type === 'VIEWED' ? <Eye size={16} className="text-blue-500" /> :
                                                        (activity.type === 'EMAIL_SENT' || activity.type === 'RESENT_EMAIL') ? <Mail size={16} className="text-violet-500" /> :
                                                            (activity.type === 'SIGNED' || activity.type === 'COMPANY_SIGNED') ? <CheckCircle size={16} className="text-emerald-500" /> :
                                                                activity.type === 'DOWNLOADED' ? <Download size={16} className="text-slate-600" /> :
                                                                    <Activity size={16} />}
                                                </div>

                                                {/* Card */}
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between space-x-2 is-active mb-1">
                                                        <div className="font-bold text-slate-900 text-sm">{activity.type.replace(/_/g, ' ')}</div>
                                                        <time className="font-mono text-[10px] text-slate-400">{new Date(activity.createdAt).toLocaleString()}</time>
                                                    </div>
                                                    <div className="text-slate-500 text-xs">
                                                        {activity.type === 'VIEWED' && 'Client viewed the contract details page.'}
                                                        {activity.type === 'EMAIL_SENT' && `Contract sent to ${activity.metadata?.recipient || 'client'}.`}
                                                        {(activity.type === 'SIGNED' || activity.type === 'COMPANY_SIGNED') && `Signed by ${activity.metadata?.name}.`}
                                                        {activity.ipAddress && (
                                                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-50 p-1 rounded inline-flex">
                                                                <Globe size={10} /> {activity.ipAddress}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-slate-400 text-sm">No activity recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Client Device Info (Mockup for now as we don't track device details deeply yet) */}
                            <div className="ent-card p-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Device Analytics</h3>
                                <div className="space-y-4">
                                    {contract.activities?.some((a: any) => a.userAgent?.includes('Mobile')) ? (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                                                <Smartphone size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">Mobile Access</p>
                                                <p className="text-[10px] text-slate-400">Client accessed via mobile device</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 text-slate-400 rounded">
                                                <Monitor size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">Desktop Access</p>
                                                <p className="text-[10px] text-slate-400">Primary access via desktop</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
