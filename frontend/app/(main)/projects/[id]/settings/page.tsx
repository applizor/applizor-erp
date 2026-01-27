'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, AlertTriangle, Shield, Archive, Trash2, Bell } from 'lucide-react';

export default function ProjectSettingsPage({ params }: { params: { id: string } }) {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [saving, setSaving] = useState(false);

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

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* 1. Project Configuration & Notifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Config Placeholder - Edit actions are in modal */}
                <div className="ent-card p-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Bell size={14} className="text-primary-600" />
                        Notifications
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <h4 className="text-xs font-bold text-gray-900">Task Updates</h4>
                                <p className="text-[10px] text-gray-500">Receive alerts when tasks change status</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <h4 className="text-xs font-bold text-gray-900">Milestone Deadlines</h4>
                                <p className="text-[10px] text-gray-500">Alerts 24 hours before due dates</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
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
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                        Save Changes
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/4">Module / Feature</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-1/4">Manager</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-1/4">Member</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-1/4">Viewer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                            {/* Tasks Module */}
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">Task Management</div>
                                    <div className="text-[9px] text-gray-400 font-normal mt-0.5">View, Create, Edit, Delete Tasks</div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex flex-col gap-1 items-center opacity-50 cursor-not-allowed">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase">Full Access</span>
                                        <Shield size={12} className="text-emerald-500" />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member.tasks.view} onChange={() => togglePermission('member', 'tasks', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" /> <span className="text-[9px] uppercase">View</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member.tasks.edit} onChange={() => togglePermission('member', 'tasks', 'edit')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" /> <span className="text-[9px] uppercase">Edit</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.viewer.tasks.view} onChange={() => togglePermission('viewer', 'tasks', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" /> <span className="text-[9px] uppercase">View</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-50">
                                            <input type="checkbox" disabled className="rounded border-gray-300 bg-gray-100 h-3 w-3" /> <span className="text-[9px] uppercase text-gray-400">Edit</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            {/* Financials Module */}
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">Financial Data</div>
                                    <div className="text-[9px] text-gray-400 font-normal mt-0.5">Access Budget, Revenue, Expenses</div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex flex-col gap-1 items-center opacity-50 cursor-not-allowed">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase">Full Access</span>
                                        <Shield size={12} className="text-emerald-500" />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member.financials.view} onChange={() => togglePermission('member', 'financials', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" /> <span className="text-[9px] uppercase">View</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.viewer.financials.view} onChange={() => togglePermission('viewer', 'financials', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" /> <span className="text-[9px] uppercase">View</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>

                            {/* Milestones Module */}
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">Milestones</div>
                                    <div className="text-[9px] text-gray-400 font-normal mt-0.5">Manage Project Roadmap</div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex flex-col gap-1 items-center opacity-50 cursor-not-allowed">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase">Full Access</span>
                                        <Shield size={12} className="text-emerald-500" />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member.milestones.view} onChange={() => togglePermission('member', 'milestones', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" /> <span className="text-[9px] uppercase">View</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.member.milestones.create} onChange={() => togglePermission('member', 'milestones', 'create')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" /> <span className="text-[9px] uppercase">Create</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={permissions.viewer.milestones.view} onChange={() => togglePermission('viewer', 'milestones', 'view')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" /> <span className="text-[9px] uppercase">View</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Danger Zone */}
            <div className="ent-card p-6 border-l-4 border-l-rose-500">
                <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Danger Zone
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                    Irreversible actions. Please proceed with caution.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-rose-100 bg-rose-50 rounded-lg">
                        <div>
                            <h4 className="text-xs font-bold text-gray-900">Archive Project</h4>
                            <p className="text-[10px] text-gray-500">Make read-only and hide from active lists.</p>
                        </div>
                        <button className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors flex items-center gap-2">
                            <Archive size={12} /> Archive
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-rose-100 bg-rose-50 rounded-lg">
                        <div>
                            <h4 className="text-xs font-bold text-gray-900">Delete Project</h4>
                            <p className="text-[10px] text-gray-500">Permanently remove all data and files.</p>
                        </div>
                        <button className="px-4 py-2 bg-rose-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors flex items-center gap-2">
                            <Trash2 size={12} /> Delete Forever
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
