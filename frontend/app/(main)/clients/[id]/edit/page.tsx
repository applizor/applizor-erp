'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <Link
                    href={`/clients/${params.id}`}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Client Details
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
                    <p className="mt-1 text-sm text-gray-500">Update client information</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Client/Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                                        }`}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                                        }`}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                                        }`}
                                />
                                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Address Details */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Address Details</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => handleChange('state', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={(e) => handleChange('pincode', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Business Information */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Business Information</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                                <input
                                    type="text"
                                    value={formData.gstin}
                                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                                    placeholder="22AAAAA0000A1Z5"
                                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm font-mono ${errors.gstin ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                                        }`}
                                />
                                {errors.gstin && <p className="mt-1 text-sm text-red-600">{errors.gstin}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">PAN</label>
                                <input
                                    type="text"
                                    value={formData.pan}
                                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                                    placeholder="AAAAA0000A"
                                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm font-mono ${errors.pan ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                                        }`}
                                />
                                {errors.pan && <p className="mt-1 text-sm text-red-600">{errors.pan}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Client Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.clientType}
                                    onChange={(e) => handleChange('clientType', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="vendor">Vendor</option>
                                    <option value="partner">Partner</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                        <Link
                            href={`/clients/${params.id}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <X size={16} className="mr-2" />
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            {saving ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} className="mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
