'use client';

import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/context/ConfirmationContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MapPin,
    Building2,
    Phone,
    Mail,
    Plus,
    Trash2,
    Globe,
    Activity,
    Edit,
    ChevronRight,
    Map
} from 'lucide-react';

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

    const { confirm } = useConfirm();

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Are you sure you want to delete this location?', type: 'danger' })) return;
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
        <div className="animate-fade-in pb-20">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 px-2">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
                            Operational Verticals
                            {locations.length > 0 && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase font-black tracking-widest">
                                    {locations.length} BRANCHES
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Manage global corporate locations, regional hubs, and branch infrastructure.
                        </p>
                    </div>
                    <Link
                        href="/settings/locations/create"
                        className="btn-primary"
                    >
                        <Plus size={16} className="mr-2" /> Add Location
                    </Link>
                </div>

                <div className="ent-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Regional Branch Registry</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="ent-table">
                            <thead>
                                <tr>
                                    <th className="rounded-l-xl">Branch Identity</th>
                                    <th>Geographic Coordinates</th>
                                    <th>Communication Line</th>
                                    <th>Status</th>
                                    <th className="text-right rounded-r-xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 animate-pulse font-black uppercase text-[10px] tracking-widest">Mapping locations...</td>
                                    </tr>
                                ) : locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <MapPin size={24} className="text-slate-200 mb-2" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No operational branches discovered</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    locations.map((location) => (
                                        <tr key={location.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm transition-transform group-hover:scale-110">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black text-slate-900 tracking-tight">{location.name}</div>
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{location.code || 'LOC-GENERIC'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                                    <Map size={10} className="text-slate-400" />
                                                    {location.city}, {location.state}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight ml-4">
                                                    {location.country || 'India'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                                        <Phone size={10} className="text-indigo-400" />
                                                        {location.phone || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 lowercase">
                                                        <Mail size={10} className="text-slate-300" />
                                                        {location.email || 'no-email@corp.com'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`ent-badge ${location.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                    <Activity size={8} className="mr-1" />
                                                    {location.isActive ? 'OPERATIONAL' : 'DECOMMISSIONED'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100 transition-all">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(location.id)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-rose-600 border border-transparent hover:border-slate-100 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
