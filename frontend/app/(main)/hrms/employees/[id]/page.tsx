'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    MapPin,
    CreditCard,
    FileText,
    ChevronLeft,
    Edit,
    Save,
    X,
    Download,
    Building2,
    Activity,
    Clock,
    UploadCloud,
    Trash2,
    Shield
} from 'lucide-react';
import api from '@/lib/api';
import { departmentsApi, positionsApi, employeesApi, Department, Position, Employee, Document } from '@/lib/api/hrms';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function EmployeeDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { can, user } = usePermission();
    const toast = useToast();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<any>({});

    // Permission checks
    const canEdit = can('Employee', 'update');
    const hasOwnedAccess = user?.permissions?.['Employee']?.readLevel === 'owned';
    const isOwnProfile = employee?.userId === user?.id;
    const canEditThisEmployee = canEdit && !isOwnProfile;

    // State for Document Generation
    const [showDocModal, setShowDocModal] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (formData.departmentId) {
            loadPositions(formData.departmentId);
        }
    }, [formData.departmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [emp, depts] = await Promise.all([
                employeesApi.getById(params.id),
                departmentsApi.getAll()
            ]);
            setEmployee(emp);
            setDepartments(depts);

            // Initialize form data with all fields
            setFormData({
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                phone: emp.phone || '',
                dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '',
                dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '',
                departmentId: emp.departmentId || '',
                positionId: emp.positionId || '',
                status: emp.status,
                gender: emp.gender || '',
                bloodGroup: emp.bloodGroup || '',
                maritalStatus: emp.maritalStatus || '',
                currentAddress: emp.currentAddress || '',
                permanentAddress: emp.permanentAddress || '',
                bankName: emp.bankName || '',
                accountNumber: emp.accountNumber || '',
                ifscCode: emp.ifscCode || '',
                panNumber: emp.panNumber || '',
                aadhaarNumber: emp.aadhaarNumber || '',
                // New Fields
                employmentType: emp.employmentType || '',
                hourlyRate: emp.hourlyRate || '',
                skills: emp.skills ? (Array.isArray(emp.skills) ? emp.skills.join(', ') : emp.skills) : '',
                slackMemberId: emp.slackMemberId || '',
                probationEndDate: emp.probationEndDate ? new Date(emp.probationEndDate).toISOString().split('T')[0] : '',
                noticePeriodStartDate: emp.noticePeriodStartDate ? new Date(emp.noticePeriodStartDate).toISOString().split('T')[0] : '',
                noticePeriodEndDate: emp.noticePeriodEndDate ? new Date(emp.noticePeriodEndDate).toISOString().split('T')[0] : ''
            });

            if (emp.departmentId) {
                await loadPositions(emp.departmentId);
            }
        } catch (error) {
            console.error('Failed to load employee data:', error);
            // toast.error('Failed to load employee details');
            // router.push('/hrms/employees');
        } finally {
            setLoading(false);
        }
    };

    const loadPositions = async (deptId: string) => {
        try {
            const pos = await positionsApi.getAll(deptId);
            setPositions(pos);
        } catch (error) {
            console.error('Failed to load positions:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            // Cleanup empty strings to null/undefined if needed, but API usually handles optional strings
            await employeesApi.update(params.id, formData);
            setIsEditing(false);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update employee');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);
            formData.append('type', 'document'); // Default type

            await employeesApi.uploadDocument(params.id, formData);
            loadData(); // Reload to show new doc
            toast.success('Document uploaded successfully');
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload document');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };



    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" className="text-primary-600 mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Profile...</p>
        </div>
    );

    if (!employee) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <User size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Employee Not Found</h3>
            <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto mb-8 leading-relaxed">
                The employee profile you requested could not be located in the global directory.
            </p>
            <Link href="/hrms/employees" className="btn-primary">
                <ChevronLeft size={14} className="mr-2" /> Back to Directory
            </Link>
        </div>
    );

    // State for Document Generation (moved to top)

    // ... (existing loadData)

    const openDocModal = async () => {
        try {
            // Lazy load templates
            setLoading(true); // Small loading indicator if needed
            const res = await api.get('/document-templates'); // Direct call or import documentTemplatesApi
            setTemplates(res.data);
            setShowDocModal(true);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDocument = async () => {
        if (!selectedTemplate) return toast.warning('Please select a template');
        try {
            setGenerating(true);
            const res = await api.post('/documents/generate-from-template', {
                employeeId: params.id,
                templateId: selectedTemplate
            }, { responseType: 'blob' });

            // Download
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const tempName = templates.find(t => t.id === selectedTemplate)?.name || 'document';
            link.setAttribute('download', `${employee?.firstName}_${tempName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setShowDocModal(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate document');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            {/* Modal: Document Generation */}
            {showDocModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="ent-card max-w-sm w-full animate-in fade-in zoom-in duration-300 p-0 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Generate Document</h3>
                            <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="ent-form-group">
                                <label className="ent-label">Select Template</label>
                                <CustomSelect
                                    options={[
                                        { label: '-- Choose Template --', value: '' },
                                        ...templates.map(t => ({ label: `${t.name} (${t.type})`, value: t.id }))
                                    ]}
                                    value={selectedTemplate}
                                    onChange={val => setSelectedTemplate(val)}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-end gap-2">
                            <button onClick={() => setShowDocModal(false)} className="btn-secondary">Cancel</button>
                            <button
                                onClick={handleGenerateDocument}
                                disabled={generating}
                                className="btn-primary"
                            >
                                {generating ? <LoadingSpinner size="sm" className="mr-2" /> : <Download size={14} className="mr-2" />}
                                {generating ? 'Generating...' : 'Download PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
                    <div className="flex flex-col">
                        <Link
                            href={hasOwnedAccess ? "/dashboard" : "/hrms/employees"}
                            className="text-[10px] font-black text-slate-400 hover:text-primary-600 uppercase tracking-widest flex items-center gap-1 transition-colors mb-2"
                        >
                            <ChevronLeft size={10} /> {hasOwnedAccess ? "Dashboard" : "Global Directory"}
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-md flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary-100 ring-4 ring-white">
                                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                    {employee.firstName} {employee.lastName}
                                </h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Briefcase size={12} className="text-slate-300" />
                                        {employee.position?.title || 'No Position Assigned'}
                                    </span>
                                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <span className="text-xs font-bold text-slate-500">
                                        {employee.department?.name || 'No Dept'}
                                    </span>
                                    <span className={`ml-2 ent-badge ${employee.status === 'active' ? 'ent-badge-success' : 'ent-badge-neutral'}`}>
                                        {employee.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!hasOwnedAccess && (
                            <button onClick={openDocModal} className="btn-secondary">
                                <FileText size={14} className="mr-2" /> Generate Doc
                            </button>
                        )}
                        {canEditThisEmployee && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="btn-primary">
                                <Edit size={14} className="mr-2" /> Edit Details
                            </button>
                        )}
                        {isEditing && (
                            <div className="flex gap-2">
                                <button onClick={() => { setIsEditing(false); loadData(); }} className="btn-secondary">Cancel</button>
                                <button onClick={handleSubmit} disabled={saving} className="btn-primary">
                                    {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save size={14} className="mr-2" />}
                                    {saving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar: Navigation & Identification */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="ent-card p-2">
                            <nav className="flex flex-col gap-1">
                                {[
                                    { id: 'overview', label: 'Identity & Core', icon: User },
                                    { id: 'details', label: 'Financials & Contact', icon: CreditCard },
                                    { id: 'other', label: 'Skills & Progression', icon: Activity },
                                    { id: 'documents', label: 'Digital Ledger', icon: Shield }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all duration-300
                                            ${activeTab === tab.id
                                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-100'
                                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}
                                        `}
                                    >
                                        <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : 'text-slate-300'} />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Quick Stats Card */}
                        <div className="ent-card p-5 bg-slate-900 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Organizational Status</h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">Employee Code</p>
                                    <p className="text-sm font-black tracking-tight">{employee.employeeId}</p>
                                </div>
                                <div className="pt-3 border-t border-white/5">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">Member Since</p>
                                    <p className="text-sm font-black tracking-tight">
                                        {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content: Dynamic View/Forms */}
                    <div className="lg:col-span-3">
                        <div className="ent-card min-h-[500px] overflow-hidden">
                            <div className="p-8">
                                <form onSubmit={handleSubmit}>
                                    {activeTab === 'overview' && (
                                        <div className="animate-fade-in space-y-8">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 border-l-4 border-primary-600 pl-3 uppercase tracking-widest mb-6">Fundamental Identity</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">First Name</label>
                                                        <input type="text" disabled={!isEditing} value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="ent-input disabled:bg-slate-50/50" />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Last Name</label>
                                                        <input type="text" disabled={!isEditing} value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="ent-input disabled:bg-slate-50/50" />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Professional Email</label>
                                                        <div className="relative">
                                                            <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                                                            <input type="email" disabled={!isEditing} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="ent-input pl-10 disabled:bg-slate-50/50" />
                                                        </div>
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Contact Handle</label>
                                                        <div className="relative">
                                                            <Phone size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                                                            <input type="tel" disabled={!isEditing} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="ent-input pl-10 disabled:bg-slate-50/50" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 border-l-4 border-primary-600 pl-3 uppercase tracking-widest mb-6 mt-8">Deployment & Personal</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Joining Protocol Date</label>
                                                        <input type="date" disabled={!isEditing} value={formData.dateOfJoining} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} className="ent-input disabled:bg-slate-50/50" />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Management Department</label>
                                                        <CustomSelect
                                                            disabled={!isEditing}
                                                            options={[
                                                                { label: 'Select Department', value: '' },
                                                                ...departments.map(dept => ({ label: dept.name, value: dept.id }))
                                                            ]}
                                                            value={formData.departmentId}
                                                            onChange={(val) => setFormData({ ...formData, departmentId: val })}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Designated Position</label>
                                                        <CustomSelect
                                                            disabled={!isEditing || !formData.departmentId}
                                                            options={[
                                                                { label: 'Select Position', value: '' },
                                                                ...positions.map(pos => ({ label: pos.title, value: pos.id }))
                                                            ]}
                                                            value={formData.positionId}
                                                            onChange={(val) => setFormData({ ...formData, positionId: val })}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Operational Status</label>
                                                        <CustomSelect
                                                            disabled={!isEditing}
                                                            options={[
                                                                { label: 'Active Service', value: 'active' },
                                                                { label: 'Inactive', value: 'inactive' },
                                                                { label: 'Authorized Leave', value: 'on-leave' },
                                                                { label: 'Separated', value: 'terminated' }
                                                            ]}
                                                            value={formData.status}
                                                            onChange={(val) => setFormData({ ...formData, status: val })}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    {/* Restored Personal Fields */}
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Bio-Identity (Gender)</label>
                                                        <CustomSelect
                                                            disabled={!isEditing}
                                                            options={[
                                                                { label: 'Select Gender', value: '' },
                                                                { label: 'Male', value: 'Male' },
                                                                { label: 'Female', value: 'Female' },
                                                                { label: 'Other', value: 'Other' }
                                                            ]}
                                                            value={formData.gender}
                                                            onChange={(val) => setFormData({ ...formData, gender: val })}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Date of Birth</label>
                                                        <input type="date" disabled={!isEditing} value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="ent-input disabled:bg-slate-50/50" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'details' && (
                                        <div className="animate-fade-in space-y-10">
                                            <section>
                                                <h3 className="text-sm font-black text-slate-900 border-l-4 border-primary-600 pl-3 uppercase tracking-widest mb-6">Financial Intelligence</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Institutional Host (Bank)</label>
                                                        <input type="text" disabled={!isEditing} value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="ent-input" />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Account Identification</label>
                                                        <input type="text" disabled={!isEditing} value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="ent-input" />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Clearance Protocol (IFSC)</label>
                                                        <input type="text" disabled={!isEditing} value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} className="ent-input font-mono" />
                                                    </div>
                                                    {/* Restored Statutory fields */}
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Fiscal ID (PAN)</label>
                                                        <input type="text" disabled={!isEditing} value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} className="ent-input font-mono" />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">National ID (Aadhaar)</label>
                                                        <input type="text" disabled={!isEditing} value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })} className="ent-input font-mono" />
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h3 className="text-sm font-black text-slate-900 border-l-4 border-primary-600 pl-3 uppercase tracking-widest mb-6">Residential Protocol</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Primary Address</label>
                                                        <textarea rows={2} disabled={!isEditing} value={formData.currentAddress} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} className="ent-input" />
                                                    </div>
                                                    <div className="ent-form-group">
                                                        <label className="ent-label">Permanent Address</label>
                                                        <textarea rows={2} disabled={!isEditing} value={formData.permanentAddress} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} className="ent-input" />
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    )}

                                    {activeTab === 'other' && (
                                        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                            <div className="ent-form-group">
                                                <label className="ent-label">Engagement Classification</label>
                                                <CustomSelect
                                                    disabled={!isEditing}
                                                    options={[
                                                        { label: 'Select Type', value: '' },
                                                        { label: 'Direct Full Time', value: 'Full Time' },
                                                        { label: 'Direct Part Time', value: 'Part Time' },
                                                        { label: 'Consolidated Contract', value: 'Contract' },
                                                        { label: 'Developmental Intern', value: 'Internship' }
                                                    ]}
                                                    value={formData.employmentType}
                                                    onChange={(val) => setFormData({ ...formData, employmentType: val })}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="ent-form-group">
                                                <label className="ent-label">Hourly Valuation (USD)</label>
                                                <input type="number" disabled={!isEditing} value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} className="ent-input" />
                                            </div>
                                            <div className="md:col-span-2 ent-form-group">
                                                <label className="ent-label">Skill Portfolio (Delimited)</label>
                                                <input type="text" disabled={!isEditing} value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="ent-input" placeholder="e.g. React, Python, Cloud Arch" />
                                            </div>
                                            <div className="ent-form-group">
                                                <label className="ent-label">Probationary Threshold Date</label>
                                                <input type="date" disabled={!isEditing} value={formData.probationEndDate} onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })} className="ent-input" />
                                            </div>
                                            <div className="ent-form-group">
                                                <label className="ent-label">Communication ID (Slack)</label>
                                                <input type="text" disabled={!isEditing} value={formData.slackMemberId} onChange={(e) => setFormData({ ...formData, slackMemberId: e.target.value })} className="ent-input font-mono" />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'documents' && (
                                        <div className="animate-fade-in space-y-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Document Repository</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Secured digital asset management</p>
                                                </div>
                                                <div className="relative">
                                                    <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" disabled={uploading} />
                                                    <label htmlFor="file-upload" className={`btn-secondary cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                                                        {uploading ? <LoadingSpinner size="sm" className="mr-2" /> : <UploadCloud size={14} className="mr-2" />}
                                                        Upload Asset
                                                    </label>
                                                </div>
                                            </div>

                                            {employee?.documents && employee.documents.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {employee.documents.map((doc: Document) => (
                                                        <div key={doc.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-md flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-primary-50/50 transition-all duration-500">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2.5 rounded-md bg-white text-primary-600 shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-900 tracking-tight leading-none mb-1">{doc.name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                        {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <a
                                                                href={doc.filePath.startsWith('http') ? doc.filePath : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.filePath}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                                                                title="Download Asset"
                                                            >
                                                                <Download size={14} />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                                                    <Shield size={40} className="mx-auto text-slate-200 mb-4" />
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No strategic documents found.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
