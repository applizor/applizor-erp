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
    Shield,
    FileSignature,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    Send
} from 'lucide-react';
import api from '@/lib/api';
import { departmentsApi, positionsApi, employeesApi, documentsApi, Department, Position, Employee, Document } from '@/lib/api/hrms';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import DocumentPreviewModal from '@/components/hrms/DocumentPreviewModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReviewDocumentModal } from '@/components/hrms/ReviewDocumentModal';
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
    const [uploadCategory, setUploadCategory] = useState('General');

    const [formData, setFormData] = useState<any>({});

    // State for Document Generation
    const [showDocModal, setShowDocModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // Modal States
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; docId: string | null }>({ isOpen: false, docId: null });
    const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; docId: string | null; docName: string }>({ isOpen: false, docId: null, docName: '' });

    // Handlers
    const handlePublishDocument = async (docId: string) => {
        try {
            setLoading(true);
            await api.post(`/documents/${docId}/publish`);
            toast.success('Document published to employee');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to publish');
        } finally {
            setLoading(false);
        }
    };

    // Permission checks
    const canEdit = can('Employee', 'update');
    // Safe access to permissions
    const hasOwnedAccess = user?.permissions?.['Employee']?.readLevel === 'owned';
    const isOwnProfile = employee?.userId === user?.id;
    const canEditThisEmployee = canEdit && !isOwnProfile;

    const canManageDocs = can('Document', 'update') || can('Document', 'create');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Only load positions if departmentId is present and changed
        if (formData.departmentId) {
            loadPositions(formData.departmentId);
        } else {
            setPositions([]);
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
            // In a real app we might redirect or show error.
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
            await employeesApi.update(params.id, formData);
            setIsEditing(false);
            loadData();
            toast.success('Employee updated successfully');
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
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('name', file.name);
            uploadData.append('type', uploadCategory);
            // CRITICAL: Append employeeId so backend knows who to link this document to
            // This is required even for self-upload to be explicit vs inferred
            uploadData.append('employeeId', params.id);

            // Use documentsApi.upload (Document.create permission) instead of employeesApi (Employee.update permission)
            await documentsApi.upload(uploadData);

            loadData(); // Reload to show new doc
            toast.success('Document uploaded successfully');
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(error.response?.data?.error || 'Failed to upload document');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const openDocModal = async () => {
        try {
            // Check permissions or loading state if needed
            const res = await api.get('/document-templates');
            setTemplates(res.data);
            setShowDocModal(true);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load templates');
        }
    };

    const handleProceedToPreview = () => {
        if (!selectedTemplate) {
            toast.warning('Please select a template');
            return;
        }
        setShowDocModal(false);
        setShowPreviewModal(true);
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

    return (
        <div className="animate-fade-in pb-20">
            {/* Modal: Template Selection */}
            {showDocModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="ent-card max-w-sm w-full animate-in fade-in zoom-in duration-300 p-0 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Select Template</h3>
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
                                onClick={handleProceedToPreview}
                                className="btn-primary"
                            >
                                <FileText size={14} className="mr-2" />
                                Next: Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Document Preview & Publish */}
            {showPreviewModal && (
                <DocumentPreviewModal
                    templateId={selectedTemplate}
                    employeeId={params.id}
                    onClose={() => setShowPreviewModal(false)}
                    onPublished={() => {
                        setShowPreviewModal(false);
                        loadData(); // Reload to show new document in list
                    }}
                />
            )}

            {/* Hidden Input for Signed Upload */}
            <input
                type="file"
                id="signed-upload-input"
                className="hidden"
                accept=".pdf"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    const docId = e.target.getAttribute('data-doc-id');
                    if (file && docId) {
                        try {
                            setUploading(true);
                            await documentsApi.uploadSigned(docId, file);
                            toast.success('Signed document submitted successfully');
                            loadData();
                        } catch (error) {
                            console.error(error);
                            toast.error('Failed to upload signed copy');
                        } finally {
                            setUploading(false);
                            e.target.value = '';
                        }
                    }
                }}
            />

            <ReviewDocumentModal
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal({ isOpen: false, docId: null, docName: '' })}
                documentName={reviewModal.docName}
                onReview={async (status: 'approved' | 'rejected', remarks?: string) => {
                    if (!reviewModal.docId) return;
                    try {
                        if (status === 'approved') {
                            await documentsApi.review(reviewModal.docId, 'approved');
                        } else {
                            await documentsApi.review(reviewModal.docId, 'rejected', remarks || '');
                        }
                        toast.success(`Document ${status}`);
                        loadData();
                    } catch (error: any) {
                        toast.error(error.response?.data?.error || `Failed to ${status} document`);
                        throw error;
                    }
                }}
            />

            {/* Dialog: Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, docId: null })}
                onConfirm={async () => {
                    if (deleteDialog.docId) {
                        try {
                            await documentsApi.delete(deleteDialog.docId);
                            toast.success('Document deleted');
                            loadData();
                        } catch (error: any) {
                            toast.error('Failed to delete document');
                        }
                        setDeleteDialog({ isOpen: false, docId: null });
                    }
                }}
                title="Delete Document"
                message="Are you sure you want to delete this document? This action cannot be undone."
                type="danger"
            />

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
                                {activeTab === 'documents' ? (
                                    <div className="animate-fade-in space-y-6">
                                        <div className="flex justify-between items-center mb-6 gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-primary-900 text-white rounded-md shadow-lg">
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Document Repository</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Secured digital asset management</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-48">
                                                    <CustomSelect
                                                        options={[
                                                            { label: 'General Document', value: 'General' },
                                                            { label: 'Employee Info Form', value: 'Employee Information Form' },
                                                            { label: 'Doc Submission Form', value: 'Document Submission Form' },
                                                            { label: 'KYC / ID Proof', value: 'KYC' },
                                                            { label: 'Offer / Contract', value: 'Contract' }
                                                        ]}
                                                        value={uploadCategory}
                                                        onChange={setUploadCategory}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" disabled={uploading} />
                                                    <label htmlFor="file-upload" className={`btn-secondary cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                                                        {uploading ? <LoadingSpinner size="sm" className="mr-2" /> : <UploadCloud size={14} className="mr-2" />}
                                                        Upload
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {employee?.documents && employee.documents.length > 0 ? (
                                            <div className="overflow-x-auto rounded-md border border-slate-200">
                                                <table className="ent-table w-full text-left bg-white">
                                                    <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                                                        <tr>
                                                            <th className="p-4">Document</th>
                                                            <th className="p-4">Type & Date</th>
                                                            <th className="p-4">Status</th>
                                                            <th className="p-4">Original</th>
                                                            <th className="p-4">Signed Copy</th>
                                                            <th className="p-4 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {employee.documents.map((doc: Document) => (
                                                            <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 rounded bg-primary-50 text-primary-600">
                                                                            <FileText size={16} />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-slate-900">{doc.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{doc.type}</span>
                                                                        <span className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border
                                                                            ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                            doc.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                                doc.status === 'submitted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                                    doc.status === 'pending_signature' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                                        'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                                        {doc.status === 'approved' && <CheckCircle2 size={10} />}
                                                                        {doc.status === 'rejected' && <XCircle size={10} />}
                                                                        {doc.status === 'pending_signature' && <FileSignature size={10} />}
                                                                        {doc.status === 'submitted' && <Clock size={10} />}
                                                                        {doc.status?.replace('_', ' ') || 'Draft'}
                                                                    </span>
                                                                    {doc.rejectionReason && (
                                                                        <p className="text-[9px] text-rose-500 mt-1 max-w-[150px] leading-tight">
                                                                            Reason: {doc.rejectionReason}
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <a
                                                                            href={doc.filePath.startsWith('http') ? doc.filePath : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.filePath}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn-secondary text-[10px] py-1 px-3 h-auto justify-center"
                                                                        >
                                                                            <Download size={10} className="mr-1.5" /> Download
                                                                        </a>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    {doc.workflowType === 'signature_required' ? (
                                                                        doc.signedFilePath ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <a
                                                                                    href={doc.signedFilePath?.startsWith('http') ? doc.signedFilePath : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.signedFilePath}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-1"
                                                                                >
                                                                                    <FileSignature size={12} /> View Signed
                                                                                </a>
                                                                                {(doc.status === 'rejected' || doc.status === 'pending_signature') && isOwnProfile && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const input = document.getElementById('signed-upload-input');
                                                                                            if (input) {
                                                                                                input.setAttribute('data-doc-id', doc.id);
                                                                                                input.click();
                                                                                            }
                                                                                        }}
                                                                                        className="text-slate-400 hover:text-primary-600 ml-2"
                                                                                        title="Re-upload"
                                                                                    >
                                                                                        <UploadCloud size={14} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            (doc.status === 'pending_signature' || doc.status === 'rejected') && (isOwnProfile || canManageDocs) ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const input = document.getElementById('signed-upload-input');
                                                                                        if (input) {
                                                                                            input.setAttribute('data-doc-id', doc.id);
                                                                                            input.click();
                                                                                        }
                                                                                    }}
                                                                                    className="btn-primary py-1 px-3 h-auto text-[10px] w-full justify-center"
                                                                                >
                                                                                    <UploadCloud size={10} className="mr-1.5" /> Upload Signed
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-slate-300 text-[10px] italic">Not uploaded</span>
                                                                            )
                                                                        )
                                                                    ) : (
                                                                        <span className="text-slate-400 text-[10px] italic">N/A (Direct Review)</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        {/* ADMIN ACTIONS: Approve/Reject/Publish */}
                                                                        {!isOwnProfile && canManageDocs && doc.status === 'draft' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handlePublishDocument(doc.id)}
                                                                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                                                                                title="Publish to Employee"
                                                                            >
                                                                                <Send size={16} />
                                                                            </button>
                                                                        )}
                                                                        {!isOwnProfile && canEdit && (doc.status === 'submitted' || (doc.status === 'draft' && doc.workflowType !== 'signature_required')) && (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        setReviewModal({ isOpen: true, docId: doc.id, docName: doc.name });
                                                                                    }}
                                                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                                                                    title="Review"
                                                                                >
                                                                                    <CheckCircle2 size={16} />
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                        {/* DELETE ACTION */}
                                                                        {/* Allow delete if Admin OR (Owner AND (Draft or Rejected)) */}
                                                                        {(canEdit || (isOwnProfile && ['draft', 'rejected', 'submitted'].includes(doc.status || ''))) && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setDeleteDialog({ isOpen: true, docId: doc.id });
                                                                                }}
                                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                                                <Shield size={40} className="mx-auto text-slate-200 mb-4" />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No strategic documents found.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
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
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="Consign to Oblivion?"
                message="Are you certain you wish to purge this document? This action is irreversible within the current temporal stream."
                onConfirm={async () => {
                    if (!deleteDialog.docId) return;
                    try {
                        await documentsApi.delete(deleteDialog.docId);
                        toast.success('Document purged successfully');
                        setDeleteDialog({ isOpen: false, docId: null });
                        loadData();
                    } catch (error) {
                        console.error(error);
                        toast.error('Failed to purge document');
                    }
                }}
                onClose={() => setDeleteDialog({ isOpen: false, docId: null })}
            />

            <ReviewDocumentModal
                isOpen={reviewModal.isOpen}
                documentName={reviewModal.docName}
                onClose={() => setReviewModal({ isOpen: false, docId: null, docName: '' })}
                onReview={async (status, remarks) => {
                    if (!reviewModal.docId) return;
                    try {
                        await documentsApi.review(reviewModal.docId, status, remarks);
                        toast.success(`Document ${status} successfully`);
                        loadData();
                    } catch (error) {
                        console.error(error);
                        toast.error(`Failed to ${status} document`);
                        throw error; // Let modal handle error state if needed
                    }
                }}
            />
        </div>
    );
}
