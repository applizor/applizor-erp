
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { usePermission } from '@/hooks/usePermission';
import { Save, Trash2, UserPlus, X } from 'lucide-react';

export default function ProjectSettings({ params }: { params: { id: string } }) {
    const router = useRouter();
    const toast = useToast();
    const { can } = usePermission();

    // Project Data
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Member Modal
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');

    useEffect(() => {
        fetchProject();
    }, []);

    const fetchProject = async () => {
        try {
            const res = await api.get(`/projects/${params.id}`);
            setProject(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load project');
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // --- Actions ---

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: project.name,
                description: project.description,
                status: project.status,
                priority: project.priority,
                startDate: project.startDate,
                endDate: project.endDate,
                budget: project.budget ? parseFloat(project.budget) : null
            };
            await api.put(`/projects/${params.id}`, payload);
            toast.success('Project Updated');
        } catch (error) {
            toast.error('Failed to update project');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure? This action cannot be undone.')) return;
        try {
            await api.delete(`/projects/${params.id}`);
            toast.success('Project Deleted');
            router.push('/projects');
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    const handleAddMember = async () => {
        if (!selectedEmployee) return;
        try {
            await api.post(`/projects/${params.id}/members`, {
                employeeId: selectedEmployee,
                role: selectedRole
            });
            toast.success('Member Added');
            setShowMemberModal(false);
            fetchProject(); // Refresh list
        } catch (error) {
            toast.error('Failed to add member');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Remove this member?')) return;
        try {
            await api.delete(`/projects/${params.id}/members/${memberId}`);
            toast.success('Member Removed');
            fetchProject();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    if (loading) return <div className="p-12"><LoadingSpinner /></div>;
    if (!project) return null;

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Configuration</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Settings & Team Management</p>
            </div>

            {/* General Settings */}
            <div className="ent-card p-6">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4 mb-6">General Details</h3>
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ent-form-group md:col-span-2">
                            <label className="ent-label">Project Title</label>
                            <input
                                type="text"
                                className="ent-input text-lg font-bold"
                                value={project.name}
                                onChange={e => setProject({ ...project, name: e.target.value })}
                            />
                        </div>
                        <div className="ent-form-group md:col-span-2">
                            <label className="ent-label">Description</label>
                            <textarea
                                className="ent-input"
                                value={project.description || ''}
                                onChange={e => setProject({ ...project, description: e.target.value })}
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Status</label>
                            <select
                                className="ent-select uppercase"
                                value={project.status}
                                onChange={e => setProject({ ...project, status: e.target.value })}
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Priority</label>
                            <select
                                className="ent-select uppercase"
                                value={project.priority}
                                onChange={e => setProject({ ...project, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="btn-primary flex items-center gap-2">
                            <Save size={14} /> Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Team Management */}
            <div className="ent-card p-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4 mb-6">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Team Members</h3>
                    <button
                        onClick={() => { setShowMemberModal(true); fetchEmployees(); }}
                        className="btn-secondary text-[10px] py-1.5 px-3 flex items-center gap-2"
                    >
                        <UserPlus size={12} /> Add Member
                    </button>
                </div>

                <div className="space-y-2">
                    {project.members?.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black uppercase text-gray-700">
                                    {m.employee.firstName[0]}{m.employee.lastName[0]}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-gray-900">{m.employee.firstName} {m.employee.lastName}</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{m.employee.position?.title} • {m.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveMember(m.id)}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {(!project.members || project.members.length === 0) && (
                        <p className="text-sm text-gray-400 italic text-center py-4">No team members assigned.</p>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="ent-card p-6 border-l-4 border-l-rose-500 bg-rose-50/10">
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Danger Zone</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-900">Delete Project</p>
                        <p className="text-xs text-gray-500">This action cannot be undone. All tasks and data will be lost.</p>
                    </div>
                    <button onClick={handleDelete} className="btn-danger">Delete Project</button>
                </div>
            </div>

            {/* Member Modal */}
            {showMemberModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-900 uppercase">Add Team Member</h3>
                            <button onClick={() => setShowMemberModal(false)} className="text-gray-400 hover:text-gray-900">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="ent-form-group">
                                <label className="ent-label">Employee</label>
                                <select
                                    className="ent-select"
                                    value={selectedEmployee}
                                    onChange={e => setSelectedEmployee(e.target.value)}
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.firstName} {e.lastName} - {e.position?.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="ent-form-group">
                                <label className="ent-label">Role</label>
                                <select
                                    className="ent-select uppercase"
                                    value={selectedRole}
                                    onChange={e => setSelectedRole(e.target.value)}
                                >
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-8">
                            <button onClick={() => setShowMemberModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleAddMember} className="btn-primary">Add Member</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
