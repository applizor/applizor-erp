'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LocationsPage() {
    const toast = useToast();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/branches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLocations(data);
            }
        } catch (error) {
            console.error('Failed to fetch locations');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/branches/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchLocations();
            } else {
                toast.error('Failed to delete location');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Locations / Branches</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your company offices and branches</p>
                </div>
                <Link
                    href="/settings/locations/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                    Add New Location
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {locations.map((location) => (
                        <li key={location.id}>
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex text-sm">
                                            <p className="font-medium text-primary-600 truncate">{location.name}</p>
                                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {location.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <p className="truncate">
                                                    {location.city}, {location.state} • {location.phone || 'No phone'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-5 flex-shrink-0 flex space-x-2">
                                    <button onClick={() => handleDelete(location.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {!loading && locations.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No locations found. Add your first branch.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
