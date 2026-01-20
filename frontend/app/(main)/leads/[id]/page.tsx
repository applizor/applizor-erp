'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Edit, Trash2, Mail, Phone, Building2, Calendar,
    DollarSign, UserPlus, Clock, CheckCircle, Plus, MessageSquare
} from 'lucide-react';
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
            // Backend returns { lead: {...} }
            const leadData = response.data.lead || response.data;
            console.log('Lead data:', leadData); // Debug
            setLead(leadData);
        } catch (error: any) {
            console.error('Load lead error:', error);
            toast.error(error.response?.data?.error || 'Failed to load lead');
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
            toast.success('Lead deleted successfully');
            router.push('/leads/list');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete lead');
            setDeleting(false);
        }
    };

    const handleConvertToClient = async () => {
        if (!lead) return;

        setConvertDialog(false);
        setConverting(true);
        try {
            await api.post(`/leads/${lead.id}/convert-to-client`);
            toast.success('Lead converted to client successfully');
            router.push('/clients');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to convert lead');
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
                // Update existing activity
                await api.put(`/leads/${lead.id}/activities/${editingActivity.id}`, activityForm);
                toast.success('Activity updated successfully');
            } else {
                // Create new activity
                await api.post(`/leads/${lead.id}/activities`, activityForm);
                toast.success('Activity added successfully');
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
            loadLead(lead.id); // Refresh lead data for nextFollowUpAt
        } catch (error: any) {
            toast.error(error.response?.data?.error || `Failed to ${editingActivity ? 'update' : 'add'} activity`);
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

    const handleDeleteActivity = async (activityId: string) => {
        if (!confirm('Are you sure you want to delete this activity?')) return;

        try {
            await api.delete(`/leads/${lead.id}/activities/${activityId}`);
            toast.success('Activity deleted successfully');
            loadActivities(lead.id);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete activity');
        }
    };

    const handleCompleteActivity = async (activityId: string) => {
        const outcome = prompt('Enter outcome (optional):');

        try {
            await api.post(`/leads/${lead.id}/activities/${activityId}/complete`, { outcome });
            toast.success('Activity marked as completed');
            loadActivities(lead.id);
            loadLead(lead.id); // Refresh for lastContactedAt
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to complete activity');
        }
    };

    const handleCloseModal = () => {
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
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!lead) {
        return null;
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            new: 'bg-blue-100 text-blue-800',
            contacted: 'bg-purple-100 text-purple-800',
            qualified: 'bg-green-100 text-green-800',
            proposal: 'bg-yellow-100 text-yellow-800',
            negotiation: 'bg-orange-100 text-orange-800',
            won: 'bg-green-100 text-green-800',
            lost: 'bg-red-100 text-red-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-blue-100 text-blue-800',
            high: 'bg-red-100 text-red-800'
        };
        return styles[priority] || 'bg-gray-100 text-gray-800';
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone size={16} className="text-blue-600" />;
            case 'email': return <Mail size={16} className="text-purple-600" />;
            case 'meeting': return <Calendar size={16} className="text-green-600" />;
            case 'note': return <MessageSquare size={16} className="text-gray-600" />;
            default: return <Clock size={16} className="text-gray-600" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/leads/list"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Leads
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-2xl">
                                {lead.name?.charAt(0).toUpperCase() || 'L'}
                            </span>
                        </div>
                        <div className="ml-4">
                            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(lead.status)}`}>
                                    {lead.status}
                                </span>
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(lead.priority)}`}>
                                    {lead.priority} priority
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {can('Lead', 'update') && can('Client', 'create') && (
                            <button
                                onClick={() => setConvertDialog(true)}
                                disabled={converting || lead.status === 'won'}
                                className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 transition-colors disabled:opacity-50"
                            >
                                <UserPlus size={16} className="mr-2" />
                                {converting ? 'Converting...' : 'Convert to Client'}
                            </button>
                        )}
                        <PermissionGuard module="Lead" action="update">
                            <Link
                                href={`/leads/${lead.id}/edit`}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <Edit size={16} className="mr-2" />
                                Edit
                            </Link>
                        </PermissionGuard>
                        <PermissionGuard module="Lead" action="delete">
                            <button
                                onClick={() => setDeleteDialog(true)}
                                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </button>
                        </PermissionGuard>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Mail className="mr-2 text-primary-600" size={20} />
                            Contact Information
                        </h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{lead.email || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                <dd className="mt-1 text-sm text-gray-900">{lead.phone || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                                <dd className="mt-1 text-sm text-gray-900">{lead.jobTitle || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Website</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {lead.website ? (
                                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                                            {lead.website}
                                        </a>
                                    ) : '-'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Company Information */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Building2 className="mr-2 text-primary-600" size={20} />
                            Company Information
                        </h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Company</dt>
                                <dd className="mt-1 text-sm text-gray-900">{lead.company || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Industry</dt>
                                <dd className="mt-1 text-sm text-gray-900">{lead.industry || '-'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Lead Details */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Details</h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Source</dt>
                                <dd className="mt-1 text-sm text-gray-900 capitalize">{lead.source?.replace('-', ' ') || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Source Details</dt>
                                <dd className="mt-1 text-sm text-gray-900">{lead.sourceDetails || '-'}</dd>
                            </div>
                            {lead.nextFollowUpAt && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Next Follow-up</dt>
                                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                        <Clock size={16} className="mr-2 text-orange-600" />
                                        {new Date(lead.nextFollowUpAt).toLocaleString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </dd>
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{lead.notes || '-'}</dd>
                            </div>
                            {lead.tags && lead.tags.length > 0 && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                                    <dd className="flex flex-wrap gap-2">
                                        {lead.tags.map((tag: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Activities / Follow-ups - MOVED TO TOP */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                <Clock className="mr-2 text-primary-600" size={20} />
                                Activities
                            </h2>
                            {can('LeadActivity', 'create') && (
                                <button
                                    onClick={() => setShowActivityModal(true)}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-primary-600 hover:bg-primary-700"
                                >
                                    <Plus size={14} className="mr-1" />
                                    Add
                                </button>
                            )}
                        </div>
                        {activities.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No activities yet</p>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {activities.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="border-l-4 border-primary-200 pl-3 py-2 hover:bg-gray-50 rounded-r transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start flex-1 min-w-0">
                                                <div className="mt-0.5 mr-2">
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">{activity.title}</h4>
                                                    {activity.description && (
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                                                    )}
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                                        <span className="capitalize">{activity.type}</span>
                                                        <span>•</span>
                                                        <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                                                        {activity.status && (
                                                            <>
                                                                <span>•</span>
                                                                <span className={`px-2 py-0.5 rounded-full ${activity.status === 'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : activity.status === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {activity.status}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                {activity.status === 'pending' && can('LeadActivity', 'update') && (
                                                    <button
                                                        onClick={() => handleCompleteActivity(activity.id)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Mark as complete"
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                )}
                                                {can('LeadActivity', 'update') && (
                                                    <button
                                                        onClick={() => handleEditActivity(activity)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                )}
                                                {can('LeadActivity', 'delete') && (
                                                    <button
                                                        onClick={() => handleDeleteActivity(activity.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {activities.length > 5 && (
                                    <Link
                                        href={`/leads/${lead.id}/activities`}
                                        className="block text-center text-sm text-primary-600 hover:text-primary-800 pt-2"
                                    >
                                        View all {activities.length} activities →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lead Value */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <DollarSign className="mr-2 text-primary-600" size={20} />
                            Lead Value
                        </h2>
                        <div className="text-3xl font-bold text-primary-600">
                            {lead.value ? formatCurrency(parseFloat(lead.value)) : '-'}
                        </div>
                        {lead.probability && (
                            <div className="mt-4">
                                <dt className="text-sm font-medium text-gray-500">Probability</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">{lead.probability}%</dd>
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Calendar className="mr-2 text-primary-600" size={20} />
                            Information
                        </h2>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(lead.updatedAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </dd>
                            </div>
                            {lead.lastContactedAt && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Last Contacted</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(lead.lastContactedAt).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>

            {/* Add/Edit Activity Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingActivity ? 'Edit Activity' : 'Add Activity'}
                        </h3>
                        <form onSubmit={handleAddActivity} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                                    <select
                                        value={activityForm.type}
                                        onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        required
                                    >
                                        <option value="call">📞 Call</option>
                                        <option value="email">📧 Email</option>
                                        <option value="meeting">📅 Meeting</option>
                                        <option value="note">📝 Note</option>
                                        <option value="task">✅ Task</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={activityForm.status}
                                        onChange={(e) => setActivityForm({ ...activityForm, status: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title *</label>
                                <input
                                    type="text"
                                    value={activityForm.title}
                                    onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                                    placeholder="e.g., Follow-up call with client"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={activityForm.description}
                                    onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                                    rows={3}
                                    placeholder="Add details about this activity..."
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Scheduled Date/Time</label>
                                    <input
                                        type="datetime-local"
                                        value={activityForm.scheduledAt}
                                        onChange={(e) => setActivityForm({ ...activityForm, scheduledAt: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">When this activity is planned</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                    <input
                                        type="datetime-local"
                                        value={activityForm.dueDate}
                                        onChange={(e) => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Deadline for completion</p>
                                </div>
                            </div>

                            {activityForm.status === 'completed' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Outcome</label>
                                    <input
                                        type="text"
                                        value={activityForm.outcome}
                                        onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                                        placeholder="e.g., Successful, No answer, Rescheduled"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingActivity}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {savingActivity ? 'Saving...' : editingActivity ? 'Update Activity' : 'Save Activity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Convert to Client Confirmation Dialog */}
            <ConfirmDialog
                isOpen={convertDialog}
                onClose={() => setConvertDialog(false)}
                onConfirm={handleConvertToClient}
                title="Convert Lead to Client"
                message={`Are you sure you want to convert "${lead?.name}" to a client? This will create a new client record and mark this lead as won.`}
                confirmText="Convert to Client"
                cancelText="Cancel"
                type="warning"
                isLoading={converting}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Delete Lead"
                message={`Are you sure you want to delete "${lead.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={deleting}
            />
        </div>
    );
}
