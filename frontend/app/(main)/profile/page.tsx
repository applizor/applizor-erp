'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { User, Lock, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, refresh } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        if (user) {
            setForm({
                name: `${user.firstName} ${user.lastName}` || '',
                email: user.email || '',
                phone: (user as any).phone || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        try {
            setLoading(true);
            await api.put('/auth/profile', form);
            toast.success('Profile updated');
            refresh();
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-900 rounded-md shadow-lg">
                    <User className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">My Profile</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Account settings & personal information</p>
                </div>
            </div>

            <div className="ent-card p-6 space-y-5">
                <div className="ent-form-group">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Full Name</label>
                    <input className="ent-input w-full p-3 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="ent-form-group">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Email</label>
                    <input className="ent-input w-full p-3 text-sm" value={form.email} disabled />
                </div>
                <div className="ent-form-group">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Phone</label>
                    <input className="ent-input w-full p-3 text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button onClick={handleSave} disabled={loading} className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="ent-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Lock size={16} className="text-gray-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">Password</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">Change your account password</p>
                <a href="/auth/forgot-password" className="text-xs font-bold text-primary-600 uppercase tracking-widest hover:underline">Reset Password →</a>
            </div>
        </div>
    );
}
