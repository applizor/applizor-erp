'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    ChevronLeft,
    Save,
    Hash,
    Globe,
    Map
} from 'lucide-react';

export default function CreateLocationPage() {
    const toast = useToast();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/branches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/settings/locations');
            } else {
                toast.error('Failed to create location');
            }
        } catch (error) {
            console.error('Error creating location', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-2">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
                            Infrastructure Registration
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Configure a new physical branch or corporate location.
                        </p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="btn-secondary"
                    >
                        <ChevronLeft size={16} className="mr-2" /> Back to Registry
                    </button>
                </div>

                <div className="ent-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location Specification</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-4">
                            {/* Primary Identity Section */}
                            <div className="md:col-span-4 ent-form-group">
                                <label className="ent-label">Branch Name <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                        <Building2 size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="ent-input pl-9"
                                        placeholder="e.g. Bangalore Global Headquarters"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 ent-form-group">
                                <label className="ent-label">Branch Code</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                        <Hash size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="ent-input pl-9"
                                        placeholder="BH-001"
                                    />
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div className="md:col-span-3 ent-form-group">
                                <label className="ent-label">Phone Hotline</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                        <Phone size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="ent-input pl-9"
                                        placeholder="+91 XXX-XXXXXXX"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-3 ent-form-group">
                                <label className="ent-label">System Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                        <Mail size={14} />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="ent-input pl-9"
                                        placeholder="branch@applizor.com"
                                    />
                                </div>
                            </div>

                            {/* Geography Section */}
                            <div className="md:col-span-6 ent-form-group">
                                <label className="ent-label">Physical Address</label>
                                <div className="relative">
                                    <div className="absolute top-2.5 left-2.5 text-slate-400">
                                        <MapPin size={14} />
                                    </div>
                                    <textarea
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        rows={2}
                                        className="ent-input pl-9 py-2 resize-none"
                                        placeholder="Building Name, Street, Area..."
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 ent-form-group">
                                <label className="ent-label">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="ent-input"
                                    placeholder="City"
                                />
                            </div>

                            <div className="md:col-span-2 ent-form-group">
                                <label className="ent-label">State / Province</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                        <Map size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                                        className="ent-input pl-9"
                                        placeholder="State"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 ent-form-group">
                                <label className="ent-label">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                    className="ent-input"
                                    placeholder="XXXXXX"
                                />
                            </div>

                            <div className="md:col-span-3 ent-form-group">
                                <label className="ent-label">Country</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                        <Globe size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                        className="ent-input pl-9"
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors mr-2"
                            >
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                        Synchronizing...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} className="mr-2" /> Create Location
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
