'use client';

import { useToast } from '@/hooks/useToast';
import { useState, useEffect } from 'react';
import { Building, MapPin, Globe, CreditCard, Save } from 'lucide-react';

export default function CompanySettingsPage() {
    const toast = useToast();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

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
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (!company) return <div className="p-8 text-center text-gray-500">Company not found.</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">Company Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Logo & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Logo Card */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Building className="w-5 h-5 mr-2 text-gray-500" />
                            Logo
                        </h2>

                        <div className="flex flex-col items-center">
                            <div className="h-32 w-32 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 mb-4">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Company Logo" className="h-full w-full object-contain" />
                                ) : (
                                    <span className="text-gray-400 text-sm">No Logo</span>
                                )}
                            </div>

                            <label className="block w-full">
                                <span className="sr-only">Choose logo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary-50 file:text-primary-700
                                    hover:file:bg-primary-100 cursor-pointer"
                                />
                            </label>

                            {logoFile && (
                                <button
                                    onClick={handleLogoUpload}
                                    disabled={uploadingLogo}
                                    className="mt-4 w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                >
                                    {uploadingLogo ? 'Uploading...' : 'Save Logo'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Details Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleUpdateProfile} className="bg-white shadow rounded-lg overflow-hidden">

                        {/* Section 1: Basic Information */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Building className="w-5 h-5 mr-2 text-gray-500" />
                                Basic Information
                            </h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={company.name || ''}
                                        onChange={e => setCompany({ ...company, name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Legal Name</label>
                                    <input
                                        type="text"
                                        value={company.legalName || ''}
                                        onChange={e => setCompany({ ...company, legalName: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        value={company.email || ''}
                                        onChange={e => setCompany({ ...company, email: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="text"
                                        value={company.phone || ''}
                                        onChange={e => setCompany({ ...company, phone: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Location */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                                Location
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <textarea
                                        rows={2}
                                        value={company.address || ''}
                                        onChange={e => setCompany({ ...company, address: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <input
                                            type="text"
                                            value={company.city || ''}
                                            onChange={e => setCompany({ ...company, city: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Pincode</label>
                                        <input
                                            type="text"
                                            value={company.pincode || ''}
                                            onChange={e => setCompany({ ...company, pincode: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Country</label>
                                        <input
                                            type="text"
                                            value={company.country || 'India'}
                                            onChange={e => setCompany({ ...company, country: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Business Details */}
                        <div className="p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Globe className="w-5 h-5 mr-2 text-gray-500" />
                                Business Details
                            </h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                            <CreditCard className="h-4 w-4" />
                                        </span>
                                        <select
                                            value={company.currency || 'USD'}
                                            onChange={e => setCompany({ ...company, currency: e.target.value })}
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        >
                                            <option value="USD">USD ($) - US Dollar</option>
                                            <option value="INR">INR (₹) - Indian Rupee</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                                    <input
                                        type="text"
                                        value={company.gstin || ''}
                                        onChange={e => setCompany({ ...company, gstin: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                                    <input
                                        type="text"
                                        value={company.pan || ''}
                                        onChange={e => setCompany({ ...company, pan: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">TAN Number</label>
                                    <input
                                        type="text"
                                        value={company.tan || ''}
                                        onChange={e => setCompany({ ...company, tan: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
