'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RolesPage() {
    const toast = useToast();
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage user roles and access control</p>
                </div>
                <Link
                    href="/settings/roles/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                    Create New Role
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {roles.map((role) => (
                        <li key={role.id}>
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex text-sm">
                                            <p className="font-medium text-primary-600 truncate">{role.name}</p>
                                            {role.isSystem && (
                                                <span className="ml-2 flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                    System Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <p className="truncate">{role.description || 'No description'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                                        <div className="flex overflow-hidden -space-x-1">
                                            <span className="text-sm text-gray-500">
                                                {role._count?.userRoles || 0} users assigned
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-5 flex-shrink-0">
                                    <Link href={`/settings/roles/${role.id}`} className="text-primary-600 hover:text-primary-900 font-medium">
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        </li>
                    ))}
                    {!loading && roles.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No roles found. Create one to get started.
                        </li>
                    )}
                </ul>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-md">
                <h3 className="text-blue-800 font-medium">Auto-Sync Permissions</h3>
                <p className="text-sm text-blue-600 mt-1">If you deployed new modules, click below to sync system permissions.</p>
                <button
                    onClick={async () => {
                        const token = localStorage.getItem('token');
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/roles/sync-permissions`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        toast.info('Permissions Synced!');
                    }}
                    className="mt-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-200"
                >
                    Sync System Permissions
                </button>
            </div>
        </div>
    );
}
