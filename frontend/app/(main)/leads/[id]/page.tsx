'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Edit, Edit2, Calendar, Phone, Mail, MapPin, User, Building, MessageSquare, Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle, Plus, Send, TrendingUp, UserPlus, Globe, FileText, Tag, Activity, X, ChevronRight } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/context/CurrencyContext';

export default function LeadDetailPage() {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const { can } = usePermission();
    const { formatCurrency } = useCurrency();
    const [lead, setLead] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [converting, setConverting] = useState(false);
    const [convertDialog, setConvertDialog] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [savingActivity, setSavingActivity] = useState(false);
    const [editingActivity, setEditingActivity] = useState<any>(null);
    const [activityForm, setActivityForm] = useState({
        type: 'call',
        title: '',
        description: '',
        scheduledAt: '',
        dueDate: '',
        status: 'pending',
        outcome: ''
    });

    useEffect(() => {
        if (params.id) {
            loadLead(params.id as string);
            loadActivities(params.id as string);
        }
    }, [params.id]);

    const loadLead = async (id: string) => {
        try {
            const response = await api.get(`/leads/${id}`);
            const leadData = response.data.lead || response.data;
            setLead(leadData);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Intelligence retrieval failed');
            router.push('/leads/list');
        } finally {
            setLoading(false);
        }
    };

    const loadActivities = async (id: string) => {
        try {
            const response = await api.get(`/leads/${id}/activities`);
            setActivities(response.data.activities || []);
        } catch (error) {
            console.error('Failed to load activities');
        }
    };

    const handleDelete = async () => {
        if (!lead) return;
        setDeleting(true);
        try {
            await api.delete(`/leads/${lead.id}`);
            toast.success('Opportunity purged from registry');
            router.push('/leads/list');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Purge protocol failed');
            setDeleting(false);
        }
    };

    const handleConvertToClient = async () => {
        if (!lead) return;
        setConvertDialog(false);
        setConverting(true);
        try {
            await api.post(`/leads/${lead.id}/convert-to-client`);
            toast.success('Opportunity upgraded to Client Registry');
            router.push('/clients');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Conversion protocol failed');
        } finally {
            setConverting(false);
        }
    };

    const handleAddActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lead || !activityForm.title.trim()) {
            toast.error('Activity title is required');
            return;
        }

        setSavingActivity(true);
        try {
            if (editingActivity) {
                await api.put(`/leads/${lead.id}/activities/${editingActivity.id}`, activityForm);
                toast.success('Activity updated');
            } else {
                await api.post(`/leads/${lead.id}/activities`, activityForm);
                toast.success('Activity recorded');
            }

            setShowActivityModal(false);
            setEditingActivity(null);
            setActivityForm({
                type: 'call',
                title: '',
                description: '',
                scheduledAt: '',
                dueDate: '',
                status: 'pending',
                outcome: ''
            });
            loadActivities(lead.id);
            loadLead(lead.id);
        } catch (error: any) {
            toast.error(error.response?.data?.error || `Protocol failed`);
        } finally {
            setSavingActivity(false);
        }
    };

    const handleEditActivity = (activity: any) => {
        setEditingActivity(activity);
        setActivityForm({
            type: activity.type || 'call',
            title: activity.title || '',
            description: activity.description || '',
            scheduledAt: activity.scheduledAt ? new Date(activity.scheduledAt).toISOString().slice(0, 16) : '',
            dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().slice(0, 16) : '',
            status: activity.status || 'pending',
            outcome: activity.outcome || ''
        });
        setShowActivityModal(true);
    };

    const { confirm } = useConfirm();

    const handleDeleteActivity = async (activityId: string) => {
        if (!await confirm({ message: 'Are you sure you want to delete this activity?', type: 'danger' })) return;
        try {
            await api.delete(`/leads/${lead.id}/activities/${activityId}`);
            toast.success('Activity purged');
            loadActivities(lead.id);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Purge failed');
        }
    };

    const handleCompleteActivity = async (activityId: string) => {
        const outcome = prompt('Enter outcome (optional):');
        try {
            await api.post(`/leads/${lead.id}/activities/${activityId}/complete`, { outcome });
            toast.success('Activity synchronized');
            loadActivities(lead.id);
            loadLead(lead.id);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Synchronization failed');
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center animate-pulse">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Retrieving Strategic Intel...</p>
            </div>
        );
    }

    if (!lead) return null;

    const getStatusStyles = (status: string) => {
        const styles: Record<string, string> = {
            new: 'bg-blue-50 text-blue-700 border-blue-100',
            contacted: 'bg-purple-50 text-purple-700 border-purple-100',
            qualified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            proposal: 'bg-amber-50 text-amber-700 border-amber-100',
            negotiation: 'bg-orange-50 text-orange-700 border-orange-100',
            won: 'bg-green-50 text-green-700 border-green-100',
            lost: 'bg-rose-50 text-rose-700 border-rose-100'
        };
        return styles[status] || 'bg-gray-50 text-gray-700 border-gray-100';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            new: 'RAW INQUIRY',
            contacted: 'DISCOVERY PHASE',
            qualified: 'QUALIFIED LEAD',
            proposal: 'PROPOSAL PENDING',
            negotiation: 'NEGOTIATION',
            won: 'SECURED DEAl',
            lost: 'SHELVED'
        };
        return labels[status] || status.toUpperCase();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header / Command Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-5 rounded-lg border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-lg shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">{lead.name}</h2>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Revenue Pipeline <ChevronRight size={10} className="text-primary-600" /> Opportunity Discovery
                        </p>
                    </div>
                    <div className={`ml-4 px-3 py-1 border rounded font-black text-[9px] uppercase tracking-widest ${getStatusStyles(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {can('Lead', 'update') && can('Client', 'create') && (
                        <button
                            onClick={() => setConvertDialog(true)}
                            disabled={converting || lead.status === 'won'}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 rounded transition-all disabled:opacity-50"
                        >
                            <UserPlus size={14} /> {converting ? 'PROTOCOL IN PROGRESS...' : 'Commit to Client Registry'}
                        </button>
                    )}
                    <PermissionGuard module="Lead" action="update">
                        <Link
                            href={`/leads/${lead.id}/edit`}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 rounded transition-all"
                        >
                            <Edit size={14} /> Reconfigure
                        </Link>
                    </PermissionGuard>
                    <PermissionGuard module="Lead" action="delete">
                        <button
                            onClick={() => setDeleteDialog(true)}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 rounded transition-all"
                        >
                            <Trash2 size={14} /> Purge
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Discovery Dossier */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Identity & Corporate Map */}
                    <div className="ent-card p-0 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                <Globe size={12} className="text-primary-600" /> Identity & Corporate Matrix
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Corporate Entity</label>
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{lead.company || 'INTERNAL REGISTRY'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Professional Designation</label>
                                        <p className="text-sm font-bold text-gray-700 uppercase">{lead.jobTitle || 'UNSPECIFIED'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Industrial Vertical</label>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{lead.industry || 'GENERAL SECTOR'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-3">Communication Protocols</label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <Mail size={14} className="text-primary-500" />
                                                <span className="font-medium">{lead.email || 'NO_EMAIL_RECORDED'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <Phone size={14} className="text-emerald-500" />
                                                <span className="font-medium">{lead.phone || 'NO_PHONE_RECORDED'}</span>
                                            </div>
                                            {lead.website && (
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <Globe size={14} className="text-indigo-500" />
                                                    <a href={lead.website} target="_blank" className="text-primary-600 hover:underline font-bold truncate">{lead.website}</a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Strategic Intel */}
                    <div className="ent-card p-0 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                <FileText size={12} className="text-primary-600" /> Strategic Intelligence Report
                            </h3>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Inbound Protocol</label>
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{lead.source?.replace('-', ' ') || 'DIRECT'}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{lead.sourceDetails || 'NO_CAMPAIGN_DATA'}</p>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Criticality Level</label>
                                    <div className={`text-[10px] font-black px-2 py-0.5 rounded-sm inline-block border ${lead.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                        {lead.priority?.toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Registry Entry</label>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{new Date(lead.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="bg-primary-50/30 p-6 rounded-xl border border-primary-100/50">
                                <label className="text-[9px] font-black uppercase tracking-widest text-primary-400 block mb-4">Intelligence Notes</label>
                                <p className="text-sm text-primary-900/80 leading-relaxed font-medium whitespace-pre-wrap">{lead.notes || 'NO_CONTEXTUAL_INTEL_RECORDED_FOR_THIS_OPPORTUNITY'}</p>
                            </div>

                            {lead.tags && lead.tags.length > 0 && (
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-3">Protocol Tags</label>
                                    <div className="flex flex-wrap gap-2">
                                        {lead.tags.map((tag: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-white border border-gray-100 text-[9px] font-black text-gray-500 rounded uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                                <Tag size={10} className="text-primary-400" /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="space-y-6">
                    {/* Valuation Panel */}
                    <div className="ent-card p-6 bg-primary-900 text-white border-0 shadow-2xl shadow-primary-900/20">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-300 block mb-2">Strategic Valuation</label>
                        <div className="text-4xl font-black tracking-tighter mb-4">
                            {lead.value ? formatCurrency(parseFloat(lead.value)) : '$ 0.00'}
                        </div>
                        <div className="pt-4 border-t border-primary-800 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] text-primary-300 font-black uppercase tracking-widest">Pipeline Weight</p>
                                <p className="text-lg font-black">{lead.probability || 0}%</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-800 rounded-lg flex items-center justify-center">
                                <TrendingUp size={20} className="text-primary-400" />
                            </div>
                        </div>
                    </div>

                    {/* Activity Registry */}
                    <div className="ent-card p-0 overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activity Registry</h3>
                            <button onClick={() => setShowActivityModal(true)} className="p-1.5 bg-primary-900 text-white rounded-md hover:scale-110 transition-transform">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="p-0 max-h-[500px] overflow-y-auto no-scrollbar">
                            {activities.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Activity size={32} className="mx-auto text-gray-100 mb-3" />
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No Tactical Movements Recorded</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="p-4 hover:bg-gray-50/50 transition-colors group">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${activity.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">{activity.title}</h4>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 font-medium line-clamp-2 leading-relaxed">{activity.description}</p>
                                                    <div className="mt-2 flex items-center gap-3">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                                                            <Calendar size={10} /> {new Date(activity.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-[9px] font-black text-primary-600 uppercase tracking-tight bg-primary-50 px-1.5 py-0.5 rounded-sm">
                                                            {activity.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {activity.status === 'pending' && (
                                                        <button onClick={() => handleCompleteActivity(activity.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-600 hover:text-white transition-all">
                                                            <CheckCircle size={10} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleEditActivity(activity)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all">
                                                        <Edit size={10} />
                                                    </button>
                                                    <button onClick={() => handleDeleteActivity(activity.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-600 hover:text-white transition-all">
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Schedule / Flow */}
                    <div className="ent-card p-5 border-l-4 border-l-amber-400">
                        <label className="text-[9px] font-black uppercase tracking-widest text-amber-600 block mb-3">Critical Intervention Schedule</label>
                        <div className="space-y-4">
                            <div>
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Follow-up Expected</dt>
                                <dd className="text-sm font-bold text-gray-900 flex items-center gap-2 mt-1">
                                    <Clock size={14} className="text-amber-500" />
                                    {lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString() : 'PENDING SCHEDULING'}
                                </dd>
                            </div>
                            <div className="pt-3 border-t border-gray-100">
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Contact Event</dt>
                                <dd className="text-xs font-bold text-gray-500 mt-1">
                                    {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : 'NO HISTORICAL RECORD'}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals & Dialogs */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{editingActivity ? 'Modify Movement' : 'Record Strategic Action'}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Registry Synchronization Protocol</p>
                            </div>
                            <button onClick={() => setShowActivityModal(false)} className="text-gray-400 hover:text-gray-900"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddActivity} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Protocol Type</label>
                                    <select value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })} className="ent-input w-full">
                                        <option value="call">TELE-COMM (CALL)</option>
                                        <option value="email">ELECTRONIC MAIL</option>
                                        <option value="meeting">STRATEGIC SESSION</option>
                                        <option value="note">INTELLIGENCE NOTE</option>
                                    </select>
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Movement Status</label>
                                    <select value={activityForm.status} onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })} className="ent-input w-full">
                                        <option value="pending">PENDING EXECUTION</option>
                                        <option value="completed">SYNCHRONIZED</option>
                                        <option value="cancelled">ABORTED</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Operation Title</label>
                                <input type="text" value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} className="ent-input w-full" placeholder="DESCRIBE THE ACTION..." required />
                            </div>
                            <div className="ent-form-group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Tactical Description</label>
                                <textarea value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} rows={3} className="ent-input w-full resize-none" placeholder="RECORD CRITICAL DETAILS..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setShowActivityModal(false)} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Abort</button>
                                <button type="submit" disabled={savingActivity} className="px-6 py-2 bg-primary-900 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-xl shadow-primary-900/10">
                                    {savingActivity ? 'SYNCING...' : 'Commit to Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={convertDialog}
                onClose={() => setConvertDialog(false)}
                onConfirm={handleConvertToClient}
                title="Protocol Upgrade: Client Conversion"
                message={`Initialize final conversion protocol for "${lead?.name}"? A permanent client record will be established and this opportunity will be marked as WON.`}
                confirmText="Execute Upgrade"
                cancelText="Abort"
                type="warning"
                isLoading={converting}
            />

            <ConfirmDialog
                isOpen={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Purge Protocol: Data Deletion"
                message={`Initiate complete erasure of "${lead?.name}" and all associated intelligence from the registry? This action is irreversible.`}
                confirmText="Purge Record"
                cancelText="Abort"
                type="danger"
                isLoading={deleting}
            />
        </div>
    );
}
