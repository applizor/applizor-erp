'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, CreditCard, Hash, Globe, Save } from 'lucide-react';
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

        setLoading(true);
        try {
            await clientsApi.create(formData);
            toast.success('Client onboarding complete');
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
        <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 px-2">
                <div className="space-y-0.5">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary-600 transition-colors mb-2 uppercase tracking-wide"
                    >
                        <ArrowLeft size={14} />
                        Abort Onboarding
                    </button>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                        Onboard New Entity
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Register a new commercial partner, customer, or vendor into the global registry.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading && <LoadingSpinner size="sm" className="mr-2" />}
                        {loading ? 'Registering...' : 'Register Entity'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Identity */}
                <div className="ent-card p-6">
                    <h3 className="text-xs font-black text-primary-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-primary-50 pb-2">
                        <Building2 size={16} className="text-primary-500" />
                        Corporate Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Registered Entity Name <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className={`ent-input pl-10 ${errors.name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                                    placeholder="LEGAL ENTITY NAME"
                                />
                            </div>
                            {errors.name && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wide">{errors.name}</p>}
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Communication Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    className={`ent-input pl-10 ${errors.email ? 'border-rose-300' : ''}`}
                                    placeholder="contact@domain.com"
                                />
                            </div>
                            {errors.email && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wide">{errors.email}</p>}
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Contact Phone</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => handleChange('phone', e.target.value)}
                                    className={`ent-input pl-10 ${errors.phone ? 'border-rose-300' : ''}`}
                                    placeholder="+XX 0000 0000"
                                />
                            </div>
                            {errors.phone && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wide">{errors.phone}</p>}
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Relationship Classification</label>
                            <select
                                value={formData.clientType}
                                onChange={e => handleChange('clientType', e.target.value as any)}
                                className="ent-input"
                            >
                                <option value="customer">CUSTOMER (Revenue Source)</option>
                                <option value="vendor">VENDOR (Supplier)</option>
                                <option value="partner">PARTNER (Strategic)</option>
                            </select>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Operational Status</label>
                            <select
                                value={formData.status}
                                onChange={e => handleChange('status', e.target.value as any)}
                                className="ent-input"
                            >
                                <option value="active">ACTIVE (Live)</option>
                                <option value="inactive">INACTIVE (Frozen)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Fiscal & Billing */}
                <div className="ent-card p-6">
                    <h3 className="text-xs font-black text-primary-900 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-primary-50 pb-2">
                        <CreditCard size={16} className="text-primary-500" />
                        Fiscal & Billing Data
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="ent-form-group">
                            <label className="ent-label">GSTIN / VAT ID</label>
                            <div className="relative">
                                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.gstin}
                                    onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                                    className="ent-input pl-10 font-mono uppercase"
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                />
                            </div>
                            {errors.gstin && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wide">{errors.gstin}</p>}
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">PAN Identifier</label>
                            <div className="relative">
                                <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.pan}
                                    onChange={e => handleChange('pan', e.target.value.toUpperCase())}
                                    className="ent-input pl-10 font-mono uppercase"
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                />
                            </div>
                            {errors.pan && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wide">{errors.pan}</p>}
                        </div>

                        <div className="md:col-span-3 ent-form-group">
                            <label className="ent-label">Billing Address</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                <textarea
                                    rows={2}
                                    value={formData.address}
                                    onChange={e => handleChange('address', e.target.value)}
                                    className="ent-input pl-10 py-3 resize-none"
                                    placeholder="Registered office address..."
                                />
                            </div>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={e => handleChange('city', e.target.value)}
                                className="ent-input"
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">State / Region</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={e => handleChange('state', e.target.value)}
                                className="ent-input"
                            />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Pincode</label>
                            <input
                                type="text"
                                value={formData.pincode}
                                onChange={e => handleChange('pincode', e.target.value)}
                                className="ent-input"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
