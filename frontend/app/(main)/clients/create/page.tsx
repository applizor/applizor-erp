'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';

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

export default function CreateClientPage() {
    const toast = useToast();
    const router = useRouter();
    const { can, user } = usePermission();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

    // Page Level Security - Same pattern as Employee module
    if (user && !can('Client', 'create')) {
        return <AccessDenied />;
    }

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

    const validateField = (field: keyof ClientFormData, value: any) => {
        try {
            // @ts-ignore - Simplify single field validation
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

        setLoading(true);
        try {
            await clientsApi.create(formData);
            toast.success('Client created successfully');
            router.push('/clients');
        } catch (error: any) {
            console.error('Error creating client', error);
            const message = error.response?.data?.error || error.response?.data?.message || 'Failed to create client';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
            </button>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
                    <p className="text-sm text-gray-500 mt-1">Create a new profile for a customer, vendor or partner.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                <div className="p-8 space-y-8">
                    {/* Basic Details Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-primary-50 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client / Company Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className={`block w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm`}
                                    placeholder="Enter company or client name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    className={`block w-full rounded-md border ${errors.email ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm`}
                                    placeholder="contact@company.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => handleChange('phone', e.target.value)}
                                    className={`block w-full rounded-md border ${errors.phone ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm`}
                                    placeholder="+91 98765 43210"
                                />
                                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.clientType}
                                    onChange={e => handleChange('clientType', e.target.value as any)}
                                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm bg-white"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="vendor">Vendor</option>
                                    <option value="partner">Partner</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => handleChange('status', e.target.value as any)}
                                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm bg-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Billing Details Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-primary-50 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                            Billing & Tax Details
                        </h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                                <input
                                    type="text"
                                    value={formData.gstin}
                                    onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                                    className={`block w-full rounded-md border ${errors.gstin ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm font-mono uppercase`}
                                    placeholder="22ABCDE1234F1Z5"
                                    maxLength={15}
                                />
                                {errors.gstin && <p className="mt-1 text-sm text-red-600">{errors.gstin}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                                <input
                                    type="text"
                                    value={formData.pan}
                                    onChange={e => handleChange('pan', e.target.value.toUpperCase())}
                                    className={`block w-full rounded-md border ${errors.pan ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm font-mono uppercase`}
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                />
                                {errors.pan && <p className="mt-1 text-sm text-red-600">{errors.pan}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                                <textarea
                                    rows={3}
                                    value={formData.address}
                                    onChange={e => handleChange('address', e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm"
                                    placeholder="Full street address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => handleChange('city', e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={e => handleChange('state', e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={e => handleChange('country', e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={e => handleChange('pincode', e.target.value)}
                                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-5 flex justify-end items-center space-x-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                    >
                        {loading && <LoadingSpinner size="sm" className="mr-2" />}
                        {loading ? 'Creating Client...' : 'Create Client'}
                    </button>
                </div>
            </form>
        </div>
    );
}
