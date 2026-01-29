'use client';

import { useToast } from '@/hooks/useToast';
import { useState, useEffect } from 'react';
import { Building, MapPin, Globe, CreditCard, Save, Upload, Loader2, Link as LinkIcon, Phone, Mail } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { CustomSelect } from '@/components/ui/CustomSelect';
import TaxConfiguration from '@/components/settings/TaxConfiguration';
import UnitConfiguration from '@/components/settings/UnitConfiguration';

export default function CompanySettingsPage() {
    const toast = useToast();
    const [company, setCompany] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'taxation' | 'units'>('general');
    const [loading, setLoading] = useState(true);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [uploadingSignature, setUploadingSignature] = useState(false);

    const [letterheadFile, setLetterheadFile] = useState<File | null>(null);
    const [letterheadPreview, setLetterheadPreview] = useState<string | null>(null);
    const [uploadingLetterhead, setUploadingLetterhead] = useState(false);

    const [continuationFile, setContinuationFile] = useState<File | null>(null);
    const [continuationPreview, setContinuationPreview] = useState<string | null>(null);
    const [uploadingContinuation, setUploadingContinuation] = useState(false);

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
                if (data.company.digitalSignature) {
                    setSignaturePreview(`${getBaseUrl()}${data.company.digitalSignature}`);
                }
                if (data.company.letterhead) {
                    setLetterheadPreview(`${getBaseUrl()}${data.company.letterhead}`);
                }
                if (data.company.continuationSheet) {
                    setContinuationPreview(`${getBaseUrl()}${data.company.continuationSheet}`);
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

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSignatureFile(file);
            setSignaturePreview(URL.createObjectURL(file));
        }
    };

    const handleSignatureUpload = async () => {
        if (!signatureFile) return;
        setUploadingSignature(true);
        try {
            const formData = new FormData();
            formData.append('signature', signatureFile);

            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/company/signature`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                toast.success('Signature updated successfully!');
                fetchCompany(); // Refresh
                setSignatureFile(null); // Clear file selection
            } else {
                toast.error('Failed to update signature');
            }
        } catch (error) {
            console.error('Signature upload error', error);
            toast.error('Error uploading signature');
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleLetterheadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLetterheadFile(file);
            setLetterheadPreview(URL.createObjectURL(file));
        }
    };

    const handleLetterheadUpload = async () => {
        if (!letterheadFile) return;
        setUploadingLetterhead(true);
        try {
            const formData = new FormData();
            formData.append('letterhead', letterheadFile);

            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/company/letterhead-asset`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                toast.success('Letterhead updated successfully!');
                fetchCompany(); // Refresh
                setLetterheadFile(null); // Clear file selection
            } else {
                toast.error('Failed to update letterhead');
            }
        } catch (error) {
            console.error('Letterhead upload error', error);
            toast.error('Error uploading letterhead');
        } finally {
            setUploadingLetterhead(false);
        }
    };

    const handleContinuationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setContinuationFile(file);
            setContinuationPreview(URL.createObjectURL(file));
        }
    };

    const handleContinuationUpload = async () => {
        if (!continuationFile) return;
        setUploadingContinuation(true);
        try {
            const formData = new FormData();
            formData.append('continuationSheet', continuationFile);

            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/company/continuation-sheet-asset`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                toast.success('Continuation sheet updated successfully!');
                fetchCompany(); // Refresh
                setContinuationFile(null); // Clear file selection
            } else {
                toast.error('Failed to update continuation sheet');
            }
        } catch (error) {
            console.error('Continuation upload error', error);
            toast.error('Error uploading continuation sheet');
        } finally {
            setUploadingContinuation(false);
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
        <div className="max-w-7xl mx-auto pb-20 space-y-6">
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
                <div className="h-10 w-64 bg-slate-100 rounded-md"></div>
                <div className="h-10 w-32 bg-slate-100 rounded-md"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="ent-card p-6 h-64 animate-pulse"></div>
                    <div className="ent-card p-6 h-32 animate-pulse"></div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="ent-card p-6 h-96 animate-pulse"></div>
                </div>
            </div>
        </div>
    );

    if (!company) return <div className="p-20 text-center font-black text-gray-400 uppercase tracking-widest">Company Protocol Not Found</div>;

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6">
            <PageHeader
                title="Company Configuration"
                subtitle="System Configuration & Branding"
                icon={Building}
                actions={
                    activeTab === 'general' ? (
                        <button
                            onClick={handleUpdateProfile}
                            disabled={saving}
                            className="px-5 py-2.5 bg-gray-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-gray-900/10 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Synchronizing...' : 'Save Configuration'}
                        </button>
                    ) : null
                }
            />

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'general'
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                        }`}
                >
                    Organization & Branding
                </button>
                <button
                    onClick={() => setActiveTab('taxation')}
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'taxation'
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                        }`}
                >
                    Taxation Rules
                </button>
                <button
                    onClick={() => setActiveTab('units')}
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'units'
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                        }`}
                >
                    Units of Measurement
                </button>
            </div>

            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Left Column: Logo & Basic Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Logo Card */}
                        <div className="ent-card p-6">
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-gray-400" />
                                Brand Assets
                            </h2>

                            <div className="flex flex-col items-center">
                                <div className="h-40 w-40 border-2 border-dashed border-gray-200 rounded-md overflow-hidden flex items-center justify-center bg-gray-50 mb-6 relative group">
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
                                    file:rounded-md file:border-0
                                    file:text-[9px] file:font-black file:uppercase file:tracking-widest
                                    file:bg-primary-50 file:text-primary-700
                                    hover:file:bg-primary-100 cursor-pointer"
                                    />
                                </label>

                                {logoFile && (
                                    <button
                                        onClick={handleLogoUpload}
                                        disabled={uploadingLogo}
                                        className="w-full px-4 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-primary-700 transition-all shadow-md active:scale-95 disabled:opacity-50 mb-3"
                                    >
                                        {uploadingLogo ? 'Uploading Logo...' : 'Confirm Logo Upload'}
                                    </button>
                                )}

                                <div className="w-full border-t border-gray-100 my-6"></div>

                                {/* Digital Signature */}
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 w-full">Authorized Signature</h3>

                                <div className="h-24 w-full border border-gray-100 rounded-md overflow-hidden flex items-center justify-center bg-white mb-4 relative group">
                                    {signaturePreview ? (
                                        <img src={signaturePreview} alt="Company Signature" className="h-full w-full object-contain p-2" />
                                    ) : (
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Signature</span>
                                    )}
                                </div>

                                <label className="block w-full mb-3">
                                    <span className="sr-only">Choose signature</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureChange}
                                        className="block w-full text-[10px] text-gray-500 font-bold uppercase
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-[9px] file:font-black file:uppercase file:tracking-widest
                                    file:bg-slate-50 file:text-slate-700
                                    hover:file:bg-slate-100 cursor-pointer"
                                    />
                                </label>

                                {signatureFile && (
                                    <button
                                        onClick={handleSignatureUpload}
                                        disabled={uploadingSignature}
                                        className="w-full px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                        {uploadingSignature ? 'Uploading Signature...' : 'Confirm Signature Upload'}
                                    </button>
                                )}

                                <div className="w-full border-t border-gray-100 my-6"></div>

                                {/* Letterhead Assets */}
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 w-full text-center">Document Engine Assets</h3>

                                {/* First Page Letterhead */}
                                <div className="w-full mb-6">
                                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-2 block">1st Page Letterhead</label>
                                    <div className="h-40 w-full border border-gray-100 rounded-md overflow-hidden flex items-center justify-center bg-white mb-2 relative group grayscale hover:grayscale-0 transition-all">
                                        {(letterheadFile?.type === 'application/pdf' || (company?.letterhead?.toLowerCase().endsWith('.pdf'))) ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="bg-red-50 p-3 rounded-full">
                                                    <Upload className="w-8 h-8 text-red-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">PDF Letterhead Set</span>
                                            </div>
                                        ) : letterheadPreview ? (
                                            <img src={letterheadPreview} alt="Letterhead" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">A4 Background Not Set</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleLetterheadChange}
                                        className="block w-full text-[9px] text-gray-400 font-bold uppercase cursor-pointer"
                                    />
                                    {letterheadFile && (
                                        <button
                                            onClick={handleLetterheadUpload}
                                            disabled={uploadingLetterhead}
                                            className="w-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all active:scale-95"
                                        >
                                            {uploadingLetterhead ? 'Uploading...' : 'Upload Letterhead'}
                                        </button>
                                    )}
                                </div>

                                {/* Continuation Sheet */}
                                <div className="w-full">
                                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-widest mb-2 block">Continuation Sheet</label>
                                    <div className="h-40 w-full border border-gray-100 rounded-md overflow-hidden flex items-center justify-center bg-white mb-2 relative group grayscale hover:grayscale-0 transition-all">
                                        {(continuationFile?.type === 'application/pdf' || (company?.continuationSheet?.toLowerCase().endsWith('.pdf'))) ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="bg-red-50 p-3 rounded-full">
                                                    <Upload className="w-8 h-8 text-red-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">PDF Sheet Set</span>
                                            </div>
                                        ) : continuationPreview ? (
                                            <img src={continuationPreview} alt="Continuation Sheet" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Next Pages Background</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleContinuationChange}
                                        className="block w-full text-[9px] text-gray-400 font-bold uppercase cursor-pointer"
                                    />
                                    {continuationFile && (
                                        <button
                                            onClick={handleContinuationUpload}
                                            disabled={uploadingContinuation}
                                            className="w-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all active:scale-95"
                                        >
                                            {uploadingContinuation ? 'Uploading...' : 'Upload Continuation'}
                                        </button>
                                    )}
                                </div>
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
                                    <Building className="w-4 h-4 text-primary-600" />
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
                                    <MapPin className="w-4 h-4 text-primary-600" />
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
                                        <div className="ent-form-group">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Base Currency</label>
                                            <CustomSelect
                                                options={[
                                                    { label: 'INR - Indian Rupee', value: 'INR' },
                                                    { label: 'USD - US Dollar', value: 'USD' },
                                                    { label: 'EUR - Euro', value: 'EUR' },
                                                    { label: 'GBP - British Pound', value: 'GBP' },
                                                    { label: 'AUD - Australian Dollar', value: 'AUD' },
                                                    { label: 'CAD - Canadian Dollar', value: 'CAD' },
                                                    { label: 'SGD - Singapore Dollar', value: 'SGD' },
                                                    { label: 'AED - UAE Dirham', value: 'AED' }
                                                ]}
                                                value={company.currency || 'INR'}
                                                onChange={val => setCompany({ ...company, currency: val })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: PDF Layout Settings */}
                            <div className="ent-card p-6 border-l-4 border-l-blue-500">
                                <h2 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight border-b border-gray-100 pb-2">
                                    <CreditCard className="w-4 h-4 text-blue-600" />
                                    PDF Layout Configuration
                                </h2>
                                <p className="text-[10px] text-gray-500 mb-6 uppercase font-bold tracking-tight">
                                    Customize margins to align content with your uploaded Letterhead and Continuation sheets.
                                </p>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">1st Page Top Margin (px)</label>
                                        <input
                                            type="number"
                                            value={company.pdfMarginTop || 180}
                                            onChange={e => setCompany({ ...company, pdfMarginTop: parseInt(e.target.value) })}
                                            className="ent-input w-full font-mono text-blue-600"
                                        />
                                        <span className="text-[9px] text-gray-400 mt-1 block">Space for Letterhead header</span>
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Next Pages Top Margin (px)</label>
                                        <input
                                            type="number"
                                            value={company.pdfContinuationTop || 80}
                                            onChange={e => setCompany({ ...company, pdfContinuationTop: parseInt(e.target.value) })}
                                            className="ent-input w-full font-mono text-blue-600"
                                        />
                                        <span className="text-[9px] text-gray-400 mt-1 block">Space for Continuation header</span>
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Bottom Margin (px)</label>
                                        <input
                                            type="number"
                                            value={company.pdfMarginBottom || 80}
                                            onChange={e => setCompany({ ...company, pdfMarginBottom: parseInt(e.target.value) })}
                                            className="ent-input w-full font-mono text-blue-600"
                                        />
                                        <span className="text-[9px] text-gray-400 mt-1 block">Space for Footer</span>
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Left Margin (px)</label>
                                        <input
                                            type="number"
                                            value={company.pdfMarginLeft || 40}
                                            onChange={e => setCompany({ ...company, pdfMarginLeft: parseInt(e.target.value) })}
                                            className="ent-input w-full font-mono"
                                        />
                                    </div>
                                    <div className="ent-form-group">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Right Margin (px)</label>
                                        <input
                                            type="number"
                                            value={company.pdfMarginRight || 40}
                                            onChange={e => setCompany({ ...company, pdfMarginRight: parseInt(e.target.value) })}
                                            className="ent-input w-full font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'taxation' && (
                <div className="animate-fade-in space-y-6">
                    <TaxConfiguration />
                </div>
            )}

            {activeTab === 'units' && (
                <div className="animate-fade-in space-y-6">
                    <UnitConfiguration />
                </div>
            )}
        </div>
    );
}
