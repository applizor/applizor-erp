'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Users, Lock, ChevronRight, RefreshCw, Key } from 'lucide-react';

export default function RolesPage() {
    const toast = useToast();
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
            }
        } catch (error) {
            console.error('Failed to fetch roles', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/roles/sync-permissions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.info('System Permissions Re-Indexed Successfully');
        } catch (error) {
            toast.error('Sync Failed');
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-96">
            <LoadingSpinner size="lg" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Loading Access Matrix...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6">
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Roles & Permissions</h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Access Control & Security Policy
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                        Sync Nodes
                    </button>
                    <Link
                        href="/settings/roles/create"
                        className="px-5 py-2.5 bg-primary-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-primary-900/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Define Role
                    </Link>
                </div>
            </div>

            <div className="ent-card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Access Role Matrix</h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{roles.length} Definitions Found</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {roles.map((role) => (
                        <div key={role.id} className="group hover:bg-gray-50 transition-colors p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-md flex items-center justify-center ${role.isSystem ? 'bg-amber-100 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                                    {role.isSystem ? <Lock size={20} /> : <Key size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                            {role.name}
                                        </h4>
                                        {role.isSystem && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-md">
                                                System Root
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-md">
                                        {role.description || 'No description provided'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-md text-gray-500">
                                    <Users size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">
                                        {role._count?.userRoles || 0} Assignments
                                    </span>
                                </div>
                                <Link
                                    href={`/settings/roles/${role.id}`}
                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"
                                >
                                    <ChevronRight size={18} />
                                </Link>
                            </div>
                        </div>
                    ))}
                    {!loading && roles.length === 0 && (
                        <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                            No Role Definitions Found
                        </div>
                    )}
                </div>
            </div>

            <div className="ent-card p-4 border-l-4 border-l-blue-500 bg-blue-50/50 flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h3 className="text-xs font-black text-blue-900 uppercase tracking-tight">Synchronization Protocol</h3>
                    <p className="text-[10px] text-blue-700 mt-1 leading-relaxed max-w-2xl">
                        If new modules have been deployed via CD/CI, run the Synchronization to index new permission nodes into the database. This ensures they are selectable when defining roles.
                    </p>
                </div>
            </div>
        </div>
    );
}
