'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Building2, Mail, Phone, MapPin, Globe, FileText, CreditCard, Tag, Activity } from 'lucide-react';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Define Zod Schema
const clientSchema = z.object({
    name: z.string().min(2, "Client/Company name is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('India'),
    pincode: z.string().optional(),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").optional().or(z.literal('')),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format").optional().or(z.literal('')),
    clientType: z.enum(['customer', 'vendor', 'partner']),
    status: z.enum(['active', 'inactive'])
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function EditClientPage() {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const { can, user } = usePermission();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
    const [formData, setFormData] = useState<ClientFormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        gstin: '',
        pan: '',
        clientType: 'customer',
        status: 'active'
    });

    // Page Level Security
    if (user && !can('Client', 'update')) {
        return <AccessDenied />;
    }

    useEffect(() => {
        if (params.id) {
            loadClient(params.id as string);
        }
    }, [params.id]);

    const loadClient = async (id: string) => {
        try {
            const response = await clientsApi.getById(id);
            // Backend returns { client: {...} }
            const data = response.client || response;
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                country: data.country || 'India',
                pincode: data.pincode || '',
                gstin: data.gstin || '',
                pan: data.pan || '',
                clientType: data.clientType || 'customer',
                status: data.status || 'active'
            });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to load client');
            router.push('/clients');
        } finally {
            setLoading(false);
        }
    };

    const validateField = (field: keyof ClientFormData, value: any) => {
        try {
            // @ts-ignore
            clientSchema.pick({ [field]: true }).parse({ [field]: value });
            setErrors({ ...errors, [field]: undefined });
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors({ ...errors, [field]: error.errors[0].message });
            }
            return false;
        }
    };

    const handleChange = (field: keyof ClientFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            validateField(field, value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            clientSchema.parse(formData);
            setErrors({});
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors: any = {};
                error.errors.forEach(err => {
                    formattedErrors[err.path[0]] = err.message;
                });
                setErrors(formattedErrors);
                toast.error("Please fix the errors in the form");
                return;
            }
        }

        setSaving(true);
        try {
            await clientsApi.update(params.id as string, formData);
            toast.success('Client updated successfully');
            router.push(`/clients/${params.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update client');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        href={`/clients/${params.id}`}
                        className="inline-flex items-center text-xs font-semibold text-primary-600 hover:text-primary-700 uppercase tracking-wider mb-2"
                    >
                        <ArrowLeft size={12} className="mr-1" />
                        Back to Details
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                        Edit Client Profile
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Update organization details and commercial parameters
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Organization Identity
                        </h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Client/Company Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className={`ent-input pl-10 w-full ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder="Enter full legal entity name"
                                />
                            </div>
                            {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Primary Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={`ent-input pl-10 w-full ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder="contact@company.com"
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className={`ent-input pl-10 w-full ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                            {errors.phone && <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone}</p>}
                        </div>
                    </div>
                </div>

                {/* Address Details */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Location & Coordinates
                        </h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Street Address
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                rows={3}
                                className="ent-input w-full py-2"
                                placeholder="Building No., Street, Area"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                City
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                className="ent-input w-full"
                                placeholder="City Name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                State/Province
                            </label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                                className="ent-input w-full"
                                placeholder="State Name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Country
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Globe className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                    className="ent-input pl-10 w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Postal Code
                            </label>
                            <input
                                type="text"
                                value={formData.pincode}
                                onChange={(e) => handleChange('pincode', e.target.value)}
                                className="ent-input w-full"
                                placeholder="000000"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Information */}
                <div className="ent-card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Commercial & Tax Info
                        </h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                GSTIN
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CreditCard className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.gstin}
                                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                                    placeholder="22AAAAA0000A1Z5"
                                    className={`ent-input pl-10 w-full font-mono uppercase ${errors.gstin ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                />
                            </div>
                            {errors.gstin && <p className="mt-1 text-xs text-red-600 font-medium">{errors.gstin}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                PAN
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CreditCard className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.pan}
                                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                                    placeholder="AAAAA0000A"
                                    className={`ent-input pl-10 w-full font-mono uppercase ${errors.pan ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                />
                            </div>
                            {errors.pan && <p className="mt-1 text-xs text-red-600 font-medium">{errors.pan}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Client Classification <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Tag className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={formData.clientType}
                                        onChange={(e) => handleChange('clientType', e.target.value)}
                                        className="ent-input pl-10 w-full appearance-none"
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="vendor">Vendor</option>
                                        <option value="partner">Partner</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Operational Status <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Activity className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={formData.status}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                        className="ent-input pl-10 w-full appearance-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <Link
                        href={`/clients/${params.id}`}
                        className="ent-button-secondary"
                    >
                        <X size={16} className="mr-2" />
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="ent-button-primary disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
