'use client';

import { useToast } from '@/hooks/useToast';
import { useState, useEffect } from 'react';
import { Building, MapPin, Globe, CreditCard, Save, Upload, Loader2, Link as LinkIcon, Phone, Mail } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CompanySettingsPage() {
    const toast = useToast();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [saving, setSaving] = useState(false);

    // Helper to get base URL (without /api)
    const getBaseUrl = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        return apiUrl.replace(/\/api$/, '');
    };

    useEffect(() => {
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/company`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCompany(data.company);
                if (data.company.logo) {
                    setLogoPreview(`${getBaseUrl()}${data.company.logo}`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch company details');
            toast.error('Failed to load company details');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile) return;
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('logo', logoFile);

            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/company/logo`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                toast.success('Logo updated successfully!');
                fetchCompany(); // Refresh
                setLogoFile(null); // Clear file selection
            } else {
                toast.error('Failed to update logo');
            }
        } catch (error) {
            console.error('Logo upload error', error);
            toast.error('Error uploading logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/company`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(company)
            });
            if (res.ok) {
                toast.success('Company profile updated successfully!');
            } else {
                toast.error('Failed to update profile');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-96">
            <LoadingSpinner size="lg" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Loading Configuration...</p>
        </div>
    );

    if (!company) return <div className="p-20 text-center font-black text-gray-400 uppercase tracking-widest">Company Protocol Not Found</div>;

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-900 rounded-lg shadow-lg">
                        <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">Company Identity</h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            System Configuration & branding
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-gray-900/10 active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Synchronizing...' : 'Save Configuration'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Logo & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Logo Card */}
                    <div className="ent-card p-6">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-gray-400" />
                            Brand Assets
                        </h2>

                        <div className="flex flex-col items-center">
                            <div className="h-40 w-40 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 mb-6 relative group">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Company Logo" className="h-full w-full object-contain p-4" />
                                ) : (
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Asset</span>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Change</span>
                                </div>
                            </div>

                            <label className="block w-full mb-3">
                                <span className="sr-only">Choose logo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="block w-full text-[10px] text-gray-500 font-bold uppercase
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded file:border-0
                                    file:text-[9px] file:font-black file:uppercase file:tracking-widest
                                    file:bg-indigo-50 file:text-indigo-700
                                    hover:file:bg-indigo-100 cursor-pointer"
                                />
                            </label>

                            {logoFile && (
                                <button
                                    onClick={handleLogoUpload}
                                    disabled={uploadingLogo}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {uploadingLogo ? 'Uploading...' : 'Confirm Upload'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="ent-card p-6 border-l-4 border-l-amber-400">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2">System Note</h2>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            Changes made to the company profile will reflect across all modules, invoices, and payslips immediately. Ensure legal details are accurate for compliance.
                        </p>
                    </div>
                </div>

                {/* Right Column: Details Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">

                        {/* Section 1: Basic Information */}
                        <div className="ent-card p-6">
                            <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                                <Building className="w-4 h-4 text-indigo-600" />
                                Organization Profile
                            </h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Display Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={company.name || ''}
                                        onChange={e => setCompany({ ...company, name: e.target.value })}
                                        className="ent-input w-full font-bold"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Legal Registered Name</label>
                                    <input
                                        type="text"
                                        value={company.legalName || ''}
                                        onChange={e => setCompany({ ...company, legalName: e.target.value })}
                                        className="ent-input w-full"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                                        <Mail size={10} /> Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={company.email || ''}
                                        onChange={e => setCompany({ ...company, email: e.target.value })}
                                        className="ent-input w-full"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block flex items-center gap-1">
                                        <Phone size={10} /> Contact Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={company.phone || ''}
                                        onChange={e => setCompany({ ...company, phone: e.target.value })}
                                        className="ent-input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Location */}
                        <div className="ent-card p-6">
                            <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                                <MapPin className="w-4 h-4 text-indigo-600" />
                                Headquarters Location
                            </h2>
                            <div className="space-y-6">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Street Address</label>
                                    <textarea
                                        rows={2}
                                        value={company.address || ''}
                                        onChange={e => setCompany({ ...company, address: e.target.value })}
                                        className="ent-input w-full resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">City / Metro</label>
                                        <input
                                            type="text"
                                            value={company.city || ''}
                                            onChange={e => setCompany({ ...company, city: e.target.value })}
                                            className="ent-input w-full"
                                        />
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">State / Prov</label>
                                        <input
                                            type="text"
                                            value={company.state || ''}
                                            onChange={e => setCompany({ ...company, state: e.target.value })}
                                            className="ent-input w-full"
                                        />
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Postal Code</label>
                                        <input
                                            type="text"
                                            value={company.pincode || ''}
                                            onChange={e => setCompany({ ...company, pincode: e.target.value })}
                                            className="ent-input w-full"
                                        />
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Country</label>
                                        <input
                                            type="text"
                                            value={company.country || 'India'}
                                            onChange={e => setCompany({ ...company, country: e.target.value })}
                                            className="ent-input w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Business Details */}
                        <div className="ent-card p-6">
                            <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                                <Globe className="w-4 h-4 text-indigo-600" />
                                Fiscal & Statutory
                            </h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Base Currency</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <select
                                            value={company.currency || 'USD'}
                                            onChange={e => setCompany({ ...company, currency: e.target.value })}
                                            className="ent-input w-full pl-9 appearance-none"
                                        >
                                            <option value="USD">USD ($) - US Dollar</option>
                                            <option value="INR">INR (₹) - Indian Rupee</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">GSTIN / Tax ID</label>
                                    <input
                                        type="text"
                                        value={company.gstin || ''}
                                        onChange={e => setCompany({ ...company, gstin: e.target.value })}
                                        className="ent-input w-full font-mono"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">PAN Number</label>
                                    <input
                                        type="text"
                                        value={company.pan || ''}
                                        onChange={e => setCompany({ ...company, pan: e.target.value })}
                                        className="ent-input w-full font-mono"
                                    />
                                </div>
                                <div className="ent-form-group">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">TAN Number</label>
                                    <input
                                        type="text"
                                        value={company.tan || ''}
                                        onChange={e => setCompany({ ...company, tan: e.target.value })}
                                        className="ent-input w-full font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
