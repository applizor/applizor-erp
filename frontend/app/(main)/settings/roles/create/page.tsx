'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Shield, Save, ArrowLeft, Layers, Sliders } from 'lucide-react';
import Link from 'next/link';

const ACCESS_OPTIONS = [
    { label: 'None', value: 'none' },
    { label: 'All (Full Access)', value: 'all' },
    { label: 'Added (My Entry)', value: 'added' },
    { label: 'Owned (Assigned)', value: 'owned' },
    { label: 'Added & Owned', value: 'added_owned' },
];

export default function CreateRolePage() {
    const toast = useToast();
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [modules, setModules] = useState<string[]>([]);
    const [matrix, setMatrix] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchMeta();
    }, []);

    const fetchMeta = async () => {
        try {
            const res = await api.get('/roles/permissions');
            setModules(res.data.modules || []);
            // Initialize matrix
            const initMatrix: any = {};
            (res.data.modules || []).forEach((m: string) => {
                initMatrix[m] = {
                    createLevel: 'none',
                    readLevel: 'none',
                    updateLevel: 'none',
                    deleteLevel: 'none'
                };
            });
            setMatrix(initMatrix);
        } catch (error) {
            console.error('Failed to fetch permission metadata');
            toast.error('Failed to load permission modules. Please refresh.');
        } finally {
            setFetching(false);
        }
    };

    const handleLevelChange = (module: string, action: string, value: string) => {
        setMatrix(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [action]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Convert matrix to array
            const permissionsArray = Object.keys(matrix).map(module => ({
                module,
                ...matrix[module]
            }));

            await api.post('/roles', {
                name,
                description,
                permissions: permissionsArray
            });
            toast.success('New Security Role Established');
            router.push('/settings/roles');
        } catch (error: any) {
            console.error('Error creating role', error);
            toast.error(error.response?.data?.error || 'Failed to create role');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex flex-col justify-center items-center h-96">
            <LoadingSpinner size="lg" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Initializing Matrix...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-900 rounded-lg shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Define New Role</h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            Access Control & Security Policy
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/settings/roles"
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2 bg-primary-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary-950 transition-all flex items-center gap-2 shadow-lg shadow-primary-900/20 active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Creating Policy...' : 'Establish Role'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="ent-card p-6">
                    <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                        <Layers className="w-4 h-4 text-primary-600" />
                        Role Definition
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ent-form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Role Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="ent-input w-full font-bold"
                                placeholder="E.g. REGIONAL MANAGER"
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="ent-input w-full"
                                placeholder="Brief description of responsibilities..."
                            />
                        </div>
                    </div>
                </div>

                <div className="ent-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-gray-400" />
                            Permission Matrix
                        </h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Default Scope: NONE</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Module Scope</th>
                                    {['createLevel', 'readLevel', 'updateLevel', 'deleteLevel'].map(action => (
                                        <th key={action} scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            {action.replace('Level', '')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {modules.map((module) => (
                                    <tr key={module} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 capitalize border-l-4 border-l-transparent hover:border-l-primary-500 transition-all">
                                            {module.replace('-', ' ')}
                                        </td>
                                        {['createLevel', 'readLevel', 'updateLevel', 'deleteLevel'].map(action => {
                                            const currentVal = matrix[module]?.[action] || 'none';
                                            let badgeColor = 'bg-gray-100 text-gray-500 border-gray-200';
                                            if (currentVal === 'all') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
                                            else if (currentVal !== 'none') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

                                            return (
                                                <td key={action} className="px-6 py-3 whitespace-nowrap">
                                                    <select
                                                        value={currentVal}
                                                        onChange={(e) => handleLevelChange(module, action, e.target.value)}
                                                        className={`block w-full max-w-[180px] rounded border py-1.5 px-2 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer ${badgeColor}`}
                                                    >
                                                        {ACCESS_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </div>
    );
}
