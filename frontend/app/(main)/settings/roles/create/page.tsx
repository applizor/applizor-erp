'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const ACCESS_OPTIONS = [
    { label: 'None', value: 'none' },
    { label: 'All', value: 'all' },
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

    const handleGlobalChange = (action: string, value: string) => {
        setMatrix(prev => {
            const next = { ...prev };
            modules.forEach(m => {
                next[m] = { ...next[m], [action]: value };
            });
            return next;
        });
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
            router.push('/settings/roles');
        } catch (error: any) {
            console.error('Error creating role', error);
            toast.error(error.response?.data?.error || 'Failed to create role');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8">Loading configuration...</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Create New Role</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                placeholder="e.g. Sales Manager"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                                placeholder="Short description..."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Permission Matrix</h2>
                        <span className="text-xs text-gray-500">Default: None</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                                    {['createLevel', 'readLevel', 'updateLevel', 'deleteLevel'].map(action => (
                                        <th key={action} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {action.replace('Level', '')}
                                            {/* Global Header Dropdown? Optional, keeps UI clean to just have column headers */}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {modules.map((module) => (
                                    <tr key={module} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                            {module}
                                        </td>
                                        {['createLevel', 'readLevel', 'updateLevel', 'deleteLevel'].map(action => (
                                            <td key={action} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <select
                                                    value={matrix[module]?.[action] || 'none'}
                                                    onChange={(e) => handleLevelChange(module, action, e.target.value)}
                                                    className="block w-full max-w-[150px] rounded-md border-gray-300 py-1.5 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                                >
                                                    {ACCESS_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Role'}
                    </button>
                </div>
            </form>
        </div>
    );
}
