'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { Users, Plus, X, Shield, UserCheck, UserX, Loader2 } from 'lucide-react';

export default function UsersPage() {
    const toast = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', role: 'employee' });
    const [inviting, setInviting] = useState(false);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    const handleInvite = async () => {
        try {
            setInviting(true);
            await api.post('/auth/invite', inviteForm);
            toast.success('User invited');
            setShowInvite(false);
            setInviteForm({ email: '', role: 'employee' });
            loadUsers();
        } catch { toast.error('Failed to invite user'); }
        finally { setInviting(false); }
    };

    const handleToggleStatus = async (userId: string, active: boolean) => {
        try {
            await api.put(`/users/${userId}`, { isActive: !active });
            toast.success(`User ${active ? 'deactivated' : 'activated'}`);
            loadUsers();
        } catch { toast.error('Failed to update user'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-md shadow-lg"><Users className="w-6 h-6 text-white" /></div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">User Management</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">System accounts & access</p>
                    </div>
                </div>
                <button onClick={() => setShowInvite(true)} className="btn-primary py-2.5 px-4 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Plus size={14} /> Invite User
                </button>
            </div>

            {showInvite && (
                <div className="ent-card p-5 border-primary-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest">Invite New User</h3>
                        <button onClick={() => setShowInvite(false)}><X size={16} className="text-gray-400" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="ent-form-group mb-0">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Email</label>
                            <input className="ent-input w-full p-2.5 text-sm" placeholder="user@company.com" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} />
                        </div>
                        <div className="ent-form-group mb-0">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Role</label>
                            <select className="ent-input w-full p-2.5 text-sm" value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="employee">Employee</option>
                            </select>
                        </div>
                        <button onClick={handleInvite} disabled={inviting || !inviteForm.email} className="btn-primary py-2.5 px-4 text-xs font-black uppercase tracking-widest h-10 flex items-center justify-center gap-2">
                            {inviting ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                            Send Invite
                        </button>
                    </div>
                </div>
            )}

            <div className="ent-card overflow-hidden">
                {loading ? (
                    <div className="p-12 flex flex-col items-center"><LoadingSpinner size="lg" /><p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading users...</p></div>
                ) : users.length === 0 ? (
                    <div className="p-12 flex flex-col items-center opacity-40"><Users size={40} className="text-gray-300 mb-4" /><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No users found</p></div>
                ) : (
                    <table className="ent-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td><span className="font-bold text-sm">{u.name || '—'}</span></td>
                                    <td className="text-gray-600 text-sm">{u.email}</td>
                                    <td><span className="ent-badge ent-badge-info text-[9px]">{u.role?.toUpperCase()}</span></td>
                                    <td>
                                        <span className={`ent-badge ${u.isActive !== false ? 'ent-badge-success' : 'ent-badge-danger'} text-[9px]`}>
                                            {u.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button onClick={() => handleToggleStatus(u.id, u.isActive !== false)} className="text-[10px] font-black text-gray-500 hover:text-primary-600 uppercase tracking-widest">
                                            {u.isActive !== false ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
