'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QuickAddModal } from '@/components/ui/QuickAddModal';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, CreditCard, Hash, Globe, Save, Lock, Plus } from 'lucide-react';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { CustomSelect } from '@/components/ui/CustomSelect';



const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

// Define Zod Schema
const clientSchema = z.object({
    salutation: z.string().optional(),
    name: z.string().min(2, "Client/Company name is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
    mobile: z.string().optional(),
    password: z.string().min(8, "Must have at least 8 characters").optional().or(z.literal('')),
    country: z.string().default('India'),
    currency: z.string().default('INR'), // Added Currency
    gender: z.enum(['male', 'female', 'other']).optional(),
    language: z.string().default('English'),
    categoryId: z.string().optional(),
    subCategoryId: z.string().optional(),
    receiveNotifications: z.boolean().default(true),
    portalAccess: z.boolean().default(false),

    // Company Details
    companyName: z.string().optional(),
    website: z.string().optional(),
    taxName: z.string().optional(),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").optional().or(z.literal('')),
    address: z.string().optional(),
    shippingAddress: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    notes: z.string().optional(),
    clientType: z.enum(['customer', 'vendor', 'partner']).default('customer'),
    status: z.enum(['active', 'inactive']).default('active'),
    profilePicture: z.string().optional(),
    companyLogo: z.string().optional(),
}).refine(data => {
    if (data.portalAccess && (!data.password || data.password.length < 8)) {
        return false;
    }
    return true;
}, {
    message: "Password is required (min 8 chars) when Portal Access is enabled",
    path: ["password"]
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function CreateClientPage() {
    const toast = useToast();
    const router = useRouter();
    const { can, user } = usePermission();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [catModal, setCatModal] = useState(false);
    const [subCatModal, setSubCatModal] = useState(false);

    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const profileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoadingCats(true);
        try {
            const response = await clientsApi.getCategories();
            setCategories(response.data?.categories || []);
        } catch (error) {
            console.error('Failed to load categories', error);
        } finally {
            setLoadingCats(false);
        }
    };

    const loadSubCategories = async (catId: string) => {
        if (!catId) {
            setSubCategories([]);
            return;
        }
        try {
            const response = await clientsApi.getSubCategories(catId);
            setSubCategories(response.data?.subCategories || []);
        } catch (error) {
            console.error('Failed to load sub-categories', error);
        }
    };

    const handleAddCategory = async (name: string) => {
        try {
            await clientsApi.createCategory({ name });
            toast.success('Category successfully registered');
            loadCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create category');
            throw error;
        }
    };

    const handleAddSubCategory = async (name: string) => {
        if (!formData.categoryId) {
            toast.error('Select a primary category first');
            return;
        }
        try {
            await clientsApi.createSubCategory({ categoryId: formData.categoryId, name });
            toast.success('Sub-Category successfully registered');
            loadSubCategories(formData.categoryId);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create sub-category');
            throw error;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'logo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        if (type === 'profile') setUploadingProfile(true);
        else setUploadingLogo(true);

        try {
            const res = type === 'profile'
                ? await clientsApi.uploadProfile(formData)
                : await clientsApi.uploadLogo(formData);

            setFormData(prev => ({
                ...prev,
                [type === 'profile' ? 'profilePicture' : 'companyLogo']: res.data.filePath
            }));
            toast.success(`${type === 'profile' ? 'Profile picture' : 'Company logo'} uploaded`);
        } catch (error: any) {
            toast.error('Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            if (type === 'profile') setUploadingProfile(false);
            else setUploadingLogo(false);
        }
    };

    if (user && !can('Client', 'create')) {
        return <AccessDenied />;
    }

    const [formData, setFormData] = useState<ClientFormData>({
        salutation: '',
        name: '',
        email: '',
        phone: '',
        mobile: '',
        password: '',
        country: 'India',
        currency: 'INR', // Default Currency
        gender: 'male',
        language: 'English',
        categoryId: '',
        subCategoryId: '',
        receiveNotifications: true,
        portalAccess: false,
        website: '',
        taxName: '',
        gstin: '',
        address: '',
        shippingAddress: '',
        city: '',
        state: '',
        pincode: '',
        notes: '',
        clientType: 'customer',
        status: 'active',
        profilePicture: '',
        companyLogo: '',
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

    const handleChange = (field: keyof ClientFormData, value: any) => {
        setFormData({ ...formData, [field]: value });
        if (field === 'categoryId') {
            loadSubCategories(value);
            setFormData(prev => ({ ...prev, categoryId: value, subCategoryId: '' }));
        }
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
        <div className="max-w-6xl mx-auto px-4 py-8 pb-40">
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
                        Add New Client
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                        {loading && <LoadingSpinner size="sm" className="mr-2" />}
                        {loading ? 'Registering...' : 'Register Entity'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Account Details Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Account Details</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-8">
                        <div className="ent-form-group">
                            <label className="ent-label">Salutation</label>
                            <CustomSelect
                                options={[
                                    { label: '--', value: '' },
                                    { label: 'Mr.', value: 'Mr.' },
                                    { label: 'Mrs.', value: 'Mrs.' },
                                    { label: 'Ms.', value: 'Ms.' },
                                    { label: 'Dr.', value: 'Dr.' }
                                ]}
                                value={formData.salutation || ''}
                                onChange={val => handleChange('salutation', val)}
                                className="w-full"
                            />
                        </div>
                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Client Name <span className="text-rose-500">*</span></label>
                            <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="ent-input" placeholder="e.g. John Doe" />
                            {errors.name && <p className="ent-error">{errors.name}</p>}
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Email</label>
                            <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className="ent-input" placeholder="e.g. johndoe@example.com" />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Password</label>
                            <div className="relative">
                                <input type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} className="ent-input pr-20" placeholder="" />
                                <div className="absolute right-2 top-1.2 flex gap-1">
                                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-400"><Lock size={14} /></button>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Must have at least 8 characters</p>
                            {errors.password && <p className="ent-error">{errors.password}</p>}
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Country</label>
                            <CustomSelect
                                options={[
                                    { label: 'India', value: 'India' },
                                    { label: 'United States', value: 'United States' },
                                    { label: 'United Kingdom', value: 'United Kingdom' },
                                    { label: 'Australia', value: 'Australia' },
                                    { label: 'Canada', value: 'Canada' },
                                    { label: 'Germany', value: 'Germany' },
                                    { label: 'France', value: 'France' },
                                    { label: 'UAE', value: 'UAE' },
                                    { label: 'Singapore', value: 'Singapore' }
                                ]}
                                value={formData.country}
                                onChange={val => handleChange('country', val)}
                                className="w-full"
                            />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Currency Base</label>
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
                                value={formData.currency}
                                onChange={val => handleChange('currency', val)}
                                className="w-full"
                            />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Mobile</label>
                            <div className="flex gap-2">
                                <div className="w-20"><input type="text" value="+91" readOnly className="ent-input text-center" /></div>
                                <input type="text" value={formData.mobile} onChange={e => handleChange('mobile', e.target.value)} className="ent-input flex-1" placeholder="e.g. 1234567890" />
                            </div>
                        </div>

                        <div
                            onClick={() => profileInputRef.current?.click()}
                            className="row-span-2 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
                        >
                            {formData.profilePicture ? (
                                <img src={`${SERVER_URL}${formData.profilePicture}`} className="absolute inset-0 w-full h-full object-cover" alt="Profile" />
                            ) : uploadingProfile ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <Plus size={24} className="text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Profile Picture</p>
                                </>
                            )}
                            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'profile')} />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Gender</label>
                            <CustomSelect
                                options={[
                                    { label: 'Male', value: 'male' },
                                    { label: 'Female', value: 'female' },
                                    { label: 'Other', value: 'other' }
                                ]}
                                value={formData.gender || 'male'}
                                onChange={val => handleChange('gender', val)}
                                className="w-full"
                            />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Change Language</label>
                            <CustomSelect
                                options={[
                                    { label: 'English', value: 'English' },
                                    { label: 'Hindi', value: 'Hindi' }
                                ]}
                                value={formData.language}
                                onChange={val => handleChange('language', val)}
                                className="w-full"
                            />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Client Category</label>
                            <div className="flex gap-2">
                                <CustomSelect
                                    options={[
                                        { label: '-- Choose Category --', value: '' },
                                        ...categories.map(cat => ({ label: cat.name, value: cat.id }))
                                    ]}
                                    value={formData.categoryId || ''}
                                    onChange={val => handleChange('categoryId', val)}
                                    className="flex-1"
                                />
                                <button type="button" onClick={() => setCatModal(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-black uppercase transition-colors">Add</button>
                            </div>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Client Sub Category</label>
                            <div className="flex gap-2">
                                <CustomSelect
                                    options={[
                                        { label: '-- Choose Sub Category --', value: '' },
                                        ...subCategories.map(sub => ({ label: sub.name, value: sub.id }))
                                    ]}
                                    value={formData.subCategoryId || ''}
                                    onChange={val => handleChange('subCategoryId', val)}
                                    className="flex-1"
                                />
                                <button type="button" onClick={() => setSubCatModal(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-black uppercase transition-colors">Add</button>
                            </div>
                        </div>

                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Login Allowed?</label>
                            <div className="flex gap-6 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={formData.portalAccess === true} onChange={() => handleChange('portalAccess', true)} className="w-4 h-4 text-primary-600" />
                                    <span className="text-sm font-bold text-slate-700">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={formData.portalAccess === false} onChange={() => handleChange('portalAccess', false)} className="w-4 h-4 text-primary-600" />
                                    <span className="text-sm font-bold text-slate-700">No</span>
                                </label>
                            </div>
                        </div>

                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Receive email notifications?</label>
                            <div className="flex gap-6 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={formData.receiveNotifications === true} onChange={() => handleChange('receiveNotifications', true)} className="w-4 h-4 text-primary-600" />
                                    <span className="text-sm font-bold text-slate-700">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={formData.receiveNotifications === false} onChange={() => handleChange('receiveNotifications', false)} className="w-4 h-4 text-primary-600" />
                                    <span className="text-sm font-bold text-slate-700">No</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Company Details Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Company Details</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-8">
                        <div className="ent-form-group">
                            <label className="ent-label">Company Name</label>
                            <input type="text" value={formData.companyName} onChange={e => handleChange('companyName', e.target.value)} className="ent-input" placeholder="e.g. Acme Corporation" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Official Website</label>
                            <input type="text" value={formData.website} onChange={e => handleChange('website', e.target.value)} className="ent-input" placeholder="e.g. https://www.example.com" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Tax Name</label>
                            <input type="text" value={formData.taxName} onChange={e => handleChange('taxName', e.target.value)} className="ent-input" placeholder="e.g. GST/VAT" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">GST/VAT Number</label>
                            <input type="text" value={formData.gstin} onChange={e => handleChange('gstin', e.target.value.toUpperCase())} className="ent-input font-mono" placeholder="e.g. 18AABCU960XXXXX" />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Office Phone Number</label>
                            <input type="text" className="ent-input" placeholder="e.g. +19876543" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">City</label>
                            <input type="text" value={formData.city} onChange={e => handleChange('city', e.target.value)} className="ent-input" placeholder="e.g. New York, Jaipur" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">State</label>
                            <input type="text" value={formData.state} onChange={e => handleChange('state', e.target.value)} className="ent-input" placeholder="e.g. California, Rajasthan" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Postal code</label>
                            <input type="text" value={formData.pincode} onChange={e => handleChange('pincode', e.target.value)} className="ent-input" placeholder="e.g. 90250" />
                        </div>

                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Company Address</label>
                            <textarea rows={3} value={formData.address} onChange={e => handleChange('address', e.target.value)} className="ent-input resize-none" placeholder="e.g. 132, My Street..." />
                        </div>
                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Shipping Address</label>
                            <textarea rows={3} value={formData.shippingAddress} onChange={e => handleChange('shippingAddress', e.target.value)} className="ent-input resize-none" placeholder="e.g. 132, My Street..." />
                        </div>

                        <div className="md:col-span-4 ent-form-group">
                            <label className="ent-label">Note</label>
                            <div className="border border-slate-200 rounded-lg p-2 min-h-[100px]">
                                <textarea value={formData.notes} onChange={e => handleChange('notes', e.target.value)} className="w-full h-full border-0 focus:ring-0 resize-none text-sm" placeholder="Additional intelligence..." />
                            </div>
                        </div>

                        <div
                            onClick={() => logoInputRef.current?.click()}
                            className="md:col-span-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
                        >
                            {formData.companyLogo ? (
                                <img src={`${SERVER_URL}${formData.companyLogo}`} className="absolute inset-0 w-full h-full object-contain p-2" alt="Logo" />
                            ) : uploadingLogo ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <div className="p-4 bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <Plus size={24} className="text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Company Logo</p>
                                </>
                            )}
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </div>
                    </div>
                </div>
            </form>

            <QuickAddModal
                isOpen={catModal}
                onClose={() => setCatModal(false)}
                onAdd={handleAddCategory}
                title="Register New Category"
                label="Category Name"
                placeholder="e.g. Enterprise, SME..."
            />

            <QuickAddModal
                isOpen={subCatModal}
                onClose={() => setSubCatModal(false)}
                onAdd={handleAddSubCategory}
                title="Register New Sub-Category"
                label="Sub-Category Name"
                placeholder="e.g. Software, Hardware..."
            />
        </div>
    );
}
// trigger rebuild
