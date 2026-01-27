'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, AlertTriangle, Shield, Archive, Trash2, Bell, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProjectSettingsPage({ params }: { params: { id: string } }) {
    const toast = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [generalSaving, setGeneralSaving] = useState(false);

    // Form Data for General Config
    const [formData, setFormData] = useState({
        name: '',
        status: '',
        startDate: '',
        endDate: '',
        budget: '',
        description: ''
    });

    // Default Permissions Matrix Structure
    const [permissions, setPermissions] = useState<any>({
        member: {
            tasks: { view: true, create: true, edit: true, delete: false },
            milestones: { view: true, create: false, edit: false, delete: false },
            financials: { view: false, create: false, edit: false, delete: false },
            settings: { view: false, edit: false }
        },
        viewer: {
            tasks: { view: true, create: false, edit: false, delete: false },
            milestones: { view: true, create: false, edit: false, delete: false },
            financials: { view: false, create: false, edit: false, delete: false },
            settings: { view: false, edit: false }
        }
    });

    useEffect(() => {
        fetchSettings();
    }, [params.id]);

    const fetchSettings = async () => {
        try {
            const res = await api.get(`/projects/${params.id}`);
            setProject(res.data);
            setFormData({
                name: res.data.name || '',
                status: res.data.status || 'planning',
                startDate: res.data.startDate ? new Date(res.data.startDate).toISOString().split('T')[0] : '',
                endDate: res.data.endDate ? new Date(res.data.endDate).toISOString().split('T')[0] : '',
                budget: res.data.budget || '',
                description: res.data.description || ''
            });

            if (res.data.settings?.permissions) {
                setPermissions(res.data.settings.permissions);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load project settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralSaving(true);
        try {
            await api.put(`/projects/${params.id}`, {
                ...formData,
                budget: Number(formData.budget)
            });
            toast.success('Project configuration updated');
            // Refresh parent layout if needed, though strictly we might need a context or window reload if name changes
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update project');
        } finally {
            setGeneralSaving(false);
        }
    };

    const handleSavePermissions = async () => {
        setSaving(true);
        try {
            await api.put(`/projects/${params.id}`, {
                settings: {
                    ...project.settings,
                    permissions
                }
            });
            toast.success('Permissions updated successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const togglePermission = (role: string, module: string, action: string) => {
        setPermissions((prev: any) => ({
            ...prev,
            [role]: {
                ...prev[role],
                [module]: {
                    ...prev[role][module],
                    [action]: !prev[role][module][action]
                }
            }
        }));
    };

    const handleDelete = async () => {
        if (!confirm("Are you SURE? This action CANNOT be undone and will delete all project data.")) return;
        try {
            await api.delete(`/projects/${params.id}`);
            toast.success("Project deleted");
            router.push('/projects');
        } catch (error) {
            toast.error("Failed to delete project");
        }
    }

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* 1. General Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 ent-card p-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase size={14} className="text-primary-600" />
                            General Configuration
                        </h3>
                    </div>

                    <form onSubmit={handleSaveGeneral} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Project Name</label>
                            <input
                                type="text"
                                className="ent-input font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Status</label>
                            <select
                                className="ent-input"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Budget</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                <input
                                    type="number"
                                    className="ent-input pl-9"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Start Date</label>
                            <input
                                type="date"
                                className="ent-input"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">End Date</label>
                            <input
                                type="date"
                                className="ent-input"
                                value={formData.endDate}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Description</label>
                            <textarea
                                className="ent-input h-24 resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" disabled={generalSaving} className="btn-primary flex items-center gap-2">
                                {generalSaving ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Notifications & Danger Zone */}
                <div className="space-y-6">
                    <div className="ent-card p-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Bell size={14} className="text-primary-600" />
                            Notifications
                        </h3>
                        {/* Notification Toggles (Visual) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div><h4 className="text-xs font-bold text-gray-900">Task Updates</h4></div>
                                <input type="checkbox" className="toggle" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div><h4 className="text-xs font-bold text-gray-900">Deadlines</h4></div>
                                <input type="checkbox" className="toggle" defaultChecked />
                            </div>
                        </div>
                    </div>

                    <div className="ent-card p-6 border-l-4 border-l-rose-500">
                        <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertTriangle size={14} />
                            Danger Zone
                        </h3>
                        <div className="space-y-3">
                            <button onClick={handleDelete} className="w-full px-4 py-2 bg-rose-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                                <Trash2 size={12} /> Delete Project
                            </button>
                        </div>
                    </div>

                    {/* Integrations */}
                    <div className="ent-card p-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Save size={14} className="text-indigo-600" />
                            Integrations
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Connect external tools to this project.</p>

                        <div className="ent-form-group">
                            <label className="ent-label">Microsoft Teams Webhook URL</label>
                            <input
                                type="url"
                                className="ent-input text-xs"
                                placeholder="https://outlook.office.com/webhook/..."
                                value={project?.settings?.teamsWebhookUrl || ''}
                                onChange={(e) => {
                                    const newSettings = { ...project.settings, teamsWebhookUrl: e.target.value };
                                    setProject({ ...project, settings: newSettings });
                                }}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                Notifications for new tasks/issues will be sent here.
                            </p>
                        </div>

                        <div className="ent-form-group mt-4">
                            <label className="ent-label">Internal Notification Email</label>
                            <input
                                type="email"
                                className="ent-input text-xs"
                                placeholder="team-alerts@applizor.com"
                                value={project?.settings?.notificationEmail || ''}
                                onChange={(e) => {
                                    const newSettings = { ...project.settings, notificationEmail: e.target.value };
                                    setProject({ ...project, settings: newSettings });
                                }}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                New tasks will be emailed to this address (internal distribution list).
                            </p>
                        </div>

                        <button
                            onClick={handleSavePermissions} // Reusing save settings/permissions logic
                            disabled={saving}
                            className="w-full btn-secondary mt-2"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Role Permissions Matrix */}
            <div className="ent-card p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Shield size={14} className="text-primary-600" />
                            Role Permissions Matrix
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">
                            Define granular access controls for project roles
                        </p>
                    </div>
                    <button
                        onClick={handleSavePermissions}
                        disabled={saving}
                        className="btn-secondary flex items-center gap-2"
                    >
                        {saving ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                        Update Permissions
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/4">Module</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-1/4">Manager</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-1/4">Member</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-1/4">Viewer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                            {/* Tasks Module */}
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">Tasks & Issues</div>
                                    <p className="text-[9px] text-gray-400 mt-0.5 font-normal">Manage project deliverables</p>
                                </td>
                                <td className="p-4 text-center"><span className="text-emerald-600 text-[10px] uppercase font-black tracking-widest">Full Access</span></td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.tasks?.view} onChange={() => togglePermission('member', 'tasks', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">View</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.tasks?.create} onChange={() => togglePermission('member', 'tasks', 'create')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">Create</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.tasks?.edit} onChange={() => togglePermission('member', 'tasks', 'edit')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">Edit</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.viewer?.tasks?.view} onChange={() => togglePermission('viewer', 'tasks', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">View</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            {/* Milestones Module */}
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">Milestones</div>
                                    <p className="text-[9px] text-gray-400 mt-0.5 font-normal">Timeline & Critical Path</p>
                                </td>
                                <td className="p-4 text-center"><span className="text-emerald-600 text-[10px] uppercase font-black tracking-widest">Full Access</span></td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.milestones?.view} onChange={() => togglePermission('member', 'milestones', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">View</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.milestones?.create} onChange={() => togglePermission('member', 'milestones', 'create')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">Create</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.milestones?.edit} onChange={() => togglePermission('member', 'milestones', 'edit')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">Edit</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.viewer?.milestones?.view} onChange={() => togglePermission('viewer', 'milestones', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">View</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            {/* Financials Module */}
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">Financials</div>
                                    <p className="text-[9px] text-gray-400 mt-0.5 font-normal">Budget, Revenue, Expenses</p>
                                </td>
                                <td className="p-4 text-center"><span className="text-emerald-600 text-[10px] uppercase font-black tracking-widest">Full Access</span></td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.financials?.view} onChange={() => togglePermission('member', 'financials', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">View Layer</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.viewer?.financials?.view} onChange={() => togglePermission('viewer', 'financials', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">View Layer</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            {/* Settings Module */}
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">Project Settings</div>
                                    <p className="text-[9px] text-gray-400 mt-0.5 font-normal">Edit details, Manage team</p>
                                </td>
                                <td className="p-4 text-center"><span className="text-emerald-600 text-[10px] uppercase font-black tracking-widest">Full Access</span></td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.settings?.view} onChange={() => togglePermission('member', 'settings', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">View</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member?.settings?.edit} onChange={() => togglePermission('member', 'settings', 'edit')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase tracking-wide">Edit</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-center">
                                        <div className="flex flex-col items-center justify-center opacity-30">
                                            <span className="text-[8px] uppercase tracking-widest italic">Restricted</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
