'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Building2, Mail, Phone, MapPin, Globe, FileText, CreditCard, Tag, Activity, Lock, Plus } from 'lucide-react';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import AccessDenied from '@/components/AccessDenied';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { QuickAddModal } from '@/components/ui/QuickAddModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

const clientSchema = z.object({
    salutation: z.string().optional(),
    name: z.string().min(2, "Client/Company name is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
    mobile: z.string().optional(),
    password: z.string().optional(), // Optional for edit
    country: z.string().default('India'),
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
    return true;
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
    const [formData, setFormData] = useState<ClientFormData>({
        salutation: '',
        name: '',
        email: '',
        phone: '',
        mobile: '',
        password: '',
        country: 'India',
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
            const data = response.client || response;
            setFormData({
                salutation: data.salutation || '',
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                mobile: data.mobile || '',
                password: '',
                country: data.country || 'India',
                gender: data.gender || 'male',
                language: data.language || 'English',
                categoryId: data.categoryId || '',
                subCategoryId: data.subCategoryId || '',
                receiveNotifications: data.receiveNotifications ?? true,
                portalAccess: data.portalAccess || false,
                companyName: data.companyName || '',
                website: data.website || '',
                taxName: data.taxName || '',
                gstin: data.gstin || '',
                address: data.address || '',
                shippingAddress: data.shippingAddress || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                notes: data.notes || '',
                clientType: data.clientType || 'customer',
                status: data.status || 'active',
                profilePicture: data.profilePicture || '',
                companyLogo: data.companyLogo || '',
            });
            if (data.categoryId) {
                loadSubCategories(data.categoryId);
            }
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

        setSaving(true);
        try {
            await clientsApi.update(params.id as string, formData);
            toast.success('Client profile updated');
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
        <div className="max-w-6xl mx-auto px-4 py-8 pb-40">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 px-2">
                <div className="space-y-0.5">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary-600 transition-colors mb-2 uppercase tracking-wide"
                    >
                        <ArrowLeft size={14} />
                        Abort Edit
                    </button>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                        Edit Client Registry
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={saving} className="btn-primary">
                        {saving && <LoadingSpinner size="sm" className="mr-2" />}
                        {saving ? 'Synchronizing...' : 'Save Configuration'}
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
                            <select value={formData.salutation} onChange={e => handleChange('salutation', e.target.value)} className="ent-input">
                                <option value="">--</option>
                                <option value="Mr.">Mr.</option>
                                <option value="Mrs.">Mrs.</option>
                                <option value="Ms.">Ms.</option>
                                <option value="Dr.">Dr.</option>
                            </select>
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
                            <label className="ent-label">Update Password</label>
                            <div className="relative">
                                <input type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} className="ent-input pr-20" placeholder="••••••••" />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Leave blank to keep existing protocol</p>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Country</label>
                            <select value={formData.country} onChange={e => handleChange('country', e.target.value)} className="ent-input">
                                <option value="India">India</option>
                                <option value="United States">United States</option>
                            </select>
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
                            <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)} className="ent-input">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Change Language</label>
                            <select value={formData.language} onChange={e => handleChange('language', e.target.value)} className="ent-input">
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                            </select>
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Client Category</label>
                            <div className="flex gap-2">
                                <select value={formData.categoryId} onChange={e => handleChange('categoryId', e.target.value)} className="ent-input flex-1">
                                    <option value="">-- Choose Category --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setCatModal(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-black uppercase transition-colors">Add</button>
                            </div>
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">Client Sub Category</label>
                            <div className="flex gap-2">
                                <select value={formData.subCategoryId} onChange={e => handleChange('subCategoryId', e.target.value)} className="ent-input flex-1">
                                    <option value="">-- Choose Sub Category --</option>
                                    {subCategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
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
                            <input type="text" value={formData.website} onChange={e => handleChange('website', e.target.value)} className="ent-input" placeholder="https://www.example.com" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Tax Name</label>
                            <input type="text" value={formData.taxName} onChange={e => handleChange('taxName', e.target.value)} className="ent-input" placeholder="GST/VAT" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">GST/VAT Number</label>
                            <input type="text" value={formData.gstin} onChange={e => handleChange('gstin', e.target.value.toUpperCase())} className="ent-input font-mono" placeholder="18AABCU960XXXXX" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">Postal code</label>
                            <input type="text" value={formData.pincode} onChange={e => handleChange('pincode', e.target.value)} className="ent-input" placeholder="90250" />
                        </div>

                        <div className="ent-form-group">
                            <label className="ent-label">City</label>
                            <input type="text" value={formData.city} onChange={e => handleChange('city', e.target.value)} className="ent-input" />
                        </div>
                        <div className="ent-form-group">
                            <label className="ent-label">State</label>
                            <input type="text" value={formData.state} onChange={e => handleChange('state', e.target.value)} className="ent-input" />
                        </div>

                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Current Address</label>
                            <textarea rows={3} value={formData.address} onChange={e => handleChange('address', e.target.value)} className="ent-input resize-none" />
                        </div>
                        <div className="md:col-span-2 ent-form-group">
                            <label className="ent-label">Shipping Protocol Address</label>
                            <textarea rows={3} value={formData.shippingAddress} onChange={e => handleChange('shippingAddress', e.target.value)} className="ent-input resize-none" />
                        </div>

                        <div className="md:col-span-4 ent-form-group">
                            <label className="ent-label">Internal Documentation Note</label>
                            <div className="border border-slate-200 rounded-lg p-2 min-h-[100px]">
                                <textarea value={formData.notes} onChange={e => handleChange('notes', e.target.value)} className="w-full h-full border-0 focus:ring-0 resize-none text-sm" />
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
                title="Update Category Protocols"
                label="Category Name"
                placeholder="e.g. Strategic Partner, Direct Vendor..."
            />

            <QuickAddModal
                isOpen={subCatModal}
                onClose={() => setSubCatModal(false)}
                onAdd={handleAddSubCategory}
                title="Update Sub-Category Protocols"
                label="Sub-Category Name"
                placeholder="e.g. Infrastructure, Consultancy..."
            />
        </div>
    );
}
