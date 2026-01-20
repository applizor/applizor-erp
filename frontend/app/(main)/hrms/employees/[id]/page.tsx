'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { departmentsApi, positionsApi, employeesApi, Department, Position, Employee, Document } from '@/lib/api/hrms';
import Layout from '@/components/Layout';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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

    const renderOverviewTab = () => (
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input type="text" disabled={!isEditing} required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input type="text" disabled={!isEditing} required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" disabled={!isEditing} required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" disabled={!isEditing} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                <input type="date" disabled={!isEditing} required value={formData.dateOfJoining} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select disabled={!isEditing} value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <select disabled={!isEditing || !formData.departmentId} value={formData.positionId} onChange={(e) => setFormData({ ...formData, positionId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
                    <option value="">Select Position</option>
                    {positions.map(pos => <option key={pos.id} value={pos.id}>{pos.title}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select disabled={!isEditing} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                </select>
            </div>

            {/* Personal Details Snapshot */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select disabled={!isEditing} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" disabled={!isEditing} value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
        </div>
    );

    const renderDetailsTab = () => (
        <div className="space-y-8">
            <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Current Address</label>
                        <textarea rows={2} disabled={!isEditing} value={formData.currentAddress} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Permanent Address</label>
                        <textarea rows={2} disabled={!isEditing} value={formData.permanentAddress} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bank & Statutory</h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input type="text" disabled={!isEditing} value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <input type="text" disabled={!isEditing} value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                        <input type="text" disabled={!isEditing} value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                        <input type="text" disabled={!isEditing} value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Aadhaar Number</label>
                        <input type="text" disabled={!isEditing} value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
                    </div>
                </div>
            </section>
        </div>
    );

    const renderOtherDetailsTab = () => (
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                <select disabled={!isEditing} value={formData.employmentType} onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100">
                    <option value="">Select Type</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Trainee">Trainee</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                <input type="number" disabled={!isEditing} value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" placeholder="0.00" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Skills</label>
                <input type="text" disabled={!isEditing} value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" placeholder="React, Node.js" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Slack ID</label>
                <input type="text" disabled={!isEditing} value={formData.slackMemberId} onChange={(e) => setFormData({ ...formData, slackMemberId: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Probation End Date</label>
                <input type="date" disabled={!isEditing} value={formData.probationEndDate} onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Notice Start</label>
                <input type="date" disabled={!isEditing} value={formData.noticePeriodStartDate} onChange={(e) => setFormData({ ...formData, noticePeriodStartDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Notice End</label>
                <input type="date" disabled={!isEditing} value={formData.noticePeriodEndDate} onChange={(e) => setFormData({ ...formData, noticePeriodEndDate: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100" />
            </div>
        </div>
    );

    const renderDocumentsTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Uploaded Documents</h3>
                <div className="relative">
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </label>
                </div>
            </div>

            {employee?.documents && employee.documents.length > 0 ? (
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {employee.documents.map((doc: Document) => (
                        <li key={doc.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                                <span className="flex-shrink-0 h-5 w-5 text-gray-400">
                                    📄
                                </span>
                                <span className="ml-2 flex-1 w-0 truncate text-gray-900 font-medium">
                                    {doc.name}
                                </span>
                                <span className="ml-2 flex-shrink-0 text-gray-500 text-xs">
                                    {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:text-primary-500">
                                    Download
                                </a>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    No documents uploaded yet.
                </div>
            )}
        </div>
    );

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!employee) return <div className="p-8 text-center">Employee not found</div>;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Doc Modal */}
            {showDocModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="bg-white p-5 rounded-lg shadow-xl w-96">
                        <h3 className="text-lg font-medium mb-4">Generate Document</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={selectedTemplate}
                                onChange={e => setSelectedTemplate(e.target.value)}
                            >
                                <option value="">-- Choose Template --</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDocModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateDocument}
                                disabled={generating}
                                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                            >
                                {generating ? 'Generating...' : 'Generate PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-0">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <Link
                            href={hasOwnedAccess ? "/dashboard" : "/hrms/employees"}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            ← Back to {hasOwnedAccess ? "Dashboard" : "Employees"}
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 mt-2">
                            {employee.firstName} {employee.lastName}
                        </h1>
                        <p className="text-sm text-gray-500">{employee.position?.title} • {employee.department?.name}</p>
                    </div>
                    <div>
                        {!hasOwnedAccess && (
                            <button
                                onClick={openDocModal}
                                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium shadow-sm"
                            >
                                Generate Document
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    {/* ... (existing content) ... */}
                    <div className="border-b border-gray-200 px-6">
                        <nav className="-mb-px flex space-x-8">
                            {['overview', 'details', 'other', 'documents'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                                        ${activeTab === tab
                                            ? 'border-primary-500 text-primary-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                    `}
                                >
                                    {tab === 'other' ? 'Other Details' : tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit}>
                            {activeTab === 'overview' && renderOverviewTab()}
                            {activeTab === 'details' && renderDetailsTab()}
                            {activeTab === 'other' && renderOtherDetailsTab()}
                            {activeTab === 'documents' && renderDocumentsTab()}

                            {activeTab !== 'documents' && (
                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                                    {canEditThisEmployee && !isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium"
                                        >
                                            Edit Details
                                        </button>
                                    ) : canEditThisEmployee && isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => { setIsEditing(false); loadData(); }}
                                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="inline-flex items-center space-x-2 justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50"
                                            >
                                                {saving && <LoadingSpinner size="sm" />}
                                                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
